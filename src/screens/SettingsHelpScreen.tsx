import { useState } from 'react';
import { ArrowLeft, Info, Trash2, Volume2, VolumeX } from 'lucide-react';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { CuteButton } from '../components/CuteButton';
import { PastelCard } from '../components/PastelCard';
import type { AppSettings } from '../features/progression/persistence';
import { getTotalStars, type ProgressionState } from '../game-engine/scoring';
import type { SignalingModeInfo } from '../multiplayer/signaling/SignalingProvider';

interface SettingsHelpScreenProps {
  settings: AppSettings;
  progression: ProgressionState;
  signalingInfo: SignalingModeInfo | null;
  onUpdateSettings: (patch: Partial<AppSettings>) => void;
  onResetProgress: () => void;
  onBack: () => void;
}

export function SettingsHelpScreen({
  settings,
  progression,
  signalingInfo,
  onUpdateSettings,
  onResetProgress,
  onBack,
}: SettingsHelpScreenProps) {
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);
  const totalStars = getTotalStars(progression.levelStars);

  return (
    <div className="mx-auto w-full max-w-2xl space-y-4 py-2">
      <div>
        <CuteButton variant="cream" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back
        </CuteButton>
      </div>

      <PastelCard tone="cream" className="space-y-5">
        <h1 className="font-display text-2xl font-bold text-[#4A355A]">
          Settings &amp; How to Play
        </h1>

        {/* Accessibility & Audio Toggles */}
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3 rounded-2xl border-2 border-[#4A355A]/12 bg-[#F7F3FF] px-4 py-3">
            <div className="flex items-center gap-3">
              {settings.soundEnabled ? (
                <Volume2 className="h-5 w-5 text-[#4A355A]" aria-hidden="true" />
              ) : (
                <VolumeX className="h-5 w-5 text-[#6D5880]" aria-hidden="true" />
              )}
              <div>
                <p className="text-sm font-extrabold text-[#4A355A]">Cozy Sound Effects</p>
                <p className="text-xs text-[#6D5880]">Soft chimes for actions and level clears</p>
              </div>
            </div>
            <CuteButton
              variant={settings.soundEnabled ? 'mint' : 'cream'}
              size="sm"
              role="switch"
              aria-checked={settings.soundEnabled}
              onClick={() => onUpdateSettings({ soundEnabled: !settings.soundEnabled })}
            >
              {settings.soundEnabled ? 'On' : 'Off'}
            </CuteButton>
          </div>

          <div className="flex items-center justify-between gap-3 rounded-2xl border-2 border-[#4A355A]/12 bg-[#F7F3FF] px-4 py-3">
            <div>
              <p className="text-sm font-extrabold text-[#4A355A]">Reduced Motion</p>
              <p className="text-xs text-[#6D5880]">
                Minimizes floating animations and transitions
              </p>
            </div>
            <CuteButton
              variant={settings.reducedMotion ? 'mint' : 'cream'}
              size="sm"
              role="switch"
              aria-checked={settings.reducedMotion}
              onClick={() => onUpdateSettings({ reducedMotion: !settings.reducedMotion })}
            >
              {settings.reducedMotion ? 'On' : 'Off'}
            </CuteButton>
          </div>
        </div>

        {/* How to Play */}
        <div className="space-y-2 rounded-3xl border-2 border-[#76BDFB]/40 bg-[#ECF7FF] p-4">
          <h2 className="font-display text-lg font-bold text-[#1D5587]">
            How Cooperative Play Works
          </h2>
          <ul className="list-disc space-y-1.5 pl-5 text-sm text-[#2B4865]">
            <li>
              <strong>Two Phones / Browsers:</strong> Player A creates a room and shares the
              6-character code. Player B joins with that code.
            </li>
            <li>
              <strong>Talk Out Loud:</strong> Use your own voice/video call or play in the same
              room — no built-in voice chat is needed.
            </li>
            <li>
              <strong>Split Clues:</strong> Player A sees maps, previews, ciphers, or target
              silhouettes. Player B holds the controls, decoder table, or puzzle pieces.
            </li>
            <li>
              <strong>Star Rules:</strong> 1★ for finishing, 2★ within the mistake limit, 3★
              within target time and without hints. Replays never reduce your best stars!
            </li>
          </ul>
        </div>

        {/* Multiplayer & Pure Frontend Info */}
        <div className="space-y-2 rounded-3xl border-2 border-[#9B8CFF]/35 bg-[#F5EFFF] p-4">
          <div className="flex items-center gap-2 text-[#4A355A]">
            <Info className="h-4 w-4 shrink-0" aria-hidden="true" />
            <h2 className="font-display text-base font-bold">
              Multiplayer &amp; Pure Frontend Info
            </h2>
          </div>
          <p className="text-xs leading-relaxed text-[#6D5880]">
            Active mode:{' '}
            <strong>{signalingInfo?.label ?? 'Auto-detected on room start'}</strong>.{' '}
            {signalingInfo?.description ??
              'Runs 100% pure frontend on static hosting (Vercel) using Direct P2P Invite/Reply codes across devices or BroadcastChannel across same-browser tabs. Local dev adds a built-in /__signal relay.'}
          </p>
          <p className="text-xs leading-relaxed text-[#6D5880]">
            Uses public STUN by default for direct peer discovery. Optional{' '}
            <code>VITE_ICE_SERVERS</code> with a TURN server can be added at build time if
            playing across strict cellular/corporate NATs.
          </p>
        </div>

        {/* Local Progress & Reset */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border-2 border-[#4A355A]/12 bg-[#FFF7F2] px-4 py-3">
          <div>
            <p className="text-sm font-extrabold text-[#4A355A]">
              Local Progress: {totalStars}★ • {progression.xp} XP
            </p>
            <p className="text-xs text-[#6D5880]">
              Saved automatically in this browser&apos;s storage.
            </p>
          </div>
          <CuteButton
            variant="cream"
            size="sm"
            onClick={() => setConfirmResetOpen(true)}
          >
            <Trash2 className="h-4 w-4 text-[#F0527F]" aria-hidden="true" />
            Reset Progress
          </CuteButton>
        </div>
      </PastelCard>

      <ConfirmDialog
        open={confirmResetOpen}
        title="Reset local stars & XP?"
        message="This clears your locally saved stars, XP, and level unlocks on this browser."
        confirmLabel="Reset Progress"
        cancelLabel="Cancel"
        onConfirm={() => {
          setConfirmResetOpen(false);
          onResetProgress();
        }}
        onCancel={() => setConfirmResetOpen(false)}
      />
    </div>
  );
}
