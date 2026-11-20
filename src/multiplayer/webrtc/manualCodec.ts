import { z } from 'zod';

export const ManualSignalBundleSchema = z.object({
  v: z.literal(1),
  r: z.string().min(4).max(12),
  t: z.enum(['offer', 'answer']),
  sdp: z.string().min(20),
});

export type ManualSignalBundle = z.infer<typeof ManualSignalBundleSchema>;

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlToBytes(b64url: string): Uint8Array {
  const padded = b64url.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(b64url.length / 4) * 4, '=');
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function compressDeflateRaw(input: Uint8Array): Promise<Uint8Array> {
  const cs = new CompressionStream('deflate-raw');
  const writer = cs.writable.getWriter();
  await writer.write(input as unknown as BufferSource);
  await writer.close();
  const buf = await new Response(cs.readable).arrayBuffer();
  return new Uint8Array(buf);
}

async function decompressDeflateRaw(input: Uint8Array): Promise<Uint8Array> {
  const ds = new DecompressionStream('deflate-raw');
  const writer = ds.writable.getWriter();
  await writer.write(input as unknown as BufferSource);
  await writer.close();
  const buf = await new Response(ds.readable).arrayBuffer();
  return new Uint8Array(buf);
}

export async function encodeManualSignalBundle(bundle: ManualSignalBundle): Promise<string> {
  const jsonBytes = new TextEncoder().encode(JSON.stringify(bundle));
  if (typeof CompressionStream !== 'undefined') {
    try {
      const compressed = await compressDeflateRaw(jsonBytes);
      return `TBOH1:${bytesToBase64Url(compressed)}`;
    } catch {
      // Fall back to uncompressed base64url
    }
  }
  return `TBOH0:${bytesToBase64Url(jsonBytes)}`;
}

export async function decodeManualSignalBundle(rawCode: string): Promise<ManualSignalBundle> {
  const trimmed = rawCode.trim().replace(/\s+/g, '');
  let jsonStr: string;

  try {
    if (trimmed.startsWith('TBOH1:')) {
      if (typeof DecompressionStream === 'undefined') {
        throw new Error('This browser cannot decompress TBOH1 codes.');
      }
      const compressed = base64UrlToBytes(trimmed.slice(6));
      const decompressed = await decompressDeflateRaw(compressed);
      jsonStr = new TextDecoder().decode(decompressed);
    } else if (trimmed.startsWith('TBOH0:')) {
      const bytes = base64UrlToBytes(trimmed.slice(6));
      jsonStr = new TextDecoder().decode(bytes);
    } else {
      throw new Error('Code must start with TBOH1: or TBOH0:.');
    }

    const parsedJson = JSON.parse(jsonStr) as unknown;
    const validated = ManualSignalBundleSchema.safeParse(parsedJson);
    if (!validated.success) {
      throw new Error('Invalid signal structure.');
    }
    return validated.data;
  } catch (err) {
    throw new Error(
      err instanceof Error && err.message.includes('decompress')
        ? err.message
        : 'Invalid P2P code. Make sure you pasted the full Invite/Reply code.',
    );
  }
}
