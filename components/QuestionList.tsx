import { MessageCircleQuestion } from 'lucide-react-native';
import { Typography, useThemeColor } from 'heroui-native';
import { View } from 'react-native';
import { cn } from '@/lib/utils';

type QuestionListProps = {
  title?: string;
  questions: string[];
  className?: string;
};

/** Questions to put to restaurant staff, phrased so they can be read out loud. */
export function QuestionList({ title, questions, className }: QuestionListProps) {
  const [accent] = useThemeColor(['accent']);
  if (questions.length === 0) return null;

  return (
    <View className={cn('gap-2', className)}>
      {title ? <Typography className="text-sm font-semibold">{title}</Typography> : null}
      {questions.map((question) => (
        <View
          key={question}
          className="border-border bg-surface flex-row items-start gap-3 rounded-2xl border p-3.5"
        >
          <MessageCircleQuestion color={accent} size={17} />
          <Typography className="flex-1 text-sm leading-6">{question}</Typography>
        </View>
      ))}
    </View>
  );
}
