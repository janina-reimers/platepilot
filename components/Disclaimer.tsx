import { Info } from 'lucide-react-native';
import { Typography, useThemeColor } from 'heroui-native';
import { View } from 'react-native';
import { cn } from '@/lib/utils';

type DisclaimerProps = {
  /** Override the standard wording where a screen needs something narrower. */
  text?: string;
  className?: string;
};

const DEFAULT_TEXT =
  'PlatePilot works from typical recipes, not from this restaurant’s kitchen. It cannot promise what is in a dish, and it is not medical advice. Always confirm with staff, and with your doctor or dietitian where it matters.';

/** The honesty note. Present anywhere a score or recommendation is shown. */
export function Disclaimer({ text = DEFAULT_TEXT, className }: DisclaimerProps) {
  const [muted] = useThemeColor(['muted']);

  return (
    <View className={cn('bg-surface-secondary flex-row gap-3 rounded-2xl p-4', className)}>
      <Info color={muted} size={18} />
      <Typography className="text-muted flex-1 text-xs leading-5">{text}</Typography>
    </View>
  );
}
