import { Typography } from 'heroui-native';
import { View } from 'react-native';
import type { Certainty } from '@/lib/data/types';
import { cn } from '@/lib/utils';
import { CertaintyChip } from './CertaintyChip';

type IngredientRowProps = {
  name: string;
  certainty: Certainty;
  note?: string;
  /** True when this ingredient is one of the reasons the score dropped. */
  flagged?: boolean;
  className?: string;
};

export function IngredientRow({ name, certainty, note, flagged, className }: IngredientRowProps) {
  return (
    <View
      className={cn(
        'gap-1.5 rounded-2xl border px-3.5 py-3',
        flagged ? 'border-score-avoid-line bg-score-avoid-soft' : 'border-border bg-surface',
        className,
      )}
    >
      <View className="flex-row items-center justify-between gap-3">
        <Typography className="flex-1 text-sm font-medium">{name}</Typography>
        <CertaintyChip certainty={certainty} />
      </View>
      {note ? <Typography className="text-muted text-xs leading-5">{note}</Typography> : null}
      {flagged ? (
        <Typography className="text-score-avoid text-xs font-medium">On your avoid list</Typography>
      ) : null}
    </View>
  );
}
