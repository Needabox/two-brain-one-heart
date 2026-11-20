import {
  buildEnvelope,
  EventDeduplicator,
  parseMultiplayerEnvelope,
  type EventPayload,
  type MultiplayerEnvelope,
} from '../protocol';
import type {
  PeerPresenceEvent,
  SignalingProvider,
  WebRtcSignalPayload,
} from '../signaling/SignalingProvider';
import {
  decodeManualSignalBundle,
  encodeManualSignalBundle,
} from './manualCodec';

function waitForIceGatheringComplete(
  pc: RTCPeerConnection,
  timeoutMs: number = 5000,
): Promise<void> {
  if (pc.iceGatheringState === 'complete') {
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    let settleEarlyTimer: ReturnType<typeof setTimeout> | null = null;
    const finish = () => {
      clearTimeout(timer);
      if (settleEarlyTimer) clearTimeout(settleEarlyTimer);
      pc.removeEventListener('icegatheringstatechange', onStateChange);
      pc.removeEventListener('icecandidate', onCandidate);
      resolve();
    };
    const onStateChange = () => {
      if (pc.iceGatheringState === 'complete') {
        finish();
      }
    };
    const onCandidate = (evt: RTCPeerConnectionIceEvent) => {
      const cand = evt.candidate?.candidate ?? '';
      if ((cand.includes(' typ srflx ') || cand.includes(' typ relay ')) && !settleEarlyTimer) {
        // Give 700ms for any secondary/TURN candidates, then proceed fast
        settleEarlyTimer = setTimeout(finish, 700);
      }
    };
    const timer = setTimeout(finish, timeoutMs);
    pc.addEventListener('icegatheringstatechange', onStateChange);
    pc.addEventListener('icecandidate', onCandidate);
  });
}

export type TransportStatus =
  | 'idle'
  | 'waiting-for-partner'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'disconnected'
  | 'error';

const DEFAULT_ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun.cloudflare.com:3478' },
];

export function parseConfiguredIceServers(): RTCIceServer[] {
  const raw = (import.meta.env.VITE_ICE_SERVERS ?? '').toString().trim();
  if (!raw) return DEFAULT_ICE_SERVERS;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed as RTCIceServer[];
    }
  } catch {
    // Fall back to default STUN servers if malformed JSON
  }
  return DEFAULT_ICE_SERVERS;
}

export interface WebRTCTransportOptions {
  roomCode: string;
  selfPeerId: string;
  role: 'host' | 'guest';
  signaling: SignalingProvider;
  onStatusChange: (status: TransportStatus, detail?: string) => void;
  onEnvelope: (envelope: MultiplayerEnvelope) => void;
  onPeerPresence?: (event: PeerPresenceEvent) => void;
}

export class WebRTCTransport {
  private readonly opts: WebRTCTransportOptions;
  private pc: RTCPeerConnection | null = null;
  private dc: RTCDataChannel | null = null;
  private remotePeerId: string | undefined;
  private pendingIceCandidates: RTCIceCandidateInit[] = [];
  private outboundQueue: MultiplayerEnvelope[] = [];
  private seq = 1;
  private readonly dedup = new EventDeduplicator(500);
  private unsubSignal: (() => void) | null = null;
  private unsubPresence: (() => void) | null = null;
  private pingTimer: ReturnType<typeof setInterval> | null = null;
  private lastPongAt = 0;
  private disposed = false;
  private makingOffer = false;

  constructor(opts: WebRTCTransportOptions) {
    this.opts = opts;
    this.unsubSignal = opts.signaling.onSignal((evt) => {
      void this.handleSignal(evt.fromPeerId, evt.signal);
    });
    this.unsubPresence = opts.signaling.onPeerPresence((evt) => {
      this.handlePresence(evt);
    });
  }

  public startWaiting(): void {
    this.opts.onStatusChange(
      this.opts.role === 'host' ? 'waiting-for-partner' : 'connecting',
    );
  }

  public initiateConnection(targetPeerId?: string): void {
    if (targetPeerId) {
      this.remotePeerId = targetPeerId;
    }
    if (this.opts.role === 'host') {
      void this.createOfferConnection();
    } else {
      this.opts.onStatusChange('connecting', 'Waiting for partner offer...');
      void this.opts.signaling.sendSignal(
        this.opts.roomCode,
        this.opts.selfPeerId,
        { kind: 'ready-to-pair', peerId: this.opts.selfPeerId },
        this.remotePeerId,
      );
    }
  }

  private handlePresence(evt: PeerPresenceEvent): void {
    if (this.disposed) return;
    this.opts.onPeerPresence?.(evt);

    if (evt.type === 'peer-joined') {
      this.remotePeerId = evt.peerId;
      if (this.opts.role === 'host') {
        void this.createOfferConnection();
      } else {
        // Host came back (e.g., after refresh): ask host to pair
        this.opts.onStatusChange('reconnecting', 'Partner returned, pairing...');
        void this.opts.signaling.sendSignal(
          this.opts.roomCode,
          this.opts.selfPeerId,
          { kind: 'ready-to-pair', peerId: this.opts.selfPeerId },
          evt.peerId,
        );
      }
    } else if (evt.type === 'peer-left') {
      this.stopHeartbeat();
      this.opts.onStatusChange('reconnecting', 'Partner disconnected. Waiting to reconnect...');
    }
  }

  private teardownPeerConnection(): void {
    this.stopHeartbeat();
    if (this.dc) {
      this.dc.onopen = null;
      this.dc.onclose = null;
      this.dc.onmessage = null;
      this.dc.onerror = null;
      try {
        this.dc.close();
      } catch {
        // ignore
      }
      this.dc = null;
    }
    if (this.pc) {
      this.pc.onicecandidate = null;
      this.pc.onconnectionstatechange = null;
      this.pc.ondatachannel = null;
      try {
        this.pc.close();
      } catch {
        // ignore
      }
      this.pc = null;
    }
    this.pendingIceCandidates = [];
  }

  private createBasePeerConnection(): RTCPeerConnection {
    this.teardownPeerConnection();
    const pc = new RTCPeerConnection({
      iceServers: parseConfiguredIceServers(),
    });

    pc.onicecandidate = (evt) => {
      if (!evt.candidate || this.disposed) return;
      void this.opts.signaling.sendSignal(
        this.opts.roomCode,
        this.opts.selfPeerId,
        { kind: 'ice', candidate: evt.candidate.toJSON() },
        this.remotePeerId,
      );
    };

    pc.onconnectionstatechange = () => {
      if (this.disposed) return;
      if (pc.connectionState === 'disconnected') {
        this.opts.onStatusChange('reconnecting', 'Connection hiccup, attempting recovery...');
      } else if (pc.connectionState === 'failed') {
        this.opts.onStatusChange(
          'error',
          'Direct P2P connection failed (strict NAT/firewall). Try Wi-Fi or add a TURN server in VITE_ICE_SERVERS.',
        );
      }
    };

    pc.oniceconnectionstatechange = () => {
      if (this.disposed) return;
      if (pc.iceConnectionState === 'failed') {
        this.opts.onStatusChange(
          'error',
          'Direct P2P ICE failed (strict NAT/firewall). Try Wi-Fi or add a TURN server in VITE_ICE_SERVERS.',
        );
      }
    };

    this.pc = pc;
    return pc;
  }

  private wireDataChannel(dc: RTCDataChannel): void {
    this.dc = dc;

    dc.onopen = () => {
      if (this.disposed) return;
      this.lastPongAt = Date.now();
      this.opts.onStatusChange('connected');
      this.flushOutboundQueue();
      this.startHeartbeat();
    };

    dc.onclose = () => {
      if (this.disposed) return;
      this.stopHeartbeat();
      this.opts.onStatusChange('reconnecting', 'Data channel closed; waiting for partner...');
    };

    dc.onerror = () => {
      if (this.disposed) return;
      this.opts.onStatusChange('reconnecting', 'Temporary channel error...');
    };

    dc.onmessage = (evt: MessageEvent<string>) => {
      if (this.disposed) return;
      try {
        const parsedJson = JSON.parse(evt.data) as unknown;
        const envelope = parseMultiplayerEnvelope(parsedJson);
        if (!envelope) return;
        if (envelope.roomId !== this.opts.roomCode) return;
        if (this.dedup.hasSeenOrMark(envelope.eventId)) return;

        if (envelope.type === 'PING') {
          this.send('PONG', { echoedSentAt: envelope.payload.sentAt });
          return;
        }
        if (envelope.type === 'PONG') {
          this.lastPongAt = Date.now();
          return;
        }

        this.opts.onEnvelope(envelope);
      } catch {
        // Ignore malformed payloads
      }
    };
  }

  private async createOfferConnection(): Promise<void> {
    if (this.disposed || this.makingOffer) return;
    this.makingOffer = true;
    try {
      this.opts.onStatusChange('connecting', 'Establishing peer connection...');
      const pc = this.createBasePeerConnection();
      const dc = pc.createDataChannel('tboh-game', { ordered: true });
      this.wireDataChannel(dc);

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      if (pc.localDescription) {
        await this.opts.signaling.sendSignal(
          this.opts.roomCode,
          this.opts.selfPeerId,
          { kind: 'offer', sdp: pc.localDescription.toJSON() },
          this.remotePeerId,
        );
      }
    } catch (err) {
      this.opts.onStatusChange(
        'error',
        err instanceof Error ? err.message : 'Failed to create WebRTC offer.',
      );
    } finally {
      this.makingOffer = false;
    }
  }

  private async handleSignal(fromPeerId: string, signal: WebRtcSignalPayload): Promise<void> {
    if (this.disposed) return;
    this.remotePeerId = fromPeerId;

    if (signal.kind === 'ready-to-pair') {
      if (this.opts.role === 'host') {
        await this.createOfferConnection();
      }
      return;
    }

    if (signal.kind === 'offer') {
      try {
        this.opts.onStatusChange('connecting', 'Accepting partner connection...');
        const pc = this.createBasePeerConnection();
        pc.ondatachannel = (evt) => {
          this.wireDataChannel(evt.channel);
        };
        await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
        await this.drainIceCandidates(pc);

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        if (pc.localDescription) {
          await this.opts.signaling.sendSignal(
            this.opts.roomCode,
            this.opts.selfPeerId,
            { kind: 'answer', sdp: pc.localDescription.toJSON() },
            fromPeerId,
          );
        }
      } catch (err) {
        this.opts.onStatusChange(
          'error',
          err instanceof Error ? err.message : 'Failed to handle partner offer.',
        );
      }
      return;
    }

    if (signal.kind === 'answer') {
      if (!this.pc) return;
      try {
        await this.pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
        await this.drainIceCandidates(this.pc);
      } catch {
        // Ignore stale answer race
      }
      return;
    }

    if (signal.kind === 'ice') {
      if (!this.pc || !this.pc.remoteDescription) {
        this.pendingIceCandidates.push(signal.candidate);
        return;
      }
      try {
        await this.pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
      } catch {
        // Ignore stale candidate
      }
    }
  }

  private async drainIceCandidates(pc: RTCPeerConnection): Promise<void> {
    const queue = [...this.pendingIceCandidates];
    this.pendingIceCandidates = [];
    for (const candidate of queue) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch {
        // Ignore failed candidate
      }
    }
  }

  // ---- Pure Frontend Zero-Server Manual Invite/Reply P2P Methods ----

  public async createManualOfferCode(): Promise<string> {
    this.opts.onStatusChange('waiting-for-partner', 'Generating P2P invite code...');
    const pc = this.createBasePeerConnection();
    // All ICE candidates will be gathered into localDescription before encoding
    pc.onicecandidate = null;
    const dc = pc.createDataChannel('tboh-game', { ordered: true });
    this.wireDataChannel(dc);

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    await waitForIceGatheringComplete(pc, 5000);

    if (!pc.localDescription?.sdp) {
      throw new Error('Could not generate WebRTC invite SDP.');
    }

    const hasPublicCandidate =
      pc.localDescription.sdp.includes(' typ srflx ') ||
      pc.localDescription.sdp.includes(' typ relay ');
    this.opts.onStatusChange(
      'waiting-for-partner',
      hasPublicCandidate
        ? 'Public network candidate ready! Send the invite code to your partner, then paste their reply code.'
        : 'Warning: STUN could not discover a public IP on this network. Faraway peers may not connect without Wi-Fi or a TURN server.',
    );
    return encodeManualSignalBundle({
      v: 1,
      r: this.opts.roomCode,
      t: 'offer',
      sdp: pc.localDescription.sdp,
    });
  }

  public async acceptManualReplyCode(replyCode: string): Promise<void> {
    if (!this.pc) {
      throw new Error('No active invite session found. Create a room invite first.');
    }
    const bundle = await decodeManualSignalBundle(replyCode);
    if (bundle.t !== 'answer') {
      throw new Error('That looks like an Invite code — ask your partner for their Reply code!');
    }
    if (bundle.r !== this.opts.roomCode) {
      throw new Error(`Reply code is for room ${bundle.r}, expected ${this.opts.roomCode}.`);
    }
    this.opts.onStatusChange('connecting', 'Linking directly with partner...');
    await this.pc.setRemoteDescription(
      new RTCSessionDescription({ type: 'answer', sdp: bundle.sdp }),
    );
    setTimeout(() => {
      if (!this.disposed && !this.isConnected() && this.pc?.connectionState !== 'failed') {
        this.opts.onStatusChange(
          'connecting',
          'Still negotiating NAT/firewall… If stuck, one network likely uses Symmetric NAT/CGNAT and requires a TURN server (VITE_ICE_SERVERS) or switching to Wi-Fi.',
        );
      }
    }, 10_000);
  }

  public async acceptManualInviteAndCreateReply(
    inviteCode: string,
  ): Promise<{ roomCode: string; replyCode: string }> {
    const bundle = await decodeManualSignalBundle(inviteCode);
    if (bundle.t !== 'offer') {
      throw new Error('That looks like a Reply code — paste the Host Invite code here!');
    }

    this.opts.onStatusChange('connecting', 'Generating your reply code...');
    const pc = this.createBasePeerConnection();
    pc.onicecandidate = null;
    pc.ondatachannel = (evt) => {
      this.wireDataChannel(evt.channel);
    };

    await pc.setRemoteDescription(
      new RTCSessionDescription({ type: 'offer', sdp: bundle.sdp }),
    );
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    await waitForIceGatheringComplete(pc, 5000);

    if (!pc.localDescription?.sdp) {
      throw new Error('Could not generate WebRTC reply SDP.');
    }

    const replyCode = await encodeManualSignalBundle({
      v: 1,
      r: bundle.r,
      t: 'answer',
      sdp: pc.localDescription.sdp,
    });

    const hasPublicCandidate =
      pc.localDescription.sdp.includes(' typ srflx ') ||
      pc.localDescription.sdp.includes(' typ relay ');
    this.opts.onStatusChange(
      'connecting',
      hasPublicCandidate
        ? 'Send this reply code back to Host to finish connecting!'
        : 'Warning: STUN could not discover a public IP on this network. Faraway peers may not connect without Wi-Fi or a TURN server.',
    );
    return { roomCode: bundle.r, replyCode };
  }

  public send<T extends MultiplayerEnvelope['type']>(
    type: T,
    payload: EventPayload<T>,
  ): MultiplayerEnvelope {
    const envelope = buildEnvelope(
      this.opts.roomCode,
      this.opts.selfPeerId,
      this.seq++,
      type,
      payload,
    );

    if (this.dc && this.dc.readyState === 'open') {
      this.dc.send(JSON.stringify(envelope));
    } else if (type !== 'PING' && type !== 'PONG') {
      this.outboundQueue.push(envelope);
      if (this.outboundQueue.length > 50) {
        this.outboundQueue.shift();
      }
    }

    return envelope;
  }

  private flushOutboundQueue(): void {
    if (!this.dc || this.dc.readyState !== 'open') return;
    while (this.outboundQueue.length > 0) {
      const env = this.outboundQueue.shift();
      if (env) {
        this.dc.send(JSON.stringify(env));
      }
    }
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.lastPongAt = Date.now();
    this.pingTimer = setInterval(() => {
      if (this.disposed) return;
      if (this.dc && this.dc.readyState === 'open') {
        this.send('PING', { sentAt: Date.now() });
      }
      const silenceMs = Date.now() - this.lastPongAt;
      if (silenceMs > 22_000) {
        this.opts.onStatusChange('disconnected', 'Partner timed out.');
      } else if (silenceMs > 10_000) {
        this.opts.onStatusChange('reconnecting', 'Waiting for partner heartbeat...');
      }
    }, 4000);
  }

  private stopHeartbeat(): void {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }

  public isConnected(): boolean {
    return this.dc?.readyState === 'open';
  }

  public dispose(): void {
    this.disposed = true;
    this.unsubSignal?.();
    this.unsubPresence?.();
    this.teardownPeerConnection();
    this.outboundQueue = [];
  }
}
