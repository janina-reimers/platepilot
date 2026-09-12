import { useMemo, useState } from 'react';
import { Languages, MessageCircleQuestion } from 'lucide-react-native';
import { useLocalSearchParams } from 'expo-router';
import { Button, Spinner, Typography, useThemeColor } from 'heroui-native';
import { ScrollView, View } from 'react-native';
import { Disclaimer } from '@/components/Disclaimer';
import { EmptyState } from '@/components/EmptyState';
import { goBackOrReplace } from '@/lib/navigation';
import { useScan } from '@/lib/store/scans';
import { translateForWaiter, WAITER_LANGUAGES, type WaiterLanguageCode } from '@/lib/translation';

type WaiterRow = {
  id: string;
  section: string;
  text: string;
};

export default function WaiterScreen() {
  const { scanId, lineId } = useLocalSearchParams<{ scanId: string; lineId?: string }>();
  const scan = useScan(scanId);
  const [language, setLanguage] = useState<WaiterLanguageCode>('en');
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationError, setTranslationError] = useState<string | null>(null);
  const [accent] = useThemeColor(['accent']);

  const rows = useMemo<WaiterRow[]>(() => {
    if (!scan) return [];
    const selectedDishes = lineId
      ? scan.analysis.dishes.filter((dish) => dish.lineId === lineId)
      : scan.analysis.dishes.filter(
          (dish) => dish.questions.length > 0 || (dish.modifications?.length ?? 0) > 0,
        );
    const output: WaiterRow[] = scan.analysis.generalQuestions.map((text, index) => ({
      id: `general-${index}`,
      section: 'My food profile',
      text,
    }));

    for (const dish of selectedDishes) {
      for (const [index, modification] of (dish.modifications ?? []).entries()) {
        output.push({
          id: `${dish.lineId}-mod-${index}`,
          section: `${dish.dishName} — requested change`,
          text: modification.request,
        });
      }
      for (const [index, text] of dish.questions.entries()) {
        output.push({ id: `${dish.lineId}-question-${index}`, section: dish.dishName, text });
      }
    }
    return output;
  }, [lineId, scan]);

  if (!scan) {
    return (
      <View className="bg-background flex-1 justify-center">
        <EmptyState
          icon={MessageCircleQuestion}
          title="This menu is no longer saved"
          body="Open a menu from your history, or start a new scan."
          actionLabel="Back"
          onAction={() => goBackOrReplace('/(tabs)')}
        />
      </View>
    );
  }

  const chooseLanguage = async (nextLanguage: WaiterLanguageCode) => {
    setLanguage(nextLanguage);
    setTranslationError(null);
    if (nextLanguage === 'en') {
      setTranslations({});
      return;
    }

    setIsTranslating(true);
    try {
      const translated = await translateForWaiter(
        rows.map(({ id, text }) => ({ id, text })),
        nextLanguage,
      );
      setTranslations(translated);
    } catch (error) {
      setTranslations({});
      setTranslationError(
        error instanceof Error ? error.message : 'Translation is unavailable. Please try again.',
      );
    } finally {
      setIsTranslating(false);
    }
  };

  const sections = [...new Set(rows.map((row) => row.section))];

  return (
    <ScrollView className="bg-background flex-1" contentContainerClassName="gap-5 px-5 pt-4 pb-10">
      <View className="gap-2">
        <Typography type="h4">Show this to your waiter</Typography>
        <Typography className="text-muted text-sm leading-6">
          Large, direct questions based on this menu and your Food Profile. Staff still need to
          confirm the recipe and any requested change.
        </Typography>
      </View>

      <View className="gap-2">
        <View className="flex-row items-center gap-2">
          <Languages color={accent} size={18} />
          <Typography className="text-sm font-semibold">Translation</Typography>
        </View>
        <View className="flex-row flex-wrap gap-2">
          {WAITER_LANGUAGES.map((option) => (
            <Button
              key={option.code}
              size="sm"
              variant={language === option.code ? 'primary' : 'secondary'}
              isDisabled={isTranslating}
              onPress={() => void chooseLanguage(option.code)}
            >
              <Button.Label>{option.label}</Button.Label>
            </Button>
          ))}
        </View>
        {isTranslating ? (
          <View className="flex-row items-center gap-2 py-2">
            <Spinner size="sm" />
            <Typography className="text-muted text-sm">Preparing the translation…</Typography>
          </View>
        ) : null}
        {translationError ? (
          <Typography className="text-score-avoid text-sm leading-6">{translationError}</Typography>
        ) : null}
      </View>

      {sections.map((section) => (
        <View key={section} className="gap-3">
          <Typography className="text-muted text-xs font-semibold tracking-wide uppercase">
            {section}
          </Typography>
          {rows
            .filter((row) => row.section === section)
            .map((row) => (
              <View key={row.id} className="border-border bg-surface rounded-3xl border px-5 py-5">
                <Typography className="text-xl leading-8 font-semibold">
                  {language === 'en' ? row.text : (translations[row.id] ?? row.text)}
                </Typography>
              </View>
            ))}
        </View>
      ))}

      <Disclaimer text="This translates questions, not the restaurant’s answer. Ask staff to confirm ingredients, preparation and any changes with the kitchen." />
    </ScrollView>
  );
}
