import { INGREDIENT_LIST } from '@/lib/data/ingredients';
import { INTOLERANCES_BY_ID, TAG_LABELS } from '@/lib/data/triggers';
import type { DietTag } from '@/lib/data/types';
import type { CustomAvoid, Profile, Trigger } from './types';

/** Lowercase, strip accents and punctuation so text comparisons behave. */
export function normalise(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Find catalogue ingredients whose name lines up with free text the user typed.
 * Matching is generous in both directions, so "cheese" picks up cream cheese
 * and "fresh coriander" picks up nothing rather than something wrong.
 */
export function matchCustomAvoidText(text: string): string[] {
  const query = normalise(text);
  if (query.length < 3) return [];

  return INGREDIENT_LIST.filter((ingredient) => {
    if (ingredient.isUnknownElement) return false;
    const name = normalise(ingredient.name);
    const bare = name.replace(/\s*\(.*?\)\s*/g, ' ').trim();
    return name.includes(query) || query.includes(bare) || bare.includes(query);
  }).map((ingredient) => ingredient.id);
}

export function createCustomAvoid(text: string): CustomAvoid {
  const trimmed = text.trim();
  return {
    id: `custom-${normalise(trimmed).replace(/\s/g, '-')}-${trimmed.length}`,
    text: trimmed,
    matchedIngredientIds: matchCustomAvoidText(trimmed),
  };
}

/**
 * Turn a saved profile into the list of checks the scoring engine runs.
 *
 * Everything becomes an `avoid`: the intolerances the user picked, and the
 * foods they typed in themselves.
 */
export function resolveTriggers(profile: Profile): Trigger[] {
  const triggers: Trigger[] = [];

  for (const entry of profile.intolerances) {
    const option = INTOLERANCES_BY_ID[entry.id];
    if (!option) continue;
    triggers.push({
      id: `intolerance:${option.id}`,
      label: option.label,
      strictness: entry.strictness,
      tags: option.tags,
      ingredientIds: [],
      source: 'intolerance',
    });
  }

  for (const avoid of profile.customAvoids) {
    if (avoid.matchedIngredientIds.length === 0) continue;
    triggers.push({
      id: `custom:${avoid.id}`,
      label: avoid.text,
      strictness: 'strict',
      tags: [],
      ingredientIds: avoid.matchedIngredientIds,
      source: 'custom',
    });
  }

  return dedupeTriggers(triggers);
}

function dedupeTriggers(triggers: Trigger[]): Trigger[] {
  const seen = new Map<string, Trigger>();
  for (const trigger of triggers) {
    const existing = seen.get(trigger.id);
    if (!existing) {
      seen.set(trigger.id, trigger);
      continue;
    }
    // Keep the stricter of two entries for the same trigger.
    if (existing.strictness === 'small-amounts' && trigger.strictness === 'strict') {
      seen.set(trigger.id, trigger);
    }
  }
  return [...seen.values()];
}

export function tagLabel(tag: DietTag): string {
  return TAG_LABELS[tag] ?? tag;
}

/** One plain sentence describing what a profile is checking for. */
export function describeProfile(profile: Profile): string {
  const parts: string[] = [];
  const intoleranceNames = profile.intolerances
    .map((entry) => INTOLERANCES_BY_ID[entry.id]?.label)
    .filter((label): label is string => Boolean(label));

  if (intoleranceNames.length > 0) parts.push(joinList(intoleranceNames));
  if (profile.customAvoids.length > 0)
    parts.push(joinList(profile.customAvoids.map((a) => a.text)));

  if (parts.length === 0) return 'Your profile is empty, so nothing is being checked yet.';
  return `Checked against ${parts.join(', plus ')}.`;
}

export function joinList(items: string[]): string {
  if (items.length === 0) return '';
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}
