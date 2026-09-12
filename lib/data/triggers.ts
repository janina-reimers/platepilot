import type { ConditionOption, DietTag, IntoleranceOption } from './types';

/**
 * The things a user can tell PlatePilot about themselves.
 *
 * Intolerances become "on your avoid list". Conditions become "keep an eye on"
 * so the app never pretends to know how strict a person needs to be, and never
 * hands out advice. Wording here is deliberately plain and non-medical.
 */

export const INTOLERANCES: IntoleranceOption[] = [
  // -------------------------------------------------------------- common
  {
    id: 'lactose',
    label: 'Lactose',
    description: 'The sugar in milk. Hard cheeses and butter usually hold very little of it.',
    tags: ['lactose', 'lactose-fodmap'],
    category: 'common',
  },
  {
    id: 'dairy',
    label: 'Milk and dairy',
    description: 'All milk products, including cheese, butter, cream and yoghurt.',
    tags: ['milk-protein', 'lactose', 'aged-cheese', 'lactose-fodmap'],
    category: 'common',
  },
  {
    id: 'gluten',
    label: 'Gluten',
    description:
      'Found in wheat, barley, rye and spelt. Also hides in soy sauce, batter and gravy.',
    tags: ['gluten', 'wheat'],
    category: 'common',
  },
  {
    id: 'wheat',
    label: 'Wheat',
    description: 'Wheat only, including semolina, couscous and most bread and pasta.',
    tags: ['wheat'],
    category: 'common',
  },
  {
    id: 'egg',
    label: 'Egg',
    description: 'Whole egg, and egg used inside mayonnaise, batter, pasta and desserts.',
    tags: ['egg'],
    category: 'common',
  },
  {
    id: 'soy',
    label: 'Soy',
    description: 'Soy beans, tofu, soy sauce and soy in many meat-free products.',
    tags: ['soy'],
    category: 'common',
  },
  {
    id: 'peanut',
    label: 'Peanuts',
    description: 'Peanuts and peanut sauces, common in Asian and African cooking.',
    tags: ['peanut'],
    category: 'common',
  },
  {
    id: 'tree-nut',
    label: 'Tree nuts',
    description: 'Almonds, walnuts, cashews, hazelnuts, pistachios and pine nuts.',
    tags: ['tree-nut'],
    category: 'common',
  },
  {
    id: 'sesame',
    label: 'Sesame',
    description: 'Sesame seeds, sesame oil and tahini, which is in hummus.',
    tags: ['sesame'],
    category: 'common',
  },
  {
    id: 'fish',
    label: 'Fish',
    description: 'All fish, plus fish sauce, anchovy and Worcestershire sauce.',
    tags: ['fish'],
    category: 'common',
  },
  {
    id: 'shellfish',
    label: 'Shellfish',
    description: 'Prawns, crab, mussels, squid and oyster sauce.',
    tags: ['shellfish'],
    category: 'common',
  },
  {
    id: 'mustard',
    label: 'Mustard',
    description: 'Mustard seed and paste, often part of dressings and mayonnaise.',
    tags: ['mustard'],
    category: 'common',
  },
  {
    id: 'celery',
    label: 'Celery',
    description: 'Celery stalks and celery salt, which is in many stocks and spice mixes.',
    tags: ['celery'],
    category: 'common',
  },
  {
    id: 'sulphite',
    label: 'Sulphites',
    description: 'A preservative in wine, dried fruit, some vinegars and processed potato.',
    tags: ['sulphite'],
    category: 'common',
  },

  // -------------------------------------------------------- carbohydrates
  {
    id: 'fructose',
    label: 'Fructose',
    description: 'Fruit sugar, also in honey, agave, onion and some vegetables.',
    tags: ['fructose'],
    category: 'carbohydrate',
  },
  {
    id: 'polyol',
    label: 'Sorbitol and similar sweeteners',
    description: 'Sugar alcohols in sugar-free products, stone fruit, mushrooms and avocado.',
    tags: ['polyol'],
    category: 'carbohydrate',
  },
  {
    id: 'fodmap',
    label: 'FODMAPs',
    description:
      'A group of carbohydrates including onion, garlic, beans, wheat, milk sugar and some fruit.',
    tags: ['onion-garlic', 'legume', 'fructose', 'polyol', 'lactose-fodmap'],
    category: 'carbohydrate',
  },
  {
    id: 'onion-garlic',
    label: 'Onion and garlic',
    description: 'Onion, garlic, leek, shallot and spring onion, including in stocks and pastes.',
    tags: ['onion-garlic'],
    category: 'carbohydrate',
  },
  {
    id: 'legume',
    label: 'Beans and lentils',
    description: 'Chickpeas, lentils, beans, peas and hummus.',
    tags: ['legume'],
    category: 'carbohydrate',
  },

  // -------------------------------------------------------------- other
  {
    id: 'histamine',
    label: 'Histamine',
    description: 'Higher in aged cheese, cured meat, fermented food, wine and older fish.',
    tags: ['histamine', 'aged-cheese'],
    category: 'other',
  },
  {
    id: 'salicylate',
    label: 'Salicylates',
    description: 'Natural compounds in many herbs, spices, and some fruit and vegetables.',
    tags: ['salicylate'],
    category: 'other',
  },
  {
    id: 'flavour-enhancer',
    label: 'Flavour enhancers (MSG)',
    description: 'Added glutamate and yeast extract, common in stocks and Asian cooking.',
    tags: ['flavour-enhancer'],
    category: 'other',
  },
  {
    id: 'artificial-sweetener',
    label: 'Artificial sweeteners',
    description: 'Sweeteners used instead of sugar in drinks and sugar-free desserts.',
    tags: ['artificial-sweetener'],
    category: 'other',
  },
  {
    id: 'nightshade',
    label: 'Nightshades',
    description: 'Tomato, potato, sweet pepper, chilli, aubergine and paprika.',
    tags: ['nightshade'],
    category: 'other',
  },
  {
    id: 'corn',
    label: 'Corn',
    description: 'Sweetcorn, polenta, corn tortillas and corn starch.',
    tags: ['corn'],
    category: 'other',
  },
  {
    id: 'yeast',
    label: 'Yeast',
    description: "Baker's yeast in bread and beer, plus yeast extract in savoury flavourings.",
    tags: ['yeast'],
    category: 'other',
  },
  {
    id: 'coconut',
    label: 'Coconut',
    description: 'Coconut milk, coconut oil and shredded coconut.',
    tags: ['coconut'],
    category: 'other',
  },
  {
    id: 'caffeine',
    label: 'Caffeine',
    description: 'Coffee, tea, cola and chocolate.',
    tags: ['caffeine'],
    category: 'other',
  },
  {
    id: 'alcohol',
    label: 'Alcohol',
    description: 'Drinks, and also wine or beer cooked into sauces and batters.',
    tags: ['alcohol'],
    category: 'other',
  },
  {
    id: 'gelatin',
    label: 'Gelatine',
    description: 'An animal-based setting agent in mousses, panna cotta and some sweets.',
    tags: ['gelatin'],
    category: 'other',
  },
  {
    id: 'pork',
    label: 'Pork',
    description: 'Pork, bacon, ham, salami, chorizo and lard.',
    tags: ['pork'],
    category: 'other',
  },
  {
    id: 'beef',
    label: 'Beef',
    description: 'Beef and veal, including in stocks and gravies.',
    tags: ['beef'],
    category: 'other',
  },
  {
    id: 'meat',
    label: 'All meat',
    description: 'Any meat or poultry, including small amounts inside sauces and stocks.',
    tags: ['meat'],
    category: 'other',
  },
  {
    id: 'spicy',
    label: 'Spicy food',
    description: 'Chilli heat, whether from fresh chilli, flakes or a paste.',
    tags: ['spicy'],
    category: 'other',
  },
];

export const CONDITIONS: ConditionOption[] = [
  {
    id: 'coeliac',
    label: 'Coeliac disease',
    description: 'Gluten from wheat, barley and rye, including small traces from shared equipment.',
    watchTags: [],
    avoidTags: ['gluten', 'wheat'],
    note: 'PlatePilot also flags shared fryers and shared prep areas for you to ask about.',
  },
  {
    id: 'ibs',
    label: 'Irritable bowel syndrome (IBS)',
    description:
      'Onion, garlic, beans, wheat, milk sugar, very fatty food and chilli come up often.',
    watchTags: [
      'onion-garlic',
      'legume',
      'polyol',
      'fructose',
      'lactose-fodmap',
      'high-fat',
      'spicy',
      'high-fibre',
    ],
  },
  {
    id: 'reflux',
    label: 'Reflux or heartburn',
    description:
      'Fried and very fatty food, acidic and spicy dishes, coffee, chocolate and alcohol.',
    watchTags: [
      'high-fat',
      'deep-fried',
      'spicy',
      'acidic',
      'citrus',
      'chocolate',
      'caffeine',
      'alcohol',
      'carbonated',
    ],
  },
  {
    id: 'diabetes',
    label: 'Type 2 diabetes',
    description: 'Added sugar and large amounts of white flour, rice and potato.',
    watchTags: ['high-sugar', 'refined-carb'],
  },
  {
    id: 'gout',
    label: 'Gout',
    description: 'Organ meat, red meat, some seafood, beer and other alcohol.',
    watchTags: ['high-purine', 'alcohol', 'high-sugar'],
  },
  {
    id: 'kidney',
    label: 'Kidney disease',
    description: 'Salt, potassium and phosphorus, which show up in stocks, cheese and cola.',
    watchTags: ['high-salt', 'high-potassium', 'high-phosphorus'],
  },
  {
    id: 'blood-pressure',
    label: 'High blood pressure',
    description: 'Salty food, cured meat, stock cubes and salted cheese.',
    watchTags: ['high-salt'],
  },
  {
    id: 'gallbladder',
    label: 'Gallbladder trouble',
    description: 'Very fatty and deep-fried dishes, and heavy cream sauces.',
    watchTags: ['high-fat', 'deep-fried'],
  },
  {
    id: 'migraine',
    label: 'Food-related migraine',
    description: 'Aged cheese, cured meat, chocolate, red wine and added flavour enhancers.',
    watchTags: ['histamine', 'aged-cheese', 'chocolate', 'alcohol', 'flavour-enhancer', 'caffeine'],
  },
  {
    id: 'kidney-stones',
    label: 'Kidney stones',
    description: 'Spinach, nuts, beetroot, chocolate and a lot of salt.',
    watchTags: ['high-oxalate', 'high-salt'],
  },
  {
    id: 'ibd',
    label: "Crohn's disease or colitis",
    description:
      'Tough fibre, chilli heat and very fatty dishes are common triggers during a flare.',
    watchTags: ['high-fibre', 'spicy', 'high-fat', 'deep-fried'],
  },
  {
    id: 'fatty-liver',
    label: 'Fatty liver',
    description: 'Added sugar, fried food and alcohol.',
    watchTags: ['high-sugar', 'high-fat', 'deep-fried', 'alcohol', 'refined-carb'],
  },
  {
    id: 'lactose-condition',
    label: 'Lactose intolerance',
    description: 'Milk sugar, mostly in milk, cream, soft cheese and ice cream.',
    watchTags: [],
    avoidTags: ['lactose', 'lactose-fodmap'],
  },
];

export const INTOLERANCES_BY_ID: Record<string, IntoleranceOption> = Object.fromEntries(
  INTOLERANCES.map((item) => [item.id, item]),
);

export const CONDITIONS_BY_ID: Record<string, ConditionOption> = Object.fromEntries(
  CONDITIONS.map((item) => [item.id, item]),
);

/**
 * Plain-language names for each tag, used when the app has to explain why a
 * dish scored the way it did.
 */
export const TAG_LABELS: Record<DietTag, string> = {
  lactose: 'milk sugar',
  'milk-protein': 'dairy',
  'aged-cheese': 'aged cheese',
  gluten: 'gluten',
  wheat: 'wheat',
  corn: 'corn',
  oats: 'oats',
  egg: 'egg',
  soy: 'soy',
  peanut: 'peanuts',
  'tree-nut': 'tree nuts',
  sesame: 'sesame',
  fish: 'fish',
  shellfish: 'shellfish',
  mustard: 'mustard',
  celery: 'celery',
  sulphite: 'sulphites',
  yeast: 'yeast',
  coconut: 'coconut',
  gelatin: 'gelatine',
  pork: 'pork',
  beef: 'beef',
  meat: 'meat',
  'lactose-fodmap': 'milk sugar',
  fructose: 'fruit sugar',
  polyol: 'sugar alcohols',
  'onion-garlic': 'onion or garlic',
  legume: 'beans or lentils',
  'high-fibre': 'a lot of fibre',
  histamine: 'histamine',
  salicylate: 'salicylates',
  'flavour-enhancer': 'added flavour enhancer',
  'artificial-sweetener': 'artificial sweetener',
  caffeine: 'caffeine',
  alcohol: 'alcohol',
  nightshade: 'nightshades',
  citrus: 'citrus',
  chocolate: 'chocolate',
  vinegar: 'vinegar',
  acidic: 'acidic ingredients',
  spicy: 'chilli heat',
  'high-fat': 'a lot of fat',
  'deep-fried': 'deep frying',
  'high-salt': 'a lot of salt',
  'high-sugar': 'added sugar',
  'refined-carb': 'white flour, rice or potato',
  'high-purine': 'purine-rich food',
  'high-oxalate': 'oxalate-rich food',
  'high-potassium': 'potassium-rich food',
  'high-phosphorus': 'phosphorus-rich food',
  'raw-animal': 'raw fish or meat',
  carbonated: 'fizzy drinks',
};
