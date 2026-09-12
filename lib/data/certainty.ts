import type { DishIngredient } from './types';

/**
 * Shorthand used by the dish library so a recipe reads as a list.
 *
 *   c - confirmed: in essentially every version of the dish
 *   p - possible: common, but plenty of kitchens leave it out
 *   u - unknown: the menu cannot tell us, only the kitchen can
 */

export const c = (ingredientId: string, note?: string): DishIngredient => ({
  ingredientId,
  certainty: 'confirmed',
  ...(note ? { note } : {}),
});

export const p = (ingredientId: string, note?: string): DishIngredient => ({
  ingredientId,
  certainty: 'possible',
  ...(note ? { note } : {}),
});

export const u = (ingredientId: string, note?: string): DishIngredient => ({
  ingredientId,
  certainty: 'unknown',
  ...(note ? { note } : {}),
});
