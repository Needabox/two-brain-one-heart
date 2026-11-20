import type { EventPayload, MultiplayerEnvelope } from './protocol';

export type TransportStatus =
  | 'idle'
  | 'waiting-for-partner'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'disconnected'
  | 'error';

export interface GameTransport {
  startWaiting(): void;
  send<T extends MultiplayerEnvelope['type']>(
    type: T,
    payload: EventPayload<T>,
  ): MultiplayerEnvelope;
  isConnected(): boolean;
  dispose(): void;
}
