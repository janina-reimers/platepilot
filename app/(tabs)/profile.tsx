import { useMemo, useState } from 'react';
import { CircleHelp, Plus, X } from 'lucide-react-native';
import { router } from 'expo-router';
import { Button, Input, Separator, Typography, useThemeColor } from 'heroui-native';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import { Disclaimer } from '@/components/Disclaimer';
import { SelectableRow } from '@/components/SelectableRow';
import { describeProfile, matchCustomAvoidText } from '@/lib/analysis/profile';
import type { Strictness } from '@/lib/analysis/types';
import { INTOLERANCES } from '@/lib/data/triggers';
import { hasProfileContent, useProfileStore } from '@/lib/store/profile';
import { cn } from '@/lib/utils';

const CATEGORY_TITLES: Record<string, string> = {
  common: 'The most common ones',
  carbohydrate: 'Carbohydrate groups',
  other: 'Other things people avoid',
};

export default function ProfileScreen() {
  const profile = useProfileStore((state) => state.profile);
  const toggleIntolerance = useProfileStore((state) => state.toggleIntolerance);
  const setStrictness = useProfileStore((state) => state.setStrictness);
  const addCustomAvoid = useProfileStore((state) => state.addCustomAvoid);
  const removeCustomAvoid = useProfileStore((state) => state.removeCustomAvoid);
  const reset = useProfileStore((state) => state.reset);

  const [draftAvoid, setDraftAvoid] = useState('');
  const [muted, accent] = useThemeColor(['muted', 'accent']);

  const grouped = useMemo(
    () => ({
      common: INTOLERANCES.filter((item) => item.category === 'common'),
      carbohydrate: INTOLERANCES.filter((item) => item.category === 'carbohydrate'),
      other: INTOLERANCES.filter((item) => item.category === 'other'),
    }),
    [],
  );

  const strictnessOf = (id: string): Strictness =>
    profile.intolerances.find((item) => item.id === id)?.strictness ?? 'strict';

  const handleAddAvoid = () => {
    const text = draftAvoid.trim();
    if (text.length < 2) return;
    addCustomAvoid(text);
    setDraftAvoid('');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="bg-background flex-1"
    >
      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-5 px-5 pt-3 pb-10"
        keyboardShouldPersistTaps="handled"
      >
        <View className="bg-surface-secondary gap-2 rounded-2xl p-4">
          <Typography className="text-sm font-semibold">In use right now</Typography>
          <Typography className="text-muted text-sm leading-6">
            {hasProfileContent(profile)
              ? describeProfile(profile)
              : 'Nothing saved yet. Until you add something, dishes cannot be scored for you.'}
          </Typography>
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/about')}
          className="border-border bg-surface flex-row items-center gap-3 rounded-2xl border p-4"
        >
          <CircleHelp color={accent} size={18} />
          <Typography className="flex-1 text-sm font-medium">
            What PlatePilot can and cannot tell you
          </Typography>
        </Pressable>

        <Separator />

        <View className="gap-3">
          <View className="gap-1">
            <Typography type="h5">Intolerances</Typography>
            <Typography className="text-muted text-sm leading-6">
              Anything you have been told to avoid. Choose how strict each one is. Severe allergies
              are not covered here, because PlatePilot cannot tell you whether a kitchen is safe for
              one.
            </Typography>
          </View>

          {(['common', 'carbohydrate', 'other'] as const).map((category) => (
            <View key={category} className="gap-2">
              <Typography className="text-muted pt-1 text-xs font-semibold tracking-wide uppercase">
                {CATEGORY_TITLES[category]}
              </Typography>
              {grouped[category].map((option) => (
                <SelectableRow
                  key={option.id}
                  label={option.label}
                  description={option.description}
                  selected={profile.intolerances.some((item) => item.id === option.id)}
                  onToggle={() => toggleIntolerance(option.id)}
                >
                  <StrictnessPicker
                    value={strictnessOf(option.id)}
                    onChange={(value) => setStrictness(option.id, value)}
                  />
                </SelectableRow>
              ))}
            </View>
          ))}
        </View>

        <Separator />

        <View className="gap-3">
          <View className="gap-1">
            <Typography type="h5">Your own list</Typography>
            <Typography className="text-muted text-sm leading-6">
              Anything else you skip, in your own words.
            </Typography>
          </View>

          <View className="flex-row items-center gap-2">
            <Input
              className="flex-1"
              placeholder="For example: coriander, mango"
              value={draftAvoid}
              onChangeText={setDraftAvoid}
              onSubmitEditing={handleAddAvoid}
              returnKeyType="done"
              autoCorrect={false}
            />
            <Button variant="secondary" isIconOnly onPress={handleAddAvoid}>
              <Plus color={accent} size={18} />
            </Button>
          </View>

          {draftAvoid.trim().length > 2 && matchCustomAvoidText(draftAvoid).length === 0 ? (
            <Typography className="text-score-ask text-xs leading-5">
              We may not recognise this one. It will still be added, as a question for staff.
            </Typography>
          ) : null}

          {profile.customAvoids.map((avoid) => (
            <View
              key={avoid.id}
              className="border-border bg-surface flex-row items-center justify-between gap-3 rounded-2xl border px-4 py-3"
            >
              <View className="flex-1 gap-0.5">
                <Typography className="text-sm font-medium">{avoid.text}</Typography>
                <Typography className="text-muted text-xs">
                  {avoid.matchedIngredientIds.length > 0
                    ? 'Recognised, and checked against every dish'
                    : 'Added as a question for staff'}
                </Typography>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Remove ${avoid.text}`}
                onPress={() => removeCustomAvoid(avoid.id)}
                className="bg-surface-secondary h-8 w-8 items-center justify-center rounded-full"
              >
                <X color={muted} size={15} />
              </Pressable>
            </View>
          ))}
        </View>

        <Separator />

        <Button variant="danger-soft" size="md" onPress={reset}>
          Clear my profile
        </Button>

        <Disclaimer />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function StrictnessPicker({
  value,
  onChange,
}: {
  value: Strictness;
  onChange: (value: Strictness) => void;
}) {
  const options: { value: Strictness; label: string }[] = [
    { value: 'strict', label: 'Avoid completely' },
    { value: 'small-amounts', label: 'Small amounts are fine' },
  ];

  return (
    <View className="flex-row gap-2">
      {options.map((option) => (
        <Pressable
          key={option.value}
          accessibilityRole="radio"
          accessibilityState={{ selected: value === option.value }}
          onPress={() => onChange(option.value)}
          className={cn(
            'flex-1 items-center rounded-xl border px-3 py-2',
            value === option.value ? 'border-accent bg-accent' : 'border-border bg-surface',
          )}
        >
          <Typography
            className={cn(
              'text-[11px] font-semibold',
              value === option.value ? 'text-accent-foreground' : 'text-muted',
            )}
          >
            {option.label}
          </Typography>
        </Pressable>
      ))}
    </View>
  );
}
