import { useEffect, useState } from 'react';
import { AlertTriangle, Clock, LogOut, RotateCcw } from 'lucide-react';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { ConnectionPill } from '../components/ConnectionPill';
import { CuteButton } from '../components/CuteButton';
import { PastelCard } from '../components/PastelCard';
import { getLevelMeta } from '../game-engine/puzzles';
import { getArcadeGameEntry } from '../game-engine/registry';
import type {
  GameActionInput,
  LaunchTarget,
  LevelId,
  PlayerAView,
  SanitizedSnapshotPayload,
} from '../game-engine/types';
import { BalloonRescueGame } from '../games/balloon-rescue/BalloonRescueGame';
import { BridgeBuilderGame } from '../games/bridge-builder/BridgeBuilderGame';
import { DontPressTogetherGame } from '../games/dont-press-together/DontPressTogetherGame';
import { DrawMyMindGame } from '../games/draw-my-mind/DrawMyMindGame';
import { LostTogetherGame } from '../games/lost-together/LostTogetherGame';
import { MemorySyncGame } from '../games/memory-sync/MemorySyncGame';
import { MirrorMovesGame } from '../games/mirror-moves/MirrorMovesGame';
import { MixedChallengeGame } from '../games/mixed-challenge/MixedChallengeGame';
import { PotionLabGame } from '../games/potion-lab/PotionLabGame';
import { PowerConnectionGame } from '../games/power-connection/PowerConnectionGame';
import { RhythmDuoGame } from '../games/rhythm-duo/RhythmDuoGame';
import { SecretLanguageGame } from '../games/secret-language/SecretLanguageGame';
import { ShapeItGame } from '../games/shape-it/ShapeItGame';
import type { SignalingModeInfo } from '../multiplayer/signaling/SignalingProvider';
import type { TransportStatus } from '../multiplayer/webrtc/WebRTCTransport';

interface MiniGameScreenProps {
  levelId: LevelId;
  target?: LaunchTarget;
  role: 'host' | 'guest';
  playerAView: PlayerAView | null;
  snapshot: SanitizedSnapshotPayload | null;
  transportStatus: TransportStatus;
  signalingInfo: SignalingModeInfo | null;
  onAction: (action: GameActionInput) => void;
  onRestart: () => void;
  onExitToLobby: () => void;
}

function formatDuration(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

export function MiniGameScreen({
  levelId,
  target,
  role,
  playerAView,
  snapshot,
  transportStatus,
  signalingInfo,
  onAction,
  onRestart,
  onExitToLobby,
}: MiniGameScreenProps) {
  const [confirmExitOpen, setConfirmExitOpen] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const resolvedTarget: LaunchTarget =
    target ?? snapshot?.summary.target ?? { mode: 'campaign', levelId };
  const meta = getLevelMeta(levelId);
  const arcadeEntry =
    resolvedTarget.mode === 'arcade'
      ? getArcadeGameEntry(resolvedTarget.gameId)
      : null;

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(t);
  }, []);

  const startedAt = snapshot?.summary.startedAt ?? now;
  const elapsedMs = Math.max(0, now - startedAt);
  const mistakes = snapshot?.summary.mistakes ?? 0;
  const hintsUsed = snapshot?.summary.hintsUsed ?? 0;
  const isConnectionInterrupted =
    transportStatus === 'reconnecting' ||
    transportStatus === 'disconnected' ||
    transportStatus === 'error';

  const renderGame = () => {
    const bView = snapshot?.playerBView ?? null;

    if (resolvedTarget.mode === 'arcade') {
      switch (resolvedTarget.gameId) {
        case 'rhythm-duo':
          return (
            <RhythmDuoGame
              role={role}
              playerAView={playerAView?.kind === 'rhythm-duo' ? playerAView : null}
              playerBView={bView?.kind === 'rhythm-duo' ? bView : null}
              onAction={onAction}
            />
          );
        case 'power-connection':
          return (
            <PowerConnectionGame
              role={role}
              playerAView={
                playerAView?.kind === 'power-connection' ? playerAView : null
              }
              playerBView={bView?.kind === 'power-connection' ? bView : null}
              onAction={onAction}
            />
          );
        case 'dont-press-together':
          return (
            <DontPressTogetherGame
              role={role}
              playerAView={
                playerAView?.kind === 'dont-press-together' ? playerAView : null
              }
              playerBView={bView?.kind === 'dont-press-together' ? bView : null}
              onAction={onAction}
            />
          );
        case 'potion-lab':
          return (
            <PotionLabGame
              role={role}
              playerAView={playerAView?.kind === 'potion-lab' ? playerAView : null}
              playerBView={bView?.kind === 'potion-lab' ? bView : null}
              onAction={onAction}
            />
          );
        case 'mirror-moves':
          return (
            <MirrorMovesGame
              role={role}
              view={
                role === 'host'
                  ? playerAView?.kind === 'mirror-moves'
                    ? playerAView
                    : null
                  : bView?.kind === 'mirror-moves'
                    ? bView
                    : null
              }
              onAction={onAction}
            />
          );
        case 'draw-my-mind':
          return (
            <DrawMyMindGame
              role={role}
              view={
                role === 'host'
                  ? playerAView?.kind === 'draw-my-mind'
                    ? playerAView
                    : null
                  : bView?.kind === 'draw-my-mind'
                    ? bView
                    : null
              }
              onAction={onAction}
            />
          );
        case 'bridge-builder':
          return (
            <BridgeBuilderGame
              role={role}
              playerAView={
                playerAView?.kind === 'bridge-builder' ? playerAView : null
              }
              playerBView={bView?.kind === 'bridge-builder' ? bView : null}
              onAction={onAction}
            />
          );
        case 'balloon-rescue':
          return (
            <BalloonRescueGame
              role={role}
              playerAView={
                playerAView?.kind === 'balloon-rescue' ? playerAView : null
              }
              playerBView={bView?.kind === 'balloon-rescue' ? bView : null}
              onAction={onAction}
            />
          );
      }
    }

    if (meta.miniGame === 'memory-sync') {
      return (
        <MemorySyncGame
          role={role}
          playerAView={playerAView?.kind === 'memory-sync' ? playerAView : null}
          playerBView={bView?.kind === 'memory-sync' ? bView : null}
          onAction={onAction}
        />
      );
    }
    if (meta.miniGame === 'secret-language') {
      return (
        <SecretLanguageGame
          role={role}
          playerAView={playerAView?.kind === 'secret-language' ? playerAView : null}
          playerBView={bView?.kind === 'secret-language' ? bView : null}
          onAction={onAction}
        />
      );
    }
    if (meta.miniGame === 'lost-together') {
      return (
        <LostTogetherGame
          role={role}
          playerAView={playerAView?.kind === 'lost-together' ? playerAView : null}
          playerBView={bView?.kind === 'lost-together' ? bView : null}
          onAction={onAction}
        />
      );
    }
    if (meta.miniGame === 'shape-it') {
      return (
        <ShapeItGame
          role={role}
          playerAView={playerAView?.kind === 'shape-it' ? playerAView : null}
          playerBView={bView?.kind === 'shape-it' ? bView : null}
          onAction={onAction}
        />
      );
    }
    return (
      <MixedChallengeGame
        role={role}
        playerAView={playerAView?.kind === 'mixed-challenge' ? playerAView : null}
        playerBView={bView?.kind === 'mixed-challenge' ? bView : null}
        onAction={onAction}
      />
    );
  };

  const roleBadgeLabel = arcadeEntry
    ? role === 'host'
      ? `Player A • ${arcadeEntry.playerARole}`
      : `Player B • ${arcadeEntry.playerBRole}`
    : role === 'host'
      ? 'Player A • Clue Holder'
      : 'Player B • Controller';

  return (
    <div className="mx-auto w-full max-w-2xl space-y-3 py-1">
      {/* HUD Header */}
      <PastelCard tone="cream" className="space-y-3 !p-3.5 sm:!p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#9B8CFF]">
              {arcadeEntry && resolvedTarget.mode === 'arcade'
                ? `Arcade • ${arcadeEntry.category} • ${resolvedTarget.difficulty}`
                : `Level ${meta.id} • The Cozy Room`}
            </p>
            <h1 className="font-display text-lg font-bold text-[#4A355A] sm:text-xl">
              {arcadeEntry ? arcadeEntry.name : meta.name}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            {role === 'host' && (
              <CuteButton
                variant="cream"
                size="sm"
                onClick={onRestart}
                title="Restart level"
                aria-label="Restart level"
              >
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
              </CuteButton>
            )}
            <CuteButton
              variant="cream"
              size="sm"
              onClick={() => setConfirmExitOpen(true)}
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Exit
            </CuteButton>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t-2 border-[#4A355A]/10 pt-2.5 text-xs font-bold text-[#4A355A]">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-3 py-1 ${
                role === 'host'
                  ? 'bg-[#EDE5FF] text-[#4A355A]'
                  : 'bg-[#DFF3FF] text-[#1D5587]'
              }`}
            >
              {roleBadgeLabel}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-[#FFF2C4] px-2.5 py-1 text-[#7D5200]">
              <Clock className="h-3.5 w-3.5" aria-hidden="true" />
              {formatDuration(elapsedMs)}
            </span>
            <span className="rounded-full bg-[#FFE3EC] px-2.5 py-1 text-[#9A214B]">
              Mistakes: {mistakes}
            </span>
            {hintsUsed > 0 && (
              <span className="rounded-full bg-[#FFF2C4] px-2.5 py-1 text-[#7D5200]">
                Hints: {hintsUsed}
              </span>
            )}
          </div>

          <ConnectionPill status={transportStatus} signalingInfo={signalingInfo} />
        </div>
      </PastelCard>

      {isConnectionInterrupted && (
        <PastelCard
          role="alert"
          tone="pink"
          className="flex flex-wrap items-center justify-between gap-3 !py-3"
        >
          <div className="flex items-center gap-2 text-sm font-bold text-[#9A214B]">
            <AlertTriangle className="h-5 w-5 shrink-0" aria-hidden="true" />
            <span>
              Partner connection interrupted ({transportStatus}). Waiting to restore your live board…
            </span>
          </div>
          <CuteButton variant="cream" size="sm" onClick={onExitToLobby}>
            Return to Lobby
          </CuteButton>
        </PastelCard>
      )}

      {renderGame()}

      <ConfirmDialog
        open={confirmExitOpen}
        title="Leave this level?"
        message="Returning to the lobby will end the active puzzle round for both players."
        confirmLabel="Leave Level"
        cancelLabel="Keep Playing"
        onConfirm={() => {
          setConfirmExitOpen(false);
          onExitToLobby();
        }}
        onCancel={() => setConfirmExitOpen(false)}
      />
    </div>
  );
}
