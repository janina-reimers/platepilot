import { DISHES_BY_ID } from '@/lib/data/dishes';
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

/**
 * Run one menu line against a profile.
 *
 * When the library has no recipe for the line, the result is deliberately
 * unscored rather than optimistic.
 */
export function analyseLine(line: MenuLine, profile: Profile): DishAnalysis {
  const triggers = resolveTriggers(profile);
  const { dish, confidence, matchedVia } = matchDish(line.raw);

  if (!dish) {
    return {
      lineId: line.id,
      rawText: line.raw,
      dishId: null,
      dishName: line.raw,
      summary: 'PlatePilot does not have a recipe for this dish yet.',
      confidence,
      matchedVia: 'none',
      score: null,
      band: 'unknown',
      headline: BAND_HEADLINE.unknown,
      reasons: [
        'We could not match this to a recipe we know, so there is nothing to score.',
        'Ask the kitchen what goes into it before you decide.',
      ],
      findings: [],
      questions: unknownDishQuestions(line.raw),
      isBestMatch: false,
    };
  }

  const findings = findTriggerHits(dish, triggers);
  const result = scoreDish(dish, findings, confidence);

  return {
    lineId: line.id,
    rawText: line.raw,
    dishId: dish.id,
    dishName: dish.name,
    summary: dish.summary,
    confidence,
    matchedVia,
    score: result.score,
    band: result.band,
    headline: BAND_HEADLINE[result.band],
    reasons: buildReasons(dish, findings, result, confidence),
    findings,
    questions: buildDishQuestions(dish, findings),
    isBestMatch: false,
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
