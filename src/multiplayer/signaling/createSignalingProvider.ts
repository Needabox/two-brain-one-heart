import { BroadcastChannelSignalingProvider } from './BroadcastChannelSignalingProvider';
import { LocalDevHttpSignalingProvider } from './LocalDevHttpSignalingProvider';
import type { SignalingModeInfo, SignalingProvider } from './SignalingProvider';

const PEERJS_MODE_INFO: SignalingModeInfo = {
  mode: 'peerjs',
  label: 'PeerJS Cloud P2P',
  supportsCrossDevice: true,
  description:
    'Uses PeerJS Cloud WebSocket broker (0.peerjs.com) + WebRTC DataChannels for 6-character room codes across separate devices without any backend server.',
};

const noop = async () => undefined;
const noopUnsub = () => () => undefined;

function createPeerJsInfoProvider(): SignalingProvider {
  return {
    getModeInfo: () => PEERJS_MODE_INFO,
    createRoom: noop,
    joinRoom: async () => ({ hostId: 'peerjs-host' }),
    sendSignal: noop,
    leaveRoom: noop,
    onSignal: noopUnsub,
    onPeerPresence: noopUnsub,
    dispose: () => undefined,
  };
}

export type ConnectionModePreference =
  | 'auto'
  | 'peerjs'
  | 'local-dev-relay'
  | 'broadcast-channel';

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
  preference: ConnectionModePreference = 'auto',
): Promise<SignalingProvider> {
  const modeOverride = (import.meta.env.VITE_SIGNALING_MODE ?? 'auto').toString().trim();

  if (preference === 'broadcast-channel' || modeOverride === 'broadcast') {
    return new BroadcastChannelSignalingProvider();
  }
  if (preference === 'peerjs' || modeOverride === 'peerjs') {
    return createPeerJsInfoProvider();
  }

  if (preference === 'local-dev-relay' || preference === 'auto' || modeOverride === 'local-relay') {
    if (await detectLocalDevRelayAvailable()) {
      return new LocalDevHttpSignalingProvider();
    }
  }

  return createPeerJsInfoProvider();
}
