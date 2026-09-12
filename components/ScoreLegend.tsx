import { Typography } from 'heroui-native';
import { View } from 'react-native';
import { BAND_STYLES, SCALE_STEPS } from '@/lib/bands';
import { cn } from '@/lib/utils';

/** Explains what the 1-10 scale actually means, in plain words. */
export function ScoreLegend({ className }: { className?: string }) {
  return (
    <View className={cn('gap-2', className)}>
      {SCALE_STEPS.map((step) => {
        const style = BAND_STYLES[step.band];
        return (
          <View key={step.range} className="flex-row items-center gap-3">
            <View className={cn('h-8 w-12 items-center justify-center rounded-lg', style.solid)}>
              <Typography className={cn('text-xs font-bold', style.onSolid)}>
                {step.range}
              </Typography>
            </View>
            <Typography className="text-muted flex-1 text-xs leading-5">{step.meaning}</Typography>
          </View>
        );
      })}
    </View>
  );
}
