import { Heart } from 'lucide-react-native';
import { useLocalSearchParams } from 'expo-router';
import { Separator, Typography } from 'heroui-native';
import { ScrollView, View } from 'react-native';
import { Disclaimer } from '@/components/Disclaimer';
import { EmptyState } from '@/components/EmptyState';
import { QuestionList } from '@/components/QuestionList';
import { ScoreBadge } from '@/components/ScoreBadge';
import { confidenceLabel } from '@/lib/analysis/score';
import type { DishSource } from '@/lib/analysis/types';
import { goBackOrReplace } from '@/lib/navigation';
import { useFavorites } from '@/lib/store/scans';

export default function FavoriteDishScreen() {
  const { favoriteId } = useLocalSearchParams<{ favoriteId: string }>();
  const favorite = useFavorites().find((item) => item.id === favoriteId);

  if (!favorite) {
    return (
      <View className="bg-background flex-1 justify-center">
        <EmptyState
          icon={Heart}
          title="This favorite is no longer saved"
          body="Open History to see your other favorite dishes and menu scans."
          actionLabel="Back to history"
          onAction={() => goBackOrReplace('/(tabs)/history')}
        />
      </View>
    );
  }

  const dish = favorite.dish;
  const source: DishSource = dish.source ?? (dish.dishId ? 'library' : 'none');
  const confidence = confidenceLabel(dish.confidence, source);

  return (
    <ScrollView className="bg-background flex-1" contentContainerClassName="gap-5 px-5 pt-4 pb-10">
      <View className="border-border bg-surface flex-row items-center gap-4 rounded-3xl border p-5">
        <ScoreBadge score={dish.score} band={dish.band} size="lg" />
        <View className="flex-1 gap-1">
          <Typography type="h5">{dish.dishName}</Typography>
          <Typography className="text-muted text-sm">{favorite.place}</Typography>
          <Typography className="text-muted text-xs">Confidence: {confidence}</Typography>
        </View>
      </View>

      <View className="gap-2">
        <Typography className="text-base font-semibold">Why this score?</Typography>
        {dish.reasons.map((reason) => (
          <Typography key={reason} className="text-sm leading-6">
            {reason}
          </Typography>
        ))}
      </View>

      {(dish.modifications?.length ?? 0) > 0 ? (
        <>
          <Separator />
          <View className="gap-3">
            <Typography className="text-base font-semibold">Can I modify this?</Typography>
            {dish.modifications?.map((modification) => (
              <View
                key={modification.label}
                className="border-border bg-surface gap-1.5 rounded-2xl border p-4"
              >
                <Typography className="font-semibold">{modification.label}</Typography>
                <Typography className="text-sm leading-6">{modification.request}</Typography>
                {modification.potentialScore ? (
                  <Typography className="text-score-good text-sm font-semibold">
                    Potential match if confirmed: {modification.potentialScore}/10
                  </Typography>
                ) : null}
              </View>
            ))}
          </View>
        </>
      ) : null}

      {dish.questions.length > 0 ? (
        <>
          <Separator />
          <QuestionList title="Ask the restaurant" questions={dish.questions} />
        </>
      ) : null}

      <Disclaimer text="This is the result saved at the time of the scan. The restaurant must still confirm the current recipe, preparation and any requested changes." />
    </ScrollView>
  );
}
