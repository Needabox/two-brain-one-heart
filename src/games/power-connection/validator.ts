import type {
  CardinalPort,
  CircuitStageDef,
  TileRotation,
  WireTileKind,
} from './types';

const BASE_PORTS: Record<WireTileKind, CardinalPort[]> = {
  empty: [],
  source: ['N'],
  target: ['N'],
  straight: ['N', 'S'],
  corner: ['N', 'E'],
  tee: ['N', 'E', 'W'],
  cross: ['N', 'E', 'S', 'W'],
};

const CLOCKWISE: CardinalPort[] = ['N', 'E', 'S', 'W'];

const OPPOSITE: Record<CardinalPort, CardinalPort> = {
  N: 'S',
  E: 'W',
  S: 'N',
  W: 'E',
};

const DELTA: Record<CardinalPort, { dx: number; dy: number }> = {
  N: { dx: 0, dy: -1 },
  E: { dx: 1, dy: 0 },
  S: { dx: 0, dy: 1 },
  W: { dx: -1, dy: 0 },
};

export function getOpenPorts(kind: WireTileKind, rotation: TileRotation): CardinalPort[] {
  const steps = rotation / 90;
  return BASE_PORTS[kind].map((p) => {
    const idx = CLOCKWISE.indexOf(p);
    return CLOCKWISE[(idx + steps) % 4]!;
  });
}

export interface CircuitEvaluation {
  valid: boolean;
  poweredCoords: Array<{ x: number; y: number }>;
  reason: string | null;
}

export function evaluateCircuit(
  stage: CircuitStageDef,
  rotations: TileRotation[][],
): CircuitEvaluation {
  const tileMap = new Map<string, WireTileKind>();
  const sources: Array<{ x: number; y: number }> = [];
  const targets: Array<{ x: number; y: number }> = [];

  for (const tile of stage.tiles) {
    tileMap.set(`${tile.x},${tile.y}`, tile.kind);
    if (tile.kind === 'source') sources.push({ x: tile.x, y: tile.y });
    if (tile.kind === 'target') targets.push({ x: tile.x, y: tile.y });
  }

  if (sources.length === 0 || targets.length === 0) {
    return { valid: false, poweredCoords: [], reason: 'Invalid circuit stage configuration.' };
  }

  const visited = new Set<string>();
  const poweredCoords: Array<{ x: number; y: number }> = [];
  const queue = [...sources];
  sources.forEach((s) => visited.add(`${s.x},${s.y}`));

  let hasDanglingPort = false;
  let danglingCoord: { x: number; y: number } | null = null;

  while (queue.length > 0) {
    const curr = queue.shift()!;
    poweredCoords.push(curr);
    const kind = tileMap.get(`${curr.x},${curr.y}`) ?? 'empty';
    const rot = rotations[curr.y]?.[curr.x] ?? 0;
    const ports = getOpenPorts(kind, rot);

    for (const port of ports) {
      const { dx, dy } = DELTA[port];
      const nx = curr.x + dx;
      const ny = curr.y + dy;
      if (nx < 0 || ny < 0 || nx >= stage.gridSize || ny >= stage.gridSize) {
        hasDanglingPort = true;
        danglingCoord = curr;
        continue;
      }
      const nKind = tileMap.get(`${nx},${ny}`) ?? 'empty';
      const nRot = rotations[ny]?.[nx] ?? 0;
      const nPorts = getOpenPorts(nKind, nRot);
      if (!nPorts.includes(OPPOSITE[port])) {
        hasDanglingPort = true;
        danglingCoord = curr;
        continue;
      }
      const nKey = `${nx},${ny}`;
      if (!visited.has(nKey)) {
        visited.add(nKey);
        queue.push({ x: nx, y: ny });
      }
    }
  }

  const allTargetsPowered = targets.every((t) => visited.has(`${t.x},${t.y}`));
  if (!allTargetsPowered) {
    return {
      valid: false,
      poweredCoords,
      reason: 'Power has not reached all Heart Bulbs yet!',
    };
  }
  if (hasDanglingPort && danglingCoord) {
    return {
      valid: false,
      poweredCoords,
      reason: `Open wire end at row ${danglingCoord.y + 1}, col ${danglingCoord.x + 1} — check all connections!`,
    };
  }

  return { valid: true, poweredCoords, reason: null };
}
