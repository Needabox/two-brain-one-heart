import { useMemo, useState } from 'react';
import { Lightbulb, RotateCw, Send, Trash2 } from 'lucide-react';
import { CuteButton } from '../../components/CuteButton';
import { PastelCard } from '../../components/PastelCard';
import { getPieceOccupiedCells, rotatePieceCells } from '../../game-engine/engines';
import type {
  GameActionInput,
  ShapeColor,
  ShapeItPlayerAView,
  ShapeItPlayerBView,
  ShapePieceDef,
  ShapePlacement,
} from '../../game-engine/types';

interface ShapeItGameProps {
  role: 'host' | 'guest';
  playerAView: ShapeItPlayerAView | null;
  playerBView: ShapeItPlayerBView | null;
  onAction: (action: GameActionInput) => void;
}

const COLOR_STYLES: Record<ShapeColor, string> = {
  mint: 'bg-[#86E6BF] border-[#3FA980]',
  sky: 'bg-[#89C9FF] border-[#3F93D8]',
  coral: 'bg-[#FFA68D] border-[#DC6E52]',
  lavender: 'bg-[#C7B6FF] border-[#8268DB]',
};

function PieceMiniPreview({
  piece,
  rotation,
}: {
  piece: ShapePieceDef;
  rotation: 0 | 90 | 180 | 270;
}) {
  const cells = rotatePieceCells(piece.cells, rotation);
  const maxX = Math.max(...cells.map((c) => c.x));
  const maxY = Math.max(...cells.map((c) => c.y));

  return (
    <div
      style={{ gridTemplateColumns: `repeat(${maxX + 1}, 16px)` }}
      className="grid gap-1"
      aria-hidden="true"
    >
      {Array.from({ length: maxY + 1 }, (_, y) =>
        Array.from({ length: maxX + 1 }, (__, x) => {
          const filled = cells.some((c) => c.x === x && c.y === y);
          return (
            <div
              key={`${x}-${y}`}
              className={`h-4 w-4 rounded-[4px] border ${
                filled ? COLOR_STYLES[piece.color] : 'border-transparent bg-transparent'
              }`}
            />
          );
        }),
      )}
    </div>
  );
}

export function ShapeItGame({
  role,
  playerAView,
  playerBView,
  onAction,
}: ShapeItGameProps) {
  const [selectedPieceId, setSelectedPieceId] = useState<string>('lavender-duo');
  const [rotation, setRotation] = useState<0 | 90 | 180 | 270>(0);
  const [localError, setLocalError] = useState<string | null>(null);

  const cellOwnerMap = useMemo(() => {
    const map = new Map<string, { pieceId: string; color: ShapeColor }>();
    if (!playerBView) return map;
    for (const placement of playerBView.placements) {
      const def = playerBView.pieces.find((p) => p.id === placement.pieceId);
      if (!def) continue;
      for (const cell of getPieceOccupiedCells(def, placement)) {
        map.set(`${cell.x},${cell.y}`, { pieceId: def.id, color: def.color });
      }
    }
    return map;
  }, [playerBView]);

  if (role === 'host' && playerAView) {
    return (
      <div className="space-y-4">
        <PastelCard tone="lavender" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-wider text-[#6D5880]">
                Target Blueprint (Reference Only)
              </p>
              <h2 className="font-display text-xl font-bold text-[#4A355A]">
                Describe the exact shape, colors &amp; row/col positions!
              </h2>
            </div>
            <CuteButton
              variant="cream"
              size="sm"
              onClick={() => onAction({ kind: 'common', type: 'USE_HINT' })}
            >
              <Lightbulb className="h-4 w-4 text-[#E89B1E]" aria-hidden="true" />
              Snap 1 Piece (Hint)
            </CuteButton>
          </div>

          <div className="mx-auto w-full max-w-[300px]">
            <div className="grid grid-cols-5 gap-1.5 rounded-3xl border-[3px] border-[#4A355A]/20 bg-[#F6F1FF] p-3">
              {Array.from({ length: playerAView.gridSize }, (_, y) =>
                Array.from({ length: playerAView.gridSize }, (__, x) => {
                  const target = playerAView.targetCells.find(
                    (c) => c.x === x && c.y === y,
                  );
                  return (
                    <div
                      key={`${x}-${y}`}
                      aria-label={`Row ${y + 1} Column ${x + 1} ${target ? target.color : 'empty'}`}
                      className={`flex aspect-square items-center justify-center rounded-xl border-2 text-[10px] font-bold ${
                        target
                          ? `${COLOR_STYLES[target.color]} text-[#4A355A]`
                          : 'border-[#4A355A]/10 bg-[#FFFDF9]/80 text-[#BBA9D2]'
                      }`}
                    >
                      {target ? `${y + 1},${x + 1}` : ''}
                    </div>
                  );
                }),
              )}
            </div>
          </div>

          <div className="flex items-center justify-between rounded-2xl bg-[#FFFDF9]/85 px-4 py-2.5 text-sm font-semibold text-[#6D5880]">
            <span>
              Partner placed <strong>{playerAView.placedCount}</strong> / {playerAView.totalPieces}{' '}
              pieces
            </span>
            <span className="text-xs">Row,Col guides shown</span>
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
    const selectedPiece =
      playerBView.pieces.find((p) => p.id === selectedPieceId) ?? playerBView.pieces[0];

    const rotateCurrent = () => {
      setRotation((prev) => (((prev + 90) % 360) as 0 | 90 | 180 | 270));
      setLocalError(null);
    };

    const handleCellClick = (x: number, y: number) => {
      setLocalError(null);
      const existing = cellOwnerMap.get(`${x},${y}`);
      if (existing) {
        // Pick piece back up when tapping an occupied cell
        const next = playerBView.placements.filter((p) => p.pieceId !== existing.pieceId);
        setSelectedPieceId(existing.pieceId);
        onAction({ kind: 'shape-it', type: 'UPDATE_PLACEMENTS', placements: next });
        return;
      }

      if (!selectedPiece) return;
      const candidate: ShapePlacement = {
        pieceId: selectedPiece.id,
        anchor: { x, y },
        rotation,
      };
      const cells = getPieceOccupiedCells(selectedPiece, candidate);
      const outOfBounds = cells.some(
        (c) => c.x < 0 || c.y < 0 || c.x >= playerBView.gridSize || c.y >= playerBView.gridSize,
      );
      if (outOfBounds) {
        setLocalError(`${selectedPiece.label} doesn't fit there — try shifting or rotating!`);
        return;
      }

      const otherPlacements = playerBView.placements.filter(
        (p) => p.pieceId !== selectedPiece.id,
      );
      const otherOccupied = new Set<string>();
      for (const p of otherPlacements) {
        const def = playerBView.pieces.find((d) => d.id === p.pieceId);
        if (!def) continue;
        getPieceOccupiedCells(def, p).forEach((c) => otherOccupied.add(`${c.x},${c.y}`));
      }

      const overlaps = cells.some((c) => otherOccupied.has(`${c.x},${c.y}`));
      if (overlaps) {
        setLocalError('That overlaps another placed piece! Tap a placed piece to remove it.');
        return;
      }

      const nextPlacements = [...otherPlacements, candidate];
      onAction({
        kind: 'shape-it',
        type: 'UPDATE_PLACEMENTS',
        placements: nextPlacements,
      });

      // Auto-select next unplaced piece for smooth flow
      const nextUnplaced = playerBView.pieces.find(
        (p) => !nextPlacements.some((pl) => pl.pieceId === p.id),
      );
      if (nextUnplaced) {
        setSelectedPieceId(nextUnplaced.id);
        setRotation(0);
      }
    };

    return (
      <div className="space-y-4">
        <PastelCard tone="sky" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-wider text-[#2B5D8A]">
                Builder Board (5×5 Snap Grid)
              </p>
              <h2 className="font-display text-xl font-bold text-[#4A355A]">
                Pick a piece, rotate if needed &amp; tap a cell to snap!
              </h2>
            </div>
            <span className="rounded-full border-2 border-[#4A355A]/15 bg-[#FFFDF9] px-3 py-1 text-xs font-bold text-[#4A355A]">
              {playerBView.placements.length} / {playerBView.pieces.length} placed
            </span>
          </div>

          {/* 5x5 Interactive Grid */}
          <div className="mx-auto w-full max-w-[300px]">
            <div className="grid grid-cols-5 gap-1.5 rounded-3xl border-[3px] border-[#4A355A]/20 bg-[#E6F4FF] p-3">
              {Array.from({ length: playerBView.gridSize }, (_, y) =>
                Array.from({ length: playerBView.gridSize }, (__, x) => {
                  const owner = cellOwnerMap.get(`${x},${y}`);
                  return (
                    <button
                      key={`${x}-${y}`}
                      type="button"
                      onClick={() => handleCellClick(x, y)}
                      aria-label={`Board row ${y + 1} col ${x + 1}${owner ? ' filled, tap to remove' : ' empty, tap to place'}`}
                      className={`flex aspect-square min-h-[44px] items-center justify-center rounded-xl border-2 text-[10px] font-bold transition-transform active:scale-95 ${
                        owner
                          ? `${COLOR_STYLES[owner.color]} text-[#4A355A] shadow-xs`
                          : 'border-[#4A355A]/15 bg-[#FFFDF9] text-[#9FB8CE] hover:bg-[#F3FAFF]'
                      }`}
                    >
                      {y + 1},{x + 1}
                    </button>
                  );
                }),
              )}
            </div>
          </div>

          {/* Piece Tray */}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {playerBView.pieces.map((piece) => {
              const isSelected = selectedPiece?.id === piece.id;
              const isPlaced = playerBView.placements.some((p) => p.pieceId === piece.id);
              return (
                <button
                  key={piece.id}
                  type="button"
                  onClick={() => {
                    setSelectedPieceId(piece.id);
                    setLocalError(null);
                  }}
                  className={`flex min-h-[74px] flex-col items-center justify-center gap-1.5 rounded-2xl border-[3px] p-2 transition-all ${
                    isSelected
                      ? 'border-[#4A355A] bg-[#FFF2C4] shadow-[0_3px_0_rgba(74,53,90,0.2)]'
                      : isPlaced
                        ? 'border-[#5CD0A5] bg-[#DCF9ED]/75 opacity-80'
                        : 'border-[#4A355A]/20 bg-[#FFFDF9]'
                  }`}
                >
                  <PieceMiniPreview
                    piece={piece}
                    rotation={isSelected ? rotation : 0}
                  />
                  <span className="text-[11px] font-bold text-[#4A355A]">
                    {piece.label} {isPlaced ? '✓' : ''}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex gap-2">
              <CuteButton variant="lavender" size="sm" onClick={rotateCurrent}>
                <RotateCw className="h-4 w-4" aria-hidden="true" />
                Rotate ({rotation}°)
              </CuteButton>
              <CuteButton
                variant="cream"
                size="sm"
                onClick={() =>
                  onAction({ kind: 'shape-it', type: 'UPDATE_PLACEMENTS', placements: [] })
                }
                disabled={playerBView.placements.length === 0}
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                Clear
              </CuteButton>
            </div>

            <CuteButton
              variant="pink"
              size="md"
              onClick={() =>
                onAction({
                  kind: 'shape-it',
                  type: 'SUBMIT_SHAPE',
                  placements: playerBView.placements,
                })
              }
            >
              <Send className="h-4 w-4" aria-hidden="true" />
              Check Blueprint
            </CuteButton>
          </div>
        </PastelCard>

        {(localError || playerBView.feedback) && (
          <PastelCard tone="pink" className="text-center text-sm font-bold text-[#4A355A]">
            {localError ?? playerBView.feedback}
          </PastelCard>
        )}
      </div>
    );
  }

  return null;
}
