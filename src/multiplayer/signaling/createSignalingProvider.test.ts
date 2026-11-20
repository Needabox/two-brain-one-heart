import { afterEach, describe, expect, it, vi } from 'vitest';
import { createSignalingProvider } from './createSignalingProvider';

describe('createSignalingProvider', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('ignores HTML 200 SPA fallback on /__signal/health and selects peerjs or broadcast-channel', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response('<!doctype html><html></html>', {
          status: 200,
          headers: { 'content-type': 'text/html' },
        }),
      ),
    );

    const peerjsProvider = await createSignalingProvider('auto');
    expect(peerjsProvider.getModeInfo().mode).toBe('peerjs');
    peerjsProvider.dispose();

    const broadcast = await createSignalingProvider('broadcast-channel');
    expect(broadcast.getModeInfo().mode).toBe('broadcast-channel');
    broadcast.dispose();
  });

  it('selects LocalDevHttpSignalingProvider only when JSON health matches local-dev-relay', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(JSON.stringify({ ok: true, mode: 'local-dev-relay' }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      ),
    );

    const provider = await createSignalingProvider('auto');
    expect(provider.getModeInfo().mode).toBe('local-dev-relay');
    provider.dispose();
  });
});
