import { ArrowRight, Home, RotateCcw, Sparkles } from 'lucide-react';
import { AssetImage } from '../components/AssetImage';
import { CharacterAvatar } from '../components/CharacterAvatar';
import { CuteButton } from '../components/CuteButton';
import { PastelCard } from '../components/PastelCard';
import { getLevelMeta } from '../game-engine/puzzles';
import { getArcadeGameEntry } from '../game-engine/registry';
import {
  formatDuration,
  getPlayerLevelFromXp,
  type ProgressionState,
} from '../game-engine/scoring';
import type { CharacterId, CosmeticId, LevelId, LevelOutcome } from '../game-engine/types';

interface LevelResultScreenProps {
  outcome: LevelOutcome;
  progression: ProgressionState;
  role: 'host' | 'guest';
  localCharacter: CharacterId;
  localCosmetic: CosmeticId;
  partnerCharacter: CharacterId;
  partnerCosmetic: CosmeticId;
  onNextLevel: (nextId: LevelId) => void;
  onReplay: () => void;
  onOpenArcade?: () => void;
  onBackToLobby: () => void;
}

export function LevelResultScreen({
  outcome,
  progression,
  role,
  localCharacter,
  localCosmetic,
  partnerCharacter,
  partnerCosmetic,
  onNextLevel,
  onReplay,
  onOpenArcade,
  onBackToLobby,
}: LevelResultScreenProps) {
  const meta = getLevelMeta(outcome.levelId);
  const arcadeMeta = outcome.arcade ? getArcadeGameEntry(outcome.arcade.gameId) : null;
  const arcadeBest = outcome.arcade
    ? progression.arcadeRecords?.[outcome.arcade.gameId]
    : undefined;
  const duoLevel = getPlayerLevelFromXp(progression.xp);
  const isFinalLevel = !outcome.arcade && outcome.levelId === 5;

  return (
    <div className="mx-auto w-full max-w-lg space-y-4 py-2">
      <PastelCard tone="cream" className="relative overflow-hidden space-y-5 text-center">
        <div className="flex justify-center">
          <AssetImage
            src="/assets/effects/sparkle-cluster.svg"
            alt="Celebration sparkles"
            className="h-14 w-24 object-contain"
          />
        </div>

        <div>
          <p className="text-xs font-extrabold uppercase tracking-widest text-[#9B8CFF]">
            {arcadeMeta && outcome.arcade
              ? `Arcade • ${arcadeMeta.name} (${outcome.arcade.difficulty.toUpperCase()})`
              : `Level ${meta.id} • ${meta.name}`}
          </p>
          <h1 className="font-display mt-1 text-3xl font-extrabold text-[#4A355A]">
            {isFinalLevel
              ? 'Cozy Room Complete!'
              : arcadeMeta
                ? 'Arcade Cleared!'
                : 'Level Complete!'}
          </h1>
        </div>

        {/* Happy Duo */}
        <div className="flex items-end justify-center gap-4">
          <CharacterAvatar
            character={localCharacter}
            cosmetic={localCosmetic}
            mood="happy"
            size="md"
          />
          {isFinalLevel && (
            <AssetImage
              src="/assets/props/heart-chest.svg"
              alt="Heart Treasure Chest"
              className="h-16 w-16 object-contain"
            />
          )}
          <CharacterAvatar
            character={partnerCharacter}
            cosmetic={partnerCosmetic}
            mood="happy"
            size="md"
          />
        </div>

        {/* 1-3 Stars */}
        <div
          className="flex items-center justify-center gap-3"
          aria-label={`Earned ${outcome.stars} out of 3 stars`}
        >
          {[1, 2, 3].map((n) => (
            <AssetImage
              key={n}
              src={
                n <= outcome.stars
                  ? '/assets/icons/star-filled.svg'
                  : '/assets/icons/star-empty.svg'
              }
              alt={n <= outcome.stars ? 'Star earned' : 'Star not earned'}
              className={`h-12 w-12 object-contain ${n === 2 ? '-translate-y-2 scale-110' : ''}`}
            />
          ))}
        </div>

        {/* Shared Stats */}
        <div className="grid grid-cols-2 gap-2.5 text-left sm:grid-cols-4">
          <div className="rounded-2xl bg-[#F7F3FF] p-3 text-center">
            <p className="text-[11px] font-bold text-[#6D5880]">Time</p>
            <p className="font-display text-lg font-extrabold text-[#4A355A]">
              {formatDuration(outcome.elapsedMs, true)}
            </p>
          </div>
          <div className="rounded-2xl bg-[#FFE3EC] p-3 text-center">
            <p className="text-[11px] font-bold text-[#9A214B]">Mistakes</p>
            <p className="font-display text-lg font-extrabold text-[#4A355A]">
              {outcome.mistakes}
            </p>
          </div>
          <div className="rounded-2xl bg-[#FFF2C4] p-3 text-center">
            <p className="text-[11px] font-bold text-[#7D5200]">Hints</p>
            <p className="font-display text-lg font-extrabold text-[#4A355A]">
              {outcome.hintsUsed}
            </p>
          </div>
          <div className="rounded-2xl bg-[#DCF9ED] p-3 text-center">
            <p className="text-[11px] font-bold text-[#1A6347]">Reward</p>
            <p className="font-display text-lg font-extrabold text-[#1A6347]">
              +{outcome.xpAwarded} XP
            </p>
          </div>
        </div>

        <div className="rounded-2xl bg-[#F7F3FF] px-4 py-2.5 text-xs font-bold text-[#4A355A]">
          <Sparkles className="mr-1 inline h-4 w-4 text-[#F5A524]" aria-hidden="true" />
          Duo Level {duoLevel} ({progression.xp} Total XP)
          {outcome.arcade && (
            <span>
              {' '}
              • Score: {outcome.arcade.score} (Best: {arcadeBest?.bestScore ?? outcome.arcade.score})
            </span>
          )}
          {!outcome.arcade && outcome.unlockedNextLevel && (
            <span> • Level {outcome.unlockedNextLevel} Unlocked!</span>
          )}
        </div>

        {/* Actions */}
        <div className="space-y-2.5 pt-1">
          {role === 'host' ? (
            <>
              {!outcome.arcade && outcome.unlockedNextLevel && (
                <CuteButton
                  variant="pink"
                  size="lg"
                  fullWidth
                  onClick={() => onNextLevel(outcome.unlockedNextLevel as LevelId)}
                >
                  Next Level ({outcome.unlockedNextLevel})
                  <ArrowRight className="h-5 w-5" aria-hidden="true" />
                </CuteButton>
              )}
              {outcome.arcade && onOpenArcade && (
                <CuteButton
                  variant="pink"
                  size="lg"
                  fullWidth
                  onClick={onOpenArcade}
                >
                  More Arcade Games
                  <ArrowRight className="h-5 w-5" aria-hidden="true" />
                </CuteButton>
              )}
              <div className="grid grid-cols-2 gap-2.5">
                <CuteButton variant="sky" size="md" onClick={onReplay}>
                  <RotateCcw className="h-4 w-4" aria-hidden="true" />
                  Replay
                </CuteButton>
                <CuteButton variant="cream" size="md" onClick={onBackToLobby}>
                  <Home className="h-4 w-4" aria-hidden="true" />
                  Lobby
                </CuteButton>
              </div>
            </>
          ) : (
            <div className="space-y-2.5">
              <p className="rounded-2xl bg-[#DFF3FF] px-4 py-2.5 text-xs font-bold text-[#1D5587]">
                Host can launch the next level or replay — stay here or return to the lobby!
              </p>
              <CuteButton variant="cream" size="md" fullWidth onClick={onBackToLobby}>
                <Home className="h-4 w-4" aria-hidden="true" />
                Back to Lobby
              </CuteButton>
            </div>
          )}
        </div>
      </PastelCard>
    </div>
  );
}
