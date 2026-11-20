// @vitest-environment node
import { EventEmitter } from 'node:events';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { describe, expect, it } from 'vitest';
import { createLocalSignalMiddleware } from '../../vite-plugin-local-signal';

function createMockRequest(
  method: string,
  url: string,
  body?: unknown,
): IncomingMessage {
  const emitter = new EventEmitter() as IncomingMessage;
  emitter.method = method;
  emitter.url = url;
  if (body !== undefined) {
    queueMicrotask(() => {
      emitter.emit('data', Buffer.from(JSON.stringify(body), 'utf8'));
      emitter.emit('end');
    });
  } else {
    queueMicrotask(() => emitter.emit('end'));
  }
  return emitter;
}

function createMockResponse() {
  const headers: Record<string, string> = {};
  const chunks: string[] = [];
  let resolveDone: (() => void) | null = null;
  const donePromise = new Promise<void>((resolve) => {
    resolveDone = resolve;
  });

  let ended = false;
  const res = {
    statusCode: 200,
    get writableEnded() {
      return ended;
    },
    setHeader(k: string, v: string) {
      headers[k] = v;
    },
    flushHeaders() {
      // noop
    },
    write(chunk: string) {
      chunks.push(chunk);
      return true;
    },
    end(chunk?: string) {
      if (chunk) chunks.push(chunk);
      ended = true;
      resolveDone?.();
    },
  } as unknown as ServerResponse;

  return {
    res,
    headers,
    chunks,
    donePromise,
    readJson() {
      return JSON.parse(chunks.join('')) as Record<string, unknown>;
    },
  };
}

describe('Vite Local Signal Relay Middleware (In-Process)', () => {
  it('supports health, room creation, invalid room 404, valid join, capacity 409, and queued SSE delivery', async () => {
    const { handler } = createLocalSignalMiddleware();

    const invoke = async (method: string, url: string, body?: unknown) => {
      const req = createMockRequest(method, url, body);
      const mock = createMockResponse();
      await handler(req, mock.res, () => {
        mock.res.statusCode = 404;
        mock.res.end('Not found');
      });
      await mock.donePromise;
      return mock;
    };

    const health = await invoke('GET', '/health');
    expect(health.res.statusCode).toBe(200);
    expect(health.readJson()).toEqual({ ok: true, mode: 'local-dev-relay' });

    const missing = await invoke('POST', '/join', { roomCode: 'BAD999', peerId: 'guest-1' });
    expect(missing.res.statusCode).toBe(404);

    const created = await invoke('POST', '/create', {
      roomCode: 'HRT429',
      peerId: 'host-1',
      meta: { name: 'Alex' },
    });
    expect(created.res.statusCode).toBe(200);

    const joined = await invoke('POST', '/join', {
      roomCode: 'HRT429',
      peerId: 'guest-1',
      meta: { name: 'Sam' },
    });
    expect(joined.res.statusCode).toBe(200);
    expect(joined.readJson().hostId).toBe('host-1');

    const third = await invoke('POST', '/join', { roomCode: 'HRT429', peerId: 'guest-2' });
    expect(third.res.statusCode).toBe(409);

    const sent = await invoke('POST', '/send', {
      roomCode: 'HRT429',
      fromPeerId: 'guest-1',
      toPeerId: 'host-1',
      signal: { kind: 'ready-to-pair', peerId: 'guest-1' },
    });
    expect(sent.res.statusCode).toBe(200);

    // Host opens SSE stream and immediately receives queued peer-joined + signal events
    const sseReq = createMockRequest('GET', '/events?roomCode=HRT429&peerId=host-1');
    const sseMock = createMockResponse();
    await handler(sseReq, sseMock.res, () => undefined);
    const streamText = sseMock.chunks.join('');
    expect(sseMock.res.statusCode).toBe(200);
    expect(streamText).toContain('event: peer-joined');
    expect(streamText).toContain('event: signal');
    expect(streamText).toContain('ready-to-pair');
    sseReq.emit('close');

    // Host re-create (refresh recovery) succeeds cleanly
    const hostRefresh = await invoke('POST', '/create', {
      roomCode: 'HRT429',
      peerId: 'host-1',
      meta: { name: 'Alex' },
    });
    expect(hostRefresh.res.statusCode).toBe(200);

    const leave = await invoke('POST', '/leave', { roomCode: 'HRT429', peerId: 'host-1' });
    expect(leave.res.statusCode).toBe(200);
  });
});
