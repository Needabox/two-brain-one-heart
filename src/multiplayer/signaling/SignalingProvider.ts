export type SignalingMode = 'peerjs' | 'local-dev-relay' | 'broadcast-channel';

export interface SignalingModeInfo {
  mode: SignalingMode;
  label: string;
  supportsCrossDevice: boolean;
  description: string;
}

export type WebRtcSignalPayload =
  | { kind: 'offer'; sdp: RTCSessionDescriptionInit }
  | { kind: 'answer'; sdp: RTCSessionDescriptionInit }
  | { kind: 'ice'; candidate: RTCIceCandidateInit }
  | { kind: 'ready-to-pair'; peerId: string };

export interface PeerPresenceEvent {
  type: 'peer-joined' | 'peer-left';
  peerId: string;
  role: 'host' | 'guest';
  meta?: Record<string, unknown>;
}

export interface SignalDeliveryEvent {
  fromPeerId: string;
  signal: WebRtcSignalPayload;
}

export interface JoinRoomResult {
  hostId: string;
  hostMeta?: Record<string, unknown>;
}

export interface SignalingProvider {
  getModeInfo(): SignalingModeInfo;
  createRoom(roomCode: string, peerId: string, meta?: Record<string, unknown>): Promise<void>;
  joinRoom(roomCode: string, peerId: string, meta?: Record<string, unknown>): Promise<JoinRoomResult>;
  sendSignal(roomCode: string, fromPeerId: string, signal: WebRtcSignalPayload, toPeerId?: string): Promise<void>;
  leaveRoom(roomCode: string, peerId: string): Promise<void>;
  onSignal(handler: (event: SignalDeliveryEvent) => void): () => void;
  onPeerPresence(handler: (event: PeerPresenceEvent) => void): () => void;
  dispose(): void;
}
