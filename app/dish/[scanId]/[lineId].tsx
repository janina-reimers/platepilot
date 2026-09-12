import { useEffect } from 'react';
import { FileQuestion, Heart, Wrench } from 'lucide-react-native';
import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import { Button, Separator, Typography, useThemeColor } from 'heroui-native';
import { ScrollView, View } from 'react-native';
import { CERTAINTY_EXPLAINER } from '@/components/CertaintyChip';
import { Disclaimer } from '@/components/Disclaimer';
import { EmptyState } from '@/components/EmptyState';
import { IngredientRow } from '@/components/IngredientRow';
import { QuestionList } from '@/components/QuestionList';
import { ScoreBadge } from '@/components/ScoreBadge';
import { confidenceLabel } from '@/lib/analysis/score';
import type { DishSource } from '@/lib/analysis/types';
import { BAND_STYLES } from '@/lib/bands';
import { getIngredient } from '@/lib/data/ingredients';
import type { Certainty } from '@/lib/data/types';
import { goBackOrReplace } from '@/lib/navigation';
import { useScan, useScanStore } from '@/lib/store/scans';
import { cn } from '@/lib/utils';

const SECTION_TITLES: Record<Certainty, string> = {
  confirmed: '✓ Confirmed ingredients',
  possible: '? Possible or likely ingredients',
  unknown: '⚠ Unknown information',
};

const MENU_SECTION_TITLES: Record<Certainty, string> = {
  confirmed: '✓ Confirmed on the menu',
  possible: '? Possible or likely ingredients',
  unknown: '⚠ Unknown information',
};

const SOURCE_NOTE: Record<DishSource, string> = {
  library:
    'We recognised this dish, so this is the recipe we hold for it, plus anything the menu spelled out.',
  menu: 'We do not hold a recipe for this one, so everything here comes from the menu’s own words.',
  none: 'The photo gave us a name and nothing else, so there is nothing for us to take apart.',
};

export default function DishDetailScreen() {
  const { scanId, lineId } = useLocalSearchParams<{ scanId: string; lineId: string }>();
  const scan = useScan(scanId);
  const navigation = useNavigation();
  const [foreground] = useThemeColor(['foreground']);
  const favorites = useScanStore((state) => state.favorites);
  const toggleFavorite = useScanStore((state) => state.toggleFavorite);

  const analysis = scan?.analysis.dishes.find((item) => item.lineId === lineId);
  const isFavorite = favorites.some((item) => item.scanId === scanId && item.lineId === lineId);

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

  const source: DishSource = analysis.source ?? (analysis.dishId ? 'library' : 'none');
  const titles = source === 'menu' ? MENU_SECTION_TITLES : SECTION_TITLES;
  const style = BAND_STYLES[analysis.band];
  const confidence = confidenceLabel(analysis.confidence, source);

  const isFlagged = (ingredientId: string): boolean =>
    analysis.findings.some((finding) => finding.ingredientId === ingredientId);

  const grouped: Record<Certainty, { id: string; name: string; note?: string }[]> = {
    confirmed: [],
    possible: [],
    unknown: [],
  };

  for (const entry of analysis.ingredients ?? []) {
    const ingredient = getIngredient(entry.ingredientId);
    if (!ingredient) continue;
    grouped[entry.certainty].push({
      id: ingredient.id,
      name: ingredient.name,
      note: entry.note ?? ingredient.note,
    });
  }

  const hasIngredients = Object.values(grouped).some((list) => list.length > 0);
  const unplaced = analysis.unplacedIngredients ?? [];

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
                ? 'There is not enough here to put a number on.'
                : `${analysis.score} out of 10 for your profile`}
            </Typography>
            <Typography className="text-muted text-xs font-medium">
              Confidence: {confidence}
            </Typography>
          </View>
        </View>

        <View className="gap-2">
          <Typography className="text-xs font-semibold tracking-wide uppercase">
            Why this score?
          </Typography>
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

      {analysis.menuDescription ? (
        <View className="border-border bg-surface-secondary gap-1.5 rounded-2xl border p-4">
          <Typography className="text-muted text-xs font-semibold tracking-wide uppercase">
            What the menu says
          </Typography>
          <Typography className="text-sm leading-6">{analysis.menuDescription}</Typography>
        </View>
      ) : null}

      {source === 'library' ? (
        <View className="gap-2">
          <Typography className="text-base font-semibold">How this dish is usually made</Typography>
          <Typography className="text-muted text-sm leading-6">{analysis.summary}</Typography>
        </View>
      ) : null}

      <Typography className="text-muted text-sm leading-6">{SOURCE_NOTE[source]}</Typography>

      {(analysis.modifications?.length ?? 0) > 0 ? (
        <>
          <Separator />
          <View className="gap-3">
            <View className="flex-row items-center gap-2">
              <Wrench color={foreground} size={18} />
              <Typography className="text-base font-semibold">Can I modify this?</Typography>
            </View>
            <Typography className="text-muted text-sm leading-6">
              These are requests, not confirmed options. The kitchen must confirm the change and the
              ingredients used.
            </Typography>
            {analysis.modifications?.map((modification) => (
              <View
                key={modification.label}
                className="border-border bg-surface gap-2 rounded-2xl border p-4"
              >
                <Typography className="font-semibold">{modification.label}</Typography>
                <Typography className="text-sm leading-6">{modification.request}</Typography>
                <Typography className="text-muted text-xs leading-5">
                  {modification.reason}
                </Typography>
                {modification.potentialScore ? (
                  <Typography className="text-score-good text-sm font-semibold">
                    Potential match if the kitchen confirms this exact change:{' '}
                    {modification.potentialScore}/10
                  </Typography>
                ) : null}
              </View>
            ))}
          </View>
        </>
      ) : null}

      {hasIngredients ? (
        <>
          <Separator />
          <View className="gap-4">
            <View className="gap-1">
              <Typography className="text-base font-semibold">What goes into it</Typography>
              <Typography className="text-muted text-sm leading-6">
                Grouped by how sure we are. Anything tinted red is there because of your profile.
              </Typography>
            </View>

            {(['confirmed', 'possible', 'unknown'] as const).map((certainty) =>
              grouped[certainty].length === 0 ? null : (
                <View key={certainty} className="gap-2">
                  <Typography className="text-muted text-xs font-semibold tracking-wide uppercase">
                    {titles[certainty]}
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
                      flagged={isFlagged(item.id)}
                    />
                  ))}
                </View>
              ),
            )}
          </View>
        </>
      ) : null}

      {unplaced.length > 0 ? (
        <View className="border-border bg-surface-secondary gap-1.5 rounded-2xl border p-4">
          <Typography className="text-muted text-xs font-semibold tracking-wide uppercase">
            Also named on the menu
          </Typography>
          <Typography className="text-sm leading-6">{unplaced.join(', ')}</Typography>
          <Typography className="text-muted text-xs leading-5">
            We do not hold information on these, so they are not part of the score. Ask about them
            if any of them matter to you.
          </Typography>
        </View>
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

      <View className="gap-2">
        <Button
          variant={isFavorite ? 'tertiary' : 'secondary'}
          onPress={() => toggleFavorite(scan.id, analysis.lineId)}
        >
          <Heart color={foreground} size={17} fill={isFavorite ? foreground : 'transparent'} />
          <Button.Label>{isFavorite ? 'Remove from favorites' : 'Save favorite dish'}</Button.Label>
        </Button>
        <Button
          variant="secondary"
          onPress={() =>
            router.push({
              pathname: '/waiter/[scanId]',
              params: { scanId: scan.id, lineId: analysis.lineId },
            })
          }
        >
          <Button.Label>Show this dish to waiter</Button.Label>
        </Button>
        <Button
          variant="ghost"
          onPress={() =>
            router.push({ pathname: '/questions/[scanId]', params: { scanId: scan.id } })
          }
        >
          <Button.Label>See all questions for this menu</Button.Label>
        </Button>
      </View>

      <Disclaimer />
    </ScrollView>
  );
}
