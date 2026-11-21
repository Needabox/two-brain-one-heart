import { useEffect } from 'react';
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Flag,
  Lightbulb,
  RotateCcw,
} from 'lucide-react';
import { CuteButton } from '../../components/CuteButton';
import { PastelCard } from '../../components/PastelCard';
import type { Direction, GameActionInput } from '../../game-engine/types';
import type { MirrorMovesPlayerView, MirrorRenderCell } from './types';

interface MirrorMovesGameProps {
  role: 'host' | 'guest';
  view: MirrorMovesPlayerView | null;
  onAction: (action: GameActionInput) => void;
}

function renderCellBadge(cell: MirrorRenderCell, isMe: boolean) {
  if (isMe) {
    return <span className="text-sm font-extrabold">●</span>;
  }
  switch (cell.kind) {
    case 'wall':
      return <span className="text-xs opacity-60">■</span>;
    case 'goal':
      return <Flag className="h-4 w-4 text-[#186A4D]" aria-hidden="true" />;
    case 'hold-plate':
      return <span className="text-[10px] font-extrabold uppercase">P:{cell.linkId}</span>;
    case 'hold-door':
      return (
        <span className="text-[10px] font-extrabold uppercase">
          {cell.isOpen ? 'OPEN' : `D:${cell.linkId}`}
        </span>
      );
    case 'sync-pad':
      return (
        <span className="text-[10px] font-extrabold uppercase">
          {cell.isOpen ? '★OK' : `★${cell.linkId}`}
        </span>
      );
    case 'sync-door':
      return (
        <span className="text-[10px] font-extrabold uppercase">
          {cell.isOpen ? 'OPEN' : `★:${cell.linkId}`}
        </span>
      );
    case 'latch-switch':
      return (
        <span className="text-[10px] font-extrabold uppercase">
          {cell.isOpen ? 'KEY✓' : `K:${cell.linkId}`}
        </span>
      );
    case 'latch-door':
      return (
        <span className="text-[10px] font-extrabold uppercase">
          {cell.isOpen ? 'OPEN' : `L:${cell.linkId}`}
        </span>
      );
    default:
      return null;
  }
}

export function MirrorMovesGame({ role, view, onAction }: MirrorMovesGameProps) {
  const sendMove = (direction: Direction) => {
    onAction({ kind: 'mirror-moves', type: 'MOVE_MIRROR_CHAR', direction });
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        return;
      }
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        sendMove('up');
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        e.preventDefault();
        sendMove('down');
      } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        sendMove('left');
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        sendMove('right');
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);

  if (!view) return null;
  const isHost = role === 'host';
  const amOnGoal = view.myPos.x === view.myGoal.x && view.myPos.y === view.myGoal.y;

  return (
    <PastelCard tone={isHost ? 'lavender' : 'sky'} className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-wider text-[#6D5880]">
            Stage {view.stageIndex + 1} of {view.totalStages} • {view.stageTitle}
          </p>
          <h2 className="font-display text-xl font-bold text-[#4A355A]">
            {isHost ? 'Board A (Character A)' : 'Board B (Character B)'}
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
            onClick={() => onAction({ kind: 'mirror-moves', type: 'RESET_MIRROR_BOARD' })}
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            Reset Both
          </CuteButton>
        </div>
      </div>

      {/* Simultaneous Goal Status */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-[#FFFBF5] px-4 py-2 text-xs font-extrabold">
        <span className={amOnGoal ? 'text-[#186A4D]' : 'text-[#4A355A]'}>
          You: {amOnGoal ? '✓ On Goal Tile!' : 'Navigate to Flag Goal'}
        </span>
        <span className={view.partnerOnGoal ? 'text-[#186A4D]' : 'text-[#6D5880]'}>
          Partner: {view.partnerOnGoal ? '✓ Waiting on Goal!' : 'Navigating partner maze…'}
        </span>
      </div>

      {/* Board Grid */}
      <div className="mx-auto w-full max-w-[330px]">
        <div
          style={{ gridTemplateColumns: `repeat(${view.gridSize}, minmax(0, 1fr))` }}
          className="grid gap-1.5 rounded-3xl border-[3px] border-[#4A355A]/20 bg-[#FFFBF5] p-3"
        >
          {view.myCells.map((cell) => {
            const isMe = cell.x === view.myPos.x && cell.y === view.myPos.y;
            let cellStyle = 'border-[#4A355A]/15 bg-[#FAF7F2] text-[#4A355A]';
            if (isMe) {
              cellStyle = isHost
                ? 'border-[#8268DB] bg-[#E6DFFF] text-[#4A355A]'
                : 'border-[#3F93D8] bg-[#DFF3FF] text-[#1D5587]';
            } else if (cell.kind === 'wall') {
              cellStyle = 'border-[#4A355A]/30 bg-[#C7BECA] text-[#4A355A]';
            } else if (cell.kind === 'goal') {
              cellStyle = 'border-[#3FA980] bg-[#D6FAEB] text-[#186A4D]';
            } else if (cell.kind === 'hold-plate' || cell.kind === 'latch-switch' || cell.kind === 'sync-pad') {
              cellStyle = 'border-[#F59E0B] bg-[#FFF2C4] text-[#7D5200]';
            } else if (
              cell.kind === 'hold-door' ||
              cell.kind === 'latch-door' ||
              cell.kind === 'sync-door'
            ) {
              cellStyle = cell.isOpen
                ? 'border-[#3FA980] bg-[#E4FAEE] text-[#186A4D]'
                : 'border-[#FF6B9C] bg-[#FFE3EC] text-[#9A214B]';
            }

            return (
              <div
                key={`${cell.x}-${cell.y}`}
                aria-label={`Row ${cell.y + 1} Col ${cell.x + 1} ${isMe ? 'Player' : cell.kind}`}
                className={`flex aspect-square items-center justify-center rounded-xl border-2 text-center ${cellStyle}`}
              >
                {renderCellBadge(cell, isMe)}
              </div>
            );
          })}
        </div>
      </div>

      {/* Touch D-Pad (Minimum 48px touch targets) */}
      <div className="flex flex-col items-center gap-1.5">
        <CuteButton
          variant="cream"
          size="md"
          className="min-h-[48px] min-w-[68px]"
          aria-label="Move up"
          onClick={() => sendMove('up')}
        >
          <ArrowUp className="h-5 w-5" />
        </CuteButton>
        <div className="flex items-center gap-2">
          <CuteButton
            variant="cream"
            size="md"
            className="min-h-[48px] min-w-[68px]"
            aria-label="Move left"
            onClick={() => sendMove('left')}
          >
            <ArrowLeft className="h-5 w-5" />
          </CuteButton>
          <CuteButton
            variant="cream"
            size="md"
            className="min-h-[48px] min-w-[68px]"
            aria-label="Move down"
            onClick={() => sendMove('down')}
          >
            <ArrowDown className="h-5 w-5" />
          </CuteButton>
          <CuteButton
            variant="cream"
            size="md"
            className="min-h-[48px] min-w-[68px]"
            aria-label="Move right"
            onClick={() => sendMove('right')}
          >
            <ArrowRight className="h-5 w-5" />
          </CuteButton>
        </div>
      </div>

      {view.feedback && (
        <p role="status" className="rounded-2xl bg-[#FFFBF5] px-4 py-2.5 text-center text-sm font-bold text-[#4A355A]">
          {view.feedback}
        </p>
      )}
    </PastelCard>
  );
}
