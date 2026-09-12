import { formatDistanceToNow } from 'date-fns';
import { Camera, ChevronRight, CircleHelp, Utensils } from 'lucide-react-native';
import { Link, router } from 'expo-router';
import { Button, Separator, Typography, useThemeColor } from 'heroui-native';
import { Pressable, ScrollView, View } from 'react-native';
import { BrandLogo } from '@/components/BrandLogo';
import { Disclaimer } from '@/components/Disclaimer';
import { ScoreBadge } from '@/components/ScoreBadge';
import { describeProfile } from '@/lib/analysis/profile';
import { hasProfileContent, useProfile } from '@/lib/store/profile';
import { useScans } from '@/lib/store/scans';

export default function HomeScreen() {
  const profile = useProfile();
  const scans = useScans();
  const [muted, accent] = useThemeColor(['muted', 'accent']);
  const recent = scans.slice(0, 3);

  return (
    <ScrollView className="bg-background flex-1" contentContainerClassName="gap-5 px-5 pt-2 pb-10">
      <View className="items-center">
        <BrandLogo size={180} />
      </View>

      <View className="gap-2">
        <Typography type="h2" className="text-center">
          What&apos;s on the menu today?
        </Typography>
        <Typography className="text-muted text-sm leading-6">
          Simply scan the menu. PlatePilot analyzes it for you and scores each dish against your
          profile.
        </Typography>
      </View>

      <View className="border-border bg-surface gap-3 rounded-3xl border p-5">
        <View className="flex-row items-center gap-3">
          <View className="bg-accent-soft h-11 w-11 items-center justify-center rounded-2xl">
            <Camera color={accent} size={22} />
          </View>
          <Typography className="text-base font-bold">Scan a menu</Typography>
        </View>
        <Typography className="text-muted text-sm leading-6">
          Take a photo or pick one from your library. We read the page and go straight to the dishes
          that look like the closest match.
        </Typography>
        <Button size="lg" onPress={() => router.push('/(tabs)/scan')}>
          Start a scan
        </Button>
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={() => router.push('/(tabs)/profile')}
        className="border-border bg-surface gap-2 rounded-3xl border p-5"
      >
        <View className="flex-row items-center justify-between gap-3">
          <Typography className="text-base font-semibold">Your profile</Typography>
          <ChevronRight color={muted} size={18} />
        </View>
        <Typography className="text-muted text-sm leading-6">
          {hasProfileContent(profile)
            ? describeProfile(profile)
            : 'Nothing saved yet. Add what you avoid so dishes can be scored for you.'}
        </Typography>
      </Pressable>

      {recent.length > 0 ? (
        <View className="gap-3">
          <View className="flex-row items-center justify-between">
            <Typography className="text-base font-semibold">Recent menus</Typography>
            <Link href="/(tabs)/history" className="text-accent text-sm font-medium">
              See all
            </Link>
          </View>

          <View className="gap-2">
            {recent.map((scan) => {
              const best = scan.analysis.dishes[0];
              return (
                <Pressable
                  key={scan.id}
                  accessibilityRole="button"
                  onPress={() =>
                    router.push({ pathname: '/results/[scanId]', params: { scanId: scan.id } })
                  }
                  className="border-border bg-surface flex-row items-center gap-3 rounded-2xl border p-4"
                >
                  {best ? <ScoreBadge score={best.score} band={best.band} size="sm" /> : null}
                  <View className="flex-1 gap-0.5">
                    <Typography className="text-sm font-semibold" numberOfLines={1}>
                      {scan.place}
                    </Typography>
                    <Typography className="text-muted text-xs">
                      {scan.analysis.dishes.length} dishes ·{' '}
                      {formatDistanceToNow(new Date(scan.createdAt), { addSuffix: true })}
                    </Typography>
                  </View>
                  <ChevronRight color={muted} size={18} />
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : (
        <View className="border-border bg-surface flex-row items-start gap-3 rounded-3xl border p-5">
          <Utensils color={muted} size={18} />
          <Typography className="text-muted flex-1 text-sm leading-6">
            Your profile and your scans stay on this phone. The menu photo goes out only to have its
            text read, and is not stored.
          </Typography>
        </View>
      )}

      <Separator />

      <Pressable
        accessibilityRole="button"
        onPress={() => router.push('/about')}
        className="bg-surface-secondary flex-row items-center gap-3 rounded-2xl p-4"
      >
        <CircleHelp color={accent} size={18} />
        <Typography className="flex-1 text-sm font-medium">
          How the 1 to 10 score is worked out
        </Typography>
        <ChevronRight color={muted} size={18} />
      </Pressable>

      <Disclaimer />
    </ScrollView>
  );
}
