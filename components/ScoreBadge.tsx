import { Typography } from 'heroui-native';
import { View } from 'react-native';
import type { ScoreBand } from '@/lib/analysis/types';
import { BAND_STYLES } from '@/lib/bands';
import { cn } from '@/lib/utils';

type Size = 'sm' | 'md' | 'lg';

const BOX: Record<Size, string> = {
  sm: 'h-10 w-10 rounded-xl',
  md: 'h-14 w-14 rounded-2xl',
  lg: 'h-20 w-20 rounded-3xl',
};

const NUMBER: Record<Size, string> = {
  sm: 'text-base',
  md: 'text-xl',
  lg: 'text-3xl',
};

type ScoreBadgeProps = {
  score: number | null;
  band: ScoreBand;
  size?: Size;
  className?: string;
};

/** The 1-10 score, colour coded. A dash means we could not score the dish. */
export function ScoreBadge({ score, band, size = 'md', className }: ScoreBadgeProps) {
  const style = BAND_STYLES[band];

  return (
    <View className={cn('items-center justify-center', BOX[size], style.solid, className)}>
      <Typography className={cn('leading-none font-bold', NUMBER[size], style.onSolid)}>
        {score === null ? '?' : score}
      </Typography>
      {score !== null && size !== 'sm' ? (
        <Typography className={cn('text-[10px] leading-none opacity-80', style.onSolid)}>
          of 10
        </Typography>
      ) : null}
    </View>
  );
}
