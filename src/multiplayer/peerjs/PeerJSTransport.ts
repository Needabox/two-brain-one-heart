import Peer, { type DataConnection, type PeerJSOption } from 'peerjs';
import { EnvelopeChannel } from '../EnvelopeChannel';
import type { GameTransport, TransportStatus } from '../GameTransport';
import {
  buildEnvelope,
  type EventPayload,
  type MultiplayerEnvelope,
} from '../protocol';
import { parseConfiguredIceServers } from '../webrtc/WebRTCTransport';

export function buildHostPeerId(roomCode: string): string {
  return `tboh-v1-${roomCode.trim().toUpperCase()}`;
}

export function buildPeerJsOptions(): PeerJSOption {
  const customHost = (import.meta.env.VITE_PEER_HOST ?? '').toString().trim();
  const customPortRaw = (import.meta.env.VITE_PEER_PORT ?? '').toString().trim();
  const customPath = (import.meta.env.VITE_PEER_PATH ?? '').toString().trim();

  const opts: PeerJSOption = {
    config: { iceServers: parseConfiguredIceServers() },
    debug: 0,
  };

  if (customHost) {
    opts.host = customHost;
    opts.secure = true;
    const parsedPort = Number(customPortRaw);
    if (Number.isFinite(parsedPort) && parsedPort > 0) opts.port = parsedPort;
    if (customPath) opts.path = customPath;
  }

  return opts;
}

export interface PeerJSTransportOptions {
  roomCode: string;
  selfPeerId: string;
  role: 'host' | 'guest';
  onStatusChange: (status: TransportStatus, detail?: string) => void;
  onEnvelope: (envelope: MultiplayerEnvelope) => void;
}

export class PeerJSTransport implements GameTransport {
  private readonly opts: PeerJSTransportOptions;
  private readonly channel: EnvelopeChannel;
  private peer: Peer | null = null;
  private conn: DataConnection | null = null;
  private activeGuestPlayerId: string | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempts = 0;
  private disposed = false;

  constructor(opts: PeerJSTransportOptions) {
    this.opts = opts;
    this.channel = new EnvelopeChannel(opts);
  }

  public startWaiting(): void {
    this.opts.onStatusChange(
      this.opts.role === 'host' ? 'waiting-for-partner' : 'connecting',
    );
  }

  private rawSend = (serialized: string): boolean => {
    if (!this.conn?.open) return false;
    void this.conn.send(serialized);
    return true;
  };

  public async createAsHost(): Promise<void> {
    if (this.disposed) return;
    const hostPeerId = buildHostPeerId(this.opts.roomCode);

    await new Promise<void>((resolve, reject) => {
      let settled = false;
      const peer = new Peer(hostPeerId, buildPeerJsOptions());
      this.peer = peer;

      const timeout = setTimeout(() => {
        if (settled) return;
        settled = true;
        reject(new Error('Could not reach PeerJS Cloud broker. Check your internet connection.'));
      }, 10_000);

      peer.on('open', () => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        this.opts.onStatusChange('waiting-for-partner', 'Room live on PeerJS Cloud. Waiting for partner...');
        resolve();
      });

      peer.on('connection', (incomingConn) => {
        this.handleIncomingHostConnection(incomingConn);
      });

      peer.on('disconnected', () => {
        if (!this.disposed && !peer.destroyed) peer.reconnect();
      });

      peer.on('error', (err) => {
        if (!settled) {
          settled = true;
          clearTimeout(timeout);
          reject(
            new Error(
              err.type === 'unavailable-id'
                ? 'That room code is temporarily in use. Please try again.'
                : err.message || 'PeerJS host registration failed.',
            ),
          );
          return;
        }
        if (err.type === 'network' || err.type === 'server-error' || err.type === 'socket-error') {
          this.opts.onStatusChange('reconnecting', 'PeerJS signaling connection interrupted...');
        }
      });
    });
  }

  public async connectAsGuest(): Promise<void> {
    if (this.disposed) return;
    const hostPeerId = buildHostPeerId(this.opts.roomCode);

    await new Promise<void>((resolve, reject) => {
      let settled = false;
      const peer = new Peer(`tboh-g-${this.opts.selfPeerId.slice(0, 12)}`, buildPeerJsOptions());
      this.peer = peer;

      const failOnce = (message: string) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        reject(new Error(message));
      };

      const timeout = setTimeout(
        () =>
          failOnce(
            'Connection timed out. Check the room code, or if on strict mobile NAT/firewall try Wi-Fi or a TURN server.',
          ),
        15_000,
      );

      peer.on('open', () => {
        if (this.disposed) return;
        this.opts.onStatusChange('connecting', 'Connecting to partner via PeerJS...');
        const conn = peer.connect(hostPeerId, {
          reliable: true,
          serialization: 'raw',
          metadata: { playerId: this.opts.selfPeerId },
        });
        this.wireDataConnection(conn, () => {
          if (settled) return;
          settled = true;
          clearTimeout(timeout);
          resolve();
        });
      });

      peer.on('disconnected', () => {
        if (!this.disposed && !peer.destroyed) peer.reconnect();
      });

      peer.on('error', (err) => {
        if (err.type === 'peer-unavailable') {
          failOnce('Room not found. Double-check the 6-character code or ask your partner to open the room.');
        } else if (!settled) {
          failOnce(err.message || 'Could not connect to PeerJS room.');
        }
      });
    });
  }

  private handleIncomingHostConnection(incomingConn: DataConnection): void {
    if (this.disposed) {
      incomingConn.close();
      return;
    }

    const meta = incomingConn.metadata as { playerId?: string } | undefined;
    const incomingPlayerId = meta?.playerId ?? incomingConn.peer;

    if (
      this.conn?.open &&
      this.activeGuestPlayerId &&
      this.activeGuestPlayerId !== incomingPlayerId
    ) {
      incomingConn.on('open', () => {
        const leaveEnv = buildEnvelope(
          this.opts.roomCode,
          this.opts.selfPeerId,
          this.channel.nextSequence(),
          'ROOM_LEAVE',
          { reason: 'This cozy room already has 2 players.' },
        );
        void incomingConn.send(JSON.stringify(leaveEnv));
        setTimeout(() => incomingConn.close(), 120);
      });
      return;
    }

    if (this.conn && this.conn !== incomingConn) {
      this.teardownConnectionOnly();
    }

    this.activeGuestPlayerId = incomingPlayerId;
    this.wireDataConnection(incomingConn);
  }

  private wireDataConnection(conn: DataConnection, onFirstOpen?: () => void): void {
    this.conn = conn;

    conn.on('open', () => {
      if (this.disposed) return;
      this.reconnectAttempts = 0;
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
      }
      this.opts.onStatusChange('connected');
      this.channel.flush(this.rawSend);
      this.channel.startHeartbeat((sentAt) => {
        if (this.conn?.open) this.send('PING', { sentAt });
      });
      onFirstOpen?.();
    });

    conn.on('data', (rawData) => {
      this.channel.handleRawData(rawData, (echoedSentAt) =>
        this.send('PONG', { echoedSentAt }),
      );
    });

    conn.on('iceStateChanged', (state) => {
      if (!this.disposed && state === 'failed') {
        this.opts.onStatusChange(
          'error',
          'WebRTC NAT traversal failed (strict firewall/CGNAT). Try Wi-Fi or configure a TURN server in VITE_ICE_SERVERS.',
        );
      }
    });

    conn.on('close', () => {
      if (this.disposed) return;
      this.channel.stopHeartbeat();
      this.opts.onStatusChange('reconnecting', 'Partner connection closed. Waiting to reconnect...');
      if (this.opts.role === 'guest') {
        this.scheduleGuestReconnect();
      }
    });

    conn.on('error', () => {
      if (!this.disposed) {
        this.opts.onStatusChange('reconnecting', 'Temporary peer channel issue...');
      }
    });
  }

  private scheduleGuestReconnect(): void {
    if (this.disposed || this.reconnectTimer || this.reconnectAttempts >= 8) {
      if (this.reconnectAttempts >= 8) {
        this.opts.onStatusChange('disconnected', 'Could not reach host after several attempts.');
      }
      return;
    }
    this.reconnectAttempts += 1;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (this.disposed || !this.peer || this.peer.destroyed) return;
      const conn = this.peer.connect(buildHostPeerId(this.opts.roomCode), {
        reliable: true,
        serialization: 'raw',
        metadata: { playerId: this.opts.selfPeerId },
      });
      this.wireDataConnection(conn);
    }, 2500);
  }

  public send<T extends MultiplayerEnvelope['type']>(
    type: T,
    payload: EventPayload<T>,
  ): MultiplayerEnvelope {
    return this.channel.send(type, payload, this.rawSend);
  }

  private teardownConnectionOnly(): void {
    this.channel.stopHeartbeat();
    if (this.conn) {
      this.conn.removeAllListeners();
      try {
        this.conn.close();
      } catch {
        // ignore
      }
      this.conn = null;
    }
  }

  public isConnected(): boolean {
    return Boolean(this.conn?.open);
  }

  public dispose(): void {
    this.disposed = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.teardownConnectionOnly();
    this.channel.dispose();
    if (this.peer) {
      this.peer.removeAllListeners();
      try {
        this.peer.destroy();
      } catch {
        // ignore
      }
      this.peer = null;
    }
  }
}
