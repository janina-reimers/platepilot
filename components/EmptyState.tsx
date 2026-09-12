import type { LucideIcon } from 'lucide-react-native';
import { Button, Typography, useThemeColor } from 'heroui-native';
import { View } from 'react-native';
import { cn } from '@/lib/utils';

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  body: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
};

export function EmptyState({
  icon: Icon,
  title,
  body,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  const [muted] = useThemeColor(['muted']);

  return (
    <View className={cn('items-center gap-3 px-6 py-12', className)}>
      <View className="bg-surface-secondary h-14 w-14 items-center justify-center rounded-2xl">
        <Icon color={muted} size={24} />
      </View>
      <Typography type="h5" className="text-center">
        {title}
      </Typography>
      <Typography className="text-muted max-w-xs text-center text-sm leading-6">{body}</Typography>
      {actionLabel && onAction ? (
        <Button size="md" onPress={onAction} className="mt-2">
          {actionLabel}
        </Button>
      ) : null}
    </View>
  );
}
