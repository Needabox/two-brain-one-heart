import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Plugin } from 'vite';

interface PeerEntry {
  peerId: string;
  role: 'host' | 'guest';
  meta: Record<string, unknown>;
  stream: ServerResponse | null;
  queue: string[];
  lastSeenAt: number;
}

interface RoomEntry {
  roomCode: string;
  createdAt: number;
  peers: Map<string, PeerEntry>;
}

const ROOM_TTL_MS = 30 * 60 * 1000;

function readJsonBody(req: IncomingMessage): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', () => {
      try {
        const raw = Buffer.concat(chunks).toString('utf8');
        resolve(raw ? (JSON.parse(raw) as Record<string, unknown>) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

function writeSseEvent(peer: PeerEntry, eventName: string, data: unknown): void {
  const payload = `event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`;
  if (peer.stream && !peer.stream.writableEnded) {
    peer.stream.write(payload);
  } else {
    peer.queue.push(payload);
    if (peer.queue.length > 80) {
      peer.queue.shift();
    }
  }
}

export function createLocalSignalMiddleware() {
  const rooms = new Map<string, RoomEntry>();

  const pruneRooms = (): void => {
    const now = Date.now();
    for (const [code, room] of rooms.entries()) {
      if (now - room.createdAt > ROOM_TTL_MS && room.peers.size === 0) {
        rooms.delete(code);
      }
      let latest = room.createdAt;
      for (const peer of room.peers.values()) {
        if (peer.lastSeenAt > latest) latest = peer.lastSeenAt;
      }
      if (now - latest > ROOM_TTL_MS) {
        rooms.delete(code);
      }
    }
  };

  const handler = async (
    req: IncomingMessage,
    res: ServerResponse,
    next: () => void,
  ): Promise<void> => {
        const urlObj = new URL(req.url ?? '/', 'http://localhost');
        const pathname = urlObj.pathname;

        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        if (req.method === 'OPTIONS') {
          res.statusCode = 204;
          res.end();
          return;
        }

        try {
          if (req.method === 'GET' && pathname === '/health') {
            sendJson(res, 200, { ok: true, mode: 'local-dev-relay' });
            return;
          }

          if (req.method === 'POST' && pathname === '/create') {
            const body = await readJsonBody(req);
            const roomCode = String(body.roomCode ?? '').trim().toUpperCase();
            const peerId = String(body.peerId ?? '').trim();
            const meta = (body.meta as Record<string, unknown>) ?? {};

            if (!roomCode || !peerId) {
              sendJson(res, 400, { error: 'roomCode and peerId are required' });
              return;
            }

            let room = rooms.get(roomCode);
            if (!room) {
              room = { roomCode, createdAt: Date.now(), peers: new Map() };
              rooms.set(roomCode, room);
            }

            const existingHost = Array.from(room.peers.values()).find((p) => p.role === 'host');
            if (existingHost && existingHost.peerId !== peerId) {
              sendJson(res, 409, { error: 'Room code is already hosted by another player' });
              return;
            }

            const existingPeer = room.peers.get(peerId);
            if (existingPeer?.stream && !existingPeer.stream.writableEnded) {
              existingPeer.stream.end();
            }
            room.peers.set(peerId, {
              peerId,
              role: 'host',
              meta,
              stream: null,
              queue: existingPeer?.queue ?? [],
              lastSeenAt: Date.now(),
            });

            const existingGuest = Array.from(room.peers.values()).find((p) => p.role === 'guest');
            if (existingGuest) {
              writeSseEvent(existingGuest, 'peer-joined', {
                peerId,
                role: 'host',
                meta,
              });
              const hostEntry = room.peers.get(peerId);
              if (hostEntry) {
                writeSseEvent(hostEntry, 'peer-joined', {
                  peerId: existingGuest.peerId,
                  role: 'guest',
                  meta: existingGuest.meta,
                });
              }
            }

            sendJson(res, 200, { ok: true, roomCode });
            return;
          }

          if (req.method === 'POST' && pathname === '/join') {
            const body = await readJsonBody(req);
            const roomCode = String(body.roomCode ?? '').trim().toUpperCase();
            const peerId = String(body.peerId ?? '').trim();
            const meta = (body.meta as Record<string, unknown>) ?? {};

            if (!roomCode || !peerId) {
              sendJson(res, 400, { error: 'roomCode and peerId are required' });
              return;
            }

            const room = rooms.get(roomCode);
            if (!room) {
              sendJson(res, 404, { error: 'Room not found. Double-check the code or ask your partner to create one.' });
              return;
            }

            const hostPeer = Array.from(room.peers.values()).find((p) => p.role === 'host');
            if (!hostPeer) {
              sendJson(res, 404, { error: 'Host is no longer in this room.' });
              return;
            }

            const existingGuest = Array.from(room.peers.values()).find(
              (p) => p.role === 'guest' && p.peerId !== peerId,
            );
            if (existingGuest) {
              sendJson(res, 409, { error: 'This cozy room already has 2 players.' });
              return;
            }

            const prevSelf = room.peers.get(peerId);
            if (prevSelf?.stream && !prevSelf.stream.writableEnded) {
              prevSelf.stream.end();
            }
            room.peers.set(peerId, {
              peerId,
              role: 'guest',
              meta,
              stream: null,
              queue: prevSelf?.queue ?? [],
              lastSeenAt: Date.now(),
            });

            hostPeer.lastSeenAt = Date.now();
            writeSseEvent(hostPeer, 'peer-joined', { peerId, role: 'guest', meta });

            sendJson(res, 200, {
              ok: true,
              roomCode,
              hostId: hostPeer.peerId,
              hostMeta: hostPeer.meta,
            });
            return;
          }

          if (req.method === 'POST' && pathname === '/send') {
            const body = await readJsonBody(req);
            const roomCode = String(body.roomCode ?? '').trim().toUpperCase();
            const fromPeerId = String(body.fromPeerId ?? '').trim();
            const toPeerId = body.toPeerId ? String(body.toPeerId) : null;
            const signal = body.signal;

            const room = rooms.get(roomCode);
            if (!room) {
              sendJson(res, 404, { error: 'Room expired or closed' });
              return;
            }

            const sender = room.peers.get(fromPeerId);
            if (sender) sender.lastSeenAt = Date.now();

            for (const peer of room.peers.values()) {
              if (peer.peerId === fromPeerId) continue;
              if (toPeerId && peer.peerId !== toPeerId) continue;
              writeSseEvent(peer, 'signal', { fromPeerId, signal });
            }

            sendJson(res, 200, { ok: true });
            return;
          }

          if (req.method === 'POST' && pathname === '/leave') {
            const body = await readJsonBody(req);
            const roomCode = String(body.roomCode ?? '').trim().toUpperCase();
            const peerId = String(body.peerId ?? '').trim();
            const room = rooms.get(roomCode);

            if (room) {
              const leaving = room.peers.get(peerId);
              room.peers.delete(peerId);
              for (const peer of room.peers.values()) {
                writeSseEvent(peer, 'peer-left', { peerId, role: leaving?.role ?? 'guest' });
              }
              if (room.peers.size === 0) {
                rooms.delete(roomCode);
              }
            }
            sendJson(res, 200, { ok: true });
            return;
          }

          if (req.method === 'GET' && pathname === '/events') {
            const roomCode = (urlObj.searchParams.get('roomCode') ?? '').trim().toUpperCase();
            const peerId = (urlObj.searchParams.get('peerId') ?? '').trim();
            const room = rooms.get(roomCode);
            const peer = room?.peers.get(peerId);

            if (!room || !peer) {
              sendJson(res, 404, { error: 'Peer registration not found in room' });
              return;
            }

            res.statusCode = 200;
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');
            res.flushHeaders?.();

            peer.stream = res;
            peer.lastSeenAt = Date.now();
            res.write(': connected\n\n');

            while (peer.queue.length > 0) {
              const item = peer.queue.shift();
              if (item) res.write(item);
            }

            const keepAlive = setInterval(() => {
              if (!res.writableEnded) {
                peer.lastSeenAt = Date.now();
                res.write(': ping\n\n');
              }
            }, 15_000);

            req.on('close', () => {
              clearInterval(keepAlive);
              if (peer.stream === res) {
                peer.stream = null;
              }
            });
            return;
          }

          next();
        } catch (err) {
          sendJson(res, 500, {
            error: err instanceof Error ? err.message : 'Signal server error',
          });
        }
  };

  return { handler, pruneRooms };
}

export function localSignalPlugin(): Plugin {
  const { handler, pruneRooms } = createLocalSignalMiddleware();

  return {
    name: 'tboh-local-signal',
    configureServer(server) {
      const interval = setInterval(pruneRooms, 60_000);
      server.httpServer?.on('close', () => clearInterval(interval));

      server.middlewares.use('/__signal', (req, res, next) => {
        void handler(req, res, next);
      });
    },
  };
}
