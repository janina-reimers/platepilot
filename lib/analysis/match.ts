import { DISHES } from '@/lib/data/dishes';
import type { Dish } from '@/lib/data/types';
import { normalise } from './profile';
import type { MatchedVia, MenuLine } from './types';

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
      const matched = entry.tokens.filter((token) => lineTokens.includes(token)).length;
      if (matched === 0) continue;
      const termCover = matched / entry.tokens.length;
      const lineCover = matched / lineTokens.length;
      confidence = termCover * 0.7 + lineCover * 0.3;
      // A single shared common word is not a match.
      if (matched === 1 && entry.tokens.length > 1) confidence *= 0.6;
    }

    if (confidence > best.confidence) {
      best = { dish: entry.dish, confidence: Math.min(confidence, 1), matchedVia: via };
    }
  }

  if (best.confidence < 0.5) return { dish: null, confidence: best.confidence, matchedVia: 'none' };
  return best;
}

/** Split pasted or typed menu text into one line per dish. */
export function parseMenuText(text: string): MenuLine[] {
  const seen = new Set<string>();
  return text
    .split(/[\n\r;•·|]+/)
    .map((part) => part.replace(/^[\s\-–—*\d.)]+/, '').trim())
    .map((part) => part.replace(/\s*[.…]*\s*(?:[€£$]\s?\d+[.,]?\d*|\d+[.,]\d{2})\s*$/, '').trim())
    .filter((part) => part.length >= 3 && /[a-zA-Z]/.test(part))
    .filter((part) => {
      const key = normalise(part);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map((raw, index) => ({
      id: `line-${index}-${normalise(raw).replace(/\s/g, '-').slice(0, 40)}`,
      raw,
    }));
}

/** Dishes whose name starts with the query, for the manual entry autocomplete. */
export function suggestDishes(query: string, limit = 8): Dish[] {
  const q = normalise(query);
  if (q.length < 2) return [];
  const scored: { dish: Dish; rank: number }[] = [];
  const seen = new Set<string>();

  for (const entry of SEARCH_TERMS) {
    if (seen.has(entry.dish.id)) continue;
    if (entry.term.startsWith(q)) {
      scored.push({ dish: entry.dish, rank: 0 });
      seen.add(entry.dish.id);
    } else if (entry.term.includes(q)) {
      scored.push({ dish: entry.dish, rank: 1 });
      seen.add(entry.dish.id);
    }
  }

  return scored
    .sort((a, b) => a.rank - b.rank || a.dish.name.localeCompare(b.dish.name))
    .slice(0, limit)
    .map((item) => item.dish);
}
