import { useCallback, useEffect, useRef, useState } from 'react';
import { Camera, ImageUp, TriangleAlert } from 'lucide-react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Button, Spinner, Typography } from 'heroui-native';
import { ScrollView, View } from 'react-native';
import { Disclaimer } from '@/components/Disclaimer';
import { analyseMenu } from '@/lib/analysis';
import { MenuReadError, readMenuPhoto } from '@/lib/analysis/reader';
import type { MenuLine, Profile } from '@/lib/analysis/types';
import { BAND_HEX } from '@/lib/bands';
import { pickMenuPhoto, takeMenuPhoto } from '@/lib/capture';
import { profileDisplayName, useProfile, useProfiles } from '@/lib/store/profile';
import { useScanStore } from '@/lib/store/scans';

type Stage = 'preparing' | 'reading' | 'matching';
type Failure = { kind: 'unreadable' | 'service' | 'photo'; message: string };

const STAGE_TEXT: Record<Stage, string> = {
  preparing: 'Mapping the menu…',
  reading: 'Reading every dish that is printed…',
  matching: 'Quick checkpoint: comparing dishes with your profile…',
};

function mergePageLines(pages: MenuLine[][]): MenuLine[] {
  const seen = new Set<string>();
  const merged: MenuLine[] = [];

  pages.forEach((lines, pageIndex) => {
    lines.forEach((line) => {
      const key = `${line.raw.trim().toLowerCase()}|${line.description?.trim().toLowerCase() ?? ''}`;
      if (seen.has(key)) return;
      seen.add(key);
      merged.push({ ...line, id: `page-${pageIndex + 1}-${line.id}` });
    });
  });

  return merged;
}

function combineProfiles(profiles: Profile[]): Profile {
  const intolerances = new Map<string, Profile['intolerances'][number]>();
  const customAvoids = new Map<string, Profile['customAvoids'][number]>();

  for (const profile of profiles) {
    for (const item of profile.intolerances) {
      const current = intolerances.get(item.id);
      if (!current || item.strictness === 'strict') intolerances.set(item.id, item);
    }
    for (const item of profile.customAvoids) customAvoids.set(item.id, item);
  }

  return {
    id: 'dining-together',
    name: 'Dining Together',
    color: 'teal',
    intolerances: [...intolerances.values()],
    customAvoids: [...customAvoids.values()],
    onboarded: true,
  };
}

/** Reads every queued menu page, then moves directly to personalized results. */
export default function ReadingScreen() {
  const profile = useProfile();
  const profiles = useProfiles();
  const draftPhotos = useScanStore((state) => state.draftPhotos);
  const draftProfileIds = useScanStore((state) => state.draftProfileIds);
  const setDraftPhotos = useScanStore((state) => state.setDraftPhotos);
  const saveScan = useScanStore((state) => state.saveScan);

  const [stage, setStage] = useState<Stage>('preparing');
  const [pageNumber, setPageNumber] = useState(1);
  const [failure, setFailure] = useState<Failure | null>(null);
  const [attempt, setAttempt] = useState(0);
  const startedFor = useRef<string | null>(null);
  const handedOver = useRef(false);

  useEffect(() => {
    if (handedOver.current) return undefined;
    if (draftPhotos.length === 0) {
      router.replace('/(tabs)/scan');
      return undefined;
    }

    const key = `${draftPhotos.map((photo) => photo.uri).join('|')}#${attempt}`;
    if (startedFor.current === key) return undefined;
    startedFor.current = key;

    let cancelled = false;
    setFailure(null);
    setStage('preparing');
    setPageNumber(1);

    const run = async () => {
      const pageLines: MenuLine[][] = [];
      let place: string | undefined;
      let wasTruncated = false;

      for (let index = 0; index < draftPhotos.length; index += 1) {
        if (cancelled) return;
        setPageNumber(index + 1);
        try {
          const read = await readMenuPhoto(draftPhotos[index], (next) => {
            if (!cancelled) setStage(next);
          });
          pageLines.push(read.lines);
          place ??= read.place;
          wasTruncated ||= read.truncated;
        } catch (error) {
          if (error instanceof MenuReadError && draftPhotos.length > 1) {
            throw new MenuReadError(error.kind, `Page ${index + 1}: ${error.message}`);
          }
          throw error;
        }
      }

      if (cancelled) return;
      setStage('matching');
      const lines = mergePageLines(pageLines);
      const selectedProfiles =
        draftProfileIds.length > 1
          ? profiles.filter((item) => draftProfileIds.includes(item.id))
          : [profile];
      const analysisProfile =
        selectedProfiles.length > 1 ? combineProfiles(selectedProfiles) : selectedProfiles[0];
      const analysis = analyseMenu(lines, analysisProfile);
      const profileLabels = selectedProfiles.map((item) => ({
        id: item.id,
        name: profileDisplayName(
          item,
          profiles.findIndex((candidate) => candidate.id === item.id),
        ),
        color: item.color,
      }));
      if (profileLabels.length > 1) {
        analysis.profileSummary = `Checked together for ${profileLabels.map((item) => item.name).join(', ')}.`;
      }
      handedOver.current = true;
      const id = saveScan({
        photoUri: draftPhotos[0]?.uri,
        photoUris: draftPhotos.map((photo) => photo.uri),
        place: place ?? 'Menu',
        lines,
        analysis,
        profiles: profileLabels,
        readerId: 'cloud-vision',
      });
      if (wasTruncated) {
        // The results remain honest: only returned dishes are shown. The reader never pads the list.
        console.warn('One or more menu pages reached the reader output limit.');
      }
      router.replace({ pathname: '/results/[scanId]', params: { scanId: id } });
    };

    void run().catch((error: unknown) => {
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
  }, [attempt, draftPhotos, draftProfileIds, profile, profiles, saveScan]);

  const replacePhotos = useCallback(
    async (mode: 'camera' | 'library') => {
      const outcome = mode === 'camera' ? await takeMenuPhoto() : await pickMenuPhoto();
      if (outcome.error) {
        setFailure({ kind: 'photo', message: outcome.error });
        return;
      }
      if (!outcome.photos || outcome.photos.length === 0) return;
      setDraftPhotos(outcome.photos);
      setAttempt((count) => count + 1);
    },
    [setDraftPhotos],
  );

  const tryAgain = useCallback(() => setAttempt((count) => count + 1), []);
  const firstPhoto = draftPhotos[0];

  return (
    <ScrollView className="bg-background flex-1" contentContainerClassName="gap-5 px-5 pt-3 pb-10">
      {firstPhoto ? (
        <View>
          <Image
            source={{ uri: firstPhoto.uri }}
            style={{ width: '100%', height: 200, borderRadius: 20 }}
            contentFit="cover"
            accessibilityLabel="The first menu page selected"
          />
          {draftPhotos.length > 1 ? (
            <View className="bg-foreground absolute right-3 bottom-3 rounded-full px-3 py-1.5">
              <Typography className="text-background text-xs font-semibold">
                {draftPhotos.length} pages
              </Typography>
            </View>
          ) : null}
        </View>
      ) : null}

      {failure ? (
        <View className="gap-4">
          <View className="border-score-ask-line bg-score-ask-soft flex-row items-start gap-3 rounded-2xl border p-4">
            <TriangleAlert color={BAND_HEX.ask} size={18} />
            <View className="flex-1 gap-1">
              <Typography className="text-score-ask text-sm font-semibold">
                {failure.kind === 'service'
                  ? 'Menu reading is unavailable'
                  : 'We could not read that page'}
              </Typography>
              <Typography className="text-score-ask text-sm leading-6">
                {failure.message}
              </Typography>
            </View>
          </View>

          {failure.kind === 'service' ? (
            <>
              <Typography className="text-muted text-sm leading-6">
                No results were created. Your profile and past scans are untouched.
              </Typography>
              <View className="gap-3">
                <Button size="lg" onPress={tryAgain}>
                  Try these pages again
                </Button>
                <Button
                  variant="secondary"
                  size="lg"
                  onPress={() => router.replace('/(tabs)/history')}
                >
                  Open history
                </Button>
                <Button variant="tertiary" size="lg" onPress={() => router.replace('/(tabs)/scan')}>
                  Back to selected pages
                </Button>
              </View>
            </>
          ) : (
            <>
              <Typography className="text-muted text-sm leading-6">
                A straight-on, well-lit picture with the full page in frame gives the reader the
                best chance. We do not substitute unrelated dishes when a page fails.
              </Typography>
              <View className="gap-3">
                <Button size="lg" onPress={() => replacePhotos('camera')}>
                  <Camera color="#ffffff" size={18} />
                  <Button.Label>Retake as one page</Button.Label>
                </Button>
                <Button variant="secondary" size="lg" onPress={() => replacePhotos('library')}>
                  <ImageUp color={BAND_HEX.ask} size={18} />
                  <Button.Label>Choose replacement pages</Button.Label>
                </Button>
                <Button variant="tertiary" size="lg" onPress={() => router.replace('/(tabs)/scan')}>
                  Back to selected pages
                </Button>
              </View>
            </>
          )}
        </View>
      ) : (
        <View className="gap-4">
          <View className="border-border bg-surface flex-row items-center gap-3 rounded-2xl border p-4">
            <Spinner size="sm" />
            <View className="flex-1 gap-0.5">
              <Typography className="text-sm font-medium">{STAGE_TEXT[stage]}</Typography>
              {draftPhotos.length > 1 && stage !== 'matching' ? (
                <Typography className="text-muted text-xs">
                  Page {pageNumber} of {draftPhotos.length}
                </Typography>
              ) : null}
            </View>
          </View>
          <Typography className="text-muted text-sm leading-6">
            We use only dishes detected on these pages. Anything the menu leaves open becomes a
            question for the kitchen instead of a guess.
          </Typography>
        </View>
      )}

      <Disclaimer />
    </ScrollView>
  );
}
