import { Typography } from 'heroui-native';
import { View } from 'react-native';
import type { Certainty } from '@/lib/data/types';
import { cn } from '@/lib/utils';
import { CertaintyChip } from './CertaintyChip';

type IngredientRowProps = {
  name: string;
  certainty: Certainty;
  note?: string;
  /** Set when this ingredient is one of the reasons the score dropped. */
  flagged?: 'avoid' | 'watch';
  className?: string;
};

export function IngredientRow({ name, certainty, note, flagged, className }: IngredientRowProps) {
  return (
    <View
      className={cn(
        'gap-1.5 rounded-2xl border px-3.5 py-3',
        flagged === 'avoid' && 'border-score-avoid-line bg-score-avoid-soft',
        flagged === 'watch' && 'border-score-ask-line bg-score-ask-soft',
        !flagged && 'border-border bg-surface',
        className,
      )}
    >
      <View className="flex-row items-center justify-between gap-3">
        <Typography className="flex-1 text-sm font-medium">{name}</Typography>
        <CertaintyChip certainty={certainty} />
      </View>
      {note ? <Typography className="text-muted text-xs leading-5">{note}</Typography> : null}
      {flagged ? (
        <Typography
          className={cn(
            'text-xs font-medium',
            flagged === 'avoid' ? 'text-score-avoid' : 'text-score-ask',
          )}
        >
          {flagged === 'avoid' ? 'On your avoid list' : 'Worth keeping an eye on'}
        </Typography>
      ) : null}
    </View>
  );
}
