import { ArrowLeft, CheckCircle2, Lock, Play, Star } from 'lucide-react';
import { AssetImage } from '../components/AssetImage';
import { CuteButton } from '../components/CuteButton';
import { PastelCard } from '../components/PastelCard';
import { LEVEL_METADATA } from '../game-engine/puzzles';
import {
  getPlayerLevelFromXp,
  getTotalStars,
  type ProgressionState,
} from '../game-engine/scoring';
import type { LevelId } from '../game-engine/types';

interface WorldSelectScreenProps {
  progression: ProgressionState;
  selectedLevelId: LevelId;
  inRoom: boolean;
  isHost: boolean;
  onSelectLevel: (levelId: LevelId) => void;
  onBack: () => void;
}

export function WorldSelectScreen({
  progression,
  selectedLevelId,
  inRoom,
  isHost,
  onSelectLevel,
  onBack,
}: WorldSelectScreenProps) {
  const totalStars = getTotalStars(progression.levelStars);
  const duoLevel = getPlayerLevelFromXp(progression.xp);

  return (
    <div className="mx-auto w-full max-w-2xl space-y-4 py-2">
      <div className="flex items-center justify-between">
        <CuteButton variant="cream" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {inRoom ? 'Back to Lobby' : 'Back Home'}
        </CuteButton>
        <div className="flex items-center gap-2 rounded-full border-2 border-[#4A355A]/15 bg-[#FFFDF9] px-3.5 py-1.5 text-xs font-extrabold text-[#4A355A]">
          <Star className="h-4 w-4 fill-[#FFC94D] text-[#4A355A]" aria-hidden="true" />
          <span>{totalStars} / 15 ★</span>
          <span className="text-[#9B8CFF]">•</span>
          <span>Lv. {duoLevel}</span>
        </div>
      </div>

      {/* World Header */}
      <PastelCard tone="cream" className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <AssetImage
            src="/assets/props/cozy-sofa.svg"
            alt="The Cozy Room sofa"
            className="h-14 w-20 object-contain"
          />
          <div>
            <p className="text-xs font-extrabold uppercase tracking-wider text-[#9B8CFF]">
              World 1
            </p>
            <h1 className="font-display text-2xl font-bold text-[#4A355A]">
              The Cozy Room
            </h1>
            <p className="text-xs font-semibold text-[#6D5880]">
              5 cooperative puzzles built for two minds!
            </p>
          </div>
        </div>
      </PastelCard>

      {/* 5 Level Cards */}
      <div className="space-y-3">
        {LEVEL_METADATA.map((lvl) => {
          const isUnlocked = lvl.id <= progression.unlockedLevelId;
          const stars = progression.levelStars[lvl.id] ?? 0;
          const isCompleted = stars > 0;
          const isSelected = selectedLevelId === lvl.id;

          return (
            <PastelCard
              key={lvl.id}
              tone={
                !isUnlocked
                  ? 'cream'
                  : isSelected
                    ? 'pink'
                    : isCompleted
                      ? 'mint'
                      : 'lavender'
              }
              className={!isUnlocked ? 'opacity-70' : ''}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <AssetImage
                    src={lvl.iconAsset}
                    alt={lvl.name}
                    className="h-14 w-14 shrink-0 rounded-2xl border-2 border-[#4A355A]/15 bg-[#FFFDF9] p-1 object-contain"
                  />
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-[#FFFDF9] px-2.5 py-0.5 text-[11px] font-extrabold text-[#4A355A]">
                        Level {lvl.id}
                      </span>
                      <span className="rounded-full bg-[#EDE5FF] px-2.5 py-0.5 text-[11px] font-bold text-[#6D5880]">
                        {lvl.difficulty}
                      </span>
                      {isCompleted && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-[#1A6347]">
                          <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                          Cleared
                        </span>
                      )}
                    </div>
                    <h2 className="font-display text-lg font-bold text-[#4A355A]">
                      {lvl.name}
                    </h2>
                    <p className="text-xs font-medium text-[#6D5880]">{lvl.description}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end">
                  {/* Stars */}
                  <div className="flex items-center gap-1" aria-label={`${stars} of 3 stars`}>
                    {[1, 2, 3].map((n) => (
                      <AssetImage
                        key={n}
                        src={
                          n <= stars
                            ? '/assets/icons/star-filled.svg'
                            : '/assets/icons/star-empty.svg'
                        }
                        alt={n <= stars ? 'Earned star' : 'Empty star'}
                        className="h-6 w-6 object-contain"
                      />
                    ))}
                  </div>

                  {!isUnlocked ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#EDE5FF] px-3 py-1.5 text-xs font-bold text-[#6D5880]">
                      <Lock className="h-3.5 w-3.5" aria-hidden="true" />
                      Clear Level {lvl.id - 1}
                    </span>
                  ) : inRoom && isHost ? (
                    <CuteButton
                      variant={isSelected ? 'pink' : 'sky'}
                      size="sm"
                      onClick={() => {
                        onSelectLevel(lvl.id);
                        onBack();
                      }}
                    >
                      <Play className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
                      {isSelected ? 'Selected' : 'Choose'}
                    </CuteButton>
                  ) : (
                    <span className="rounded-full bg-[#FFFDF9] px-3 py-1 text-xs font-bold text-[#4A355A]">
                      {inRoom ? 'Host selects level' : 'Unlocked'}
                    </span>
                  )}
                </div>
              </div>
            </PastelCard>
          );
        })}
      </div>
    </div>
  );
}
