import type { DietTag, IntoleranceOption } from './types';

/**
 * The things a user can tell PlatePilot about themselves.
 *
 * Everything here is an intolerance or a food someone chooses to skip, and it
 * becomes "on your avoid list". Severe allergens and medical conditions are
 * deliberately not offered: PlatePilot cannot make a dish safe, so it does not
 * invite people to rely on it for that. Wording is plain and non-medical.
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
    id: 'wheat',
    label: 'Wheat',
    description: 'Wheat only, including semolina, couscous and most bread and pasta.',
    tags: ['wheat'],
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

export const INTOLERANCES_BY_ID: Record<string, IntoleranceOption> = Object.fromEntries(
  INTOLERANCES.map((item) => [item.id, item]),
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
