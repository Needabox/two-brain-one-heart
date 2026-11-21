import { FlaskConical, Lightbulb, Sparkles, Trash2 } from 'lucide-react';
import { AssetImage } from '../../components/AssetImage';
import { CuteButton } from '../../components/CuteButton';
import { PastelCard } from '../../components/PastelCard';
import type { GameActionInput } from '../../game-engine/types';
import type {
  PotionLabPlayerAView,
  PotionLabPlayerBView,
} from './types';

interface PotionLabGameProps {
  role: 'host' | 'guest';
  playerAView: PotionLabPlayerAView | null;
  playerBView: PotionLabPlayerBView | null;
  onAction: (action: GameActionInput) => void;
}

export function PotionLabGame({
  role,
  playerAView,
  playerBView,
  onAction,
}: PotionLabGameProps) {
  if (role === 'host' && playerAView) {
    return (
      <PastelCard tone="lavender" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-wider text-[#6D5880]">
              Potion {playerAView.stageIndex + 1} of {playerAView.totalStages} • Secret Recipe
            </p>
            <h2 className="font-display text-xl font-bold text-[#4A355A]">
              {playerAView.potionName}
            </h2>
          </div>
          <CuteButton
            variant="cream"
            size="sm"
            onClick={() => onAction({ kind: 'common', type: 'USE_HINT' })}
          >
            <Lightbulb className="h-4 w-4 text-[#E89B1E]" aria-hidden="true" />
            Reveal 1 Step (Hint)
          </CuteButton>
        </div>

        <div className="rounded-2xl bg-[#FFFBF5] px-4 py-2.5 text-xs font-extrabold text-[#4A355A]">
          Cauldron Fill Progress: {playerAView.cauldronCount} / {playerAView.recipe.length}{' '}
          ingredients added by partner
        </div>

        <ol className="space-y-2.5">
          {playerAView.recipe.map((item, idx) => (
            <li
              key={`${item.id}-${idx}`}
              className="flex items-center gap-3 rounded-2xl border-2 border-[#4A355A]/15 bg-[#FFFBF5] px-3 py-2.5"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#FFE3EC] text-sm font-extrabold text-[#9A214B]">
                {idx + 1}
              </span>
              <AssetImage
                src={item.assetPath}
                alt={item.name}
                className="h-11 w-11 shrink-0"
                fallback={<span>🧪</span>}
              />
              <div>
                <p className="font-display text-base font-bold text-[#4A355A]">
                  {item.name}
                </p>
                <p className="text-xs font-semibold text-[#6D5880]">
                  {item.colorTag} • {item.propertyTag}
                </p>
              </div>
            </li>
          ))}
        </ol>

        {playerAView.feedback && (
          <p role="status" className="rounded-2xl bg-[#FFFBF5] px-4 py-2.5 text-center text-sm font-bold text-[#4A355A]">
            {playerAView.feedback}
          </p>
        )}
      </PastelCard>
    );
  }

  if (role === 'guest' && playerBView) {
    return (
      <PastelCard tone="sky" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-wider text-[#1D5587]">
              Potion {playerBView.stageIndex + 1} of {playerBView.totalStages} • Mixing Bench
            </p>
            <h2 className="font-display text-xl font-bold text-[#4A355A]">
              {playerBView.potionName} ({playerBView.cauldron.length}/
              {playerBView.targetLength})
            </h2>
          </div>

          <div className="flex flex-wrap gap-2">
            <CuteButton
              variant="cream"
              size="sm"
              onClick={() => onAction({ kind: 'common', type: 'USE_HINT' })}
            >
              <Lightbulb className="h-4 w-4 text-[#E89B1E]" aria-hidden="true" />
              Hint
            </CuteButton>
            <CuteButton
              variant="cream"
              size="sm"
              onClick={() => onAction({ kind: 'potion-lab', type: 'CLEAR_CAULDRON' })}
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              Clear
            </CuteButton>
          </div>
        </div>

        {/* Active Cauldron Slots */}
        <div className="rounded-2xl border-2 border-[#4A355A]/15 bg-[#FFFBF5] p-3">
          <div className="mb-2 flex items-center justify-between text-xs font-extrabold text-[#4A355A]">
            <span className="inline-flex items-center gap-1">
              <FlaskConical className="h-4 w-4 text-[#9B8CFF]" aria-hidden="true" />{' '}
              Cauldron Sequence (tap item to remove)
            </span>
            {playerBView.brewTick > 0 && (
              <span className="inline-flex items-center gap-1 text-[#FF6B9C]">
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" /> Stir #{playerBView.brewTick}
              </span>
            )}
          </div>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            {Array.from({ length: playerBView.targetLength }, (_, slotIdx) => {
              const filled = playerBView.cauldron[slotIdx];
              const hinted = playerBView.revealedHints.find(
                (h) => h.slotIndex === slotIdx,
              );
              return (
                <button
                  key={slotIdx}
                  type="button"
                  disabled={!filled}
                  onClick={() =>
                    filled &&
                    onAction({
                      kind: 'potion-lab',
                      type: 'REMOVE_INGREDIENT',
                      index: slotIdx,
                    })
                  }
                  aria-label={`Cauldron slot ${slotIdx + 1} ${filled ? filled.name : 'empty'}`}
                  className={`flex min-h-[64px] flex-col items-center justify-center rounded-xl border-2 p-1.5 text-center ${
                    filled
                      ? 'border-[#9B8CFF] bg-[#EDE5FF] cursor-pointer active:scale-95'
                      : 'border-dashed border-[#4A355A]/20 bg-[#FAF7F2]'
                  }`}
                >
                  {filled ? (
                    <>
                      <AssetImage
                        src={filled.assetPath}
                        alt={filled.name}
                        className="h-8 w-8"
                        fallback={<span>🧪</span>}
                      />
                      <span className="text-[10px] font-bold text-[#4A355A]">
                        {filled.name}
                      </span>
                    </>
                  ) : hinted ? (
                    <span className="text-[10px] font-extrabold text-[#B77200]">
                      Hint: {hinted.ingredient.name}
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-[#6D5880]">
                      #{slotIdx + 1}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Ingredient Shelf (Includes Decoys) */}
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          {playerBView.shelf.map((ing) => (
            <button
              key={ing.id}
              type="button"
              onClick={() =>
                onAction({
                  kind: 'potion-lab',
                  type: 'ADD_INGREDIENT',
                  ingredientId: ing.id,
                })
              }
              className="flex min-h-[68px] items-center gap-2.5 rounded-2xl border-[3px] border-[#4A355A]/18 bg-[#FFFBF5] p-2.5 text-left transition hover:border-[#9B8CFF] active:scale-95"
            >
              <AssetImage
                src={ing.assetPath}
                alt={ing.name}
                className="h-11 w-11 shrink-0"
                fallback={<span>🧪</span>}
              />
              <div className="min-w-0">
                <p className="truncate font-display text-sm font-bold text-[#4A355A]">
                  {ing.name}
                </p>
                <p className="truncate text-[11px] font-semibold text-[#6D5880]">
                  {ing.colorTag}
                </p>
              </div>
            </button>
          ))}
        </div>

        <CuteButton
          variant="mint"
          size="lg"
          className="w-full"
          disabled={playerBView.cauldron.length < playerBView.targetLength}
          onClick={() => onAction({ kind: 'potion-lab', type: 'BREW_POTION' })}
        >
          <Sparkles className="h-5 w-5" aria-hidden="true" />
          Brew Potion!
        </CuteButton>

        {playerBView.feedback && (
          <p role="status" className="rounded-2xl bg-[#FFFBF5] px-4 py-2.5 text-center text-sm font-bold text-[#4A355A]">
            {playerBView.feedback}
          </p>
        )}
      </PastelCard>
    );
  }

  return null;
}
