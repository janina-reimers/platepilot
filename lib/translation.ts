import { bilt } from '@/lib/bilt';

export const WAITER_LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Spanish' },
  { code: 'fr', label: 'French' },
  { code: 'de', label: 'German' },
  { code: 'it', label: 'Italian' },
  { code: 'pt', label: 'Portuguese' },
  { code: 'ja', label: 'Japanese' },
] as const;

export type WaiterLanguageCode = (typeof WAITER_LANGUAGES)[number]['code'];

type TranslationRow = { id: string; text: string };

type TranslationResponse = {
  translations?: TranslationRow[];
  error?: string;
};

export async function translateForWaiter(
  rows: TranslationRow[],
  language: WaiterLanguageCode,
): Promise<Record<string, string>> {
  if (language === 'en') return Object.fromEntries(rows.map((row) => [row.id, row.text]));

  const { data, error } = await bilt.functions.invoke<TranslationResponse>('translate-waiter', {
    body: { language, rows },
  });

  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(data.error);
  if (!data?.translations || data.translations.length !== rows.length) {
    throw new Error('The translation came back incomplete. Please try again.');
  }

  return Object.fromEntries(data.translations.map((row) => [row.id, row.text]));
}
