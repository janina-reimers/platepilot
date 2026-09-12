import { useMemo, useState } from 'react';
import { ArrowLeft, Plus, ShieldCheck, X } from 'lucide-react-native';
import { router } from 'expo-router';
import { Button, Input, Separator, Typography, useThemeColor } from 'heroui-native';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from '@/components/ui/primitives/SafeAreaView';
import { Disclaimer } from '@/components/Disclaimer';
import { SelectableRow } from '@/components/SelectableRow';
import { matchCustomAvoidText } from '@/lib/analysis/profile';
import type { Strictness } from '@/lib/analysis/types';
import { CONDITIONS, INTOLERANCES } from '@/lib/data/triggers';
import { useProfileStore } from '@/lib/store/profile';
import { cn } from '@/lib/utils';

const STEPS = ['Welcome', 'Intolerances', 'Conditions', 'Anything else', 'Review'] as const;

const CATEGORY_TITLES: Record<string, string> = {
  common: 'The most common ones',
  carbohydrate: 'Carbohydrate groups',
  other: 'Other things people avoid',
};

export default function OnboardingScreen() {
  const [step, setStep] = useState(0);
  const [draftAvoid, setDraftAvoid] = useState('');

  const profile = useProfileStore((state) => state.profile);
  const toggleIntolerance = useProfileStore((state) => state.toggleIntolerance);
  const setStrictness = useProfileStore((state) => state.setStrictness);
  const toggleCondition = useProfileStore((state) => state.toggleCondition);
  const addCustomAvoid = useProfileStore((state) => state.addCustomAvoid);
  const removeCustomAvoid = useProfileStore((state) => state.removeCustomAvoid);
  const completeOnboarding = useProfileStore((state) => state.completeOnboarding);

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

  const finish = () => {
    completeOnboarding();
    router.replace('/(tabs)');
  };

  const isLast = step === STEPS.length - 1;

  return (
    <SafeAreaView edges={['top']} className="bg-background flex-1">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <View className="flex-row items-center gap-3 px-5 pt-2 pb-3">
          {step > 0 ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Go back a step"
              onPress={() => setStep((value) => value - 1)}
              className="bg-surface-secondary h-9 w-9 items-center justify-center rounded-full"
            >
              <ArrowLeft color={muted} size={18} />
            </Pressable>
          ) : null}
          <View className="flex-1 gap-1.5">
            <Typography className="text-muted text-xs font-medium">
              Step {step + 1} of {STEPS.length} · {STEPS[step]}
            </Typography>
            <View className="bg-surface-secondary h-1.5 overflow-hidden rounded-full">
              <View
                className="bg-accent h-full rounded-full"
                style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
              />
            </View>
          </View>
        </View>

        <ScrollView
          className="flex-1"
          contentContainerClassName="gap-4 px-5 pb-8"
          keyboardShouldPersistTaps="handled"
        >
          {step === 0 ? (
            <View className="gap-4">
              <View className="bg-accent-soft h-12 w-12 items-center justify-center rounded-2xl">
                <ShieldCheck color={accent} size={24} />
              </View>
              <Typography type="h2">Eating out, with fewer guesses</Typography>
              <Typography className="text-muted text-base leading-7">
                Tell PlatePilot what you cannot eat. Photograph a menu, and it will work through the
                usual recipe behind each dish and show you which ones look like a fit.
              </Typography>

              <View className="border-border bg-surface gap-3 rounded-2xl border p-4">
                <Typography className="text-sm font-semibold">What it does well</Typography>
                <Typography className="text-muted text-sm leading-6">
                  It knows the recipes most restaurants follow, and it is clear about the difference
                  between what is normally in a dish and what only the kitchen can confirm.
                </Typography>
                <Separator />
                <Typography className="text-sm font-semibold">Where it stops</Typography>
                <Typography className="text-muted text-sm leading-6">
                  It has never seen this restaurant’s kitchen. It cannot promise a dish is safe, and
                  it does not give medical or allergy advice. When something matters, the staff and
                  your own healthcare team decide, not the app.
                </Typography>
              </View>
            </View>
          ) : null}

          {step === 1 ? (
            <View className="gap-4">
              <Typography type="h3">What do you have trouble with?</Typography>
              <Typography className="text-muted text-sm leading-6">
                Pick anything you have been told to avoid. You can change all of this later.
              </Typography>

              {(['common', 'carbohydrate', 'other'] as const).map((category) => (
                <View key={category} className="gap-2">
                  <Typography className="text-muted pt-2 text-xs font-semibold tracking-wide uppercase">
                    {CATEGORY_TITLES[category]}
                  </Typography>
                  {grouped[category].map((option) => {
                    const selected = profile.intolerances.some((item) => item.id === option.id);
                    return (
                      <SelectableRow
                        key={option.id}
                        label={option.label}
                        description={option.description}
                        selected={selected}
                        onToggle={() => toggleIntolerance(option.id)}
                      >
                        <StrictnessPicker
                          value={strictnessOf(option.id)}
                          onChange={(value) => setStrictness(option.id, value)}
                        />
                      </SelectableRow>
                    );
                  })}
                </View>
              ))}
            </View>
          ) : null}

          {step === 2 ? (
            <View className="gap-4">
              <Typography type="h3">Anything a doctor is helping you with?</Typography>
              <Typography className="text-muted text-sm leading-6">
                These are not treated as strict rules. PlatePilot will simply point out the things
                that often come up, so you can weigh them up yourself.
              </Typography>

              <View className="gap-2">
                {CONDITIONS.map((option) => (
                  <SelectableRow
                    key={option.id}
                    label={option.label}
                    description={option.description}
                    selected={profile.conditionIds.includes(option.id)}
                    onToggle={() => toggleCondition(option.id)}
                  >
                    {option.note ? (
                      <Typography className="text-muted text-xs leading-5">
                        {option.note}
                      </Typography>
                    ) : null}
                  </SelectableRow>
                ))}
              </View>
            </View>
          ) : null}

          {step === 3 ? (
            <View className="gap-4">
              <Typography type="h3">Anything else you cannot have?</Typography>
              <Typography className="text-muted text-sm leading-6">
                Foods or drinks you skip for any reason. One per line, in your own words.
              </Typography>

              <View className="flex-row items-center gap-2">
                <Input
                  className="flex-1"
                  placeholder="For example: coriander, tap water, mango"
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
                  We may not recognise this one. It will still be added, and PlatePilot will put it
                  in your list of questions for staff.
                </Typography>
              ) : null}

              <View className="gap-2">
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
            </View>
          ) : null}

          {step === 4 ? (
            <View className="gap-4">
              <Typography type="h3">Here is your profile</Typography>

              <ReviewBlock
                title="You avoid"
                items={profile.intolerances.map((item) => {
                  const option = INTOLERANCES.find((entry) => entry.id === item.id);
                  const suffix = item.strictness === 'strict' ? 'completely' : 'in larger amounts';
                  return `${option?.label ?? item.id} — ${suffix}`;
                })}
                emptyText="Nothing selected."
              />

              <ReviewBlock
                title="You are keeping an eye on"
                items={profile.conditionIds.map(
                  (id) => CONDITIONS.find((entry) => entry.id === id)?.label ?? id,
                )}
                emptyText="Nothing selected."
              />

              <ReviewBlock
                title="Your own list"
                items={profile.customAvoids.map((avoid) => avoid.text)}
                emptyText="Nothing added."
              />

              <Disclaimer />
            </View>
          ) : null}
        </ScrollView>

        <View className="border-border pb-safe-offset-4 gap-2 border-t px-5 pt-4">
          <Button size="lg" onPress={() => (isLast ? finish() : setStep((value) => value + 1))}>
            {isLast ? 'Start using PlatePilot' : step === 0 ? 'Get started' : 'Continue'}
          </Button>
          {step > 0 && !isLast ? (
            <Button variant="ghost" size="sm" onPress={() => setStep((value) => value + 1)}>
              Skip this step
            </Button>
          ) : null}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
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

function ReviewBlock({
  title,
  items,
  emptyText,
}: {
  title: string;
  items: string[];
  emptyText: string;
}) {
  return (
    <View className="border-border bg-surface gap-2 rounded-2xl border p-4">
      <Typography className="text-muted text-xs font-semibold tracking-wide uppercase">
        {title}
      </Typography>
      {items.length === 0 ? (
        <Typography className="text-muted text-sm">{emptyText}</Typography>
      ) : (
        items.map((item) => (
          <Typography key={item} className="text-sm leading-6">
            {item}
          </Typography>
        ))
      )}
    </View>
  );
}
