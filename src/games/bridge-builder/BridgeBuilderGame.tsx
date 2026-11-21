import { useState } from 'react';
import { Hammer, Lightbulb, RotateCcw, RotateCw, Trash2 } from 'lucide-react';
import { CuteButton } from '../../components/CuteButton';
import { PastelCard } from '../../components/PastelCard';
import type { GameActionInput } from '../../game-engine/types';
import type {
  BridgeBuilderPlayerAView,
  BridgeBuilderPlayerBView,
  BridgePieceKind,
  BridgeRotation,
} from './types';
import { getPiecePorts } from './validator';

interface BridgeBuilderGameProps {
  role: 'host' | 'guest';
  playerAView: BridgeBuilderPlayerAView | null;
  playerBView: BridgeBuilderPlayerBView | null;
  onAction: (action: GameActionInput) => void;
}

function BridgePieceGraphic({
  kind,
  rotation,
  connected,
}: {
  kind: BridgePieceKind;
  rotation: BridgeRotation;
  connected: boolean;
}) {
  const ports = getPiecePorts(kind, rotation);
  const stroke =
    kind === 'truss'
      ? connected
        ? '#059669'
        : '#B45309'
      : connected
        ? '#10B981'
        : '#7C5D41';

  return (
    <svg viewBox="0 0 40 40" className="h-8 w-8" aria-hidden="true">
      {ports.includes('N') && (
        <line x1="20" y1="20" x2="20" y2="2" stroke={stroke} strokeWidth="7" strokeLinecap="round" />
      )}
      {ports.includes('E') && (
        <line x1="20" y1="20" x2="38" y2="20" stroke={stroke} strokeWidth="7" strokeLinecap="round" />
      )}
      {ports.includes('S') && (
        <line x1="20" y1="20" x2="20" y2="38" stroke={stroke} strokeWidth="7" strokeLinecap="round" />
      )}
      {ports.includes('W') && (
        <line x1="20" y1="20" x2="2" y2="20" stroke={stroke} strokeWidth="7" strokeLinecap="round" />
      )}
      {kind === 'truss' ? (
        <polygon points="20,10 29,28 11,28" fill="#FDE047" stroke="#4A355A" strokeWidth="2" />
      ) : kind === 'ramp' ? (
        <circle cx="20" cy="20" r="5" fill="#FF8BB3" stroke="#4A355A" strokeWidth="2" />
      ) : (
        <rect x="15" y="16" width="10" height="8" rx="2" fill="#E8C39E" stroke="#4A355A" strokeWidth="2" />
      )}
    </svg>
  );
}

const PIECE_OPTIONS: Array<{ kind: BridgePieceKind; label: string }> = [
  { kind: 'deck', label: 'Deck' },
  { kind: 'ramp', label: 'Ramp' },
  { kind: 'truss', label: 'Truss' },
];

export function BridgeBuilderGame({
  role,
  playerAView,
  playerBView,
  onAction,
}: BridgeBuilderGameProps) {
  const [selectedPiece, setSelectedPiece] = useState<BridgePieceKind>('deck');
  const [removeMode, setRemoveMode] = useState(false);

  if (role === 'host' && playerAView) {
    return (
      <PastelCard tone="lavender" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-wider text-[#6D5880]">
              Stage {playerAView.stageIndex + 1} of {playerAView.totalStages} • Blueprint Only
            </p>
            <h2 className="font-display text-xl font-bold text-[#4A355A]">
              {playerAView.stageTitle} ({playerAView.placedCount}/
              {playerAView.blueprint.length} placed)
            </h2>
          </div>
          <CuteButton
            variant="cream"
            size="sm"
            onClick={() => onAction({ kind: 'common', type: 'USE_HINT' })}
          >
            <Lightbulb className="h-4 w-4 text-[#E89B1E]" aria-hidden="true" />
            Snap 1 Piece
          </CuteButton>
        </div>

        <div className="mx-auto w-full max-w-[400px] overflow-x-auto">
          <div
            style={{
              gridTemplateColumns: `repeat(${playerAView.width}, minmax(44px, 1fr))`,
            }}
            className="grid gap-1.5 rounded-3xl border-[3px] border-[#4A355A]/20 bg-[#F6F1FF] p-3"
          >
            {Array.from({ length: playerAView.height }, (_, y) =>
              Array.from({ length: playerAView.width }, (__, x) => {
                const isLeftCliff = x === 0 && y >= playerAView.leftBankY;
                const isRightCliff =
                  x === playerAView.width - 1 && y >= playerAView.rightBankY;
                const isRock = playerAView.rocks.some((r) => r.x === x && r.y === y);
                const bp = playerAView.blueprint.find((b) => b.x === x && b.y === y);

                return (
                  <div
                    key={`${x}-${y}`}
                    className={`relative flex aspect-square items-center justify-center rounded-xl border-2 text-[10px] font-bold ${
                      isLeftCliff || isRightCliff
                        ? 'border-[#3FA980] bg-[#B8F0D8] text-[#186A4D]'
                        : isRock
                          ? 'border-[#4A355A]/30 bg-[#C7BECA] text-[#4A355A]'
                          : bp
                            ? 'border-[#9B8CFF] bg-[#FFFBF5]'
                            : 'border-[#4A355A]/10 bg-[#E0F2FE]/60'
                    }`}
                  >
                    <span className="absolute top-0.5 left-1 text-[8px] opacity-60">
                      {y + 1},{x + 1}
                    </span>
                    {isLeftCliff && y === playerAView.leftBankY ? (
                      'LEFT'
                    ) : isRightCliff && y === playerAView.rightBankY ? (
                      'RIGHT'
                    ) : isRock ? (
                      'ROCK'
                    ) : bp ? (
                      <BridgePieceGraphic
                        kind={bp.kind}
                        rotation={bp.rotation}
                        connected
                      />
                    ) : null}
                  </div>
                );
              }),
            )}
          </div>
        </div>

        <p className="text-center text-xs font-semibold text-[#6D5880]">
          Legend: Straight Bar = Deck • Pink Corner = Ramp • Gold Triangle = Truss
        </p>

        {playerAView.feedback && (
          <p role="status" className="rounded-2xl bg-[#FFFBF5] px-4 py-2.5 text-center text-sm font-bold text-[#4A355A]">
            {playerAView.feedback}
          </p>
        )}
      </PastelCard>
    );
  }

  if (role === 'guest' && playerBView) {
    const connectedSet = new Set(
      playerBView.connectedCoords.map((c) => `${c.x},${c.y}`),
    );

    const handleCellClick = (x: number, y: number) => {
      const existing = playerBView.placed.find((p) => p.x === x && p.y === y);
      if (existing) {
        if (existing.locked) return;
        if (removeMode) {
          onAction({ kind: 'bridge-builder', type: 'REMOVE_BRIDGE_PIECE', x, y });
        } else {
          onAction({ kind: 'bridge-builder', type: 'ROTATE_BRIDGE_PIECE', x, y });
        }
        return;
      }
      if (!removeMode) {
        onAction({
          kind: 'bridge-builder',
          type: 'PLACE_BRIDGE_PIECE',
          x,
          y,
          pieceKind: selectedPiece,
        });
      }
    };

    return (
      <PastelCard tone="sky" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-wider text-[#1D5587]">
              Stage {playerBView.stageIndex + 1} of {playerBView.totalStages} • Builder Grid
            </p>
            <h2 className="font-display text-xl font-bold text-[#4A355A]">
              {playerBView.stageTitle}
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
              onClick={() => onAction({ kind: 'bridge-builder', type: 'RESET_BRIDGE_GRID' })}
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              Reset
            </CuteButton>
          </div>
        </div>

        {/* Piece Palette + Budget */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          {PIECE_OPTIONS.map((opt) => {
            const rem = playerBView.inventory[opt.kind] ?? 0;
            const active = !removeMode && selectedPiece === opt.kind;
            return (
              <CuteButton
                key={opt.kind}
                variant={active ? 'pink' : 'cream'}
                size="sm"
                onClick={() => {
                  setRemoveMode(false);
                  setSelectedPiece(opt.kind);
                }}
              >
                {opt.label} ({rem} left)
              </CuteButton>
            );
          })}
          <CuteButton
            variant={removeMode ? 'pink' : 'cream'}
            size="sm"
            onClick={() => setRemoveMode((r) => !r)}
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            {removeMode ? 'Erase: ON' : 'Remove Mode'}
          </CuteButton>
        </div>

        {/* Construction Grid */}
        <div className="mx-auto w-full max-w-[400px] overflow-x-auto">
          <div
            style={{
              gridTemplateColumns: `repeat(${playerBView.width}, minmax(44px, 1fr))`,
            }}
            className="grid gap-1.5 rounded-3xl border-[3px] border-[#4A355A]/20 bg-[#E6F4FE] p-3"
          >
            {Array.from({ length: playerBView.height }, (_, y) =>
              Array.from({ length: playerBView.width }, (__, x) => {
                const isLeftCliff = x === 0 && y >= playerBView.leftBankY;
                const isRightCliff =
                  x === playerBView.width - 1 && y >= playerBView.rightBankY;
                const isCliffCol = x === 0 || x === playerBView.width - 1;
                const isRock = playerBView.rocks.some((r) => r.x === x && r.y === y);
                const placed = playerBView.placed.find((p) => p.x === x && p.y === y);
                const isConnected = connectedSet.has(`${x},${y}`);

                return (
                  <button
                    key={`${x}-${y}`}
                    type="button"
                    disabled={isCliffCol || isRock}
                    onClick={() => handleCellClick(x, y)}
                    aria-label={`Bridge cell row ${y + 1} col ${x + 1}`}
                    className={`relative flex min-h-[48px] aspect-square items-center justify-center rounded-xl border-2 text-[10px] font-bold transition ${
                      isLeftCliff || isRightCliff
                        ? 'border-[#3FA980] bg-[#B8F0D8] text-[#186A4D]'
                        : isCliffCol
                          ? 'border-[#4A355A]/10 bg-[#D7ECFC]'
                          : isRock
                            ? 'border-[#4A355A]/30 bg-[#C7BECA] text-[#4A355A]'
                            : placed
                              ? isConnected
                                ? 'border-[#3FA980] bg-[#D6FAEB]'
                                : 'border-[#9B8CFF] bg-[#FFFBF5]'
                              : 'border-[#4A355A]/15 bg-[#FFFBF5]/70 hover:bg-[#FFF2F7]'
                    }`}
                  >
                    <span className="absolute top-0.5 left-1 text-[8px] opacity-60">
                      {y + 1},{x + 1}
                    </span>
                    {isLeftCliff && y === playerBView.leftBankY ? (
                      'START'
                    ) : isRightCliff && y === playerBView.rightBankY ? (
                      'GOAL'
                    ) : isRock ? (
                      'ROCK'
                    ) : placed ? (
                      <div className="flex flex-col items-center">
                        <BridgePieceGraphic
                          kind={placed.kind}
                          rotation={placed.rotation}
                          connected={isConnected}
                        />
                        {!placed.locked && (
                          <RotateCw className="h-2.5 w-2.5 opacity-60" aria-hidden="true" />
                        )}
                      </div>
                    ) : null}
                  </button>
                );
              }),
            )}
          </div>
        </div>

        <CuteButton
          variant="mint"
          size="lg"
          className="w-full"
          onClick={() => onAction({ kind: 'bridge-builder', type: 'SUBMIT_BRIDGE' })}
        >
          <Hammer className="h-5 w-5" aria-hidden="true" />
          Inspect &amp; Cross Bridge!
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
