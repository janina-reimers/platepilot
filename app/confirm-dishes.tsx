import { useEffect, useMemo, useState } from 'react';
import { CircleCheck, CircleDashed, Plus, Search, X } from 'lucide-react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Button, Input, Spinner, TextArea, Typography, useThemeColor } from 'heroui-native';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import { Disclaimer } from '@/components/Disclaimer';
import { analyseMenu } from '@/lib/analysis';
import { matchDish, parseMenuText, suggestDishes } from '@/lib/analysis/match';
import { getAutomaticReader } from '@/lib/analysis/reader';
import { BAND_HEX } from '@/lib/bands';
import { hasProfileContent, useProfile } from '@/lib/store/profile';
import { useScanStore } from '@/lib/store/scans';

export default function ConfirmDishesScreen() {
  const profile = useProfile();
  const draftPhotoUri = useScanStore((state) => state.draftPhotoUri);
  const saveScan = useScanStore((state) => state.saveScan);

  const autoReader = useMemo(() => getAutomaticReader(), []);
  const [place, setPlace] = useState('');
  const [text, setText] = useState('');
  const [search, setSearch] = useState('');
  const [readerId, setReaderId] = useState('manual');
  const [readerState, setReaderState] = useState<'idle' | 'reading' | 'failed'>(() =>
    autoReader && draftPhotoUri ? 'reading' : 'idle',
  );
  const [notice, setNotice] = useState<string | null>(null);

  const [accent, muted] = useThemeColor(['accent', 'muted']);

  const lines = useMemo(() => parseMenuText(text), [text]);
  const recognised = useMemo(
    () => lines.map((line) => ({ line, match: matchDish(line.raw) })),
    [lines],
  );
  const suggestions = useMemo(() => suggestDishes(search, 10), [search]);
  const knownCount = recognised.filter((item) => item.match.dish).length;

  // If an automatic reader is configured, try it once on the photo. Otherwise
  // the user confirms the dish names themselves, which is the default path.
  useEffect(() => {
    if (!autoReader || !draftPhotoUri) return undefined;

    let cancelled = false;
    autoReader
      .read({ imageUri: draftPhotoUri })
      .then((result) => {
        if (cancelled) return;
        setText(result.lines.map((line) => line.raw).join('\n'));
        setReaderId(result.readerId);
        setNotice(result.notice ?? null);
        setReaderState('idle');
      })
      .catch(() => {
        if (cancelled) return;
        setReaderState('failed');
      });

    return () => {
      cancelled = true;
    };
  }, [autoReader, draftPhotoUri]);

  const addDish = (name: string) => {
    setText((current) => (current.trim().length === 0 ? name : `${current.trim()}\n${name}`));
    setSearch('');
  };

  const removeLine = (raw: string) => {
    setText((current) =>
      current
        .split(/\r?\n/)
        .filter((entry) => entry.trim() !== raw.trim())
        .join('\n'),
    );
  };

  const runAnalysis = () => {
    if (lines.length === 0) return;
    const analysis = analyseMenu(lines, profile);
    const id = saveScan({
      photoUri: draftPhotoUri,
      place: place.trim().length > 0 ? place.trim() : 'Menu',
      lines,
      analysis,
      readerId,
    });
    router.replace({ pathname: '/results/[scanId]', params: { scanId: id } });
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="bg-background flex-1"
    >
      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-4 px-5 pt-3 pb-8"
        keyboardShouldPersistTaps="handled"
      >
        {draftPhotoUri ? (
          <Image
            source={{ uri: draftPhotoUri }}
            style={{ width: '100%', height: 160, borderRadius: 20 }}
            contentFit="cover"
            accessibilityLabel="The menu photo you took"
          />
        ) : null}

        {readerState === 'reading' ? (
          <View className="bg-surface-secondary flex-row items-center gap-3 rounded-2xl p-4">
            <Spinner size="sm" />
            <Typography className="text-muted flex-1 text-sm">Reading the photo…</Typography>
          </View>
        ) : null}

        {readerState === 'failed' ? (
          <Typography className="text-score-ask text-sm leading-6">
            The photo could not be read this time. Type the dish names below instead.
          </Typography>
        ) : null}

        {notice ? (
          <Typography className="text-muted text-sm leading-6">{notice}</Typography>
        ) : (
          <Typography className="text-muted text-sm leading-6">
            Enter the dishes you are considering, one per line. PlatePilot looks each one up rather
            than guessing from the photo.
          </Typography>
        )}

        <View className="gap-2">
          <Typography className="text-muted text-xs font-semibold tracking-wide uppercase">
            Where are you?
          </Typography>
          <Input placeholder="Restaurant name (optional)" value={place} onChangeText={setPlace} />
        </View>

        <View className="gap-2">
          <Typography className="text-muted text-xs font-semibold tracking-wide uppercase">
            Dishes
          </Typography>
          <TextArea
            placeholder={'Caesar salad\nMushroom risotto\nGrilled salmon'}
            value={text}
            onChangeText={setText}
            className="min-h-32"
            numberOfLines={6}
          />
        </View>

        <View className="gap-2">
          <Typography className="text-muted text-xs font-semibold tracking-wide uppercase">
            Or find a dish we already know
          </Typography>
          <View className="flex-row items-center gap-2">
            <Search color={muted} size={16} />
            <Input
              className="flex-1"
              placeholder="Search dishes, e.g. risotto"
              value={search}
              onChangeText={setSearch}
              autoCorrect={false}
            />
          </View>
          {suggestions.length > 0 ? (
            <View className="flex-row flex-wrap gap-2">
              {suggestions.map((dish) => (
                <Pressable
                  key={dish.id}
                  accessibilityRole="button"
                  onPress={() => addDish(dish.name)}
                  className="border-border bg-surface flex-row items-center gap-1.5 rounded-full border px-3 py-2"
                >
                  <Plus color={accent} size={13} />
                  <Typography className="text-xs font-medium">{dish.name}</Typography>
                </Pressable>
              ))}
            </View>
          ) : null}
        </View>

        {recognised.length > 0 ? (
          <View className="gap-2">
            <Typography className="text-muted text-xs font-semibold tracking-wide uppercase">
              {knownCount} of {recognised.length} recognised
            </Typography>
            {recognised.map(({ line, match }) => (
              <View
                key={line.id}
                className="border-border bg-surface flex-row items-center gap-3 rounded-2xl border px-4 py-3"
              >
                {match.dish ? (
                  <CircleCheck color={BAND_HEX.good} size={17} />
                ) : (
                  <CircleDashed color={muted} size={17} />
                )}
                <View className="flex-1 gap-0.5">
                  <Typography className="text-sm font-medium" numberOfLines={1}>
                    {line.raw}
                  </Typography>
                  <Typography className="text-muted text-xs">
                    {match.dish
                      ? `Matched to our recipe for ${match.dish.name}`
                      : 'No recipe yet — we will give you questions instead of a score'}
                  </Typography>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Remove ${line.raw}`}
                  onPress={() => removeLine(line.raw)}
                  className="bg-surface-secondary h-8 w-8 items-center justify-center rounded-full"
                >
                  <X color={muted} size={14} />
                </Pressable>
              </View>
            ))}
          </View>
        ) : null}

        {!hasProfileContent(profile) ? (
          <View className="border-score-ask-line bg-score-ask-soft gap-2 rounded-2xl border p-4">
            <Typography className="text-score-ask text-sm font-semibold">
              Your profile is empty
            </Typography>
            <Typography className="text-score-ask text-sm leading-6">
              Without anything to check against, every dish will simply come back unscored. Add what
              you avoid first.
            </Typography>
            <Button variant="secondary" size="sm" onPress={() => router.push('/(tabs)/profile')}>
              Open profile
            </Button>
          </View>
        ) : null}

        <Disclaimer />
      </ScrollView>

      <View className="border-border pb-safe-offset-4 border-t px-5 pt-4">
        <Button size="lg" isDisabled={lines.length === 0} onPress={runAnalysis}>
          {lines.length === 0
            ? 'Add at least one dish'
            : `Check ${lines.length === 1 ? 'this dish' : `these ${lines.length} dishes`}`}
        </Button>
      </View>
    </KeyboardAvoidingView>
  );
}
