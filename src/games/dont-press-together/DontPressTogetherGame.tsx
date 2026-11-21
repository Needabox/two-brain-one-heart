import { AlertTriangle, Lightbulb, RotateCcw, ShieldCheck } from 'lucide-react';
import { CuteButton } from '../../components/CuteButton';
import { PastelCard } from '../../components/PastelCard';
import type { GameActionInput } from '../../game-engine/types';
import type {
  DontPressPlayerAView,
  DontPressPlayerBView,
} from './types';

interface DontPressTogetherGameProps {
  role: 'host' | 'guest';
  playerAView: DontPressPlayerAView | null;
  playerBView: DontPressPlayerBView | null;
  onAction: (action: GameActionInput) => void;
}

const BUTTON_VARIANT_MAP = {
  pink: 'pink',
  mint: 'mint',
  amber: 'cream',
  sky: 'cream',
} as const;

export function DontPressTogetherGame({
  role,
  playerAView,
  playerBView,
  onAction,
}: DontPressTogetherGameProps) {
  const isHost = role === 'host';
  const view = isHost ? playerAView : playerBView;
  if (!view) return null;

  return (
    <PastelCard tone={isHost ? 'lavender' : 'sky'} className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-wider text-[#6D5880]">
            Stage {view.stageIndex + 1} of {view.totalStages} • {view.stageTitle}
          </p>
          <h2 className="font-display text-xl font-bold text-[#4A355A]">
            {isHost
              ? 'Switch Board A & Target Goals'
              : 'Color Control Panel B & Hazard Rules'}
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
            onClick={() =>
              onAction({ kind: 'dont-press-together', type: 'RESET_LOGIC_PANEL' })
            }
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            Reset Panel
          </CuteButton>
        </div>
      </div>

      {/* Shared Variable Meters (Player A sees target; Player B sees only current levels!) */}
      <div className="grid gap-2.5 sm:grid-cols-2">
        {view.variables.map((v) => {
          const targetVal = 'target' in v ? v.target : null;
          const isMatched = targetVal !== null && v.current === targetVal;
          const pct = Math.round(((v.current - v.min) / Math.max(1, v.max - v.min)) * 100);

          return (
            <div
              key={v.key}
              className={`rounded-2xl border-2 px-3.5 py-2.5 ${
                isMatched
                  ? 'border-[#3FA980] bg-[#E4FAEE]'
                  : 'border-[#4A355A]/15 bg-[#FFFBF5]'
              }`}
            >
              <div className="flex items-center justify-between text-xs font-extrabold text-[#4A355A]">
                <span>{v.label}</span>
                <span>
                  Now: {v.current}
                  {targetVal !== null ? ` / Goal: ${targetVal}` : ` (max ${v.max})`}
                </span>
              </div>
              <div className="mt-1.5 h-3 w-full overflow-hidden rounded-full bg-[#4A355A]/10">
                <div
                  className="h-full rounded-full bg-[#9B8CFF] transition-all"
                  style={{ width: `${Math.max(8, pct)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Hazard Rule Card visible ONLY on Player B */}
      {!isHost && playerBView && (
        <div className="flex items-start gap-2.5 rounded-2xl border-2 border-[#E89B1E]/40 bg-[#FFF2C4] px-4 py-3 text-xs font-bold text-[#7D5200]">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <div>
            <p className="font-extrabold uppercase">Safety Manual (Communicate to Player A):</p>
            <p className="mt-0.5 text-sm">{playerBView.hazardRuleHint}</p>
          </div>
        </div>
      )}

      {/* Last Actor Cue */}
      <div className="flex items-center justify-between rounded-xl bg-[#FFFBF5]/80 px-3 py-2 text-xs font-bold text-[#6D5880]">
        <span>
          Last Button Pressed By:{' '}
          <strong className="text-[#4A355A]">
            {view.lastActor === 'host'
              ? 'Player A'
              : view.lastActor === 'guest'
                ? 'Player B'
                : 'None yet'}
          </strong>
        </span>
        {isHost && (
          <span className="inline-flex items-center gap-1 text-[#186A4D]">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" /> Tell partner your goals!
          </span>
        )}
      </div>

      {/* Active Player's Control Panel */}
      <div className="grid gap-2.5 sm:grid-cols-2">
        {view.myButtons.map((btn) => (
          <CuteButton
            key={btn.id}
            variant={BUTTON_VARIANT_MAP[btn.color]}
            size="lg"
            className="flex !h-auto min-h-[60px] flex-col !items-start !justify-center px-4 py-3 text-left"
            onClick={() =>
              onAction({
                kind: 'dont-press-together',
                type: 'PRESS_LOGIC_BUTTON',
                buttonId: btn.id,
              })
            }
          >
            <span className="text-sm font-extrabold">{btn.label}</span>
            <span className="text-xs opacity-85">{btn.effectSummary}</span>
            {'ruleText' in btn && btn.ruleText && (
              <span className="mt-0.5 text-[11px] font-bold text-[#9A214B]">
                ⚠ {btn.ruleText}
              </span>
            )}
          </CuteButton>
        ))}
      </div>

      {view.hintRevealed && (
        <div className="rounded-2xl border-2 border-[#E89B1E]/40 bg-[#FFF9DC] px-4 py-2.5 text-xs font-bold text-[#7D5200]">
          Hint Path: {view.hintRevealed}
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
