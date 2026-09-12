import { parseMenuText } from './match';
import type { MenuLine } from './types';

/**
 * The seam between PlatePilot and whatever reads a menu photo.
 *
 * Today the app ships with the knowledge base and manual entry: you photograph
 * the menu, then confirm the dish names, which the library recognises. An
 * automatic reader can be dropped in behind this interface later without any
 * change to the scoring, questions or screens.
 */

export type MenuReadInput = {
  imageUri: string;
};

export type MenuReadResult = {
  readerId: string;
  lines: MenuLine[];
  /** Plain sentence shown to the user about how the text was read. */
  notice?: string;
};

export type MenuReader = {
  id: string;
  label: string;
  description: string;
  isAvailable: () => boolean;
  read: (input: MenuReadInput) => Promise<MenuReadResult>;
};

const AI_ENDPOINT = process.env.EXPO_PUBLIC_MENU_AI_ENDPOINT;

/**
 * Reads a menu photo through a hosted service. Only active once an endpoint is
 * configured; until then the app falls back to confirming dish names by hand.
 */
export const aiMenuReader: MenuReader = {
  id: 'ai',
  label: 'Automatic reading',
  description: 'Reads the dish names straight off the photo.',
  isAvailable: () => Boolean(AI_ENDPOINT),
  read: async ({ imageUri }) => {
    if (!AI_ENDPOINT) throw new Error('No menu reading service is set up yet.');

    const response = await fetch(AI_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageUri }),
    });

    if (!response.ok) {
      throw new Error('The menu could not be read this time. You can type the dish names instead.');
    }

    const payload: unknown = await response.json();
    const data = (payload ?? {}) as { lines?: unknown; text?: unknown };
    const fromLines = Array.isArray(data.lines)
      ? data.lines.filter((entry): entry is string => typeof entry === 'string')
      : [];
    const fromText = typeof data.text === 'string' ? data.text : '';
    const lines = parseMenuText(fromLines.length > 0 ? fromLines.join('\n') : fromText);

    return {
      readerId: 'ai',
      lines,
      notice: 'Read from your photo. Check the list and remove anything that is wrong.',
    };
  },
};

/** Turns dish names the user typed or pasted into menu lines. */
export const manualMenuReader = {
  id: 'manual',
  label: 'Type the dish names',
  description: 'You enter the dishes you are considering, and PlatePilot looks them up.',
  read: (text: string): MenuReadResult => ({
    readerId: 'manual',
    lines: parseMenuText(text),
    notice: 'Based on the dish names you entered.',
  }),
};

/** The automatic reader, if one is configured. */
export function getAutomaticReader(): MenuReader | null {
  return aiMenuReader.isAvailable() ? aiMenuReader : null;
}
