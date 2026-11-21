import type { TransportStatus } from './GameTransport';
import {
  buildEnvelope,
  EventDeduplicator,
  parseMultiplayerEnvelope,
  type EventPayload,
  type MultiplayerEnvelope,
} from './protocol';

export interface EnvelopeChannelOptions {
  roomCode: string;
  selfPeerId: string;
  onStatusChange: (status: TransportStatus, detail?: string) => void;
  onEnvelope: (envelope: MultiplayerEnvelope) => void;
}

/** Shared framing, deduplication, outbound buffering, and heartbeat manager across transports */
export class EnvelopeChannel {
  private readonly opts: EnvelopeChannelOptions;
  private readonly dedup = new EventDeduplicator(500);
  private outboundQueue: MultiplayerEnvelope[] = [];
  private seq = 1;
  private pingTimer: ReturnType<typeof setInterval> | null = null;
  private lastPongAt = 0;
  private disposed = false;

  constructor(opts: EnvelopeChannelOptions) {
    this.opts = opts;
  }

  public nextSequence(): number {
    return this.seq++;
  }

  public send<T extends MultiplayerEnvelope['type']>(
    type: T,
    payload: EventPayload<T>,
    rawSend: ((serialized: string) => boolean),
  ): MultiplayerEnvelope {
    const envelope = buildEnvelope(
      this.opts.roomCode,
      this.opts.selfPeerId,
      this.seq++,
      type,
      payload,
    );
    const serialized = JSON.stringify(envelope);

    if (!rawSend(serialized) && type !== 'PING' && type !== 'PONG') {
      this.outboundQueue.push(envelope);
      if (this.outboundQueue.length > 50) {
        this.outboundQueue.shift();
      }
    }

    return envelope;
  }

  public flush(rawSend: (serialized: string) => boolean): void {
    while (this.outboundQueue.length > 0) {
      const next = this.outboundQueue[0];
      if (!next || !rawSend(JSON.stringify(next))) break;
      this.outboundQueue.shift();
    }
  }

  public handleRawData(
    rawData: unknown,
    sendPong: (echoedSentAt: number) => void,
  ): void {
    if (this.disposed) return;
    try {
      const parsedJson =
        typeof rawData === 'string' ? (JSON.parse(rawData) as unknown) : rawData;
      const envelope = parseMultiplayerEnvelope(parsedJson);
      if (!envelope || envelope.roomId !== this.opts.roomCode) return;
      if (this.dedup.hasSeenOrMark(envelope.eventId)) return;

      if (envelope.type === 'PING') {
        sendPong(envelope.payload.sentAt);
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
  }

  public startHeartbeat(sendPing: (sentAt: number) => void): void {
    this.stopHeartbeat();
    this.lastPongAt = Date.now();
    this.pingTimer = setInterval(() => {
      if (this.disposed) return;
      sendPing(Date.now());
      const silenceMs = Date.now() - this.lastPongAt;
      if (silenceMs > 22_000) {
        this.opts.onStatusChange('disconnected', 'Partner timed out.');
      } else if (silenceMs > 10_000) {
        this.opts.onStatusChange('reconnecting', 'Waiting for partner heartbeat...');
      }
    }, 4000);
  }

  public stopHeartbeat(): void {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }

  public dispose(): void {
    this.disposed = true;
    this.stopHeartbeat();
    this.outboundQueue = [];
    this.dedup.clear();
  }
}
