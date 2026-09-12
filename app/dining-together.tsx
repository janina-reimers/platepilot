import { useState } from 'react';
import { Users } from 'lucide-react-native';
import { router } from 'expo-router';
import { Button, Typography, useThemeColor } from 'heroui-native';
import { ScrollView, View } from 'react-native';
import { Disclaimer } from '@/components/Disclaimer';
import { SelectableRow } from '@/components/SelectableRow';
import { profileDisplayName, useProfiles } from '@/lib/store/profile';
import { useScanStore } from '@/lib/store/scans';

export default function DiningTogetherScreen() {
  const profiles = useProfiles();
  const savedIds = useScanStore((state) => state.draftProfileIds);
  const setDraftProfileIds = useScanStore((state) => state.setDraftProfileIds);
  const [selectedIds, setSelectedIds] = useState<string[]>(
    savedIds.length > 1 ? savedIds : profiles.map((profile) => profile.id),
  );
  const [accent] = useThemeColor(['accent']);

  const toggle = (id: string) =>
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );

  const continueToScan = () => {
    if (selectedIds.length < 2) return;
    setDraftProfileIds(selectedIds);
    router.replace('/(tabs)/scan');
  };

  return (
    <ScrollView className="bg-background flex-1" contentContainerClassName="gap-5 px-5 pt-4 pb-10">
      <View className="gap-2">
        <View className="bg-accent-soft h-12 w-12 items-center justify-center rounded-2xl">
          <Users color={accent} size={24} />
        </View>
        <Typography type="h4">Dining Together</Typography>
        <Typography className="text-muted text-sm leading-6">
          Choose at least two profiles. PlatePilot will use the strictest combined result, so a dish
          is only highlighted when it works well across the selected profiles.
        </Typography>
      </View>

      <View className="gap-2">
        {profiles.map((profile, index) => (
          <SelectableRow
            key={profile.id}
            label={profileDisplayName(profile, index)}
            description={
              profile.intolerances.length + profile.customAvoids.length > 0
                ? `${profile.intolerances.length + profile.customAvoids.length} profile items`
                : 'No food preferences added yet'
            }
            selected={selectedIds.includes(profile.id)}
            onToggle={() => toggle(profile.id)}
          />
        ))}
      </View>

      {selectedIds.length < 2 ? (
        <Typography className="text-score-ask text-sm">Select at least two profiles.</Typography>
      ) : null}

      <Button size="lg" isDisabled={selectedIds.length < 2} onPress={continueToScan}>
        Use these profiles
      </Button>
      <Button
        variant="ghost"
        onPress={() => {
          setDraftProfileIds([]);
          router.replace('/(tabs)/scan');
        }}
      >
        Use active profile only
      </Button>

      <Disclaimer text="Dining Together combines the selected profiles conservatively. Restaurant staff still need to confirm ingredients, preparation and any requested changes." />
    </ScrollView>
  );
}
