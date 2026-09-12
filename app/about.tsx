import { Separator, Typography } from 'heroui-native';
import { ScrollView, View } from 'react-native';
import { CertaintyChip } from '@/components/CertaintyChip';
import { Disclaimer } from '@/components/Disclaimer';
import { ScoreLegend } from '@/components/ScoreLegend';

const CERTAINTY_ROWS = [
  {
    certainty: 'confirmed' as const,
    text: 'Part of nearly every version of the dish. A carbonara has egg and hard cheese in it.',
  },
  {
    certainty: 'possible' as const,
    text: 'Common, but plenty of kitchens leave it out. Cream in a carbonara is a good example.',
  },
  {
    certainty: 'unknown' as const,
    text: 'Things a menu simply cannot answer: the fat a pan was started with, what a stock was made from, whether the fryer is shared.',
  },
];

export default function AboutScreen() {
  return (
    <ScrollView className="bg-background flex-1" contentContainerClassName="gap-6 px-5 pt-5 pb-12">
      <View className="gap-2">
        <Typography type="h3">How PlatePilot works</Typography>
        <Typography className="text-muted text-sm leading-6">
          PlatePilot reads the text off your menu photo, then looks each dish up in its library of
          the recipes restaurants usually follow. It checks each ingredient against your profile and
          tells you how sure it is about every part.
        </Typography>
      </View>

      <View className="gap-3">
        <Typography className="text-base font-semibold">Three levels of certainty</Typography>
        {CERTAINTY_ROWS.map((row) => (
          <View
            key={row.certainty}
            className="border-border bg-surface gap-2 rounded-2xl border p-4"
          >
            <CertaintyChip certainty={row.certainty} className="self-start" />
            <Typography className="text-muted text-sm leading-6">{row.text}</Typography>
          </View>
        ))}
      </View>

      <Separator />

      <View className="gap-3">
        <Typography className="text-base font-semibold">What the score means</Typography>
        <ScoreLegend />
      </View>

      <View className="border-border bg-surface gap-3 rounded-2xl border p-4">
        <Typography className="text-base font-semibold">How we keep it honest</Typography>
        <Typography className="text-muted text-sm leading-6">
          One confirmed ingredient from your avoid list drops a dish to 1, however good the rest of
          it looks. Anything that has to be checked with staff is capped at 6, so a dish can never
          look recommended while a question is still open. A dish with any unclear part never
          reaches 10, and a dish we cannot look up is not scored at all.
        </Typography>
      </View>

      <View className="border-border bg-surface gap-3 rounded-2xl border p-4">
        <Typography className="text-base font-semibold">
          Conditions are handled differently
        </Typography>
        <Typography className="text-muted text-sm leading-6">
          Where you have told us about a condition, PlatePilot points out the things that often come
          up with it. It does not treat them as rules, because how strict you need to be is between
          you and the people looking after your health.
        </Typography>
      </View>

      <View className="border-border bg-surface gap-3 rounded-2xl border p-4">
        <Typography className="text-base font-semibold">What happens to your photo</Typography>
        <Typography className="text-muted text-sm leading-6">
          Your profile and your past scans are kept on this phone. The menu photo is sent to our
          reading service to have its text read, and is not stored there. Your profile is never sent
          with it: the matching against what you avoid happens on your phone.
        </Typography>
      </View>

      <Disclaimer />
    </ScrollView>
  );
}
