import { ChevronRight, Star } from 'lucide-react-native';
import { Surface, Typography, useThemeColor } from 'heroui-native';
import { Pressable, View } from 'react-native';
import type { DishAnalysis } from '@/lib/analysis/types';
import { BAND_HEX, BAND_STYLES } from '@/lib/bands';
import { cn } from '@/lib/utils';
import { ScoreBadge } from './ScoreBadge';

type DishResultCardProps = {
  analysis: DishAnalysis;
  onPress: () => void;
};

/** One dish in the results list: score, verdict, and the first reason why. */
export function DishResultCard({ analysis, onPress }: DishResultCardProps) {
  const [muted] = useThemeColor(['muted']);
  const style = BAND_STYLES[analysis.band];

  return (
    <Pressable onPress={onPress} accessibilityRole="button">
      <Surface
        variant="default"
        className={cn(
          'gap-3 rounded-3xl border p-4',
          analysis.isBestMatch ? 'border-score-good-line' : 'border-border',
        )}
      >
        {analysis.isBestMatch ? (
          <View className="bg-score-good-soft flex-row items-center gap-1.5 self-start rounded-full px-2.5 py-1">
            <Star color={BAND_HEX.good} size={12} />
            <Typography className="text-score-good text-[11px] font-semibold">
              Best match on this menu
            </Typography>
          </View>
        ) : null}

        <View className="flex-row items-center gap-3">
          <ScoreBadge score={analysis.score} band={analysis.band} size="md" />

          <View className="flex-1 gap-0.5">
            <Typography className="text-base font-semibold" numberOfLines={2}>
              {analysis.dishName}
            </Typography>
            <Typography className={cn('text-xs font-medium', style.text)}>
              {analysis.headline}
            </Typography>
          </View>

          <ChevronRight color={muted} size={18} />
        </View>

        {analysis.reasons.length > 0 ? (
          <Typography className="text-muted text-sm leading-5" numberOfLines={3}>
            {analysis.reasons[0]}
          </Typography>
        ) : null}

        {analysis.source === 'menu' ? (
          <Typography className="text-muted text-[11px] font-medium">
            Read from the menu text
          </Typography>
        ) : null}

        {analysis.questions.length > 0 ? (
          <Typography className="text-score-ask text-xs font-medium">
            {analysis.questions.length === 1
              ? '1 question to ask staff'
              : `${analysis.questions.length} questions to ask staff`}
          </Typography>
        ) : null}
      </Surface>
    </Pressable>
  );
}
