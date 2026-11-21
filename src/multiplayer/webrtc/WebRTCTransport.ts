import { EnvelopeChannel } from '../EnvelopeChannel';
import type { GameTransport, TransportStatus } from '../GameTransport';
import type { EventPayload, MultiplayerEnvelope } from '../protocol';
import type {
  PeerPresenceEvent,
  SignalingProvider,
  WebRtcSignalPayload,
} from '../signaling/SignalingProvider';

export type { TransportStatus };

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
    // Fall back to default STUN servers
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

export class WebRTCTransport implements GameTransport {
  private readonly opts: WebRTCTransportOptions;
  private readonly channel: EnvelopeChannel;
  private pc: RTCPeerConnection | null = null;
  private dc: RTCDataChannel | null = null;
  private remotePeerId: string | undefined;
  private pendingIceCandidates: RTCIceCandidateInit[] = [];
  private unsubSignal: (() => void) | null = null;
  private unsubPresence: (() => void) | null = null;
  private disposed = false;
  private makingOffer = false;

  constructor(opts: WebRTCTransportOptions) {
    this.opts = opts;
    this.channel = new EnvelopeChannel(opts);
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

  private rawSend = (serialized: string): boolean => {
    if (this.dc?.readyState !== 'open') return false;
    this.dc.send(serialized);
    return true;
  };

  public initiateConnection(targetPeerId?: string): void {
    if (targetPeerId) this.remotePeerId = targetPeerId;
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
        this.opts.onStatusChange('reconnecting', 'Partner returned, pairing...');
        void this.opts.signaling.sendSignal(
          this.opts.roomCode,
          this.opts.selfPeerId,
          { kind: 'ready-to-pair', peerId: this.opts.selfPeerId },
          evt.peerId,
        );
      }
    } else if (evt.type === 'peer-left') {
      this.channel.stopHeartbeat();
      this.opts.onStatusChange('reconnecting', 'Partner disconnected. Waiting to reconnect...');
    }
  }

  private teardownPeerConnection(): void {
    this.channel.stopHeartbeat();
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
      this.pc.oniceconnectionstatechange = null;
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
    const pc = new RTCPeerConnection({ iceServers: parseConfiguredIceServers() });

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
          'Peer connection failed (strict NAT/firewall). Try Wi-Fi or add a TURN server in VITE_ICE_SERVERS.',
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
      this.opts.onStatusChange('connected');
      this.channel.flush(this.rawSend);
      this.channel.startHeartbeat((sentAt) => {
        if (this.dc?.readyState === 'open') this.send('PING', { sentAt });
      });
    };

    dc.onclose = () => {
      if (this.disposed) return;
      this.channel.stopHeartbeat();
      this.opts.onStatusChange('reconnecting', 'Data channel closed; waiting for partner...');
    };

    dc.onerror = () => {
      if (!this.disposed) {
        this.opts.onStatusChange('reconnecting', 'Temporary channel error...');
      }
    };

    dc.onmessage = (evt: MessageEvent<string>) => {
      this.channel.handleRawData(evt.data, (echoedSentAt) =>
        this.send('PONG', { echoedSentAt }),
      );
    };
  }

  private async createOfferConnection(): Promise<void> {
    if (this.disposed || this.makingOffer) return;
    this.makingOffer = true;
    try {
      this.opts.onStatusChange('connecting', 'Establishing peer connection...');
      const pc = this.createBasePeerConnection();
      this.wireDataChannel(pc.createDataChannel('tboh-game', { ordered: true }));

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
      if (this.opts.role === 'host') await this.createOfferConnection();
      return;
    }

    if (signal.kind === 'offer') {
      try {
        this.opts.onStatusChange('connecting', 'Accepting partner connection...');
        const pc = this.createBasePeerConnection();
        pc.ondatachannel = (evt) => this.wireDataChannel(evt.channel);
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
      if (!this.pc?.remoteDescription) {
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

  public send<T extends MultiplayerEnvelope['type']>(
    type: T,
    payload: EventPayload<T>,
  ): MultiplayerEnvelope {
    return this.channel.send(type, payload, this.rawSend);
  }

  public isConnected(): boolean {
    return this.dc?.readyState === 'open';
  }

  public dispose(): void {
    this.disposed = true;
    this.unsubSignal?.();
    this.unsubPresence?.();
    this.teardownPeerConnection();
    this.channel.dispose();
  }
}
