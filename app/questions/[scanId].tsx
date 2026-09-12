import { FileQuestion } from 'lucide-react-native';
import { useLocalSearchParams } from 'expo-router';
import { Separator, Typography } from 'heroui-native';
import { ScrollView, View } from 'react-native';
import { Disclaimer } from '@/components/Disclaimer';
import { EmptyState } from '@/components/EmptyState';
import { QuestionList } from '@/components/QuestionList';
import { collectQuestions } from '@/lib/analysis';
import { goBackOrReplace } from '@/lib/navigation';
import { useScan } from '@/lib/store/scans';

export default function QuestionsScreen() {
  const { scanId } = useLocalSearchParams<{ scanId: string }>();
  const scan = useScan(scanId);

  if (!scan) {
    return (
      <View className="bg-background flex-1 justify-center">
        <EmptyState
          icon={FileQuestion}
          title="This menu is no longer saved"
          body="Open a menu from your history, or start a new scan."
          actionLabel="Back"
          onAction={() => goBackOrReplace('/(tabs)')}
        />
      </View>
    );
  }

  const perDish = collectQuestions(scan.analysis);

  return (
    <ScrollView className="bg-background flex-1" contentContainerClassName="gap-5 px-5 pt-4 pb-10">
      <View className="gap-2">
        <Typography type="h4">Worth asking before you order</Typography>
        <Typography className="text-muted text-sm leading-6">
          Every question here exists because a menu could not answer it. Staff can usually check
          with the kitchen in a minute.
        </Typography>
      </View>

      {scan.analysis.generalQuestions.length > 0 ? (
        <QuestionList
          title="About your order in general"
          questions={scan.analysis.generalQuestions}
        />
      ) : null}

      {perDish.length > 0 ? <Separator /> : null}

      {perDish.map((group) => (
        <QuestionList key={group.dishName} title={group.dishName} questions={group.questions} />
      ))}

      {perDish.length === 0 && scan.analysis.generalQuestions.length === 0 ? (
        <Typography className="text-muted text-sm leading-6">
          Nothing needs checking for this menu.
        </Typography>
      ) : null}

      <Disclaimer text="Answers from staff are the reliable part here, not our guess at the recipe. If nobody can tell you, treat that as a reason to pick something else." />
    </ScrollView>
  );
}
