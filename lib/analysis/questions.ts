import { getIngredient } from '@/lib/data/ingredients';
import type { Dish } from '@/lib/data/types';
import { joinList } from './profile';
import type { Finding, Profile, Trigger } from './types';

function fillTemplate(template: string, dishName: string): string {
  return template.replace(/\{dish\}/g, dishName.toLowerCase());
}

/**
 * Questions for one dish, built only from the parts we genuinely cannot
 * settle from a menu. A confirmed ingredient needs no question.
 */
export function buildDishQuestions(dish: Dish, findings: Finding[]): string[] {
  const questions: string[] = [];
  const seenIngredients = new Set<string>();

  for (const finding of findings) {
    if (finding.certainty === 'confirmed' && !finding.isUnknownElement) continue;
    if (seenIngredients.has(finding.ingredientId)) continue;
    seenIngredients.add(finding.ingredientId);

    const ingredient = getIngredient(finding.ingredientId);
    const template =
      ingredient?.question ??
      `Does the {dish} contain any ${finding.ingredientName.toLowerCase()}?`;
    questions.push(fillTemplate(template, dish.name));
  }

  for (const question of dish.openQuestions ?? []) {
    questions.push(fillTemplate(question, dish.name));
  }

  return dedupe(questions).slice(0, 7);
}

/** Question to use when we have no recipe for a menu line at all. */
export function unknownDishQuestions(rawText: string): string[] {
  const name = rawText.trim().toLowerCase();
  return [
    `Could you tell me what goes into the ${name}?`,
    `Is the ${name} cooked in butter, oil or something else?`,
    `Does the ${name} come with a sauce or dressing, and what is in it?`,
  ];
}

/**
 * Questions about the order as a whole: cross-contact, free-text avoids the
 * catalogue could not place, and a closing line that keeps the decision with
 * the restaurant rather than the app.
 */
export function buildGeneralQuestions(profile: Profile, triggers: Trigger[]): string[] {
  const questions: string[] = [];

  const avoidLabels = triggers.filter((t) => t.kind === 'avoid').map((t) => t.label.toLowerCase());
  if (avoidLabels.length > 0) {
    questions.push(
      `I need to avoid ${joinList(avoidLabels.slice(0, 5))}. Could you check the kitchen can handle that?`,
    );
  }

  const strictTriggers = triggers.filter((t) => t.kind === 'avoid' && t.strictness === 'strict');
  if (strictTriggers.length > 0) {
    questions.push('Is food for this prepared on a separate surface, with clean utensils?');
    questions.push('Is the fryer shared with breaded or battered items?');
  }

  const unplaced = profile.customAvoids.filter((avoid) => avoid.matchedIngredientIds.length === 0);
  for (const avoid of unplaced) {
    questions.push(
      `I also avoid ${avoid.text.toLowerCase()}. Could you check whether any is used in what I order?`,
    );
  }

  questions.push(
    'If anything is unclear, could you check the recipe with the kitchen before I order?',
  );

  return dedupe(questions);
}

function dedupe(items: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of items) {
    const key = item.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}
