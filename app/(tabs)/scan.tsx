import { useState } from 'react';
import { Camera, ImageUp, Keyboard, TriangleAlert } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { Button, Typography, useThemeColor } from 'heroui-native';
import { ScrollView, View } from 'react-native';
import { Disclaimer } from '@/components/Disclaimer';
import { BAND_HEX } from '@/lib/bands';
import { useScanStore } from '@/lib/store/scans';

export default function ScanScreen() {
  const setDraftPhoto = useScanStore((state) => state.setDraftPhoto);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [accent, muted] = useThemeColor(['accent', 'muted']);

  const goToConfirm = (uri?: string) => {
    setDraftPhoto(uri);
    router.push('/confirm-dishes');
  };

  const takePhoto = async () => {
    setError(null);
    setBusy(true);
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        setError(
          'PlatePilot needs camera access to photograph a menu. You can also type the dishes instead.',
        );
        return;
      }
      const result = await ImagePicker.launchCameraAsync({ quality: 0.6 });
      if (!result.canceled && result.assets[0]) goToConfirm(result.assets[0].uri);
    } catch {
      setError('The camera could not be opened. You can type the dish names instead.');
    } finally {
      setBusy(false);
    }
  };

  const pickPhoto = async () => {
    setError(null);
    setBusy(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.6,
      });
      if (!result.canceled && result.assets[0]) goToConfirm(result.assets[0].uri);
    } catch {
      setError('That photo could not be opened. You can type the dish names instead.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView className="bg-background flex-1" contentContainerClassName="gap-4 px-5 pt-2 pb-10">
      <View className="gap-2">
        <Typography type="h3">Start with the menu</Typography>
        <Typography className="text-muted text-sm leading-6">
          A clear photo of the page works best. On the next screen you confirm the dish names, so
          nothing gets scored from a blurry guess.
        </Typography>
      </View>

      <View className="border-border bg-surface gap-3 rounded-3xl border p-5">
        <View className="bg-accent-soft h-11 w-11 items-center justify-center rounded-2xl">
          <Camera color={accent} size={22} />
        </View>
        <Typography className="text-base font-semibold">Take a photo</Typography>
        <Typography className="text-muted text-sm leading-6">
          The photo stays on your phone. It is only there so you can look back at what you read.
        </Typography>
        <Button size="lg" isDisabled={busy} onPress={takePhoto}>
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
        <Button variant="secondary" size="lg" isDisabled={busy} onPress={pickPhoto}>
          Choose from library
        </Button>
      </View>

      <View className="border-border bg-surface gap-3 rounded-3xl border p-5">
        <View className="bg-surface-secondary h-11 w-11 items-center justify-center rounded-2xl">
          <Keyboard color={muted} size={22} />
        </View>
        <Typography className="text-base font-semibold">Type the dishes instead</Typography>
        <Typography className="text-muted text-sm leading-6">
          Handy when the menu is on a board, or read out to you.
        </Typography>
        <Button variant="tertiary" size="lg" onPress={() => goToConfirm(undefined)}>
          Enter dish names
        </Button>
      </View>

      {error ? (
        <View className="border-score-ask-line bg-score-ask-soft flex-row items-start gap-3 rounded-2xl border p-4">
          <TriangleAlert color={BAND_HEX.ask} size={18} />
          <Typography className="text-score-ask flex-1 text-sm leading-6">{error}</Typography>
        </View>
      ) : null}

      <Disclaimer />
    </ScrollView>
  );
}
