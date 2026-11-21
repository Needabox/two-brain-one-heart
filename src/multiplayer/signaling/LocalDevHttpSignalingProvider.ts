import type {
  JoinRoomResult,
  PeerPresenceEvent,
  SignalDeliveryEvent,
  SignalingModeInfo,
  SignalingProvider,
  WebRtcSignalPayload,
} from './SignalingProvider';

export class LocalDevHttpSignalingProvider implements SignalingProvider {
  private eventSource: EventSource | null = null;
  private readonly signalHandlers = new Set<(event: SignalDeliveryEvent) => void>();
  private readonly presenceHandlers = new Set<(event: PeerPresenceEvent) => void>();

  getModeInfo(): SignalingModeInfo {
    return {
      mode: 'local-dev-relay',
      label: 'Local Dev Relay',
      supportsCrossDevice: true,
      description: 'Connected via Vite local dev relay (works across separate browsers & local Wi-Fi). Switch to PeerJS Cloud P2P for internet play.',
    };
  }

  private openEventStream(roomCode: string, peerId: string): void {
    this.eventSource?.close();
    const url = `/__signal/events?roomCode=${encodeURIComponent(roomCode)}&peerId=${encodeURIComponent(peerId)}`;
    const es = new EventSource(url);

    es.addEventListener('signal', (evt) => {
      try {
        const parsed = JSON.parse((evt as MessageEvent<string>).data) as SignalDeliveryEvent;
        this.signalHandlers.forEach((h) => h(parsed));
      } catch {
        // Ignore malformed SSE payload
      }
    });

    es.addEventListener('peer-joined', (evt) => {
      try {
        const data = JSON.parse((evt as MessageEvent<string>).data) as {
          peerId: string;
          role: 'host' | 'guest';
          meta?: Record<string, unknown>;
        };
        this.presenceHandlers.forEach((h) =>
          h({ type: 'peer-joined', peerId: data.peerId, role: data.role, meta: data.meta }),
        );
      } catch {
        // Ignore malformed SSE payload
      }
    });

    es.addEventListener('peer-left', (evt) => {
      try {
        const data = JSON.parse((evt as MessageEvent<string>).data) as {
          peerId: string;
          role: 'host' | 'guest';
        };
        this.presenceHandlers.forEach((h) =>
          h({ type: 'peer-left', peerId: data.peerId, role: data.role }),
        );
      } catch {
        // Ignore malformed SSE payload
      }
    });

    this.eventSource = es;
  }

  async createRoom(roomCode: string, peerId: string, meta?: Record<string, unknown>): Promise<void> {
    const res = await fetch('/__signal/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomCode, peerId, meta: meta ?? {} }),
    });
    const body = (await res.json()) as { error?: string };
    if (!res.ok) {
      throw new Error(body.error ?? 'Could not create room.');
    }
    this.openEventStream(roomCode, peerId);
  }

  async joinRoom(
    roomCode: string,
    peerId: string,
    meta?: Record<string, unknown>,
  ): Promise<JoinRoomResult> {
    const res = await fetch('/__signal/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomCode, peerId, meta: meta ?? {} }),
    });
    const body = (await res.json()) as {
      error?: string;
      hostId?: string;
      hostMeta?: Record<string, unknown>;
    };
    if (!res.ok || !body.hostId) {
      throw new Error(body.error ?? 'Room not found.');
    }
    this.openEventStream(roomCode, peerId);
    return { hostId: body.hostId, hostMeta: body.hostMeta };
  }

  async sendSignal(
    roomCode: string,
    fromPeerId: string,
    signal: WebRtcSignalPayload,
    toPeerId?: string,
  ): Promise<void> {
    const res = await fetch('/__signal/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomCode, fromPeerId, toPeerId, signal }),
    });
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      throw new Error(body.error ?? 'Failed to relay WebRTC signal.');
    }
  }

  async leaveRoom(roomCode: string, peerId: string): Promise<void> {
    this.eventSource?.close();
    this.eventSource = null;
    await fetch('/__signal/leave', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomCode, peerId }),
    }).catch(() => undefined);
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
    this.eventSource?.close();
    this.eventSource = null;
    this.signalHandlers.clear();
    this.presenceHandlers.clear();
  }
}
