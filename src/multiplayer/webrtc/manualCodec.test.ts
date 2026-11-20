import { describe, expect, it } from 'vitest';
import {
  decodeManualSignalBundle,
  encodeManualSignalBundle,
} from './manualCodec';

describe('Manual P2P Invite/Reply Codec', () => {
  it('encodes and decodes offer and answer bundles cleanly across whitespace wrapping', async () => {
    const sampleSdp = 'v=0\r\no=- 123456789 2 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\n';
    const encoded = await encodeManualSignalBundle({
      v: 1,
      r: 'HRT429',
      t: 'offer',
      sdp: sampleSdp,
    });

    expect(encoded.startsWith('TBOH1:') || encoded.startsWith('TBOH0:')).toBe(true);

    // Simulate chat line wrapping / surrounding whitespace
    const wrapped = `  ${encoded.slice(0, 12)}\n${encoded.slice(12)}  `;
    const decoded = await decodeManualSignalBundle(wrapped);
    expect(decoded).toEqual({
      v: 1,
      r: 'HRT429',
      t: 'offer',
      sdp: sampleSdp,
    });
  });

  it('rejects malformed or corrupted P2P invite codes', async () => {
    await expect(decodeManualSignalBundle('BADCODE')).rejects.toThrow(/Invalid P2P code/i);
    await expect(decodeManualSignalBundle('TBOH0:not-valid-base64!!!')).rejects.toThrow(
      /Invalid P2P code/i,
    );
  });
});
