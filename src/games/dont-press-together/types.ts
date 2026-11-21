import type { DifficultyLevel } from '../../game-engine/types';

export type LogicVarKey = 'alpha' | 'beta' | 'gamma' | 'delta';

export interface LogicVarMeta {
  key: LogicVarKey;
  label: string;
  min: number;
  max: number;
  initial: number;
  target: number;
}

export interface LogicDelta {
  alpha?: number;
  beta?: number;
  gamma?: number;
  delta?: number;
}

export interface LogicButtonDef {
  id: string;
  owner: 'host' | 'guest';
  label: string;
  color: 'pink' | 'mint' | 'amber' | 'sky';
  effectSummary: string;
  deltas: LogicDelta;
  /** Optional safety constraint that triggers a hazard overload mistake if violated */
  requires?: {
    key: LogicVarKey;
    min?: number;
    max?: number;
    ruleText: string;
  };
  /** If true, cannot be pressed immediately after partner pressed without an alternate action or while hazard flag matches */
  forbidImmediatePartnerFollow?: boolean;
}

export interface DontPressStageDef {
  title: string;
  variables: LogicVarMeta[];
  buttons: LogicButtonDef[];
  hazardRuleHint: string;
  /** Deterministic reference sequence length for par / hint guidance */
  hintSuggestion: string;
}

export interface DontPressTogetherConfig {
  difficulty: DifficultyLevel;
  stages: DontPressStageDef[];
}

export type LogicValues = Partial<Record<LogicVarKey, number>>;

export interface DontPressEngineState {
  kind: 'dont-press-together';
  difficulty: DifficultyLevel;
  stageIndex: number;
  totalStages: number;
  values: LogicValues;
  lastActor: 'host' | 'guest' | null;
  lastButtonId: string | null;
  pressHistory: string[];
  hintRevealed: string | null;
  feedback: string | null;
  status: 'playing' | 'completed';
  startedAt: number;
  mistakes: number;
  hintsUsed: number;
}

export interface DontPressPlayerAView {
  kind: 'dont-press-together';
  difficulty: DifficultyLevel;
  stageIndex: number;
  totalStages: number;
  stageTitle: string;
  variables: Array<{
    key: LogicVarKey;
    label: string;
    min: number;
    max: number;
    current: number;
    target: number;
  }>;
  myButtons: Array<{
    id: string;
    label: string;
    color: 'pink' | 'mint' | 'amber' | 'sky';
    effectSummary: string;
  }>;
  lastActor: 'host' | 'guest' | null;
  hintRevealed: string | null;
  feedback: string | null;
}

export interface DontPressPlayerBView {
  kind: 'dont-press-together';
  difficulty: DifficultyLevel;
  stageIndex: number;
  totalStages: number;
  stageTitle: string;
  variables: Array<{
    key: LogicVarKey;
    label: string;
    min: number;
    max: number;
    current: number;
  }>;
  myButtons: Array<{
    id: string;
    label: string;
    color: 'pink' | 'mint' | 'amber' | 'sky';
    effectSummary: string;
    ruleText: string | null;
  }>;
  hazardRuleHint: string;
  lastActor: 'host' | 'guest' | null;
  hintRevealed: string | null;
  feedback: string | null;
}
