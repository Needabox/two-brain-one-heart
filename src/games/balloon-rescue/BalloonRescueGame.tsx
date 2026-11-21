import { useEffect } from 'react';
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Lightbulb,
  Pause,
  RotateCcw,
  Wind,
} from 'lucide-react';
import { CuteButton } from '../../components/CuteButton';
import { PastelCard } from '../../components/PastelCard';
import type { GameActionInput } from '../../game-engine/types';
import type {
  BalloonRescuePlayerAView,
  BalloonRescuePlayerBView,
} from './types';

interface BalloonRescueGameProps {
  role: 'host' | 'guest';
  playerAView: BalloonRescuePlayerAView | null;
  playerBView: BalloonRescuePlayerBView | null;
  onAction: (action: GameActionInput) => void;
}

export function BalloonRescueGame({
  role,
  playerAView,
  playerBView,
  onAction,
}: BalloonRescueGameProps) {
  const isHost = role === 'host';
  const view = isHost ? playerAView : playerBView;

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (isHost) {
        if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
          e.preventDefault();
          onAction({ kind: 'balloon-rescue', type: 'SET_BALLOON_STEER', steer: -1 });
        } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
          e.preventDefault();
          onAction({ kind: 'balloon-rescue', type: 'SET_BALLOON_STEER', steer: 1 });
        } else if (e.key === ' ') {
          e.preventDefault();
          onAction({ kind: 'balloon-rescue', type: 'SET_BALLOON_STEER', steer: 0 });
        }
      } else {
        if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
          e.preventDefault();
          onAction({ kind: 'balloon-rescue', type: 'SET_BALLOON_LIFT', lift: 1 });
        } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
          e.preventDefault();
          onAction({ kind: 'balloon-rescue', type: 'SET_BALLOON_LIFT', lift: -1 });
        } else if (e.key === ' ') {
          e.preventDefault();
          onAction({ kind: 'balloon-rescue', type: 'SET_BALLOON_LIFT', lift: 0 });
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isHost, onAction]);

  if (!view) return null;

  const steerVal =
    isHost && playerAView
      ? playerAView.steerA
      : !isHost && playerBView
        ? playerBView.partnerSteerState
        : 0;
  const liftVal =
    !isHost && playerBView
      ? playerBView.liftB
      : isHost && playerAView
        ? playerAView.partnerLiftState
        : 0;

  return (
    <PastelCard tone={isHost ? 'lavender' : 'sky'} className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-wider text-[#6D5880]">
            Course {view.stageIndex + 1} of {view.totalStages} • {view.stageTitle}
          </p>
          <h2 className="font-display text-xl font-bold text-[#4A355A]">
            {isHost ? 'Player A: Horizontal Rudder (← / →)' : 'Player B: Vertical Burner (↑ / ↓)'}
          </h2>
        </div>

        <div className="flex flex-wrap gap-2">
          <CuteButton
            variant="cream"
            size="sm"
            onClick={() => onAction({ kind: 'common', type: 'USE_HINT' })}
          >
            <Lightbulb className="h-4 w-4 text-[#E89B1E]" aria-hidden="true" />
            Calm Wind (Hint)
          </CuteButton>
          <CuteButton
            variant="cream"
            size="sm"
            onClick={() => onAction({ kind: 'balloon-rescue', type: 'RESET_BALLOON' })}
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            Launch Pad
          </CuteButton>
        </div>
      </div>

      {/* Wind & Partner Telemetry */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-[#FFFBF5] px-4 py-2 text-xs font-extrabold text-[#4A355A]">
        <span className="inline-flex items-center gap-1">
          <Wind className="h-4 w-4 text-[#3F93D8]" aria-hidden="true" />
          Wind Drift: {view.windDx === 0 ? 'Calm' : `+${view.windDx} East`}
        </span>
        <span>
          Steer (A): {steerVal === -1 ? '← Left' : steerVal === 1 ? 'Right →' : 'Glide'} • Lift (B):{' '}
          {liftVal === 1 ? '↑ Rise' : liftVal === -1 ? '↓ Sink' : 'Hover'}
        </span>
      </div>

      {/* Deterministic Sky Arena SVG */}
      <div className="relative overflow-hidden rounded-3xl border-[3px] border-[#4A355A]/20 bg-gradient-to-b from-[#DFF3FF] via-[#EFF8FF] to-[#E6FAEE]">
        <svg
          viewBox={`0 0 ${view.arenaWidth} ${view.arenaHeight}`}
          className="block h-auto w-full"
          role="img"
          aria-label="Balloon Rescue Sky Arena"
        >
          {/* Landing Zone */}
          <rect
            x={view.landingZone.x}
            y={view.landingZone.y}
            width={view.landingZone.width}
            height={view.landingZone.height}
            rx={3}
            fill="#A7F3D0"
            stroke="#059669"
            strokeWidth={0.9}
          />
          <text
            x={view.landingZone.x + view.landingZone.width / 2}
            y={view.landingZone.y + view.landingZone.height / 2 + 1.5}
            textAnchor="middle"
            fontSize="3.5"
            fontWeight="800"
            fill="#065F46"
          >
            LAND
          </text>

          {/* Obstacles */}
          {view.obstacles.map((obs) => (
            <rect
              key={obs.id}
              x={obs.x}
              y={obs.y}
              width={obs.width}
              height={obs.height}
              rx={obs.kind === 'cliff' ? 1.5 : 4}
              fill={
                obs.kind === 'cliff'
                  ? '#94A3B8'
                  : obs.kind === 'wind-hazard'
                    ? '#FCA5A5'
                    : '#CBD5E1'
              }
              stroke="#475569"
              strokeWidth={0.7}
            />
          ))}

          {/* Hot Air Balloon */}
          <g transform={`translate(${view.pos.x}, ${view.pos.y})`}>
            <circle cx={0} cy={-1.1} r={2.8} fill="#FB7185" stroke="#4A355A" strokeWidth={0.6} />
            <rect x={-1.2} y={1.8} width={2.4} height={1.4} rx={0.4} fill="#D97706" stroke="#4A355A" strokeWidth={0.4} />
          </g>
        </svg>

        {view.countdownRemainingTicks > 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#4A355A]/20 backdrop-blur-[1px]">
            <div className="rounded-full bg-[#FFFBF5] px-5 py-2 font-display text-xl font-extrabold text-[#9A214B] shadow-md">
              Launch in {Math.ceil(view.countdownRemainingTicks / 3)}…
            </div>
          </div>
        )}
      </div>

      {/* Role-Specific Controls (>= 48px touch targets) */}
      {isHost ? (
        <div className="grid grid-cols-3 gap-2">
          <CuteButton
            variant={steerVal === -1 ? 'pink' : 'cream'}
            size="lg"
            className="min-h-[54px]"
            onClick={() =>
              onAction({ kind: 'balloon-rescue', type: 'SET_BALLOON_STEER', steer: -1 })
            }
          >
            <ArrowLeft className="h-5 w-5" aria-hidden="true" />
            Left
          </CuteButton>
          <CuteButton
            variant={steerVal === 0 ? 'mint' : 'cream'}
            size="lg"
            className="min-h-[54px]"
            onClick={() =>
              onAction({ kind: 'balloon-rescue', type: 'SET_BALLOON_STEER', steer: 0 })
            }
          >
            <Pause className="h-4 w-4" aria-hidden="true" />
            Glide
          </CuteButton>
          <CuteButton
            variant={steerVal === 1 ? 'pink' : 'cream'}
            size="lg"
            className="min-h-[54px]"
            onClick={() =>
              onAction({ kind: 'balloon-rescue', type: 'SET_BALLOON_STEER', steer: 1 })
            }
          >
            Right
            <ArrowRight className="h-5 w-5" aria-hidden="true" />
          </CuteButton>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          <CuteButton
            variant={liftVal === 1 ? 'pink' : 'cream'}
            size="lg"
            className="min-h-[54px]"
            onClick={() =>
              onAction({ kind: 'balloon-rescue', type: 'SET_BALLOON_LIFT', lift: 1 })
            }
          >
            <ArrowUp className="h-5 w-5" aria-hidden="true" />
            Rise
          </CuteButton>
          <CuteButton
            variant={liftVal === 0 ? 'mint' : 'cream'}
            size="lg"
            className="min-h-[54px]"
            onClick={() =>
              onAction({ kind: 'balloon-rescue', type: 'SET_BALLOON_LIFT', lift: 0 })
            }
          >
            <Pause className="h-4 w-4" aria-hidden="true" />
            Hover
          </CuteButton>
          <CuteButton
            variant={liftVal === -1 ? 'pink' : 'cream'}
            size="lg"
            className="min-h-[54px]"
            onClick={() =>
              onAction({ kind: 'balloon-rescue', type: 'SET_BALLOON_LIFT', lift: -1 })
            }
          >
            <ArrowDown className="h-5 w-5" aria-hidden="true" />
            Sink
          </CuteButton>
        </div>
      )}

      {view.hintCue && (
        <div className="rounded-2xl bg-[#FFF2C4] px-4 py-2 text-center text-xs font-bold text-[#7D5200]">
          Hint Safe Lane: {view.hintCue}
        </div>
      )}

      {view.feedback && (
        <p role="status" className="rounded-2xl bg-[#FFFBF5] px-4 py-2.5 text-center text-sm font-bold text-[#4A355A]">
          {view.feedback}
        </p>
      )}
    </PastelCard>
  );
}
