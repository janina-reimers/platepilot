import type { Certainty, DietTag } from '@/lib/data/types';

/** How closely a user wants a trigger avoided. */
export type Strictness = 'strict' | 'small-amounts';

export type ProfileIntolerance = {
  id: string;
  strictness: Strictness;
};

export type CustomAvoid = {
  id: string;
  /** Exactly what the user typed. */
  text: string;
  /** Ingredients from the catalogue whose name matches the text. */
  matchedIngredientIds: string[];
};

export type Profile = {
  intolerances: ProfileIntolerance[];
  conditionIds: string[];
  customAvoids: CustomAvoid[];
  /** Set once the user has been through onboarding. */
  onboarded: boolean;
};

export const EMPTY_PROFILE: Profile = {
  intolerances: [],
  conditionIds: [],
  customAvoids: [],
  onboarded: false,
};

/**
 * A single thing PlatePilot checks a dish against.
 *
 * `avoid` comes from something the user told us they cannot have.
 * `watch` comes from a condition, where the app flags it but never decides
 * for the user how strict they need to be.
 */
export type Trigger = {
  id: string;
  label: string;
  kind: 'avoid' | 'watch';
  strictness: Strictness;
  tags: DietTag[];
  /** Direct ingredient matches, used for free-text avoids. */
  ingredientIds: string[];
  source: 'intolerance' | 'condition' | 'custom';
};

export type MenuLine = {
  id: string;
  /** The dish name as it appears on the menu. */
  raw: string;
};

export type MatchedVia = 'exact' | 'alias' | 'keyword' | 'none';

export type Finding = {
  triggerId: string;
  triggerLabel: string;
  kind: 'avoid' | 'watch';
  strictness: Strictness;
  tagLabel: string;
  ingredientId: string;
  ingredientName: string;
  certainty: Certainty;
  isUnknownElement: boolean;
};

export type ScoreBand = 'avoid' | 'ask' | 'good' | 'strong' | 'unknown';

export type DishAnalysis = {
  lineId: string;
  rawText: string;
  dishId: string | null;
  dishName: string;
  summary: string;
  confidence: number;
  matchedVia: MatchedVia;
  /** 1-10, or null when there is not enough information to score at all. */
  score: number | null;
  band: ScoreBand;
  headline: string;
  reasons: string[];
  findings: Finding[];
  questions: string[];
  isBestMatch: boolean;
};

export type MenuAnalysis = {
  dishes: DishAnalysis[];
  /** Line ids of the dishes to highlight at the top of the results. */
  bestMatchLineIds: string[];
  /** Questions worth asking about the whole order, not one dish. */
  generalQuestions: string[];
  /** Plain sentence describing what the analysis was run against. */
  profileSummary: string;
};
