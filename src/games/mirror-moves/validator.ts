import type { Direction, GridPoint } from '../../game-engine/types';
import type { MirrorRenderCell, MirrorStageDef } from './types';

const DELTAS: Record<Direction, GridPoint> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

export function getMirrorSpecialAt(
  board: MirrorStageDef['boardA'],
  pos: GridPoint,
) {
  return board.specials.find((s) => s.x === pos.x && s.y === pos.y) ?? null;
}

export function isWallAt(board: MirrorStageDef['boardA'], pos: GridPoint): boolean {
  return board.walls.some((w) => w.x === pos.x && w.y === pos.y);
}

export function isDoorPassable(
  doorKind: 'hold-door' | 'sync-door' | 'latch-door',
  linkId: string,
  partnerBoard: MirrorStageDef['boardA'],
  partnerPos: GridPoint,
  unlockedSyncIds: string[],
  unlockedLatchIds: string[],
): boolean {
  if (doorKind === 'sync-door') {
    return unlockedSyncIds.includes(linkId);
  }
  if (doorKind === 'latch-door') {
    return unlockedLatchIds.includes(linkId);
  }
  const partnerSpecial = getMirrorSpecialAt(partnerBoard, partnerPos);
  return partnerSpecial?.kind === 'hold-plate' && partnerSpecial.linkId === linkId;
}

export function attemptMirrorStep(
  stage: MirrorStageDef,
  actor: 'host' | 'guest',
  direction: Direction,
  posA: GridPoint,
  posB: GridPoint,
  unlockedSyncIds: string[],
  unlockedLatchIds: string[],
):
  | {
      moved: true;
      nextPosA: GridPoint;
      nextPosB: GridPoint;
      nextUnlockedSyncIds: string[];
      nextUnlockedLatchIds: string[];
      eventNote: string | null;
    }
  | { moved: false; reason: string } {
  const delta = DELTAS[direction];
  const myBoard = actor === 'host' ? stage.boardA : stage.boardB;
  const partnerBoard = actor === 'host' ? stage.boardB : stage.boardA;
  const myPos = actor === 'host' ? posA : posB;
  const partnerPos = actor === 'host' ? posB : posA;

  const target: GridPoint = { x: myPos.x + delta.x, y: myPos.y + delta.y };
  if (
    target.x < 0 ||
    target.y < 0 ||
    target.x >= stage.gridSize ||
    target.y >= stage.gridSize
  ) {
    return { moved: false, reason: 'Blocked by edge of board!' };
  }

  if (isWallAt(myBoard, target)) {
    return { moved: false, reason: 'Blocked by a wall!' };
  }

  const special = getMirrorSpecialAt(myBoard, target);
  if (
    special &&
    (special.kind === 'hold-door' ||
      special.kind === 'sync-door' ||
      special.kind === 'latch-door')
  ) {
    const open = isDoorPassable(
      special.kind,
      special.linkId,
      partnerBoard,
      partnerPos,
      unlockedSyncIds,
      unlockedLatchIds,
    );
    if (!open) {
      const hintLabel =
        special.kind === 'hold-door'
          ? `Partner must stand on "${special.linkId}" plate!`
          : special.kind === 'latch-door'
            ? `Partner must hit "${special.linkId}" latch switch!`
            : `Both players must stand on "${special.linkId}" sync pads together!`;
      return { moved: false, reason: `Locked gate (${special.linkId}): ${hintLabel}` };
    }
  }

  const nextPosA = actor === 'host' ? target : posA;
  const nextPosB = actor === 'guest' ? target : posB;

  const nextUnlockedLatchIds = [...unlockedLatchIds];
  let eventNote: string | null = null;

  if (special?.kind === 'latch-switch' && !nextUnlockedLatchIds.includes(special.linkId)) {
    nextUnlockedLatchIds.push(special.linkId);
    eventNote = `Latch switch "${special.linkId}" unlocked permanently!`;
  }

  const nextUnlockedSyncIds = [...unlockedSyncIds];
  const spA = getMirrorSpecialAt(stage.boardA, nextPosA);
  const spB = getMirrorSpecialAt(stage.boardB, nextPosB);
  if (
    spA?.kind === 'sync-pad' &&
    spB?.kind === 'sync-pad' &&
    spA.linkId === spB.linkId &&
    !nextUnlockedSyncIds.includes(spA.linkId)
  ) {
    nextUnlockedSyncIds.push(spA.linkId);
    eventNote = `Twin Sync "${spA.linkId}" activated! Gates opened!`;
  }

  return {
    moved: true,
    nextPosA,
    nextPosB,
    nextUnlockedSyncIds,
    nextUnlockedLatchIds,
    eventNote,
  };
}

export function buildMirrorCellsForBoard(
  gridSize: number,
  myBoard: MirrorStageDef['boardA'],
  partnerBoard: MirrorStageDef['boardA'],
  partnerPos: GridPoint,
  unlockedSyncIds: string[],
  unlockedLatchIds: string[],
): MirrorRenderCell[] {
  const cells: MirrorRenderCell[] = [];
  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      const pos = { x, y };
      if (isWallAt(myBoard, pos)) {
        cells.push({ x, y, kind: 'wall' });
        continue;
      }
      if (myBoard.goal.x === x && myBoard.goal.y === y) {
        cells.push({ x, y, kind: 'goal' });
        continue;
      }
      const sp = getMirrorSpecialAt(myBoard, pos);
      if (sp) {
        const isOpen =
          sp.kind === 'hold-door' || sp.kind === 'sync-door' || sp.kind === 'latch-door'
            ? isDoorPassable(
                sp.kind,
                sp.linkId,
                partnerBoard,
                partnerPos,
                unlockedSyncIds,
                unlockedLatchIds,
              )
            : sp.kind === 'sync-pad'
              ? unlockedSyncIds.includes(sp.linkId)
              : sp.kind === 'latch-switch'
                ? unlockedLatchIds.includes(sp.linkId)
                : partnerPos.x >= 0; // hold-plate stays visible
        cells.push({
          x,
          y,
          kind: sp.kind,
          linkId: sp.linkId,
          isOpen,
        });
        continue;
      }
      cells.push({ x, y, kind: 'floor' });
    }
  }
  return cells;
}

export function isMirrorStageSolved(
  stage: MirrorStageDef,
  posA: GridPoint,
  posB: GridPoint,
): boolean {
  return (
    posA.x === stage.boardA.goal.x &&
    posA.y === stage.boardA.goal.y &&
    posB.x === stage.boardB.goal.x &&
    posB.y === stage.boardB.goal.y
  );
}

/** BFS shortest next hint action from any state */
export function findNextMirrorHintStep(
  stage: MirrorStageDef,
  startPosA: GridPoint,
  startPosB: GridPoint,
  startSyncIds: string[],
  startLatchIds: string[],
): { actor: 'host' | 'guest'; direction: Direction } | null {
  interface Node {
    posA: GridPoint;
    posB: GridPoint;
    syncIds: string[];
    latchIds: string[];
    firstMove: { actor: 'host' | 'guest'; direction: Direction } | null;
  }

  const keyOf = (n: Node) =>
    `${n.posA.x},${n.posA.y}|${n.posB.x},${n.posB.y}|${n.syncIds.slice().sort().join(',')}|${n.latchIds.slice().sort().join(',')}`;

  const queue: Node[] = [
    {
      posA: startPosA,
      posB: startPosB,
      syncIds: startSyncIds,
      latchIds: startLatchIds,
      firstMove: null,
    },
  ];
  const visited = new Set<string>([keyOf(queue[0]!)]);
  const dirs: Direction[] = ['up', 'down', 'left', 'right'];
  const actors: Array<'host' | 'guest'> = ['host', 'guest'];

  let head = 0;
  while (head < queue.length && visited.size < 20000) {
    const cur = queue[head++]!;
    if (isMirrorStageSolved(stage, cur.posA, cur.posB)) {
      return cur.firstMove;
    }

    for (const actor of actors) {
      for (const direction of dirs) {
        const res = attemptMirrorStep(
          stage,
          actor,
          direction,
          cur.posA,
          cur.posB,
          cur.syncIds,
          cur.latchIds,
        );
        if (!res.moved) continue;
        const nextNode: Node = {
          posA: res.nextPosA,
          posB: res.nextPosB,
          syncIds: res.nextUnlockedSyncIds,
          latchIds: res.nextUnlockedLatchIds,
          firstMove: cur.firstMove ?? { actor, direction },
        };
        const k = keyOf(nextNode);
        if (!visited.has(k)) {
          visited.add(k);
          queue.push(nextNode);
        }
      }
    }
  }
  return null;
}
