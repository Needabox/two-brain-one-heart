import { useState } from 'react';
import { ArrowLeft, Clock, Play, Sparkles, Star, Trophy } from 'lucide-react';
import { AssetImage } from '../components/AssetImage';
import { CuteButton } from '../components/CuteButton';
import { PastelCard } from '../components/PastelCard';
import {
  ARCADE_CATEGORIES,
  ARCADE_GAME_REGISTRY,
} from '../game-engine/registry';
import {
  getPlayerLevelFromXp,
  getTotalArcadeStars,
  type ProgressionState,
} from '../game-engine/scoring';
import type {
  ArcadeGameId,
  DifficultyLevel,
  GameCategory,
  LaunchTarget,
} from '../game-engine/types';

interface ArcadeSelectScreenProps {
  progression: ProgressionState;
  selectedTarget: LaunchTarget;
  inRoom: boolean;
  isHost: boolean;
  onSelectArcadeGame: (gameId: ArcadeGameId, difficulty: DifficultyLevel) => void;
  onBack: () => void;
}

const DIFFICULTY_LABELS: Record<DifficultyLevel, string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
};

export function ArcadeSelectScreen({
  progression,
  selectedTarget,
  inRoom,
  isHost,
  onSelectArcadeGame,
  onBack,
}: ArcadeSelectScreenProps) {
  const [activeCategory, setActiveCategory] = useState<'All' | GameCategory>('All');
  const [difficultyMap, setDifficultyMap] = useState<Record<ArcadeGameId, DifficultyLevel>>(() => {
    const map = {} as Record<ArcadeGameId, DifficultyLevel>;
    for (const game of ARCADE_GAME_REGISTRY) {
      map[game.id] =
        progression.arcadeRecords?.[game.id]?.lastDifficulty ?? 'easy';
    }
    return map;
  });

  const filteredGames =
    activeCategory === 'All'
      ? ARCADE_GAME_REGISTRY
      : ARCADE_GAME_REGISTRY.filter((g) => g.category === activeCategory);

  const totalArcadeStars = getTotalArcadeStars(progression.arcadeRecords);
  const duoLevel = getPlayerLevelFromXp(progression.xp);

  return (
    <div className="mx-auto w-full max-w-2xl space-y-4 py-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <CuteButton variant="cream" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {inRoom ? 'Back to Lobby' : 'Back Home'}
        </CuteButton>

        <div className="flex items-center gap-2 rounded-full border-2 border-[#4A355A]/15 bg-[#FFFDF9] px-3.5 py-1.5 text-xs font-extrabold text-[#4A355A]">
          <Star className="h-4 w-4 fill-[#FFC94D] text-[#4A355A]" aria-hidden="true" />
          <span>{totalArcadeStars} / {ARCADE_GAME_REGISTRY.length * 3} ★</span>
          <span className="text-[#9B8CFF]">•</span>
          <span>Lv. {duoLevel}</span>
        </div>
      </div>

      {/* Header */}
      <PastelCard tone="cream" className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl border-2 border-[#4A355A]/15 bg-[#FFE3EC]">
            <Sparkles className="h-6 w-6 text-[#FF6B93]" aria-hidden="true" />
          </span>
          <div>
            <p className="text-xs font-extrabold uppercase tracking-wider text-[#9B8CFF]">
              Arcade Mode
            </p>
            <h1 className="font-display text-2xl font-bold text-[#4A355A]">
              8 Co-op Mini-Games
            </h1>
            <p className="text-xs font-semibold text-[#6D5880]">
              Jump straight into any game with Easy, Medium, or Hard challenges!
            </p>
          </div>
        </div>
      </PastelCard>

      {/* Category Filter */}
      <div
        role="tablist"
        aria-label="Filter Arcade games by category"
        className="flex flex-wrap gap-1.5"
      >
        {(['All', ...ARCADE_CATEGORIES] as const).map((cat) => {
          const active = activeCategory === cat;
          return (
            <button
              key={cat}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setActiveCategory(cat)}
              className={`min-h-[44px] rounded-full border-2 px-3.5 text-xs font-extrabold transition-colors ${
                active
                  ? 'border-[#4A355A] bg-[#FF9AB8] text-white'
                  : 'border-[#4A355A]/15 bg-[#FFFDF9] text-[#6D5880] hover:bg-[#F7F3FF]'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Game Cards */}
      <div className="grid grid-cols-1 gap-3">
        {filteredGames.map((game) => {
          const record = progression.arcadeRecords?.[game.id];
          const bestStars = record?.bestStars ?? 0;
          const bestScore = record?.bestScore ?? 0;
          const selectedDiff = difficultyMap[game.id] ?? 'easy';
          const isSelectedTarget =
            selectedTarget.mode === 'arcade' && selectedTarget.gameId === game.id;

          return (
            <PastelCard
              key={game.id}
              tone={isSelectedTarget ? 'pink' : bestStars > 0 ? 'mint' : 'lavender'}
              className="space-y-3"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-3">
                  <AssetImage
                    src={game.iconAsset}
                    alt={game.name}
                    className="h-14 w-14 shrink-0 rounded-2xl border-2 border-[#4A355A]/15 bg-[#FFFDF9] p-1 object-contain"
                  />
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="rounded-full bg-[#FFFDF9] px-2.5 py-0.5 text-[11px] font-extrabold text-[#4A355A]">
                        {game.category}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#EDE5FF] px-2.5 py-0.5 text-[11px] font-bold text-[#6D5880]">
                        <Clock className="h-3 w-3" aria-hidden="true" />
                        {game.estimatedDuration}
                      </span>
                      <span className="rounded-full bg-[#DCF9ED] px-2 py-0.5 text-[10px] font-extrabold text-[#1A6347]">
                        Unlocked
                      </span>
                    </div>
                    <h2 className="font-display text-lg font-bold text-[#4A355A]">
                      {game.name}
                    </h2>
                    <p className="text-xs font-medium text-[#6D5880]">
                      {game.shortDescription}
                    </p>
                    <p className="text-[11px] font-bold text-[#6D5880]">
                      A: {game.playerARole} • B: {game.playerBRole}
                    </p>
                  </div>
                </div>

                {/* Best Stars & Score */}
                <div className="flex items-center justify-between gap-2 sm:flex-col sm:items-end">
                  <div className="flex items-center gap-1" aria-label={`${bestStars} of 3 stars`}>
                    {[1, 2, 3].map((n) => (
                      <AssetImage
                        key={n}
                        src={
                          n <= bestStars
                            ? '/assets/icons/star-filled.svg'
                            : '/assets/icons/star-empty.svg'
                        }
                        alt={n <= bestStars ? 'Earned star' : 'Empty star'}
                        className="h-5 w-5 object-contain"
                      />
                    ))}
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#FFFDF9] px-2.5 py-1 text-[11px] font-extrabold text-[#4A355A]">
                    <Trophy className="h-3.5 w-3.5 text-[#F5A524]" aria-hidden="true" />
                    {bestScore > 0 ? `Best: ${bestScore}` : 'No score yet'}
                  </span>
                </div>
              </div>

              {/* Difficulty & Play Action */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-t-2 border-[#4A355A]/10 pt-2.5">
                <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label={`${game.name} difficulty`}>
                  {(['easy', 'medium', 'hard'] as DifficultyLevel[]).map((diff) => {
                    const active = selectedDiff === diff;
                    return (
                      <button
                        key={diff}
                        type="button"
                        onClick={() =>
                          setDifficultyMap((prev) => ({ ...prev, [game.id]: diff }))
                        }
                        className={`min-h-[44px] rounded-full border-2 px-3 text-xs font-extrabold ${
                          active
                            ? 'border-[#4A355A] bg-[#FFF2C4] text-[#4A355A]'
                            : 'border-[#4A355A]/15 bg-[#FFFDF9] text-[#6D5880]'
                        }`}
                      >
                        {DIFFICULTY_LABELS[diff]}
                      </button>
                    );
                  })}
                </div>

                {inRoom && isHost ? (
                  <CuteButton
                    variant={isSelectedTarget ? 'pink' : 'sky'}
                    size="sm"
                    onClick={() => {
                      onSelectArcadeGame(game.id, selectedDiff);
                      onBack();
                    }}
                  >
                    <Play className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
                    {record?.completions ? 'Replay' : 'Select'}
                  </CuteButton>
                ) : (
                  <span className="rounded-full bg-[#FFFDF9] px-3 py-1.5 text-xs font-bold text-[#6D5880]">
                    {inRoom ? 'Host chooses game' : 'Create or join room to play'}
                  </span>
                )}
              </div>
            </PastelCard>
          );
        })}
      </div>
    </div>
  );
}
