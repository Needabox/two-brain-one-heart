import type { DifficultyLevel } from '../../game-engine/types';

export type SteerInput = -1 | 0 | 1; // Left, Glide, Right (Player A)
export type LiftInput = -1 | 0 | 1;  // Sink, Hover, Rise (Player B)

export interface BalloonPoint {
  x: number;
  y: number;
}

export interface BalloonObstacleDef {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  kind: 'cloud' | 'cliff' | 'wind-hazard';
  /** Optional deterministic vertical/horizontal oscillation relative to tickCount */
  oscillateAxis?: 'x' | 'y';
  oscillateAmplitude?: number;
  oscillatePeriodTicks?: number;
}

export interface BalloonStageDef {
  title: string;
  arenaWidth: number;
  arenaHeight: number;
  start: BalloonPoint;
  landingZone: { x: number; y: number; width: number; height: number };
  windDx: number;
  obstacles: BalloonObstacleDef[];
  safeLaneHint: string;
}

export interface BalloonRescueConfig {
  difficulty: DifficultyLevel;
  stepSizeX: number;
  stepSizeY: number;
  countdownTicks: number;
  stages: BalloonStageDef[];
}

export interface BalloonRescueEngineState {
  kind: 'balloon-rescue';
  difficulty: DifficultyLevel;
  stageIndex: number;
  totalStages: number;
  tickCount: number;
  countdownRemainingTicks: number;
  pos: BalloonPoint;
  steerA: SteerInput;
  liftB: LiftInput;
  hintSlowActive: boolean;
  feedback: string | null;
  status: 'playing' | 'completed';
  startedAt: number;
  mistakes: number;
  hintsUsed: number;
}

export interface BalloonActiveObstacle {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  kind: 'cloud' | 'cliff' | 'wind-hazard';
}

export interface BalloonRescuePlayerAView {
  kind: 'balloon-rescue';
  difficulty: DifficultyLevel;
  stageIndex: number;
  totalStages: number;
  stageTitle: string;
  arenaWidth: number;
  arenaHeight: number;
  pos: BalloonPoint;
  landingZone: { x: number; y: number; width: number; height: number };
  obstacles: BalloonActiveObstacle[];
  steerA: SteerInput;
  partnerLiftState: LiftInput;
  windDx: number;
  countdownRemainingTicks: number;
  hintCue: string | null;
  feedback: string | null;
}

export interface BalloonRescuePlayerBView {
  kind: 'balloon-rescue';
  difficulty: DifficultyLevel;
  stageIndex: number;
  totalStages: number;
  stageTitle: string;
  arenaWidth: number;
  arenaHeight: number;
  pos: BalloonPoint;
  landingZone: { x: number; y: number; width: number; height: number };
  obstacles: BalloonActiveObstacle[];
  liftB: LiftInput;
  partnerSteerState: SteerInput;
  windDx: number;
  countdownRemainingTicks: number;
  hintCue: string | null;
  feedback: string | null;
}
