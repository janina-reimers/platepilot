/**
 * Core vocabulary for PlatePilot's food knowledge base.
 *
 * Everything the app reasons about is expressed as a `DietTag`. A user's
 * profile turns into a set of tags to avoid or watch; every ingredient
 * declares the tags it definitely carries and the tags it sometimes carries.
 * The analysis engine only ever compares tags, which keeps the matching
 * honest and easy to explain in plain language.
 */

export type DietTag =
  // Dairy
  | 'lactose'
  | 'milk-protein'
  | 'aged-cheese'
  // Grains
  | 'gluten'
  | 'wheat'
  | 'corn'
  | 'oats'
  // Common trigger foods
  | 'egg'
  | 'soy'
  | 'peanut'
  | 'tree-nut'
  | 'sesame'
  | 'fish'
  | 'shellfish'
  | 'mustard'
  | 'celery'
  | 'sulphite'
  | 'yeast'
  | 'coconut'
  | 'gelatin'
  | 'pork'
  | 'beef'
  | 'meat'
  // Carbohydrate groups
  | 'lactose-fodmap'
  | 'fructose'
  | 'polyol'
  | 'onion-garlic'
  | 'legume'
  | 'high-fibre'
  // Reactive compounds
  | 'histamine'
  | 'salicylate'
  | 'flavour-enhancer'
  | 'artificial-sweetener'
  | 'caffeine'
  | 'alcohol'
  | 'nightshade'
  | 'citrus'
  | 'chocolate'
  | 'vinegar'
  | 'acidic'
  | 'spicy'
  // Nutritional load
  | 'high-fat'
  | 'deep-fried'
  | 'high-salt'
  | 'high-sugar'
  | 'refined-carb'
  | 'high-purine'
  | 'high-oxalate'
  | 'high-potassium'
  | 'high-phosphorus'
  | 'raw-animal'
  | 'carbonated';

export type IngredientGroup =
  | 'dairy'
  | 'grain'
  | 'vegetable'
  | 'fruit'
  | 'protein'
  | 'seafood'
  | 'legume-nut'
  | 'fat-oil'
  | 'sauce'
  | 'seasoning'
  | 'sweet'
  | 'drink'
  | 'kitchen-practice';

export type Ingredient = {
  id: string;
  /** Plain, everyday name. Shown directly in the UI. */
  name: string;
  group: IngredientGroup;
  /** Tags this ingredient always carries. */
  tags: DietTag[];
  /**
   * Tags this ingredient carries in some recipes or brands only. These are
   * always reported as "worth asking about", never as confirmed.
   */
  mayContain?: DietTag[];
  /** One short sentence explaining the ingredient in everyday words. */
  note?: string;
  /**
   * Question to put to restaurant staff, with `{dish}` replaced by the dish
   * name. Used when this ingredient is possible or unknown in a dish.
   */
  question?: string;
  /**
   * True for things that are not a food as such but a gap in the menu
   * description: the cooking fat, the stock, the house dressing, the fryer.
   */
  isUnknownElement?: boolean;
};

/**
 * How sure the knowledge base is that an ingredient is in a dish.
 *
 * - `confirmed`: part of essentially every version of this dish.
 * - `possible`: common in many versions, but plenty of kitchens leave it out.
 * - `unknown`: the menu cannot tell us; only the kitchen knows.
 */
export type Certainty = 'confirmed' | 'possible' | 'unknown';

export type DishIngredient = {
  ingredientId: string;
  certainty: Certainty;
  /** Optional dish-specific wording, e.g. "usually finished with butter". */
  note?: string;
};

export type Dish = {
  id: string;
  /** Canonical menu name. */
  name: string;
  /** Other spellings and menu wordings that should match this dish. */
  aliases: string[];
  cuisine: string;
  /** Plain-language description of how the dish is usually made. */
  summary: string;
  ingredients: DishIngredient[];
  /** Extra questions worth asking for this dish, regardless of profile. */
  openQuestions?: string[];
};

/** A thing the user avoids, coming from a diagnosed intolerance. */
export type IntoleranceOption = {
  id: string;
  label: string;
  /** Everyday explanation, no jargon. */
  description: string;
  tags: DietTag[];
  category: 'common' | 'carbohydrate' | 'other';
};
