import { getLevelPuzzle } from './puzzles';
import type {
  CozySymbolId,
  Direction,
  FogCell,
  FogCellType,
  GameActionInput,
  GameEngineState,
  GridPoint,
  LevelId,
  LevelPuzzle,
  LostTogetherEngineState,
  LostTogetherPlayerAView,
  LostTogetherPlayerBView,
  MazePuzzle,
  MemorySyncEngineState,
  MemorySyncPuzzle,
  MixedChallengeEngineState,
  MixedChallengePuzzle,
  PlayerAView,
  PlayerBView,
  SanitizedSnapshotPayload,
  SecretLanguageEngineState,
  SecretLanguagePuzzle,
  ShapeColor,
  ShapeItEngineState,
  ShapePieceDef,
  ShapePlacement,
  ShapePuzzle,
} from './types';

// ---- Maze Helpers (Deterministic BFS) ----

const DIRECTION_DELTAS: Record<Direction, GridPoint> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

export function isWalkable(maze: MazePuzzle, x: number, y: number): boolean {
  if (x < 0 || y < 0 || x >= maze.gridSize || y >= maze.gridSize) {
    return false;
  }
  const row = maze.walls[y];
  if (!row) return false;
  return row[x] === 0;
}

export function findShortestPath(
  maze: MazePuzzle,
  from: GridPoint,
  to: GridPoint,
): GridPoint[] {
  if (from.x === to.x && from.y === to.y) return [];
  if (!isWalkable(maze, from.x, from.y) || !isWalkable(maze, to.x, to.y)) {
    return [];
  }

  const key = (p: GridPoint) => `${p.x},${p.y}`;
  const queue: GridPoint[] = [from];
  const visited = new Set<string>([key(from)]);
  const parent = new Map<string, GridPoint>();

  while (queue.length > 0) {
    const curr = queue.shift();
    if (!curr) break;
    if (curr.x === to.x && curr.y === to.y) {
      const path: GridPoint[] = [];
      let trace: GridPoint | undefined = curr;
      while (trace && !(trace.x === from.x && trace.y === from.y)) {
        path.unshift(trace);
        trace = parent.get(key(trace));
      }
      return path;
    }

    for (const dir of ['up', 'down', 'left', 'right'] as Direction[]) {
      const delta = DIRECTION_DELTAS[dir];
      const next = { x: curr.x + delta.x, y: curr.y + delta.y };
      const nextKey = key(next);
      if (isWalkable(maze, next.x, next.y) && !visited.has(nextKey)) {
        visited.add(nextKey);
        parent.set(nextKey, curr);
        queue.push(next);
      }
    }
  }

  return [];
}

function getDirectionBetween(from: GridPoint, to: GridPoint): Direction | null {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  if (dx === 1 && dy === 0) return 'right';
  if (dx === -1 && dy === 0) return 'left';
  if (dx === 0 && dy === 1) return 'down';
  if (dx === 0 && dy === -1) return 'up';
  return null;
}

// ---- Shape Placement Helpers ----

export function rotatePieceCells(
  cells: GridPoint[],
  rotation: 0 | 90 | 180 | 270,
): GridPoint[] {
  const steps = rotation / 90;
  let rotated = cells.map((c) => ({ ...c }));
  for (let i = 0; i < steps; i++) {
    rotated = rotated.map((c) => ({ x: -c.y, y: c.x }));
  }
  const minX = Math.min(...rotated.map((c) => c.x));
  const minY = Math.min(...rotated.map((c) => c.y));
  return rotated.map((c) => ({ x: c.x - minX, y: c.y - minY }));
}

export function getPieceOccupiedCells(
  piece: ShapePieceDef,
  placement: ShapePlacement,
): GridPoint[] {
  const rel = rotatePieceCells(piece.cells, placement.rotation);
  return rel.map((c) => ({
    x: placement.anchor.x + c.x,
    y: placement.anchor.y + c.y,
  }));
}

export interface ShapeValidationResult {
  valid: boolean;
  reason: string | null;
  occupiedColorMap: Map<string, ShapeColor>;
}

export function validateShapePlacements(
  puzzle: ShapePuzzle,
  placements: ShapePlacement[],
): ShapeValidationResult {
  const occupiedColorMap = new Map<string, ShapeColor>();

  for (const placement of placements) {
    const piece = puzzle.pieces.find((p) => p.id === placement.pieceId);
    if (!piece) {
      return { valid: false, reason: 'Unknown piece selected.', occupiedColorMap };
    }
    const cells = getPieceOccupiedCells(piece, placement);
    for (const cell of cells) {
      if (
        cell.x < 0 ||
        cell.y < 0 ||
        cell.x >= puzzle.gridSize ||
        cell.y >= puzzle.gridSize
      ) {
        return {
          valid: false,
          reason: `${piece.label} goes outside the 5×5 board!`,
          occupiedColorMap,
        };
      }
      const k = `${cell.x},${cell.y}`;
      if (occupiedColorMap.has(k)) {
        return {
          valid: false,
          reason: 'Two shape pieces are overlapping!',
          occupiedColorMap,
        };
      }
      occupiedColorMap.set(k, piece.color);
    }
  }

  if (placements.length < puzzle.pieces.length) {
    return {
      valid: false,
      reason: `Place all ${puzzle.pieces.length} pieces on the board first!`,
      occupiedColorMap,
    };
  }

  // Build target color map
  const targetMap = new Map<string, ShapeColor>();
  for (const target of puzzle.targetPlacements) {
    const piece = puzzle.pieces.find((p) => p.id === target.pieceId);
    if (!piece) continue;
    for (const cell of getPieceOccupiedCells(piece, target)) {
      targetMap.set(`${cell.x},${cell.y}`, piece.color);
    }
  }

  if (occupiedColorMap.size !== targetMap.size) {
    return {
      valid: false,
      reason: 'The silhouette shape does not match yet.',
      occupiedColorMap,
    };
  }

  for (const [k, color] of targetMap.entries()) {
    if (occupiedColorMap.get(k) !== color) {
      return {
        valid: false,
        reason: 'Almost there! Check the piece colors and positions with your partner.',
        occupiedColorMap,
      };
    }
  }

  return { valid: true, reason: null, occupiedColorMap };
}

// ---- Engine State Creation ----

function createMemorySyncState(puzzle: MemorySyncPuzzle, now: number): MemorySyncEngineState {
  const firstRound = puzzle.rounds[0];
  return {
    kind: 'memory-sync',
    roundIndex: 0,
    totalRounds: puzzle.rounds.length,
    previewUntil: now + (firstRound?.previewDurationMs ?? 7500),
    partnerTypedCount: 0,
    feedback: null,
    status: 'playing',
    startedAt: now,
    mistakes: 0,
    hintsUsed: 0,
  };
}

function createSecretLanguageState(
  puzzle: SecretLanguagePuzzle,
  now: number,
): SecretLanguageEngineState {
  return {
    kind: 'secret-language',
    roundIndex: 0,
    totalRounds: puzzle.rounds.length,
    revealedIndices: [],
    feedback: null,
    status: 'playing',
    startedAt: now,
    mistakes: 0,
    hintsUsed: 0,
  };
}

function createLostTogetherState(puzzle: MazePuzzle, now: number): LostTogetherEngineState {
  return {
    kind: 'lost-together',
    avatarPos: { ...puzzle.start },
    keyCollected: false,
    steps: 0,
    lastBumpDirection: null,
    hintPath: [],
    feedback: null,
    status: 'playing',
    startedAt: now,
    mistakes: 0,
    hintsUsed: 0,
  };
}

function createShapeItState(now: number): ShapeItEngineState {
  return {
    kind: 'shape-it',
    placements: [],
    lockedHintPieceId: null,
    feedback: null,
    status: 'playing',
    startedAt: now,
    mistakes: 0,
    hintsUsed: 0,
  };
}

export function createEngineState(levelId: LevelId, now: number = Date.now()): GameEngineState {
  const puzzle = getLevelPuzzle(levelId);
  switch (puzzle.kind) {
    case 'memory-sync':
      return createMemorySyncState(puzzle, now);
    case 'secret-language':
      return createSecretLanguageState(puzzle, now);
    case 'lost-together':
      return createLostTogetherState(puzzle, now);
    case 'shape-it':
      return createShapeItState(now);
    case 'mixed-challenge':
      return {
        kind: 'mixed-challenge',
        stage: 1,
        stage1State: createSecretLanguageState(puzzle.stage1, now),
        stage2State: createLostTogetherState(puzzle.stage2, now),
        feedback: null,
        status: 'playing',
        startedAt: now,
        mistakes: 0,
        hintsUsed: 0,
      };
  }
}

// ---- Individual Engine Transitions ----

function applyMemorySyncAction(
  puzzle: MemorySyncPuzzle,
  state: MemorySyncEngineState,
  action: GameActionInput,
  now: number,
): MemorySyncEngineState {
  if (state.status === 'completed') return state;
  const round = puzzle.rounds[state.roundIndex];
  if (!round) return state;

  if (action.kind === 'memory-sync' && action.type === 'PROGRESS_COUNT') {
    const clamped = Math.max(0, Math.min(round.sequence.length, action.count));
    return {
      ...state,
      partnerTypedCount: clamped,
    };
  }

  if (action.kind === 'memory-sync' && action.type === 'SUBMIT_SEQUENCE') {
    const isMatch =
      action.sequence.length === round.sequence.length &&
      action.sequence.every((sym, idx) => sym === round.sequence[idx]);

    if (isMatch) {
      const nextIndex = state.roundIndex + 1;
      const nextRound = puzzle.rounds[nextIndex];
      if (!nextRound) {
        return {
          ...state,
          partnerTypedCount: round.sequence.length,
          feedback: 'Memory synced! Both brains in harmony!',
          status: 'completed',
        };
      }
      return {
        ...state,
        roundIndex: nextIndex,
        partnerTypedCount: 0,
        previewUntil: now + nextRound.previewDurationMs,
        feedback: `Round ${state.roundIndex + 1} synced! Memorize Round ${nextIndex + 1}!`,
      };
    }

    return {
      ...state,
      mistakes: state.mistakes + 1,
      partnerTypedCount: 0,
      previewUntil: now + 6000,
      feedback: 'Not quite that order — Player A gets a fresh 6s peek!',
    };
  }

  if (action.kind === 'common' && action.type === 'USE_HINT') {
    return {
      ...state,
      hintsUsed: state.hintsUsed + 1,
      previewUntil: now + 5000,
      feedback: 'Hint used: sequence re-revealed to Player A for 5s!',
    };
  }

  return state;
}

function applySecretLanguageAction(
  puzzle: SecretLanguagePuzzle,
  state: SecretLanguageEngineState,
  action: GameActionInput,
): SecretLanguageEngineState {
  if (state.status === 'completed') return state;
  const round = puzzle.rounds[state.roundIndex];
  if (!round) return state;

  if (action.kind === 'secret-language' && action.type === 'SUBMIT_WORD') {
    const normalized = action.word.trim().toUpperCase();
    if (normalized === round.answer) {
      const nextIndex = state.roundIndex + 1;
      const nextRound = puzzle.rounds[nextIndex];
      if (!nextRound) {
        return {
          ...state,
          feedback: 'Secret code decoded!',
          status: 'completed',
        };
      }
      return {
        ...state,
        roundIndex: nextIndex,
        revealedIndices: [],
        feedback: 'Word 1 cracked! Next secret message unlocked!',
      };
    }

    return {
      ...state,
      mistakes: state.mistakes + 1,
      feedback: 'That translation does not match the symbols. Double-check together!',
    };
  }

  if (action.kind === 'common' && action.type === 'USE_HINT') {
    const nextIdx = Array.from({ length: round.answer.length }, (_, i) => i).find(
      (i) => !state.revealedIndices.includes(i),
    );
    if (nextIdx === undefined) {
      return {
        ...state,
        feedback: 'All letters in this word are already revealed!',
      };
    }
    return {
      ...state,
      hintsUsed: state.hintsUsed + 1,
      revealedIndices: [...state.revealedIndices, nextIdx],
      feedback: `Hint: Letter #${nextIdx + 1} is "${round.answer[nextIdx]}"!`,
    };
  }

  return state;
}

function applyLostTogetherAction(
  puzzle: MazePuzzle,
  state: LostTogetherEngineState,
  action: GameActionInput,
): LostTogetherEngineState {
  if (state.status === 'completed') return state;

  if (action.kind === 'lost-together' && action.type === 'RESET_AVATAR') {
    return {
      ...state,
      avatarPos: { ...puzzle.start },
      lastBumpDirection: null,
      hintPath: [],
      feedback: 'Returned to the start tile!',
    };
  }

  if (action.kind === 'lost-together' && action.type === 'MOVE') {
    const delta = DIRECTION_DELTAS[action.direction];
    const nextX = state.avatarPos.x + delta.x;
    const nextY = state.avatarPos.y + delta.y;

    if (!isWalkable(puzzle, nextX, nextY)) {
      return {
        ...state,
        mistakes: state.mistakes + 1,
        lastBumpDirection: action.direction,
        feedback: 'Bonk! That direction is blocked by cozy furniture or a wall.',
      };
    }

    const nextPos = { x: nextX, y: nextY };
    const pickedUpKey =
      state.keyCollected || (nextX === puzzle.keyPos.x && nextY === puzzle.keyPos.y);
    const reachedGoal = nextX === puzzle.goalPos.x && nextY === puzzle.goalPos.y;

    if (reachedGoal && pickedUpKey) {
      return {
        ...state,
        avatarPos: nextPos,
        keyCollected: true,
        steps: state.steps + 1,
        lastBumpDirection: null,
        hintPath: [],
        feedback: 'Unlocked the Heart Door together!',
        status: 'completed',
      };
    }

    let feedback: string | null = null;
    if (!state.keyCollected && pickedUpKey) {
      feedback = 'Golden Key collected! Now head to the Heart Door!';
    } else if (reachedGoal && !pickedUpKey) {
      feedback = 'The Heart Door is locked! Collect the Golden Key first.';
    }

    return {
      ...state,
      avatarPos: nextPos,
      keyCollected: pickedUpKey,
      steps: state.steps + 1,
      lastBumpDirection: null,
      hintPath: [],
      feedback,
    };
  }

  if (action.kind === 'common' && action.type === 'USE_HINT') {
    const target = state.keyCollected ? puzzle.goalPos : puzzle.keyPos;
    const shortest = findShortestPath(puzzle, state.avatarPos, target).slice(0, 3);
    return {
      ...state,
      hintsUsed: state.hintsUsed + 1,
      hintPath: shortest,
      feedback: 'Hint active: next steps highlighted!',
    };
  }

  return state;
}

function applyShapeItAction(
  puzzle: ShapePuzzle,
  state: ShapeItEngineState,
  action: GameActionInput,
): ShapeItEngineState {
  if (state.status === 'completed') return state;

  if (action.kind === 'shape-it' && action.type === 'UPDATE_PLACEMENTS') {
    // Sanitize draft placements: keep only valid in-bounds non-overlapping entries
    const occupied = new Set<string>();
    const clean: ShapePlacement[] = [];
    for (const p of action.placements) {
      const def = puzzle.pieces.find((d) => d.id === p.pieceId);
      if (!def) continue;
      if (clean.some((existing) => existing.pieceId === p.pieceId)) continue;
      const cells = getPieceOccupiedCells(def, p);
      const validBounds = cells.every(
        (c) => c.x >= 0 && c.y >= 0 && c.x < puzzle.gridSize && c.y < puzzle.gridSize,
      );
      const overlaps = cells.some((c) => occupied.has(`${c.x},${c.y}`));
      if (!validBounds || overlaps) continue;
      cells.forEach((c) => occupied.add(`${c.x},${c.y}`));
      clean.push(p);
    }

    return {
      ...state,
      placements: clean,
      feedback: null,
    };
  }

  if (action.kind === 'shape-it' && action.type === 'SUBMIT_SHAPE') {
    const check = validateShapePlacements(puzzle, action.placements);
    if (check.valid) {
      return {
        ...state,
        placements: action.placements,
        feedback: 'Blueprint matched! Cozy silhouette complete!',
        status: 'completed',
      };
    }

    return {
      ...state,
      mistakes: state.mistakes + 1,
      feedback: check.reason ?? 'Shapes do not match the blueprint yet.',
    };
  }

  if (action.kind === 'common' && action.type === 'USE_HINT') {
    const missingOrWrongTarget = puzzle.targetPlacements.find((target) => {
      const current = state.placements.find((p) => p.pieceId === target.pieceId);
      if (!current) return true;
      return (
        current.anchor.x !== target.anchor.x ||
        current.anchor.y !== target.anchor.y ||
        current.rotation !== target.rotation
      );
    });

    if (!missingOrWrongTarget) {
      return {
        ...state,
        feedback: 'All pieces are already in their target positions! Tap Check Blueprint!',
      };
    }

    const pieceDef = puzzle.pieces.find((p) => p.id === missingOrWrongTarget.pieceId);
    const targetCells = pieceDef
      ? new Set(
          getPieceOccupiedCells(pieceDef, missingOrWrongTarget).map((c) => `${c.x},${c.y}`),
        )
      : new Set<string>();

    // Remove conflicting placements so the hint piece snaps cleanly
    const filtered = state.placements.filter((existing) => {
      if (existing.pieceId === missingOrWrongTarget.pieceId) return false;
      const def = puzzle.pieces.find((p) => p.id === existing.pieceId);
      if (!def) return false;
      return getPieceOccupiedCells(def, existing).every(
        (c) => !targetCells.has(`${c.x},${c.y}`),
      );
    });

    return {
      ...state,
      hintsUsed: state.hintsUsed + 1,
      placements: [...filtered, { ...missingOrWrongTarget }],
      lockedHintPieceId: missingOrWrongTarget.pieceId,
      feedback: `Hint placed ${pieceDef?.label ?? 'a piece'} into its target spot!`,
    };
  }

  return state;
}

function applyMixedAction(
  puzzle: MixedChallengePuzzle,
  state: MixedChallengeEngineState,
  action: GameActionInput,
): MixedChallengeEngineState {
  if (state.status === 'completed') return state;

  if (state.stage === 1) {
    const nextStage1 = applySecretLanguageAction(puzzle.stage1, state.stage1State, action);
    if (nextStage1.status === 'completed') {
      return {
        ...state,
        stage: 2,
        stage1State: nextStage1,
        mistakes: nextStage1.mistakes + state.stage2State.mistakes,
        hintsUsed: nextStage1.hintsUsed + state.stage2State.hintsUsed,
        feedback: 'Whisper Lock opened! Now guide your partner through the final maze!',
      };
    }
    return {
      ...state,
      stage1State: nextStage1,
      mistakes: nextStage1.mistakes + state.stage2State.mistakes,
      hintsUsed: nextStage1.hintsUsed + state.stage2State.hintsUsed,
      feedback: nextStage1.feedback,
    };
  }

  const nextStage2 = applyLostTogetherAction(puzzle.stage2, state.stage2State, action);
  const completed = nextStage2.status === 'completed';
  return {
    ...state,
    stage2State: nextStage2,
    mistakes: state.stage1State.mistakes + nextStage2.mistakes,
    hintsUsed: state.stage1State.hintsUsed + nextStage2.hintsUsed,
    feedback: nextStage2.feedback,
    status: completed ? 'completed' : 'playing',
  };
}

export function applyGameAction(
  levelId: LevelId,
  state: GameEngineState,
  action: GameActionInput,
  now: number = Date.now(),
): { nextState: GameEngineState; completedNow: boolean } {
  const puzzle = getLevelPuzzle(levelId);
  const wasCompleted = state.status === 'completed';

  let nextState: GameEngineState = state;
  if (puzzle.kind === 'memory-sync' && state.kind === 'memory-sync') {
    nextState = applyMemorySyncAction(puzzle, state, action, now);
  } else if (puzzle.kind === 'secret-language' && state.kind === 'secret-language') {
    nextState = applySecretLanguageAction(puzzle, state, action);
  } else if (puzzle.kind === 'lost-together' && state.kind === 'lost-together') {
    nextState = applyLostTogetherAction(puzzle, state, action);
  } else if (puzzle.kind === 'shape-it' && state.kind === 'shape-it') {
    nextState = applyShapeItAction(puzzle, state, action);
  } else if (puzzle.kind === 'mixed-challenge' && state.kind === 'mixed-challenge') {
    nextState = applyMixedAction(puzzle, state, action);
  }

  return {
    nextState,
    completedNow: !wasCompleted && nextState.status === 'completed',
  };
}

// ---- Sanitized Clue Isolation Projections ----

function extractSecretLanguageA(
  puzzle: SecretLanguagePuzzle,
  state: SecretLanguageEngineState,
): {
  kind: 'secret-language';
  roundIndex: number;
  totalRounds: number;
  codedSymbols: CozySymbolId[];
  revealedHintSlots: Array<{ index: number; letter: string }>;
  feedback: string | null;
} {
  const round = puzzle.rounds[state.roundIndex];
  const answer = round?.answer ?? '';
  return {
    kind: 'secret-language',
    roundIndex: state.roundIndex,
    totalRounds: state.totalRounds,
    codedSymbols: round ? [...round.codedSymbols] : [],
    revealedHintSlots: state.revealedIndices.map((idx) => ({
      index: idx,
      letter: answer[idx] ?? '',
    })),
    feedback: state.feedback,
  };
}

function extractSecretLanguageB(
  puzzle: SecretLanguagePuzzle,
  state: SecretLanguageEngineState,
): {
  kind: 'secret-language';
  roundIndex: number;
  totalRounds: number;
  decoderEntries: Array<{ symbol: CozySymbolId; letter: string }>;
  wordLength: number;
  revealedHintSlots: Array<{ index: number; letter: string }>;
  feedback: string | null;
} {
  const round = puzzle.rounds[state.roundIndex];
  const answer = round?.answer ?? '';
  // Sort decoder entries alphabetically by letter so symbol order reveals zero clues!
  const decoderEntries = (Object.entries(puzzle.decoderMap) as Array<[CozySymbolId, string]>)
    .map(([symbol, letter]) => ({ symbol, letter }))
    .sort((a, b) => a.letter.localeCompare(b.letter));

  return {
    kind: 'secret-language',
    roundIndex: state.roundIndex,
    totalRounds: state.totalRounds,
    decoderEntries,
    wordLength: answer.length,
    revealedHintSlots: state.revealedIndices.map((idx) => ({
      index: idx,
      letter: answer[idx] ?? '',
    })),
    feedback: state.feedback,
  };
}

function extractLostTogetherA(
  puzzle: MazePuzzle,
  state: LostTogetherEngineState,
): LostTogetherPlayerAView {
  return {
    kind: 'lost-together',
    gridSize: puzzle.gridSize,
    walls: puzzle.walls,
    start: puzzle.start,
    keyPos: puzzle.keyPos,
    goalPos: puzzle.goalPos,
    avatarPos: state.avatarPos,
    keyCollected: state.keyCollected,
    steps: state.steps,
    lastBumpDirection: state.lastBumpDirection,
    hintPath: state.hintPath,
    feedback: state.feedback,
  };
}

function extractLostTogetherB(
  puzzle: MazePuzzle,
  state: LostTogetherEngineState,
): LostTogetherPlayerBView {
  const localCells: FogCell[] = [];
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const x = state.avatarPos.x + dx;
      const y = state.avatarPos.y + dy;
      let cell: FogCellType = 'wall';
      if (x < 0 || y < 0 || x >= puzzle.gridSize || y >= puzzle.gridSize) {
        cell = 'wall';
      } else if (!isWalkable(puzzle, x, y)) {
        cell = 'wall';
      } else if (x === puzzle.keyPos.x && y === puzzle.keyPos.y && !state.keyCollected) {
        cell = 'key';
      } else if (x === puzzle.goalPos.x && y === puzzle.goalPos.y) {
        cell = 'goal';
      } else if (x === puzzle.start.x && y === puzzle.start.y) {
        cell = 'start';
      } else {
        cell = 'floor';
      }
      localCells.push({ x, y, cell });
    }
  }

  const firstHint = state.hintPath[0];
  const hintDirection = firstHint ? getDirectionBetween(state.avatarPos, firstHint) : null;

  return {
    kind: 'lost-together',
    gridSize: puzzle.gridSize,
    avatarPos: state.avatarPos,
    keyCollected: state.keyCollected,
    steps: state.steps,
    lastBumpDirection: state.lastBumpDirection,
    localCells,
    hintDirection,
    feedback: state.feedback,
  };
}

export function extractPlayerAView(
  levelId: LevelId,
  state: GameEngineState,
): PlayerAView {
  const puzzle = getLevelPuzzle(levelId);

  if (puzzle.kind === 'memory-sync' && state.kind === 'memory-sync') {
    const round = puzzle.rounds[state.roundIndex];
    return {
      kind: 'memory-sync',
      roundIndex: state.roundIndex,
      totalRounds: state.totalRounds,
      sequence: round ? [...round.sequence] : [],
      previewUntil: state.previewUntil,
      partnerTypedCount: state.partnerTypedCount,
      feedback: state.feedback,
    };
  }

  if (puzzle.kind === 'secret-language' && state.kind === 'secret-language') {
    return extractSecretLanguageA(puzzle, state);
  }

  if (puzzle.kind === 'lost-together' && state.kind === 'lost-together') {
    return extractLostTogetherA(puzzle, state);
  }

  if (puzzle.kind === 'shape-it' && state.kind === 'shape-it') {
    const targetCells: Array<{ x: number; y: number; color: ShapeColor }> = [];
    for (const target of puzzle.targetPlacements) {
      const piece = puzzle.pieces.find((p) => p.id === target.pieceId);
      if (!piece) continue;
      for (const cell of getPieceOccupiedCells(piece, target)) {
        targetCells.push({ x: cell.x, y: cell.y, color: piece.color });
      }
    }
    return {
      kind: 'shape-it',
      gridSize: puzzle.gridSize,
      targetCells,
      placedCount: state.placements.length,
      totalPieces: puzzle.pieces.length,
      feedback: state.feedback,
    };
  }

  if (puzzle.kind === 'mixed-challenge' && state.kind === 'mixed-challenge') {
    return {
      kind: 'mixed-challenge',
      stage: state.stage,
      stage1View: extractSecretLanguageA(puzzle.stage1, state.stage1State),
      stage2View: extractLostTogetherA(puzzle.stage2, state.stage2State),
      feedback: state.feedback,
    };
  }

  throw new Error(`State/puzzle mismatch for level ${levelId}`);
}

export function extractPlayerBView(
  levelId: LevelId,
  state: GameEngineState,
): PlayerBView {
  const puzzle = getLevelPuzzle(levelId);

  if (puzzle.kind === 'memory-sync' && state.kind === 'memory-sync') {
    const round = puzzle.rounds[state.roundIndex];
    return {
      kind: 'memory-sync',
      roundIndex: state.roundIndex,
      totalRounds: state.totalRounds,
      palette: [...puzzle.palette],
      expectedLength: round?.sequence.length ?? 0,
      previewUntil: state.previewUntil,
      feedback: state.feedback,
    };
  }

  if (puzzle.kind === 'secret-language' && state.kind === 'secret-language') {
    return extractSecretLanguageB(puzzle, state);
  }

  if (puzzle.kind === 'lost-together' && state.kind === 'lost-together') {
    return extractLostTogetherB(puzzle, state);
  }

  if (puzzle.kind === 'shape-it' && state.kind === 'shape-it') {
    const lockedHintPlacement = state.lockedHintPieceId
      ? puzzle.targetPlacements.find((t) => t.pieceId === state.lockedHintPieceId) ?? null
      : null;
    return {
      kind: 'shape-it',
      gridSize: puzzle.gridSize,
      pieces: puzzle.pieces,
      placements: state.placements,
      lockedHintPlacement,
      feedback: state.feedback,
    };
  }

  if (puzzle.kind === 'mixed-challenge' && state.kind === 'mixed-challenge') {
    return {
      kind: 'mixed-challenge',
      stage: state.stage,
      stage1View: extractSecretLanguageB(puzzle.stage1, state.stage1State),
      stage2View: extractLostTogetherB(puzzle.stage2, state.stage2State),
      feedback: state.feedback,
    };
  }

  throw new Error(`State/puzzle mismatch for level ${levelId}`);
}

export function buildSanitizedSnapshot(
  levelId: LevelId,
  state: GameEngineState,
  stateVersion: number,
): SanitizedSnapshotPayload {
  return {
    summary: {
      levelId,
      stateVersion,
      status: state.status,
      startedAt: state.startedAt,
      mistakes: state.mistakes,
      hintsUsed: state.hintsUsed,
    },
    playerBView: extractPlayerBView(levelId, state),
  };
}

// Re-export helper type for puzzle unit tests
export type { LevelPuzzle };
