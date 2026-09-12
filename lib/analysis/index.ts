import { DISHES_BY_ID } from '@/lib/data/dishes';
import { getIngredient } from '@/lib/data/ingredients';
import type { Dish, DishIngredient } from '@/lib/data/types';
import { matchDish } from './match';
import { describeProfile, resolveTriggers } from './profile';
import { buildDishQuestions, buildGeneralQuestions, unknownDishQuestions } from './questions';
import { BAND_HEADLINE, buildReasons, findTriggerHits, scoreDish } from './score';
import type { DishAnalysis, MenuAnalysis, MenuLine, Profile } from './types';

export * from './match';
export * from './profile';
export * from './questions';
export * from './reader';
export * from './score';
export * from './types';

/** A dish we only know from the menu text can never read as a confident yes. */
const MENU_TEXT_CEILING = 8;

/**
 * Menu wording that points at a part of the dish a printed menu cannot settle.
 *
 * These are the app's own additions, kept separate from what the menu says, and
 * always reported as something only the kitchen can answer.
 */
const GAP_RULES: { id: string; pattern: RegExp }[] = [
  {
    id: 'unknown-house-sauce',
    pattern: /\b(sauce|sauced|glaze|glazed|jus|gravy|dip|aioli|pesto|salsa|coulis|drizzle)\b/i,
  },
  { id: 'unknown-dressing', pattern: /\b(salad|slaw|dressing|vinaigrette|bowl)\b/i },
  {
    id: 'shared-fryer',
    pattern: /\b(fried|fries|chips|tempura|battered|crispy|breaded|crumbed|schnitzel|nuggets)\b/i,
  },
  {
    id: 'unknown-marinade',
    pattern: /\b(marinated|marinade|skewer|kebab|satay|teriyaki|wings)\b/i,
  },
  {
    id: 'unknown-stock',
    pattern: /\b(soup|broth|stock|risotto|stew|casserole|ramen|pho|curry)\b/i,
  },
  { id: 'unknown-thickener', pattern: /\b(creamy|veloute|bisque|chowder|thick)\b/i },
  {
    id: 'unknown-bread-side',
    pattern: /\b(bread|toast|bun|baguette|focaccia|sourdough|crostini)\b/i,
  },
  {
    id: 'unknown-seasoning-blend',
    pattern: /\b(spiced|spicy|seasoned|rub|cajun|jerk|masala|blackened|peri)\b/i,
  },
];

function knownIngredientIds(ids: string[] | undefined): string[] {
  return (ids ?? []).filter((id) => getIngredient(id));
}

/**
 * Fold what the menu printed into a recipe we know.
 *
 * If the menu names something our recipe only listed as "sometimes", the menu
 * settles it: it becomes confirmed.
 */
function withMenuIngredients(dish: Dish, statedIds: string[]): Dish {
  if (statedIds.length === 0) return dish;

  const ingredients: DishIngredient[] = dish.ingredients.map((entry) =>
    statedIds.includes(entry.ingredientId) && entry.certainty !== 'confirmed'
      ? { ...entry, certainty: 'confirmed', note: 'The menu names this.' }
      : entry,
  );

  for (const id of statedIds) {
    if (ingredients.some((entry) => entry.ingredientId === id)) continue;
    ingredients.push({ ingredientId: id, certainty: 'confirmed', note: 'The menu names this.' });
  }

  return { ...dish, ingredients };
}

/** Build a one-off dish from nothing but the menu's own words. */
function menuTextDish(line: MenuLine, statedIds: string[]): Dish {
  const text = `${line.raw} ${line.description ?? ''}`;
  const gapIds = ['unknown-cooking-fat'];

  for (const rule of GAP_RULES) {
    if (rule.pattern.test(text)) gapIds.push(rule.id);
  }

  const ingredients: DishIngredient[] = [
    ...statedIds.map(
      (id): DishIngredient => ({
        ingredientId: id,
        certainty: 'confirmed',
        note: 'The menu names this.',
      }),
    ),
    ...gapIds
      .filter((id) => getIngredient(id))
      .map((id): DishIngredient => ({ ingredientId: id, certainty: 'unknown' })),
  ];

  return {
    id: `menu-${line.id}`,
    name: line.raw,
    aliases: [],
    cuisine: 'unknown',
    summary: line.description ?? 'Read from the menu.',
    ingredients,
    openQuestions: line.description ? undefined : ['Could you tell me what goes into the {dish}?'],
  };
}

/**
 * Run one menu line against a profile.
 *
 * Three levels of knowledge, and the result always says which one it used:
 * a recipe we know, only what the menu printed, or nothing at all. Nothing is
 * ever scored on a guess.
 */
export function analyseLine(line: MenuLine, profile: Profile): DishAnalysis {
  const triggers = resolveTriggers(profile);
  const stated = knownIngredientIds(line.statedIngredientIds);
  const { dish: known, confidence, matchedVia } = matchDish(line.raw);

  const base = {
    lineId: line.id,
    rawText: line.raw,
    menuDescription: line.description,
    unplacedIngredients: line.unplacedIngredients,
    isBestMatch: false,
  };

  if (known) {
    const dish = withMenuIngredients(known, stated);
    const findings = findTriggerHits(dish, triggers);
    const result = scoreDish(dish, findings, confidence);

    return {
      ...base,
      dishId: dish.id,
      dishName: dish.name,
      summary: dish.summary,
      source: 'library',
      ingredients: dish.ingredients,
      confidence,
      matchedVia,
      score: result.score,
      band: result.band,
      headline: BAND_HEADLINE[result.band],
      reasons: buildReasons(dish, findings, result, confidence),
      findings,
      questions: buildDishQuestions(dish, findings),
    };
  }

  if (stated.length > 0) {
    const dish = menuTextDish(line, stated);
    const findings = findTriggerHits(dish, triggers);
    const result = scoreDish(dish, findings, 1, MENU_TEXT_CEILING);

    return {
      ...base,
      dishId: null,
      dishName: line.raw,
      summary: dish.summary,
      source: 'menu',
      ingredients: dish.ingredients,
      confidence: 0,
      matchedVia: 'none',
      score: result.score,
      band: result.band,
      headline: BAND_HEADLINE[result.band],
      reasons: buildReasons(dish, findings, result, 1, 'menu'),
      findings,
      questions: buildDishQuestions(dish, findings),
    };
  }

  return {
    ...base,
    dishId: null,
    dishName: line.raw,
    summary: 'We only have the name from the menu for this one.',
    source: 'none',
    ingredients: [],
    confidence,
    matchedVia: 'none',
    score: null,
    band: 'unknown',
    headline: BAND_HEADLINE.unknown,
    reasons: [
      'The menu gives only a name here, and we do not have a recipe for it, so there is nothing to score.',
      'Ask the kitchen what goes into it before you decide.',
    ],
    findings: [],
    questions: unknownDishQuestions(line.raw),
  };
}

/** Run a whole menu against a profile and pick out the best matches. */
export function analyseMenu(lines: MenuLine[], profile: Profile): MenuAnalysis {
  const triggers = resolveTriggers(profile);
  const dishes = lines.map((line) => analyseLine(line, profile));

  const scored = dishes.filter((item) => item.score !== null && item.score >= 7);
  const topScore = scored.reduce((max, item) => Math.max(max, item.score ?? 0), 0);
  const bestMatchLineIds = scored
    .filter((item) => item.score === topScore)
    .slice(0, 3)
    .map((item) => item.lineId);

  for (const dish of dishes) {
    dish.isBestMatch = bestMatchLineIds.includes(dish.lineId);
  }

  dishes.sort((a, b) => (b.score ?? -1) - (a.score ?? -1));

  return {
    dishes,
    bestMatchLineIds,
    generalQuestions: buildGeneralQuestions(profile, triggers),
    profileSummary: describeProfile(profile),
  };
}

/** All questions from a set of results, grouped for the questions screen. */
export function collectQuestions(
  analysis: MenuAnalysis,
): { dishName: string; questions: string[] }[] {
  return analysis.dishes
    .filter((dish) => dish.questions.length > 0 && dish.band !== 'avoid')
    .map((dish) => ({ dishName: dish.dishName, questions: dish.questions }));
}

export function getDish(dishId: string | null) {
  return dishId ? DISHES_BY_ID[dishId] : undefined;
}
