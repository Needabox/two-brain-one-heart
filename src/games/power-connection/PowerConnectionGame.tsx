import { Heart, Lightbulb, RotateCcw, Zap } from 'lucide-react';
import { CuteButton } from '../../components/CuteButton';
import { PastelCard } from '../../components/PastelCard';
import type { GameActionInput } from '../../game-engine/types';
import type {
  PowerConnectionPlayerAView,
  PowerConnectionPlayerBView,
  TileRotation,
  WireTileKind,
} from './types';
import { getOpenPorts } from './validator';

interface PowerConnectionGameProps {
  role: 'host' | 'guest';
  playerAView: PowerConnectionPlayerAView | null;
  playerBView: PowerConnectionPlayerBView | null;
  onAction: (action: GameActionInput) => void;
}

function WireTileGraphic({
  kind,
  rotation,
  powered,
}: {
  kind: WireTileKind;
  rotation: TileRotation;
  powered: boolean;
}) {
  if (kind === 'empty') {
    return <span className="text-[10px] font-bold text-[#6D5880]/40">·</span>;
  }

  const ports = getOpenPorts(kind, rotation);
  const stroke = powered ? '#F59E0B' : '#4A355A';

  return (
    <svg viewBox="0 0 40 40" className="h-9 w-9" aria-hidden="true">
      {ports.includes('N') && (
        <line x1="20" y1="20" x2="20" y2="2" stroke={stroke} strokeWidth="6" strokeLinecap="round" />
      )}
      {ports.includes('E') && (
        <line x1="20" y1="20" x2="38" y2="20" stroke={stroke} strokeWidth="6" strokeLinecap="round" />
      )}
      {ports.includes('S') && (
        <line x1="20" y1="20" x2="20" y2="38" stroke={stroke} strokeWidth="6" strokeLinecap="round" />
      )}
      {ports.includes('W') && (
        <line x1="20" y1="20" x2="2" y2="20" stroke={stroke} strokeWidth="6" strokeLinecap="round" />
      )}
      {kind === 'source' ? (
        <circle cx="20" cy="20" r="9" fill="#FDE047" stroke="#4A355A" strokeWidth="2.5" />
      ) : kind === 'target' ? (
        <circle cx="20" cy="20" r="9" fill={powered ? '#FF6B9C' : '#FBCFE8'} stroke="#4A355A" strokeWidth="2.5" />
      ) : (
        <circle cx="20" cy="20" r="4" fill={powered ? '#F59E0B' : '#4A355A'} />
      )}
    </svg>
  );
}

export function PowerConnectionGame({
  role,
  playerAView,
  playerBView,
  onAction,
}: PowerConnectionGameProps) {
  if (role === 'host' && playerAView) {
    return (
      <PastelCard tone="lavender" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-wider text-[#6D5880]">
              Stage {playerAView.stageIndex + 1} of {playerAView.totalStages} • Blueprint Only
            </p>
            <h2 className="font-display text-xl font-bold text-[#4A355A]">
              Guide the wire directions from Source to Bulb!
            </h2>
          </div>
          <CuteButton
            variant="cream"
            size="sm"
            onClick={() => onAction({ kind: 'common', type: 'USE_HINT' })}
          >
            <Lightbulb className="h-4 w-4 text-[#E89B1E]" aria-hidden="true" />
            Align 1 Wire (Hint)
          </CuteButton>
        </div>

        <div className="flex items-center justify-between rounded-2xl bg-[#FFFBF5] px-4 py-2 text-xs font-extrabold text-[#4A355A]">
          <span className="inline-flex items-center gap-1">
            <Zap className="h-4 w-4 text-[#F59E0B]" aria-hidden="true" /> Powered Tiles:{' '}
            {playerAView.poweredCount}
          </span>
          <span className="inline-flex items-center gap-1 text-[#9A214B]">
            <Heart className="h-4 w-4 fill-[#FF6B9C] text-[#FF6B9C]" aria-hidden="true" /> Target Grid
          </span>
        </div>

        <div className="mx-auto w-full max-w-[330px]">
          <div
            style={{
              gridTemplateColumns: `repeat(${playerAView.gridSize}, minmax(0, 1fr))`,
            }}
            className="grid gap-1.5 rounded-3xl border-[3px] border-[#4A355A]/20 bg-[#F6F1FF] p-3"
          >
            {playerAView.blueprintTiles.map((tile) => (
              <div
                key={`${tile.x}-${tile.y}`}
                aria-label={`Blueprint Row ${tile.y + 1} Col ${tile.x + 1} ${tile.kind}`}
                className="relative flex aspect-square items-center justify-center rounded-xl border-2 border-[#4A355A]/15 bg-[#FFFBF5]"
              >
                <span className="absolute top-0.5 left-1 text-[9px] font-bold text-[#6D5880]">
                  {tile.y + 1},{tile.x + 1}
                </span>
                <WireTileGraphic
                  kind={tile.kind}
                  rotation={tile.targetRotation}
                  powered={tile.kind !== 'empty'}
                />
              </div>
            ))}
          </div>
        </div>

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
              Stage {playerBView.stageIndex + 1} of {playerBView.totalStages} • Circuit Grid
            </p>
            <h2 className="font-display text-xl font-bold text-[#4A355A]">
              Tap wire tiles to rotate clockwise!
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
              onClick={() => onAction({ kind: 'power-connection', type: 'RESET_CIRCUIT' })}
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              Reset
            </CuteButton>
          </div>
        </div>

        <div className="mx-auto w-full max-w-[330px]">
          <div
            style={{
              gridTemplateColumns: `repeat(${playerBView.gridSize}, minmax(0, 1fr))`,
            }}
            className="grid gap-1.5 rounded-3xl border-[3px] border-[#4A355A]/20 bg-[#E6F4FE] p-3"
          >
            {playerBView.boardTiles.map((tile) => (
              <button
                key={`${tile.x}-${tile.y}`}
                type="button"
                disabled={tile.locked || tile.kind === 'empty'}
                onClick={() =>
                  onAction({
                    kind: 'power-connection',
                    type: 'ROTATE_TILE',
                    x: tile.x,
                    y: tile.y,
                  })
                }
                aria-label={`Row ${tile.y + 1} Column ${tile.x + 1} ${tile.kind} ${
                  tile.locked ? 'locked' : 'rotatable'
                }`}
                className={`relative flex min-h-[48px] aspect-square items-center justify-center rounded-xl border-2 transition-colors ${
                  tile.powered
                    ? 'border-[#F59E0B] bg-[#FFF8D6]'
                    : tile.kind === 'empty'
                      ? 'border-[#4A355A]/10 bg-[#F3F8FC]/60'
                      : 'border-[#4A355A]/25 bg-[#FFFBF5] hover:bg-[#FFF2F7]'
                } ${tile.locked ? 'cursor-default opacity-95' : 'cursor-pointer active:scale-95'}`}
              >
                <span className="absolute top-0.5 left-1 text-[9px] font-bold text-[#6D5880]">
                  {tile.y + 1},{tile.x + 1}
                </span>
                <WireTileGraphic
                  kind={tile.kind}
                  rotation={tile.rotation}
                  powered={tile.powered}
                />
              </button>
            ))}
          </div>
        </div>

        <CuteButton
          variant="mint"
          size="lg"
          className="w-full"
          onClick={() => onAction({ kind: 'power-connection', type: 'SUBMIT_CIRCUIT' })}
        >
          <Zap className="h-5 w-5" aria-hidden="true" />
          Test &amp; Submit Circuit
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
