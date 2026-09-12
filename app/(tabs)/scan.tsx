import { useState } from 'react';
import { Camera, ImageUp, ScanText, TriangleAlert } from 'lucide-react-native';
import { router } from 'expo-router';
import { Button, Typography, useThemeColor } from 'heroui-native';
import { ScrollView, View } from 'react-native';
import { Disclaimer } from '@/components/Disclaimer';
import { BAND_HEX } from '@/lib/bands';
import { pickMenuPhoto, takeMenuPhoto } from '@/lib/capture';
import { hasProfileContent, useProfile } from '@/lib/store/profile';
import { useScanStore } from '@/lib/store/scans';

export default function ScanScreen() {
  const profile = useProfile();
  const setDraftPhoto = useScanStore((state) => state.setDraftPhoto);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [accent, muted] = useThemeColor(['accent', 'muted']);

  const capture = async (mode: 'camera' | 'library') => {
    setError(null);
    setBusy(true);
    try {
      const outcome = mode === 'camera' ? await takeMenuPhoto() : await pickMenuPhoto();
      if (outcome.error) {
        setError(outcome.error);
        return;
      }
      if (!outcome.photo) return;
      setDraftPhoto(outcome.photo);
      router.push('/reading');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView className="bg-background flex-1" contentContainerClassName="gap-4 px-5 pt-2 pb-10">
      <View className="gap-2">
        <Typography type="h3">Point it at the menu</Typography>
        <Typography className="text-muted text-sm leading-6">
          Take one photo and PlatePilot reads the page itself, then tells you which dishes look like
          the closest match for your profile.
        </Typography>
      </View>

      <View className="border-border bg-surface gap-3 rounded-3xl border p-5">
        <View className="bg-accent-soft h-11 w-11 items-center justify-center rounded-2xl">
          <Camera color={accent} size={22} />
        </View>
        <Typography className="text-base font-semibold">Take a photo</Typography>
        <Typography className="text-muted text-sm leading-6">
          One page at a time, held straight, whole page in frame. Your profile stays on the phone.
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
          Use a picture you already have, or a screenshot of a menu from a website.
        </Typography>
        <Button variant="secondary" size="lg" isDisabled={busy} onPress={() => capture('library')}>
          Choose from library
        </Button>
      </View>

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
