import { useState } from 'react';
import { Camera, ImageUp, ScanText, Trash2, TriangleAlert, Users } from 'lucide-react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Button, Typography, useThemeColor } from 'heroui-native';
import { ScrollView, View } from 'react-native';
import { Disclaimer } from '@/components/Disclaimer';
import { BAND_HEX } from '@/lib/bands';
import { pickMenuPhoto, takeMenuPhoto } from '@/lib/capture';
import {
  hasProfileContent,
  profileDisplayName,
  useProfile,
  useProfiles,
} from '@/lib/store/profile';
import { useScanStore } from '@/lib/store/scans';

export default function ScanScreen() {
  const profile = useProfile();
  const profiles = useProfiles();
  const draftPhotos = useScanStore((state) => state.draftPhotos);
  const draftProfileIds = useScanStore((state) => state.draftProfileIds);
  const setDraftPhotos = useScanStore((state) => state.setDraftPhotos);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [accent, muted] = useThemeColor(['accent', 'muted']);
  const groupProfiles = profiles.filter((item) => draftProfileIds.includes(item.id));
  const activeIndex = profiles.findIndex((item) => item.id === profile.id);
  const targetLabel =
    groupProfiles.length > 1
      ? `Dining Together: ${groupProfiles
          .map((item) => profileDisplayName(item, profiles.indexOf(item)))
          .join(', ')}`
      : `Checking for: ${profileDisplayName(profile, activeIndex)}`;

  const capture = async (mode: 'camera' | 'library') => {
    setError(null);
    setBusy(true);
    try {
      const outcome = mode === 'camera' ? await takeMenuPhoto() : await pickMenuPhoto();
      if (outcome.error) {
        setError(outcome.error);
        return;
      }
      if (!outcome.photos || outcome.photos.length === 0) return;
      setDraftPhotos([...draftPhotos, ...outcome.photos].slice(0, 6));
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView className="bg-background flex-1" contentContainerClassName="gap-4 px-5 pt-2 pb-10">
      <View className="gap-2">
        <Typography type="h3">Point it at the menu</Typography>
        <Typography className="text-muted text-sm leading-6">
          Add up to six menu pages. PlatePilot reads every page, then shows which dishes look like
          the closest match for your active profile.
        </Typography>
      </View>

      <View className="border-border bg-surface-secondary flex-row items-center gap-3 rounded-2xl border p-4">
        <Users color={accent} size={18} />
        <View className="flex-1 gap-0.5">
          <Typography className="text-sm font-semibold">{targetLabel}</Typography>
          <Typography className="text-muted text-xs">
            {groupProfiles.length > 1
              ? 'Results use the strictest combined profile.'
              : 'Switch profiles from the Food Profile tab.'}
          </Typography>
        </View>
        {profiles.length > 1 ? (
          <Button variant="ghost" size="sm" onPress={() => router.push('/dining-together')}>
            Change
          </Button>
        ) : null}
      </View>

      <View className="border-border bg-surface gap-3 rounded-3xl border p-5">
        <View className="bg-accent-soft h-11 w-11 items-center justify-center rounded-2xl">
          <Camera color={accent} size={22} />
        </View>
        <Typography className="text-base font-semibold">Take a photo</Typography>
        <Typography className="text-muted text-sm leading-6">
          Add a page at a time, held straight with the whole page in frame. Your profile stays on
          the phone.
        </Typography>
        <Button size="lg" isDisabled={busy} onPress={() => capture('camera')}>
          Open camera
        </Button>
      </View>

      <View className="border-border bg-surface gap-3 rounded-3xl border p-5">
        <View className="bg-surface-secondary h-11 w-11 items-center justify-center rounded-2xl">
          <ImageUp color={muted} size={22} />
        </View>
        <Typography className="text-base font-semibold">Upload a photo</Typography>
        <Typography className="text-muted text-sm leading-6">
          Choose one or several pictures, including menu screenshots. You can combine them with
          camera photos.
        </Typography>
        <Button variant="secondary" size="lg" isDisabled={busy} onPress={() => capture('library')}>
          Choose from library
        </Button>
      </View>

      {draftPhotos.length > 0 ? (
        <View className="border-border bg-surface gap-3 rounded-3xl border p-4">
          <View className="flex-row items-center justify-between gap-3">
            <View className="gap-0.5">
              <Typography className="text-sm font-semibold">
                {draftPhotos.length === 1 ? '1 page ready' : `${draftPhotos.length} pages ready`}
              </Typography>
              <Typography className="text-muted text-xs">Maximum 6 pages per scan</Typography>
            </View>
            <Button variant="tertiary" size="sm" onPress={() => setDraftPhotos([])}>
              Clear
            </Button>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerClassName="gap-2"
          >
            {draftPhotos.map((photo, index) => (
              <View key={photo.uri} className="relative">
                <Image
                  source={{ uri: photo.uri }}
                  style={{ width: 82, height: 104, borderRadius: 12 }}
                  contentFit="cover"
                  accessibilityLabel={`Menu page ${index + 1}`}
                />
                <Button
                  variant="danger-soft"
                  size="sm"
                  isIconOnly
                  className="absolute top-1 right-1 h-7 w-7"
                  accessibilityLabel={`Remove menu page ${index + 1}`}
                  onPress={() =>
                    setDraftPhotos(draftPhotos.filter((_, itemIndex) => itemIndex !== index))
                  }
                >
                  <Trash2 color={BAND_HEX.avoid} size={13} />
                </Button>
              </View>
            ))}
          </ScrollView>
          <Button size="lg" onPress={() => router.push('/reading')}>
            Analyze {draftPhotos.length === 1 ? 'this page' : 'these pages'}
          </Button>
        </View>
      ) : null}

      <View className="border-border bg-surface-secondary flex-row items-start gap-3 rounded-2xl border p-4">
        <ScanText color={muted} size={18} />
        <Typography className="text-muted flex-1 text-sm leading-6">
          We read only what is printed. Where the menu is vague — the sauce, the frying oil, the
          dressing — you get a question to ask instead of a guess.
        </Typography>
      </View>

      {error ? (
        <View className="border-score-ask-line bg-score-ask-soft flex-row items-start gap-3 rounded-2xl border p-4">
          <TriangleAlert color={BAND_HEX.ask} size={18} />
          <Typography className="text-score-ask flex-1 text-sm leading-6">{error}</Typography>
        </View>
      ) : null}

      {!hasProfileContent(profile) ? (
        <View className="border-score-ask-line bg-score-ask-soft gap-2 rounded-2xl border p-4">
          <Typography className="text-score-ask text-sm font-semibold">
            Your profile is empty
          </Typography>
          <Typography className="text-score-ask text-sm leading-6">
            Without anything to check against, every dish comes back unscored. Add what you avoid
            first.
          </Typography>
          <Button variant="secondary" size="sm" onPress={() => router.push('/(tabs)/profile')}>
            Open profile
          </Button>
        </View>
      ) : null}

      <Disclaimer />
    </ScrollView>
  );
}
