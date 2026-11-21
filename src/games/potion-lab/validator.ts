import type { PotionIngredientId } from './types';

export function validatePotionBrew(
  recipe: PotionIngredientId[],
  cauldron: PotionIngredientId[],
): { ok: true } | { ok: false; reason: string } {
  if (cauldron.length !== recipe.length) {
    return {
      ok: false,
      reason: `Needs exactly ${recipe.length} ingredients (cauldron has ${cauldron.length}).`,
    };
  }

  let matchedCount = 0;
  let wrongOrder = false;
  for (let i = 0; i < recipe.length; i++) {
    if (cauldron[i] === recipe[i]) {
      matchedCount += 1;
    } else if (cauldron.includes(recipe[i]!)) {
      wrongOrder = true;
    }
  }

  if (matchedCount === recipe.length) {
    return { ok: true };
  }

  if (wrongOrder && new Set(cauldron).size === recipe.length) {
    return {
      ok: false,
      reason: `Close! ${matchedCount}/${recipe.length} are in the right order — check sequence!`,
    };
  }

  return {
    ok: false,
    reason: `Fizzle! Only ${matchedCount}/${recipe.length} cauldron slots matched the recipe.`,
  };
}
