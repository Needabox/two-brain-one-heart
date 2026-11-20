import { BroadcastChannelSignalingProvider } from './BroadcastChannelSignalingProvider';
import { LocalDevHttpSignalingProvider } from './LocalDevHttpSignalingProvider';
import type {
  JoinRoomResult,
  SignalingModeInfo,
  SignalingProvider,
} from './SignalingProvider';

export class ManualP2PSignalingInfoProvider implements SignalingProvider {
  getModeInfo(): SignalingModeInfo {
    return {
      mode: 'manual-p2p',
      label: 'Direct P2P (Zero Server)',
      supportsCrossDevice: true,
      description:
        'Pure frontend WebRTC using copy-paste Invite & Reply codes. Works across 2 devices on Vercel with no backend or database (note: restrictive cellular NATs may still need STUN/TURN).',
    };
  }

  async createRoom(): Promise<void> {
    // Handled via direct WebRTC manual offer generation
  }

  async joinRoom(): Promise<JoinRoomResult> {
    return { hostId: 'manual-host' };
  }

  async sendSignal(): Promise<void> {
    // No automated signaling relay in manual-p2p mode
  }

  async leaveRoom(): Promise<void> {
    // Nothing to clean up on external server
  }

  onSignal(): () => void {
    return () => undefined;
  }

  onPeerPresence(): () => void {
    return () => undefined;
  }

  dispose(): void {
    // noop
  }
}

export type StaticConnectionPreference = 'manual-p2p' | 'broadcast-channel';

export async function detectLocalDevRelayAvailable(): Promise<boolean> {
  try {
    const res = await fetch('/__signal/health', { method: 'GET' });
    const contentType = res.headers.get('content-type') ?? '';
    if (res.ok && contentType.includes('application/json')) {
      const data = (await res.json()) as { ok?: boolean; mode?: string };
      return data.ok === true && data.mode === 'local-dev-relay';
    }
  } catch {
    // Static build or relay offline
  }
  return false;
}

export async function createSignalingProvider(
  staticPreference: StaticConnectionPreference = 'manual-p2p',
): Promise<SignalingProvider> {
  const modeOverride = (import.meta.env.VITE_SIGNALING_MODE ?? 'auto').toString().trim();

  if (modeOverride === 'broadcast') {
    return new BroadcastChannelSignalingProvider();
  }
  if (modeOverride === 'manual-p2p') {
    return new ManualP2PSignalingInfoProvider();
  }

  if (modeOverride === 'local-relay' || modeOverride === 'auto') {
    if (await detectLocalDevRelayAvailable()) {
      return new LocalDevHttpSignalingProvider();
    }
  }

  return staticPreference === 'broadcast-channel'
    ? new BroadcastChannelSignalingProvider()
    : new ManualP2PSignalingInfoProvider();
}
