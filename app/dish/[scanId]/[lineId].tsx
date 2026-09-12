import { useEffect } from 'react';
import { FileQuestion } from 'lucide-react-native';
import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import { Separator, Typography } from 'heroui-native';
import { ScrollView, View } from 'react-native';
import { CERTAINTY_EXPLAINER } from '@/components/CertaintyChip';
import { Disclaimer } from '@/components/Disclaimer';
import { EmptyState } from '@/components/EmptyState';
import { IngredientRow } from '@/components/IngredientRow';
import { QuestionList } from '@/components/QuestionList';
import { ScoreBadge } from '@/components/ScoreBadge';
import { BAND_STYLES } from '@/lib/bands';
import { DISHES_BY_ID } from '@/lib/data/dishes';
import { getIngredient } from '@/lib/data/ingredients';
import type { Certainty } from '@/lib/data/types';
import { goBackOrReplace } from '@/lib/navigation';
import { useScan } from '@/lib/store/scans';
import { cn } from '@/lib/utils';

const SECTION_TITLES: Record<Certainty, string> = {
  confirmed: 'Nearly always in this dish',
  possible: 'Often in this dish',
  unknown: 'Only the kitchen can say',
};

export default function DishDetailScreen() {
  const { scanId, lineId } = useLocalSearchParams<{ scanId: string; lineId: string }>();
  const scan = useScan(scanId);
  const navigation = useNavigation();

  const analysis = scan?.analysis.dishes.find((item) => item.lineId === lineId);

  useEffect(() => {
    if (analysis) navigation.setOptions({ title: analysis.dishName });
  }, [analysis, navigation]);

  if (!scan || !analysis) {
    return (
      <View className="bg-background flex-1 justify-center">
        <EmptyState
          icon={FileQuestion}
          title="This dish is no longer saved"
          body="Open the menu again from your history, or start a new scan."
          actionLabel="Back"
          onAction={() => goBackOrReplace('/(tabs)')}
        />
      </View>
    );
  }

  const dish = analysis.dishId ? DISHES_BY_ID[analysis.dishId] : undefined;
  const style = BAND_STYLES[analysis.band];

  const flagFor = (ingredientId: string): 'avoid' | 'watch' | undefined => {
    const hits = analysis.findings.filter((finding) => finding.ingredientId === ingredientId);
    if (hits.some((finding) => finding.kind === 'avoid')) return 'avoid';
    if (hits.length > 0) return 'watch';
    return undefined;
  };

  const grouped: Record<Certainty, { id: string; name: string; note?: string }[]> = {
    confirmed: [],
    possible: [],
    unknown: [],
  };

  for (const entry of dish?.ingredients ?? []) {
    const ingredient = getIngredient(entry.ingredientId);
    if (!ingredient) continue;
    grouped[entry.certainty].push({
      id: ingredient.id,
      name: ingredient.name,
      note: entry.note ?? ingredient.note,
    });
  }

  return (
    <ScrollView className="bg-background flex-1" contentContainerClassName="gap-5 px-5 pt-4 pb-10">
      <View className={cn('gap-3 rounded-3xl border p-5', style.line, style.soft)}>
        <View className="flex-row items-center gap-4">
          <ScoreBadge score={analysis.score} band={analysis.band} size="lg" />
          <View className="flex-1 gap-1">
            <Typography className={cn('text-base font-bold', style.text)}>
              {analysis.headline}
            </Typography>
            <Typography className="text-muted text-xs">
              {analysis.score === null
                ? 'We do not score a dish we cannot look up.'
                : `${analysis.score} out of 10 for your profile`}
            </Typography>
          </View>
        </View>

        <View className="gap-2">
          {analysis.reasons.map((reason) => (
            <Typography key={reason} className="text-sm leading-6">
              {reason}
            </Typography>
          ))}
        </View>
      </View>

      {analysis.rawText !== analysis.dishName ? (
        <Typography className="text-muted text-xs">On the menu as “{analysis.rawText}”</Typography>
      ) : null}

      {dish ? (
        <View className="gap-2">
          <Typography className="text-base font-semibold">How this dish is usually made</Typography>
          <Typography className="text-muted text-sm leading-6">{dish.summary}</Typography>
        </View>
      ) : null}

      {dish ? (
        <>
          <Separator />
          <View className="gap-4">
            <View className="gap-1">
              <Typography className="text-base font-semibold">What goes into it</Typography>
              <Typography className="text-muted text-sm leading-6">
                Grouped by how sure we are. Anything tinted red or amber is there because of your
                profile.
              </Typography>
            </View>

            {(['confirmed', 'possible', 'unknown'] as const).map((certainty) =>
              grouped[certainty].length === 0 ? null : (
                <View key={certainty} className="gap-2">
                  <Typography className="text-muted text-xs font-semibold tracking-wide uppercase">
                    {SECTION_TITLES[certainty]}
                  </Typography>
                  <Typography className="text-muted text-xs leading-5">
                    {CERTAINTY_EXPLAINER[certainty]}
                  </Typography>
                  {grouped[certainty].map((item) => (
                    <IngredientRow
                      key={`${certainty}-${item.id}`}
                      name={item.name}
                      certainty={certainty}
                      note={item.note}
                      flagged={flagFor(item.id)}
                    />
                  ))}
                </View>
              ),
            )}
          </View>
        </>
      ) : null}

      {analysis.questions.length > 0 ? (
        <>
          <Separator />
          <View className="gap-2">
            <Typography className="text-base font-semibold">Ask the staff</Typography>
            <Typography className="text-muted text-sm leading-6">
              These are the parts a menu cannot settle. Read them out as they are if that helps.
            </Typography>
            <QuestionList questions={analysis.questions} className="mt-1" />
          </View>
        </>
      ) : null}

      <Typography
        className="text-accent text-sm font-medium"
        onPress={() =>
          router.push({ pathname: '/questions/[scanId]', params: { scanId: scan.id } })
        }
      >
        See all questions for this menu
      </Typography>

      <Disclaimer />
    </ScrollView>
  );
}
