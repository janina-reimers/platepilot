import { useEffect, useMemo } from 'react';
import { FileQuestion, MessageCircleQuestion, Star } from 'lucide-react-native';
import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import { Button, Separator, Typography, useThemeColor } from 'heroui-native';
import { FlatList, View } from 'react-native';
import { Disclaimer } from '@/components/Disclaimer';
import { DishResultCard } from '@/components/DishResultCard';
import { EmptyState } from '@/components/EmptyState';
import type { DishAnalysis } from '@/lib/analysis/types';
import { BAND_HEX } from '@/lib/bands';
import { goBackOrReplace } from '@/lib/navigation';
import { useScan } from '@/lib/store/scans';

export default function ResultsScreen() {
  const { scanId } = useLocalSearchParams<{ scanId: string }>();
  const scan = useScan(scanId);
  const navigation = useNavigation();
  const [foreground] = useThemeColor(['foreground']);

  useEffect(() => {
    if (scan) navigation.setOptions({ title: scan.place });
  }, [navigation, scan]);

  const questionCount = useMemo(() => {
    if (!scan) return 0;
    const perDish = scan.analysis.dishes.reduce((total, dish) => total + dish.questions.length, 0);
    return perDish + scan.analysis.generalQuestions.length;
  }, [scan]);

  if (!scan) {
    return (
      <View className="bg-background flex-1 justify-center">
        <EmptyState
          icon={FileQuestion}
          title="This menu is no longer saved"
          body="It may have been removed from your history. Start a new scan when you are ready."
          actionLabel="Back"
          onAction={() => goBackOrReplace('/(tabs)')}
        />
      </View>
    );
  }

  const { dishes, bestMatchLineIds, profileSummary } = scan.analysis;

  const openDish = (dish: DishAnalysis) =>
    router.push({
      pathname: '/dish/[scanId]/[lineId]',
      params: { scanId: scan.id, lineId: dish.lineId },
    });

  return (
    <FlatList
      className="bg-background flex-1"
      data={dishes}
      keyExtractor={(item) => item.lineId}
      contentContainerClassName="gap-3 px-5 pt-3 pb-10"
      ListHeaderComponent={
        <View className="gap-3 pb-1">
          <Typography className="text-muted text-sm leading-6">
            {dishes.length === 1
              ? 'We read one dish off your photo.'
              : `We read ${dishes.length} dishes off your photo.`}{' '}
            {profileSummary}
          </Typography>

          {bestMatchLineIds.length > 0 ? (
            <View className="border-score-good-line bg-score-good-soft flex-row items-start gap-3 rounded-2xl border p-4">
              <Star color={BAND_HEX.good} size={18} />
              <Typography className="text-score-good flex-1 text-sm leading-6">
                {bestMatchLineIds.length === 1
                  ? 'One dish stands out as the best fit for your profile. It is marked below.'
                  : `${bestMatchLineIds.length} dishes stand out as the best fit for your profile. They are marked below.`}
              </Typography>
            </View>
          ) : (
            <View className="border-score-ask-line bg-score-ask-soft rounded-2xl border p-4">
              <Typography className="text-score-ask text-sm leading-6">
                Nothing here scored highly enough for us to call it a good match. Work through the
                questions with staff before you decide.
              </Typography>
            </View>
          )}

          {questionCount > 0 ? (
            <Button
              variant="secondary"
              size="md"
              onPress={() =>
                router.push({ pathname: '/questions/[scanId]', params: { scanId: scan.id } })
              }
            >
              <MessageCircleQuestion color={foreground} size={16} />
              <Button.Label>
                {questionCount === 1
                  ? '1 question for staff'
                  : `${questionCount} questions for staff`}
              </Button.Label>
            </Button>
          ) : null}

          <Separator className="my-1" />
        </View>
      }
      renderItem={({ item }) => <DishResultCard analysis={item} onPress={() => openDish(item)} />}
      ListFooterComponent={<Disclaimer className="mt-4" />}
    />
  );
}
