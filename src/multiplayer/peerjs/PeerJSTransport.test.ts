import { describe, expect, it } from 'vitest';
import { buildHostPeerId } from './PeerJSTransport';

describe('PeerJSTransport helpers', () => {
  it('builds deterministic uppercase room peer IDs scoped to Two Brains One Heart', () => {
    expect(buildHostPeerId(' hrt429 ')).toBe('tboh-v1-HRT429');
    expect(buildHostPeerId('cozy99')).toBe('tboh-v1-COZY99');
  });
});
