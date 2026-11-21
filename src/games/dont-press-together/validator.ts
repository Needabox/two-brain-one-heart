import type { DontPressStageDef, LogicButtonDef, LogicValues } from './types';

export function buildInitialLogicValues(stage: DontPressStageDef): LogicValues {
  const values: LogicValues = {};
  for (const v of stage.variables) {
    values[v.key] = v.initial;
  }
  return values;
}

export function validateButtonPress(
  stage: DontPressStageDef,
  values: LogicValues,
  button: LogicButtonDef,
  lastActor: 'host' | 'guest' | null,
): { ok: true; nextValues: LogicValues } | { ok: false; reason: string } {
  if (button.forbidImmediatePartnerFollow && lastActor && lastActor !== button.owner) {
    return {
      ok: false,
      reason: `Collision! "${button.label}" cannot be pressed immediately after partner acted!`,
    };
  }

  if (button.requires) {
    const cur = values[button.requires.key] ?? 0;
    if (button.requires.min !== undefined && cur < button.requires.min) {
      return {
        ok: false,
        reason: `Hazard blocked "${button.label}": ${button.requires.ruleText}`,
      };
    }
    if (button.requires.max !== undefined && cur > button.requires.max) {
      return {
        ok: false,
        reason: `Hazard blocked "${button.label}": ${button.requires.ruleText}`,
      };
    }
  }

  const nextValues: LogicValues = { ...values };
  for (const varMeta of stage.variables) {
    const cur = values[varMeta.key] ?? varMeta.initial;
    const delta = button.deltas[varMeta.key] ?? 0;
    const updated = cur + delta;
    if (updated < varMeta.min || updated > varMeta.max) {
      return {
        ok: false,
        reason: `Safety limit! ${varMeta.label} would go out of bounds (${varMeta.min}–${varMeta.max}).`,
      };
    }
    nextValues[varMeta.key] = updated;
  }

  return { ok: true, nextValues };
}

export function isLogicStageSolved(stage: DontPressStageDef, values: LogicValues): boolean {
  return stage.variables.every((v) => (values[v.key] ?? v.initial) === v.target);
}
