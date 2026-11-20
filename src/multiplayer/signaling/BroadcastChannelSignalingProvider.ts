import type {
  JoinRoomResult,
  PeerPresenceEvent,
  SignalDeliveryEvent,
  SignalingModeInfo,
  SignalingProvider,
  WebRtcSignalPayload,
} from './SignalingProvider';

type BcWireMessage =
  | { kind: 'probe'; fromPeerId: string }
  | { kind: 'probe-ack'; fromPeerId: string; role: 'host' | 'guest'; meta?: Record<string, unknown> }
  | { kind: 'join'; fromPeerId: string; meta?: Record<string, unknown> }
  | { kind: 'leave'; fromPeerId: string; role: 'host' | 'guest' }
  | { kind: 'signal'; fromPeerId: string; toPeerId?: string; signal: WebRtcSignalPayload };

export class BroadcastChannelSignalingProvider implements SignalingProvider {
  private channel: BroadcastChannel | null = null;
  private selfPeerId: string = '';
  private selfRole: 'host' | 'guest' = 'host';
  private selfMeta: Record<string, unknown> = {};
  private readonly signalHandlers = new Set<(event: SignalDeliveryEvent) => void>();
  private readonly presenceHandlers = new Set<(event: PeerPresenceEvent) => void>();

  getModeInfo(): SignalingModeInfo {
    return {
      mode: 'broadcast-channel',
      label: 'Same-Browser Tabs',
      supportsCrossDevice: false,
      description: 'Running without signaling credentials: works between tabs in the same browser. Configure Supabase env vars for internet play.',
    };
  }

  private openChannel(roomCode: string): BroadcastChannel {
    this.channel?.close();
    const bc = new BroadcastChannel(`tboh-signal-${roomCode.toUpperCase()}`);
    bc.onmessage = (evt: MessageEvent<BcWireMessage>) => {
      const msg = evt.data;
      if (!msg || msg.fromPeerId === this.selfPeerId) return;

      if (msg.kind === 'probe' && this.selfRole === 'host') {
        bc.postMessage({
          kind: 'probe-ack',
          fromPeerId: this.selfPeerId,
          role: 'host',
          meta: this.selfMeta,
        } satisfies BcWireMessage);
        return;
      }

      if (msg.kind === 'join' && this.selfRole === 'host') {
        this.presenceHandlers.forEach((h) =>
          h({ type: 'peer-joined', peerId: msg.fromPeerId, role: 'guest', meta: msg.meta }),
        );
        return;
      }

      if (msg.kind === 'leave') {
        this.presenceHandlers.forEach((h) =>
          h({ type: 'peer-left', peerId: msg.fromPeerId, role: msg.role }),
        );
        return;
      }

      if (msg.kind === 'signal') {
        if (msg.toPeerId && msg.toPeerId !== this.selfPeerId) return;
        this.signalHandlers.forEach((h) =>
          h({ fromPeerId: msg.fromPeerId, signal: msg.signal }),
        );
      }
    };
    this.channel = bc;
    return bc;
  }

  async createRoom(roomCode: string, peerId: string, meta?: Record<string, unknown>): Promise<void> {
    this.selfPeerId = peerId;
    this.selfRole = 'host';
    this.selfMeta = meta ?? {};
    this.openChannel(roomCode);
  }

  async joinRoom(
    roomCode: string,
    peerId: string,
    meta?: Record<string, unknown>,
  ): Promise<JoinRoomResult> {
    this.selfPeerId = peerId;
    this.selfRole = 'guest';
    this.selfMeta = meta ?? {};
    const bc = this.openChannel(roomCode);

    return new Promise<JoinRoomResult>((resolve, reject) => {
      let settled = false;
      const timer = setTimeout(() => {
        if (settled) return;
        settled = true;
        bc.removeEventListener('message', onAck);
        reject(new Error('No host found for that room code in this browser.'));
      }, 1800);

      const onAck = (evt: MessageEvent<BcWireMessage>) => {
        const msg = evt.data;
        if (!msg || msg.kind !== 'probe-ack' || msg.role !== 'host') return;
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        bc.removeEventListener('message', onAck);
        bc.postMessage({
          kind: 'join',
          fromPeerId: peerId,
          meta: meta ?? {},
        } satisfies BcWireMessage);
        resolve({ hostId: msg.fromPeerId, hostMeta: msg.meta });
      };

      bc.addEventListener('message', onAck);
      bc.postMessage({ kind: 'probe', fromPeerId: peerId } satisfies BcWireMessage);
    });
  }

  async sendSignal(
    _roomCode: string,
    fromPeerId: string,
    signal: WebRtcSignalPayload,
    toPeerId?: string,
  ): Promise<void> {
    this.channel?.postMessage({
      kind: 'signal',
      fromPeerId,
      toPeerId,
      signal,
    } satisfies BcWireMessage);
  }

  async leaveRoom(_roomCode: string, peerId: string): Promise<void> {
    this.channel?.postMessage({
      kind: 'leave',
      fromPeerId: peerId,
      role: this.selfRole,
    } satisfies BcWireMessage);
    this.channel?.close();
    this.channel = null;
  }

  onSignal(handler: (event: SignalDeliveryEvent) => void): () => void {
    this.signalHandlers.add(handler);
    return () => this.signalHandlers.delete(handler);
  }

  onPeerPresence(handler: (event: PeerPresenceEvent) => void): () => void {
    this.presenceHandlers.add(handler);
    return () => this.presenceHandlers.delete(handler);
  }

  dispose(): void {
    this.channel?.close();
    this.channel = null;
    this.signalHandlers.clear();
    this.presenceHandlers.clear();
  }
}
