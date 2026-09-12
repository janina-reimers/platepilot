import type { Dish } from '@/lib/data/types';
import { scoreDish } from './score';
import type { DishModification, Finding } from './types';

type Suggestion = Pick<DishModification, 'label' | 'request'>;

const LEAVE_OFF_IDS = new Set([
  'cheese',
  'mozzarella',
  'parmesan',
  'cream',
  'sour-cream',
  'yogurt',
  'bread',
  'croutons',
  'mayonnaise',
  'aioli',
]);

function suggestionFor(finding: Finding): Suggestion | null {
  const { ingredientId, ingredientName, tagLabel } = finding;
  const lowerName = ingredientName.toLowerCase();

  if (ingredientId === 'unknown-dressing') {
    return {
      label: 'Dressing on the side',
      request: 'Ask for the dressing on the side, after staff confirm what is in it.',
    };
  }

  if (ingredientId === 'unknown-house-sauce') {
    return {
      label: 'Sauce on the side',
      request: 'Ask whether the sauce can come on the side, after staff confirm what is in it.',
    };
  }

  if (ingredientId === 'butter' && !tagLabel.includes('fat')) {
    return {
      label: 'Use olive oil instead of butter',
      request: 'Ask whether the kitchen can cook it with olive oil instead of butter.',
    };
  }

  if (ingredientId === 'unknown-cooking-fat' && !tagLabel.includes('fat')) {
    return {
      label: 'Use a different cooking fat',
      request: 'Ask what it is cooked in and whether the kitchen can use olive oil instead.',
    };
  }

  if (LEAVE_OFF_IDS.has(ingredientId)) {
    return {
      label: `Without ${lowerName}`,
      request: `Ask whether the ${ingredientName} can be left off or prepared separately.`,
    };
  }

  return null;
}

/**
 * Suggest only straightforward kitchen requests. These are hypothetical until
 * staff confirm both the recipe and that the change can be made.
 */
export function buildDishModifications(
  dish: Dish,
  findings: Finding[],
  confidence: number,
  currentScore: number,
  ceiling = 10,
): DishModification[] {
  const suggestions: DishModification[] = [];
  const seen = new Set<string>();

  for (const finding of findings) {
    if (seen.has(finding.ingredientId)) continue;
    const suggestion = suggestionFor(finding);
    if (!suggestion) continue;
    seen.add(finding.ingredientId);

    const changedDish: Dish = {
      ...dish,
      ingredients: dish.ingredients.filter((entry) => entry.ingredientId !== finding.ingredientId),
    };
    const remainingFindings = findings.filter(
      (candidate) => candidate.ingredientId !== finding.ingredientId,
    );
    const potential = scoreDish(changedDish, remainingFindings, confidence, ceiling).score;

    suggestions.push({
      ...suggestion,
      reason: `${ingredientNameForReason(finding)} conflicts with ${finding.triggerLabel.toLowerCase()} in your profile.`,
      potentialScore: potential > currentScore ? potential : null,
    });
  }

  return suggestions.slice(0, 3);
}

function ingredientNameForReason(finding: Finding): string {
  if (finding.isUnknownElement) return finding.ingredientName;
  return finding.certainty === 'confirmed'
    ? finding.ingredientName
    : `Possible ${finding.ingredientName.toLowerCase()}`;
}
