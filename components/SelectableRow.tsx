import { Check } from 'lucide-react-native';
import { Typography, useThemeColor } from 'heroui-native';
import { Pressable, View } from 'react-native';
import { cn } from '@/lib/utils';

type SelectableRowProps = {
  label: string;
  description?: string;
  selected: boolean;
  onToggle: () => void;
  /** Extra controls shown once the row is selected, e.g. how strict to be. */
  children?: React.ReactNode;
};

/** A tappable option row used throughout onboarding and the profile screen. */
export function SelectableRow({
  label,
  description,
  selected,
  onToggle,
  children,
}: SelectableRowProps) {
  const [accentForeground] = useThemeColor(['accent-foreground']);

  return (
    <View
      className={cn(
        'rounded-2xl border',
        selected ? 'border-accent bg-accent-soft' : 'border-border bg-surface',
      )}
    >
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: selected }}
        onPress={onToggle}
        className="flex-row items-start gap-3 p-4"
      >
        <View
          className={cn(
            'mt-0.5 h-5 w-5 items-center justify-center rounded-md border-2',
            selected ? 'border-accent bg-accent' : 'border-border',
          )}
        >
          {selected ? <Check color={accentForeground} size={13} strokeWidth={3} /> : null}
        </View>

        <View className="flex-1 gap-1">
          <Typography className="text-sm font-semibold">{label}</Typography>
          {description ? (
            <Typography className="text-muted text-xs leading-5">{description}</Typography>
          ) : null}
        </View>
      </Pressable>

      {selected && children ? <View className="px-4 pb-4">{children}</View> : null}
    </View>
  );
}
