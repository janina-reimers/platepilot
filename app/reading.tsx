import { useCallback, useEffect, useRef, useState } from 'react';
import { Camera, ImageUp, TriangleAlert } from 'lucide-react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Button, Spinner, Typography } from 'heroui-native';
import { ScrollView, View } from 'react-native';
import { Disclaimer } from '@/components/Disclaimer';
import { analyseMenu } from '@/lib/analysis';
import { MenuReadError, readMenuPhoto } from '@/lib/analysis/reader';
import { BAND_HEX } from '@/lib/bands';
import { pickMenuPhoto, takeMenuPhoto } from '@/lib/capture';
import { useProfile } from '@/lib/store/profile';
import { useScanStore } from '@/lib/store/scans';

type Stage = 'preparing' | 'reading' | 'matching';

type Failure = { kind: 'unreadable' | 'service' | 'photo'; message: string };

const STAGE_TEXT: Record<Stage, string> = {
  preparing: 'Getting the photo ready…',
  reading: 'Reading what is printed on the menu…',
  matching: 'Checking the dishes against your profile…',
};

/**
 * The waiting screen between the photo and the results.
 *
 * It reads the photo, matches the dishes and moves straight on. Nothing here
 * asks the user to pick dishes: if the photo cannot be read, the honest answer
 * is to take another one.
 */
export default function ReadingScreen() {
  const profile = useProfile();
  const draftPhoto = useScanStore((state) => state.draftPhoto);
  const setDraftPhoto = useScanStore((state) => state.setDraftPhoto);
  const saveScan = useScanStore((state) => state.saveScan);

  const [stage, setStage] = useState<Stage>('preparing');
  const [failure, setFailure] = useState<Failure | null>(null);
  const [attempt, setAttempt] = useState(0);
  const startedFor = useRef<string | null>(null);

  useEffect(() => {
    if (!draftPhoto) {
      router.replace('/(tabs)/scan');
      return undefined;
    }

    const key = `${draftPhoto.uri}#${attempt}`;
    if (startedFor.current === key) return undefined;
    startedFor.current = key;

    let cancelled = false;
    setFailure(null);
    setStage('preparing');

    readMenuPhoto(draftPhoto, (next) => {
      if (!cancelled) setStage(next);
    })
      .then((read) => {
        if (cancelled) return;
        setStage('matching');
        const analysis = analyseMenu(read.lines, profile);
        const id = saveScan({
          photoUri: draftPhoto.uri,
          place: read.place ?? 'Menu',
          lines: read.lines,
          analysis,
          readerId: read.readerId,
        });
        router.replace({ pathname: '/results/[scanId]', params: { scanId: id } });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setFailure(
          error instanceof MenuReadError
            ? { kind: error.kind, message: error.message }
            : {
                kind: 'service',
                message: 'Something went wrong while reading the menu. Please try again.',
              },
        );
      });

    return () => {
      cancelled = true;
    };
  }, [attempt, draftPhoto, profile, saveScan]);

  const retry = useCallback(
    async (mode: 'camera' | 'library') => {
      const outcome = mode === 'camera' ? await takeMenuPhoto() : await pickMenuPhoto();
      if (outcome.error) {
        setFailure({ kind: 'photo', message: outcome.error });
        return;
      }
      if (!outcome.photo) return;
      setDraftPhoto(outcome.photo);
      setAttempt((count) => count + 1);
    },
    [setDraftPhoto],
  );

  /** Same photo, another attempt — the right move when the reader itself failed. */
  const tryAgain = useCallback(() => setAttempt((count) => count + 1), []);

  return (
    <ScrollView className="bg-background flex-1" contentContainerClassName="gap-5 px-5 pt-3 pb-10">
      {draftPhoto ? (
        <Image
          source={{ uri: draftPhoto.uri }}
          style={{ width: '100%', height: 200, borderRadius: 20 }}
          contentFit="cover"
          accessibilityLabel="The menu photo you took"
        />
      ) : null}

      {failure ? (
        <View className="gap-4">
          <View className="border-score-ask-line bg-score-ask-soft flex-row items-start gap-3 rounded-2xl border p-4">
            <TriangleAlert color={BAND_HEX.ask} size={18} />
            <View className="flex-1 gap-1">
              <Typography className="text-score-ask text-sm font-semibold">
                {failure.kind === 'service'
                  ? 'Menu reading is unavailable'
                  : 'We could not read that one'}
              </Typography>
              <Typography className="text-score-ask text-sm leading-6">
                {failure.message}
              </Typography>
            </View>
          </View>

          {failure.kind === 'service' ? (
            <>
              <Typography className="text-muted text-sm leading-6">
                Nothing is wrong with your photo. Your profile and past scans are untouched, and you
                can still open an earlier scan from History.
              </Typography>
              <View className="gap-3">
                <Button size="lg" onPress={tryAgain}>
                  Try this photo again
                </Button>
                <Button
                  variant="secondary"
                  size="lg"
                  onPress={() => router.replace('/(tabs)/history')}
                >
                  Open history
                </Button>
                <Button variant="tertiary" size="lg" onPress={() => router.replace('/(tabs)/scan')}>
                  Back to scanning
                </Button>
              </View>
            </>
          ) : (
            <>
              <Typography className="text-muted text-sm leading-6">
                A straight-on shot of a single page, with the whole page in frame and no glare,
                gives us the most to work with.
              </Typography>
              <View className="gap-3">
                <Button size="lg" onPress={() => retry('camera')}>
                  <Camera color="#ffffff" size={18} />
                  <Button.Label>Take another photo</Button.Label>
                </Button>
                <Button variant="secondary" size="lg" onPress={() => retry('library')}>
                  <ImageUp color={BAND_HEX.ask} size={18} />
                  <Button.Label>Upload a different picture</Button.Label>
                </Button>
                <Button variant="tertiary" size="lg" onPress={() => router.replace('/(tabs)/scan')}>
                  Back to scanning
                </Button>
              </View>
            </>
          )}
        </View>
      ) : (
        <View className="gap-4">
          <View className="border-border bg-surface flex-row items-center gap-3 rounded-2xl border p-4">
            <Spinner size="sm" />
            <Typography className="flex-1 text-sm font-medium">{STAGE_TEXT[stage]}</Typography>
          </View>
          <Typography className="text-muted text-sm leading-6">
            We only take what the menu actually prints. Anything the page leaves open we turn into a
            question for the kitchen instead of filling it in ourselves.
          </Typography>
        </View>
      )}

      <Disclaimer />
    </ScrollView>
  );
}
