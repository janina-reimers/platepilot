import { getIngredient } from '@/lib/data/ingredients';
import type { Certainty, Dish, DishIngredient, Ingredient } from '@/lib/data/types';
import { joinList, tagLabel } from './profile';
import type { Finding, ScoreBand, Trigger } from './types';

/**
 * How sure we are that a given trigger applies to a given dish ingredient.
 *
 * An ingredient that only *sometimes* carries something is never reported as
 * fact, and anything the menu simply cannot answer stays "unknown".
 */
function certaintyFor(
  ingredient: Ingredient,
  entry: DishIngredient,
  trigger: Trigger,
): Certainty | null {
  if (trigger.ingredientIds.includes(ingredient.id)) return entry.certainty;

  const carries = trigger.tags.some((tag) => ingredient.tags.includes(tag));
  if (carries) return entry.certainty;

  const mayCarry = trigger.tags.some((tag) => ingredient.mayContain?.includes(tag));
  if (mayCarry) return entry.certainty === 'confirmed' ? 'possible' : 'unknown';

  return null;
}

function matchedTagLabel(ingredient: Ingredient, trigger: Trigger): string {
  if (trigger.ingredientIds.includes(ingredient.id)) return trigger.label.toLowerCase();
  const direct = trigger.tags.find((tag) => ingredient.tags.includes(tag));
  if (direct) return tagLabel(direct);
  const possible = trigger.tags.find((tag) => ingredient.mayContain?.includes(tag));
  return possible ? tagLabel(possible) : trigger.label.toLowerCase();
}

export function findTriggerHits(dish: Dish, triggers: Trigger[]): Finding[] {
  const findings: Finding[] = [];

  for (const entry of dish.ingredients) {
    const ingredient = getIngredient(entry.ingredientId);
    if (!ingredient) continue;

    for (const trigger of triggers) {
      const certainty = certaintyFor(ingredient, entry, trigger);
      if (!certainty) continue;

      findings.push({
        triggerId: trigger.id,
        triggerLabel: trigger.label,
        strictness: trigger.strictness,
        tagLabel: matchedTagLabel(ingredient, trigger),
        ingredientId: ingredient.id,
        ingredientName: ingredient.name,
        certainty,
        isUnknownElement: Boolean(ingredient.isUnknownElement),
      });
    }
  }

  const rank: Record<Certainty, number> = { confirmed: 0, possible: 1, unknown: 2 };
  return findings.sort(
    (a, b) =>
      rank[a.certainty] - rank[b.certainty] || a.ingredientName.localeCompare(b.ingredientName),
  );
}

const AVOID_PENALTY: Record<Certainty, { strict: number; lenient: number }> = {
  confirmed: { strict: 99, lenient: 4 },
  possible: { strict: 5, lenient: 3 },
  unknown: { strict: 4, lenient: 2 },
};

export type ScoreResult = {
  score: number;
  band: ScoreBand;
  needsAsking: boolean;
  blocked: boolean;
};

/**
 * Turn findings into a 1-10 score.
 *
 * Rules that keep the number honest:
 *  - one confirmed hit on something the user strictly avoids drops it to 1
 *  - anything that has to be checked with staff is capped at 6
 *  - a dish with any unclear part can never reach 10
 *  - `ceiling` caps a dish we only half know, whatever the findings say
 *  - only the worst finding per trigger counts, so one problem is not
 *    punished five times over
 */
export function scoreDish(
  dish: Dish,
  findings: Finding[],
  confidence: number,
  ceiling = 10,
): ScoreResult {
  const worstPerTrigger = new Map<string, Finding>();
  const order: Record<Certainty, number> = { confirmed: 0, possible: 1, unknown: 2 };

  for (const finding of findings) {
    const current = worstPerTrigger.get(finding.triggerId);
    if (!current || order[finding.certainty] < order[current.certainty]) {
      worstPerTrigger.set(finding.triggerId, finding);
    }
  }

  let deductions = 0;
  let blocked = false;
  let needsAsking = false;

  for (const finding of worstPerTrigger.values()) {
    const penalty = AVOID_PENALTY[finding.certainty];
    const value = finding.strictness === 'strict' ? penalty.strict : penalty.lenient;
    if (value >= 99) {
      blocked = true;
      continue;
    }
    deductions += value;
    if (finding.certainty !== 'confirmed') needsAsking = true;
  }

  if (blocked) return { score: 1, band: 'avoid', needsAsking: false, blocked: true };

  let score = 10 - deductions;

  const hasUnclearPart = dish.ingredients.some((entry) => {
    const ingredient = getIngredient(entry.ingredientId);
    return entry.certainty !== 'confirmed' || ingredient?.isUnknownElement;
  });
  if (hasUnclearPart) score = Math.min(score, 9);
  if (needsAsking) score = Math.min(score, 6);
  if (confidence < 0.6) score = Math.min(score, 6);
  score = Math.min(score, ceiling);

  score = Math.max(2, Math.min(10, Math.round(score)));

  return { score, band: bandFor(score), needsAsking, blocked: false };
}

export function bandFor(score: number | null): ScoreBand {
  if (score === null) return 'unknown';
  if (score <= 3) return 'avoid';
  if (score <= 6) return 'ask';
  if (score <= 8) return 'good';
  return 'strong';
}

export const BAND_HEADLINE: Record<ScoreBand, string> = {
  avoid: 'Not recommended for you',
  ask: 'Ask before you order',
  good: 'Looks like a reasonable choice',
  strong: 'Looks like a good match',
  unknown: 'Not enough information',
};

export const BAND_SHORT: Record<ScoreBand, string> = {
  avoid: 'Avoid',
  ask: 'Ask first',
  good: 'Reasonable',
  strong: 'Good match',
  unknown: 'Unclear',
};

/** Plain sentences explaining the score, in the order a person would read them. */
export function buildReasons(
  dish: Dish,
  findings: Finding[],
  result: ScoreResult,
  confidence: number,
  source: 'library' | 'menu' = 'library',
): string[] {
  const reasons: string[] = [];

  if (source === 'menu') {
    reasons.push(
      'We do not have a recipe for this dish, so this is based only on what the menu prints about it.',
    );
  } else if (confidence < 0.6) {
    reasons.push(`We matched this to our recipe for ${dish.name}. Check that it is the same dish.`);
  }

  const confirmedAvoid = groupNames(findings.filter((f) => f.certainty === 'confirmed'));
  const possibleAvoid = groupNames(findings.filter((f) => f.certainty === 'possible'));
  const unknownAvoid = groupNames(findings.filter((f) => f.certainty === 'unknown'));

  if (confirmedAvoid.length > 0) {
    reasons.push(
      `This dish normally contains ${joinList(confirmedAvoid)}, which is on your avoid list.`,
    );
  }
  if (possibleAvoid.length > 0) {
    reasons.push(`It often contains ${joinList(possibleAvoid)}, but not every kitchen adds it.`);
  }
  if (unknownAvoid.length > 0) {
    reasons.push(`We cannot tell from a menu whether ${joinList(unknownAvoid)} is involved.`);
  }

  if (result.blocked) {
    reasons.push('Because you avoid this strictly, we are not recommending it.');
  } else if (result.needsAsking) {
    reasons.push('Ask the kitchen the questions below before you decide.');
  } else if (findings.length === 0) {
    reasons.push(
      source === 'menu'
        ? 'Nothing the menu names is on your list, but a menu never lists everything.'
        : 'Nothing in the usual recipe matches your profile.',
    );
  }

  return reasons;
}

function groupNames(findings: Finding[]): string[] {
  const seen = new Set<string>();
  const labels: string[] = [];
  for (const finding of findings) {
    const label = finding.isUnknownElement
      ? finding.ingredientName.toLowerCase()
      : finding.tagLabel;
    if (seen.has(label)) continue;
    seen.add(label);
    labels.push(label);
  }
  return labels.slice(0, 4);
}
