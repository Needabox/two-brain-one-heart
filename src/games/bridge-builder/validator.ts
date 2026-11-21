import type { GridPoint } from '../../game-engine/types';
import type {
  BridgePieceKind,
  BridgePlacedPiece,
  BridgeRotation,
  BridgeStageDef,
} from './types';

type Port = 'N' | 'E' | 'S' | 'W';

const OPPOSITE: Record<Port, Port> = {
  N: 'S',
  S: 'N',
  E: 'W',
  W: 'E',
};

const STEP: Record<Port, GridPoint> = {
  N: { x: 0, y: -1 },
  S: { x: 0, y: 1 },
  E: { x: 1, y: 0 },
  W: { x: -1, y: 0 },
};

export function getPiecePorts(kind: BridgePieceKind, rotation: BridgeRotation): Port[] {
  switch (kind) {
    case 'deck':
      return rotation === 0 || rotation === 180 ? ['W', 'E'] : ['N', 'S'];
    case 'ramp':
      if (rotation === 0) return ['W', 'N'];
      if (rotation === 90) return ['N', 'E'];
      if (rotation === 180) return ['E', 'S'];
      return ['S', 'W'];
    case 'truss':
      // Truss supports both deck ends and structural vertical bracing
      if (rotation === 0 || rotation === 180) return ['W', 'E'];
      return ['N', 'S'];
  }
}

export function getRemainingInventory(
  stage: BridgeStageDef,
  placed: BridgePlacedPiece[],
): Partial<Record<BridgePieceKind, number>> {
  const counts: Partial<Record<BridgePieceKind, number>> = { ...stage.inventory };
  for (const p of placed) {
    if (counts[p.kind] !== undefined) {
      counts[p.kind] = Math.max(0, (counts[p.kind] ?? 0) - 1);
    }
  }
  return counts;
}

export function evaluateBridgeStructure(
  stage: BridgeStageDef,
  placed: BridgePlacedPiece[],
): {
  valid: boolean;
  connectedCoords: GridPoint[];
  reason: string | null;
} {
  const byCoord = new Map<string, BridgePlacedPiece>();
  for (const p of placed) {
    byCoord.set(`${p.x},${p.y}`, p);
  }

  // BFS starting at Left Platform (x=0, y=leftBankY) exiting East into (x=1, y=leftBankY)
  const firstPos: GridPoint = { x: 1, y: stage.leftBankY };
  const firstPiece = byCoord.get(`${firstPos.x},${firstPos.y}`);
  if (!firstPiece || !getPiecePorts(firstPiece.kind, firstPiece.rotation).includes('W')) {
    return {
      valid: false,
      connectedCoords: [],
      reason: 'Bridge must connect from the Left Cliff edge!',
    };
  }

  const visited = new Set<string>([`${firstPos.x},${firstPos.y}`]);
  const queue: GridPoint[] = [firstPos];
  const connectedCoords: GridPoint[] = [];
  let reachedRightBank = false;

  while (queue.length > 0) {
    const cur = queue.shift()!;
    connectedCoords.push(cur);
    const piece = byCoord.get(`${cur.x},${cur.y}`);
    if (!piece) continue;
    const ports = getPiecePorts(piece.kind, piece.rotation);

    for (const port of ports) {
      const next: GridPoint = {
        x: cur.x + STEP[port].x,
        y: cur.y + STEP[port].y,
      };
      if (next.x === stage.width - 1 && next.y === stage.rightBankY && port === 'E') {
        reachedRightBank = true;
        continue;
      }
      if (next.x === 0 && next.y === stage.leftBankY && port === 'W') {
        continue;
      }
      if (next.x < 1 || next.x >= stage.width - 1 || next.y < 0 || next.y >= stage.height) {
        continue;
      }
      const nPiece = byCoord.get(`${next.x},${next.y}`);
      if (!nPiece) continue;
      if (!getPiecePorts(nPiece.kind, nPiece.rotation).includes(OPPOSITE[port])) {
        continue;
      }
      const key = `${next.x},${next.y}`;
      if (!visited.has(key)) {
        visited.add(key);
        queue.push(next);
      }
    }
  }

  if (!reachedRightBank) {
    return {
      valid: false,
      connectedCoords,
      reason: 'Bridge does not reach the Right Cliff yet!',
    };
  }

  // Verify every required blueprint piece is placed with valid matching structure (no missing/dangling pieces)
  const allBlueprintMatch = stage.blueprint.every((bp) => {
    const p = byCoord.get(`${bp.x},${bp.y}`);
    if (!p || p.kind !== bp.kind) return false;
    const portsBp = getPiecePorts(bp.kind, bp.rotation).slice().sort().join('');
    const portsP = getPiecePorts(p.kind, p.rotation).slice().sort().join('');
    return portsBp === portsP;
  });

  if (!allBlueprintMatch || placed.length !== stage.blueprint.length) {
    return {
      valid: false,
      connectedCoords,
      reason: 'Bridge connects, but does not match Player A blueprint structure!',
    };
  }

  return {
    valid: true,
    connectedCoords,
    reason: null,
  };
}
