import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { bilt } from '@/lib/bilt';
import { INGREDIENT_LIST } from '@/lib/data/ingredients';
import { normalise } from './profile';
import type { MenuLine } from './types';

/**
 * Reading a menu photo.
 *
 * The photo goes to the `read-menu` cloud function, which transcribes what is
 * printed on the page. It is told never to fill in what a dish "usually"
 * contains: recipe knowledge comes from PlatePilot's own library, so the two
 * sources stay separate and we can always say where a claim came from.
 */

const MAX_WIDTH = 1600;
const READER_ID = 'cloud-vision';

/** Ingredients the model may name. Kitchen-practice gaps are ours, not the menu's. */
const INGREDIENT_OPTIONS = INGREDIENT_LIST.filter((item) => !item.isUnknownElement).map(
  ({ id, name }) => ({ id, name }),
);

const NAME_TOKENS: { id: string; tokens: string[] }[] = INGREDIENT_OPTIONS.map((option) => ({
  id: option.id,
  tokens: normalise(option.name).split(' ').filter(Boolean),
}));

export type MenuReadFailure = 'unreadable' | 'service' | 'photo';

/** Reasons the cloud reader reports back instead of a transcription. */
type CloudFailure = 'not_configured' | 'quota' | 'upstream' | 'unreadable';

const FAILURE_MESSAGE: Record<CloudFailure, { kind: MenuReadFailure; message: string }> = {
  not_configured: {
    kind: 'service',
    message:
      'Menu reading is not switched on yet, so there is nothing to read the photo with. Nobody has been charged and your photo was not kept.',
  },
  quota: {
    kind: 'service',
    message:
      'Menu reading has run out of credit on its account, so this photo could not be read. It will work again once that is topped up.',
  },
  upstream: {
    kind: 'service',
    message: 'Menu reading did not answer just now. Try the same photo again in a moment.',
  },
  unreadable: {
    kind: 'unreadable',
    message:
      'We could not make out any dishes on that photo. A straight, well-lit shot of one page works best.',
  },
};

/** A failure we can explain to the user in one sentence. */
export class MenuReadError extends Error {
  readonly kind: MenuReadFailure;

  constructor(kind: MenuReadFailure, message: string) {
    super(message);
    this.name = 'MenuReadError';
    this.kind = kind;
  }
}

export type MenuPhoto = {
  uri: string;
  width?: number;
  height?: number;
};

export type MenuReadResult = {
  readerId: string;
  /** Restaurant name, when the page printed one. */
  place?: string;
  lines: MenuLine[];
  /** True when the page was longer than one reading could cover. */
  truncated: boolean;
};

type CloudMenuItem = {
  name: string;
  description: string | null;
  section: string | null;
  statedIngredientIds: string[];
  otherStatedIngredients: string[];
};

type CloudReadResponse = {
  readable: boolean;
  place: string | null;
  items: CloudMenuItem[];
  truncated?: boolean;
  failure?: CloudFailure;
};

/** Match a word the menu used against the ingredient catalogue, whole words only. */
function placeIngredientWord(word: string): string | null {
  const wordTokens = normalise(word).split(' ').filter(Boolean);
  if (wordTokens.length === 0) return null;

  const joined = wordTokens.join(' ');
  const exact = NAME_TOKENS.find((entry) => entry.tokens.join(' ') === joined);
  if (exact) return exact.id;

  const contained = NAME_TOKENS.find(
    (entry) =>
      entry.tokens.length > 0 &&
      entry.tokens.every((token) => token.length > 2 && wordTokens.includes(token)),
  );
  return contained?.id ?? null;
}

function toMenuLines(items: CloudMenuItem[]): MenuLine[] {
  return items.map((item, index) => {
    const stated = new Set(item.statedIngredientIds);
    const unplaced: string[] = [];

    for (const word of item.otherStatedIngredients) {
      const id = placeIngredientWord(word);
      if (id) stated.add(id);
      else unplaced.push(word);
    }

    return {
      id: `line-${index}-${normalise(item.name).replace(/\s/g, '-').slice(0, 40)}`,
      raw: item.name,
      description: item.description ?? undefined,
      section: item.section ?? undefined,
      statedIngredientIds: [...stated],
      unplacedIngredients: unplaced.length > 0 ? unplaced.slice(0, 6) : undefined,
    };
  });
}

/** Shrink and re-encode the photo so a phone upload stays reasonable. */
async function toBase64Jpeg(photo: MenuPhoto): Promise<string> {
  try {
    const context = ImageManipulator.manipulate(photo.uri);
    if (!photo.width || photo.width > MAX_WIDTH) context.resize({ width: MAX_WIDTH });

    const rendered = await context.renderAsync();
    const saved = await rendered.saveAsync({
      format: SaveFormat.JPEG,
      compress: 0.65,
      base64: true,
    });

    if (!saved.base64) throw new Error('no base64 output');
    return saved.base64;
  } catch {
    throw new MenuReadError('photo', 'We could not open that picture. Try taking it again.');
  }
}

/**
 * Read a menu photo into menu lines.
 *
 * `onStage` reports progress so the waiting screen can say what is happening.
 */
export async function readMenuPhoto(
  photo: MenuPhoto,
  onStage?: (stage: 'preparing' | 'reading') => void,
): Promise<MenuReadResult> {
  onStage?.('preparing');
  const image = await toBase64Jpeg(photo);

  onStage?.('reading');
  const { data, error } = await bilt.functions.invoke<CloudReadResponse>('read-menu', {
    body: { image, mimeType: 'image/jpeg', ingredientOptions: INGREDIENT_OPTIONS },
  });

  if (error || !data) {
    throw new MenuReadError(
      'service',
      'We could not reach the menu reader. Check your connection and try again.',
    );
  }

  if (data.failure) {
    const known = FAILURE_MESSAGE[data.failure];
    if (known) throw new MenuReadError(known.kind, known.message);
    throw new MenuReadError('service', FAILURE_MESSAGE.upstream.message);
  }

  if (!data.readable || data.items.length === 0) {
    throw new MenuReadError('unreadable', FAILURE_MESSAGE.unreadable.message);
  }

  return {
    readerId: READER_ID,
    place: data.place ?? undefined,
    lines: toMenuLines(data.items),
    truncated: Boolean(data.truncated),
  };
}
