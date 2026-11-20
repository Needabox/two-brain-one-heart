import { useEffect } from 'react';
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Compass,
  Heart,
  KeyRound,
  Lightbulb,
  RotateCcw,
} from 'lucide-react';
import { AssetImage } from '../../components/AssetImage';
import { CuteButton } from '../../components/CuteButton';
import { PastelCard } from '../../components/PastelCard';
import type {
  Direction,
  GameActionInput,
  LostTogetherPlayerAView,
  LostTogetherPlayerBView,
} from '../../game-engine/types';

interface LostTogetherGameProps {
  role: 'host' | 'guest';
  playerAView: LostTogetherPlayerAView | null;
  playerBView: LostTogetherPlayerBView | null;
  onAction: (action: GameActionInput) => void;
}

const DIRECTION_LABELS: Record<Direction, string> = {
  up: 'Up (North)',
  down: 'Down (South)',
  left: 'Left (West)',
  right: 'Right (East)',
};

export function LostTogetherGame({
  role,
  playerAView,
  playerBView,
  onAction,
}: LostTogetherGameProps) {
  useEffect(() => {
    if (role !== 'guest') return;
    const onKeyDown = (evt: KeyboardEvent) => {
      if (evt.key === 'ArrowUp' || evt.key === 'w' || evt.key === 'W') {
        evt.preventDefault();
        onAction({ kind: 'lost-together', type: 'MOVE', direction: 'up' });
      } else if (evt.key === 'ArrowDown' || evt.key === 's' || evt.key === 'S') {
        evt.preventDefault();
        onAction({ kind: 'lost-together', type: 'MOVE', direction: 'down' });
      } else if (evt.key === 'ArrowLeft' || evt.key === 'a' || evt.key === 'A') {
        evt.preventDefault();
        onAction({ kind: 'lost-together', type: 'MOVE', direction: 'left' });
      } else if (evt.key === 'ArrowRight' || evt.key === 'd' || evt.key === 'D') {
        evt.preventDefault();
        onAction({ kind: 'lost-together', type: 'MOVE', direction: 'right' });
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onAction, role]);

  if (role === 'host' && playerAView) {
    return (
      <div className="space-y-4">
        <PastelCard tone="lavender" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-wider text-[#6D5880]">
                Cozy Room Map (Navigator View)
              </p>
              <h2 className="font-display text-xl font-bold text-[#4A355A]">
                Guide your partner to the Key, then the Heart Door!
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1 rounded-full border-2 px-3 py-1 text-xs font-extrabold ${
                  playerAView.keyCollected
                    ? 'border-[#5CD0A5] bg-[#DCF9ED] text-[#1A6347]'
                    : 'border-[#F2B830] bg-[#FFF2C4] text-[#7D5200]'
                }`}
              >
                <KeyRound className="h-3.5 w-3.5" aria-hidden="true" />
                {playerAView.keyCollected ? 'Key Found!' : 'Need Key'}
              </span>
              <CuteButton
                variant="cream"
                size="sm"
                onClick={() => onAction({ kind: 'common', type: 'USE_HINT' })}
              >
                <Lightbulb className="h-4 w-4 text-[#E89B1E]" aria-hidden="true" />
                Path Hint
              </CuteButton>
            </div>
          </div>

          {/* Full 7x7 Map Grid */}
          <div className="mx-auto w-full max-w-[340px]">
            <div
              role="grid"
              aria-label="Cozy Room maze map"
              className="grid grid-cols-7 gap-1 rounded-3xl border-[3px] border-[#4A355A]/20 bg-[#E6DAFF] p-2.5 shadow-inner"
            >
              {playerAView.walls.map((row, y) =>
                row.map((cell, x) => {
                  const isWall = cell === 1;
                  const isAvatar =
                    playerAView.avatarPos.x === x && playerAView.avatarPos.y === y;
                  const isKey =
                    !playerAView.keyCollected &&
                    playerAView.keyPos.x === x &&
                    playerAView.keyPos.y === y;
                  const isGoal =
                    playerAView.goalPos.x === x && playerAView.goalPos.y === y;
                  const isStart =
                    playerAView.start.x === x && playerAView.start.y === y;
                  const isHint = playerAView.hintPath.some((p) => p.x === x && p.y === y);

                  return (
                    <div
                      key={`${x}-${y}`}
                      aria-label={`Row ${y + 1} Col ${x + 1} ${isWall ? 'wall' : 'floor'}`}
                      className={[
                        'relative flex aspect-square items-center justify-center rounded-xl text-xs font-bold',
                        isWall
                          ? 'border-2 border-[#7C6599]/35 bg-[#8E7AB5]'
                          : isHint
                            ? 'border-2 border-[#F5A524] bg-[#FFF2C4]'
                            : 'border border-[#4A355A]/10 bg-[#FFFDF9]',
                      ].join(' ')}
                    >
                      {isWall ? (
                        <span aria-hidden="true" className="text-[11px] opacity-65">
                          🌿
                        </span>
                      ) : isAvatar ? (
                        <span
                          title="Partner position"
                          className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#4A355A] bg-[#FF9AB8] text-[11px] font-extrabold text-white shadow-sm"
                        >
                          ★
                        </span>
                      ) : isKey ? (
                        <AssetImage
                          src="/assets/props/golden-key.svg"
                          alt="Golden Key"
                          className="h-6 w-6 object-contain"
                          fallback={<KeyRound className="h-4 w-4 text-[#E89B1E]" />}
                        />
                      ) : isGoal ? (
                        <Heart
                          className={`h-5 w-5 ${
                            playerAView.keyCollected
                              ? 'fill-[#FF6B93] text-[#4A355A]'
                              : 'fill-[#FFD1DF] text-[#6D5880]'
                          }`}
                          aria-label="Heart Door"
                        />
                      ) : isStart ? (
                        <span className="text-[10px] text-[#9B8CFF]">S</span>
                      ) : null}
                    </div>
                  );
                }),
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-[#FFFDF9]/85 px-4 py-2.5 text-xs font-bold text-[#6D5880]">
            <span>Steps taken: {playerAView.steps}</span>
            <span>
              Partner at ({playerAView.avatarPos.x + 1}, {playerAView.avatarPos.y + 1})
            </span>
          </div>
        </PastelCard>

        {playerAView.feedback && (
          <PastelCard tone="pink" className="text-center text-sm font-bold text-[#4A355A]">
            {playerAView.feedback}
          </PastelCard>
        )}
      </div>
    );
  }

  if (role === 'guest' && playerBView) {
    const move = (direction: Direction) => {
      onAction({ kind: 'lost-together', type: 'MOVE', direction });
    };

    return (
      <div className="space-y-4">
        <PastelCard tone="sky" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-wider text-[#2B5D8A]">
                Blindfolded Explorer (3×3 Fog View)
              </p>
              <h2 className="font-display text-xl font-bold text-[#4A355A]">
                Listen to your partner &amp; step carefully!
              </h2>
            </div>
            <span
              className={`inline-flex items-center gap-1 rounded-full border-2 px-3 py-1 text-xs font-extrabold ${
                playerBView.keyCollected
                  ? 'border-[#5CD0A5] bg-[#DCF9ED] text-[#1A6347]'
                  : 'border-[#F2B830] bg-[#FFF2C4] text-[#7D5200]'
              }`}
            >
              <KeyRound className="h-3.5 w-3.5" aria-hidden="true" />
              {playerBView.keyCollected ? 'Key Collected!' : 'Find Key First'}
            </span>
          </div>

          {playerBView.hintDirection && (
            <div className="flex items-center justify-center gap-2 rounded-2xl border-2 border-[#FFC94D] bg-[#FFF2C4] px-3 py-2 text-xs font-extrabold text-[#7D5200]">
              <Compass className="h-4 w-4" aria-hidden="true" />
              Compass Hint: Try moving {DIRECTION_LABELS[playerBView.hintDirection]}!
            </div>
          )}

          {/* Strictly 3x3 Local Neighborhood Spotlight */}
          <div className="mx-auto w-full max-w-[230px]">
            <div
              aria-label="3 by 3 immediate surroundings"
              className="grid grid-cols-3 gap-2 rounded-3xl border-[3px] border-[#4A355A]/20 bg-[#D7ECFF] p-3"
            >
              {playerBView.localCells.map((cell, idx) => {
                const isCenter = idx === 4;
                const isWall = cell.cell === 'wall';
                return (
                  <div
                    key={`${cell.x}-${cell.y}`}
                    className={[
                      'flex aspect-square items-center justify-center rounded-2xl border-2',
                      isCenter
                        ? 'border-[#4A355A] bg-[#FFE3EC] shadow-sm'
                        : isWall
                          ? 'border-[#7C6599]/35 bg-[#8E7AB5] text-white/80'
                          : 'border-[#4A355A]/10 bg-[#FFFDF9]',
                    ].join(' ')}
                  >
                    {isCenter ? (
                      <span className="font-display text-sm font-extrabold text-[#4A355A]">
                        YOU
                      </span>
                    ) : isWall ? (
                      <span aria-label="Blocked wall" className="text-sm">
                        🧱
                      </span>
                    ) : cell.cell === 'key' ? (
                      <AssetImage
                        src="/assets/props/golden-key.svg"
                        alt="Golden Key"
                        className="h-7 w-7 object-contain"
                        fallback={<KeyRound className="h-5 w-5 text-[#E89B1E]" />}
                      />
                    ) : cell.cell === 'goal' ? (
                      <Heart
                        className={`h-6 w-6 ${
                          playerBView.keyCollected
                            ? 'fill-[#FF6B93] text-[#4A355A]'
                            : 'fill-[#FFD1DF] text-[#6D5880]'
                        }`}
                        aria-label="Heart Door"
                      />
                    ) : (
                      <span className="h-2 w-2 rounded-full bg-[#B9D8F7]" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Accessible D-Pad Controls (48px+ targets) */}
          <div className="mx-auto grid w-48 grid-cols-3 gap-2">
            <div />
            <CuteButton
              variant="lavender"
              size="md"
              onClick={() => move('up')}
              aria-label="Move Up"
              className="!px-0"
            >
              <ArrowUp className="h-5 w-5" aria-hidden="true" />
            </CuteButton>
            <div />
            <CuteButton
              variant="lavender"
              size="md"
              onClick={() => move('left')}
              aria-label="Move Left"
              className="!px-0"
            >
              <ArrowLeft className="h-5 w-5" aria-hidden="true" />
            </CuteButton>
            <CuteButton
              variant="lavender"
              size="md"
              onClick={() => move('down')}
              aria-label="Move Down"
              className="!px-0"
            >
              <ArrowDown className="h-5 w-5" aria-hidden="true" />
            </CuteButton>
            <CuteButton
              variant="lavender"
              size="md"
              onClick={() => move('right')}
              aria-label="Move Right"
              className="!px-0"
            >
              <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </CuteButton>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <span className="text-xs font-bold text-[#2B5D8A]">
              Steps: {playerBView.steps} • Arrow keys / WASD supported
            </span>
            <CuteButton
              variant="cream"
              size="sm"
              onClick={() => onAction({ kind: 'lost-together', type: 'RESET_AVATAR' })}
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              Reset Position
            </CuteButton>
          </div>
        </PastelCard>

        {playerBView.feedback && (
          <PastelCard tone="pink" className="text-center text-sm font-bold text-[#4A355A]">
            {playerBView.feedback}
          </PastelCard>
        )}
      </div>
    );
  }

  return null;
}
