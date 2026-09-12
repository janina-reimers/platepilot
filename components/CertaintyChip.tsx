import { Typography } from 'heroui-native';
import { View } from 'react-native';
import type { Certainty } from '@/lib/data/types';
import { cn } from '@/lib/utils';

const META: Record<Certainty, { label: string; box: string; text: string }> = {
  confirmed: {
    label: 'In the dish',
    box: 'bg-score-unknown-soft border-score-unknown-line',
    text: 'text-ink',
  },
  possible: {
    label: 'Sometimes',
    box: 'bg-score-ask-soft border-score-ask-line',
    text: 'text-score-ask',
  },
  unknown: {
    label: 'Only the kitchen knows',
    box: 'bg-score-unknown-soft border-score-unknown-line',
    text: 'text-score-unknown',
  },
};

/** Says how sure we are about one ingredient, in plain words. */
export function CertaintyChip({
  certainty,
  className,
}: {
  certainty: Certainty;
  className?: string;
}) {
  const meta = META[certainty];
  return (
    <View className={cn('rounded-full border px-2 py-0.5', meta.box, className)}>
      <Typography className={cn('text-[11px] font-medium', meta.text)}>{meta.label}</Typography>
    </View>
  );
}

export const CERTAINTY_EXPLAINER: Record<Certainty, string> = {
  confirmed: 'Part of nearly every version of this dish.',
  possible: 'Common, but plenty of kitchens leave it out.',
  unknown: 'A menu cannot tell us. Worth asking.',
};
