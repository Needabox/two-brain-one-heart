import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import type { TransportStatus } from '../multiplayer/GameTransport';
import type { SignalingModeInfo } from '../multiplayer/signaling/SignalingProvider';

interface ConnectionPillProps {
  status: TransportStatus;
  signalingInfo: SignalingModeInfo | null;
}

export function ConnectionPill({ status, signalingInfo }: ConnectionPillProps) {
  const statusStyles: Record<TransportStatus, { label: string; badge: string }> = {
    idle: { label: 'Offline', badge: 'bg-[#EDE5FF] text-[#6D5880]' },
    'waiting-for-partner': { label: 'Waiting for partner', badge: 'bg-[#FFF2C4] text-[#7D5200]' },
    connecting: { label: 'Connecting…', badge: 'bg-[#DFF3FF] text-[#1D5587]' },
    connected: { label: 'Connected', badge: 'bg-[#DCF9ED] text-[#1A6347]' },
    reconnecting: { label: 'Reconnecting…', badge: 'bg-[#FFEBD6] text-[#8F4716]' },
    disconnected: { label: 'Disconnected', badge: 'bg-[#FFE3EC] text-[#9A214B]' },
    error: { label: 'Connection Error', badge: 'bg-[#FFE3EC] text-[#9A214B]' },
  };

  const current = statusStyles[status];

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span
        role="status"
        aria-live="polite"
        className={`inline-flex items-center gap-1.5 rounded-full border-2 border-[#4A355A]/15 px-3 py-1 text-xs font-bold ${current.badge}`}
      >
        {status === 'connected' ? (
          <Wifi className="h-3.5 w-3.5" aria-hidden="true" />
        ) : status === 'reconnecting' || status === 'connecting' ? (
          <RefreshCw className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
        ) : (
          <WifiOff className="h-3.5 w-3.5" aria-hidden="true" />
        )}
        <span>{current.label}</span>
      </span>
      {signalingInfo && (
        <span
          title={signalingInfo.description}
          className="inline-flex items-center rounded-full border-2 border-[#4A355A]/10 bg-[#FFFDF9]/90 px-2.5 py-1 text-[11px] font-semibold text-[#6D5880]"
        >
          {signalingInfo.label}
        </span>
      )}
    </div>
  );
}
