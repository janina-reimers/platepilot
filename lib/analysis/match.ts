import { DISHES } from '@/lib/data/dishes';
import type { Dish } from '@/lib/data/types';
import { normalise } from './profile';
import type { MatchedVia } from './types';

const STOPWORDS = new Set([
  'the',
  'a',
  'an',
  'of',
  'with',
  'and',
  'in',
  'on',
  'our',
  'house',
  'served',
  'fresh',
  'homemade',
  'style',
  'classic',
  'traditional',
  'small',
  'large',
  'side',
  'plate',
  'bowl',
  'v',
  'vg',
  'gf',
]);

function tokens(text: string): string[] {
  return normalise(text)
    .split(' ')
    .filter((token) => token.length > 1 && !STOPWORDS.has(token));
}

type SearchTerm = { dish: Dish; term: string; isAlias: boolean; tokens: string[] };

const SEARCH_TERMS: SearchTerm[] = DISHES.flatMap((dish) => [
  { dish, term: normalise(dish.name), isAlias: false, tokens: tokens(dish.name) },
  ...dish.aliases.map((alias) => ({
    dish,
    term: normalise(alias),
    isAlias: true,
    tokens: tokens(alias),
  })),
]);

export type DishMatch = {
  dish: Dish | null;
  confidence: number;
  matchedVia: MatchedVia;
};

/**
 * How many different dishes a word appears in.
 *
 * A word that belongs to exactly one dish, like "carbonara" or "margherita",
 * identifies that dish on its own. A word shared by many, like "soup" or
 * "grilled", identifies nothing.
 */
const TOKEN_OWNERS = new Map<string, Set<string>>();
for (const entry of SEARCH_TERMS) {
  for (const token of entry.tokens) {
    const owners = TOKEN_OWNERS.get(token) ?? new Set<string>();
    owners.add(entry.dish.id);
    TOKEN_OWNERS.set(token, owners);
  }
}

/** Confidence given to a dish named by one word that belongs to it alone. */
const DISTINCTIVE_CONFIDENCE = 0.74;

function isDistinctive(token: string): boolean {
  return token.length >= 4 && TOKEN_OWNERS.get(token)?.size === 1;
}

/**
 * Match one menu line to a dish in the library.
 *
 * Deliberately cautious: a weak match returns nothing so the app says "we do
 * not know this dish" instead of scoring the wrong recipe.
 */
export function matchDish(rawText: string): DishMatch {
  const line = normalise(rawText);
  if (line.length < 3) return { dish: null, confidence: 0, matchedVia: 'none' };

  const lineTokens = tokens(rawText);
  if (lineTokens.length === 0) return { dish: null, confidence: 0, matchedVia: 'none' };

  let best: DishMatch = { dish: null, confidence: 0, matchedVia: 'none' };

  for (const entry of SEARCH_TERMS) {
    if (entry.tokens.length === 0) continue;

    let confidence = 0;
    let via: MatchedVia = 'keyword';

    if (line === entry.term) {
      confidence = 1;
      via = entry.isAlias ? 'alias' : 'exact';
    } else if (entry.term.length >= 5 && line.includes(entry.term)) {
      confidence = 0.88;
      via = entry.isAlias ? 'alias' : 'exact';
    } else {
      const matched = entry.tokens.filter((token) => lineTokens.includes(token));
      if (matched.length === 0) continue;

      const termCover = matched.length / entry.tokens.length;
      const lineCover = matched.length / lineTokens.length;
      confidence = termCover * 0.7 + lineCover * 0.3;

      if (matched.some(isDistinctive)) {
        // The shared word names this dish and nothing else, so partial overlap
        // is still a real match: "Carbonara" is the spaghetti carbonara recipe.
        confidence = Math.max(confidence, DISTINCTIVE_CONFIDENCE);
      } else if (matched.length === 1 && entry.tokens.length > 1) {
        // A single shared common word is not a match.
        confidence *= 0.6;
      }
    }

    if (confidence > best.confidence) {
      best = { dish: entry.dish, confidence: Math.min(confidence, 1), matchedVia: via };
    }
  }

  if (best.confidence < 0.5) return { dish: null, confidence: best.confidence, matchedVia: 'none' };
  return best;
}

/**
 * Match against several wordings of the same dish and keep the best.
 *
 * Used so a menu in another language can be matched on the plain-English name
 * the reader gave us as well as on the words actually printed on the page.
 */
export function matchDishAny(candidates: (string | undefined)[]): DishMatch {
  let best: DishMatch = { dish: null, confidence: 0, matchedVia: 'none' };

  for (const candidate of candidates) {
    if (!candidate) continue;
    const result = matchDish(candidate);
    if (result.confidence > best.confidence) best = result;
  }

  return best;
}
