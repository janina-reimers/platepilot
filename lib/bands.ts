import type { ScoreBand } from '@/lib/analysis/types';

export type BandStyle = {
  /** Solid fill, for the score badge. */
  solid: string;
  /** Text colour that sits on the solid fill. */
  onSolid: string;
  /** Tinted background, for cards and rows. */
  soft: string;
  /** Border that matches the tint. */
  line: string;
  /** Text colour on a light background. */
  text: string;
  label: string;
};

/**
 * The one place the red - amber - green scale is defined.
 * Grey is used for "not enough information" so it never reads as a mild pass.
 */
export const BAND_STYLES: Record<ScoreBand, BandStyle> = {
  avoid: {
    solid: 'bg-score-avoid',
    onSolid: 'text-white',
    soft: 'bg-score-avoid-soft',
    line: 'border-score-avoid-line',
    text: 'text-score-avoid',
    label: 'Not recommended',
  },
  ask: {
    solid: 'bg-score-ask',
    onSolid: 'text-white',
    soft: 'bg-score-ask-soft',
    line: 'border-score-ask-line',
    text: 'text-score-ask',
    label: 'Ask first',
  },
  good: {
    solid: 'bg-score-good',
    onSolid: 'text-white',
    soft: 'bg-score-good-soft',
    line: 'border-score-good-line',
    text: 'text-score-good',
    label: 'Reasonable',
  },
  strong: {
    solid: 'bg-score-good',
    onSolid: 'text-white',
    soft: 'bg-score-good-soft',
    line: 'border-score-good-line',
    text: 'text-score-good',
    label: 'Good match',
  },
  unknown: {
    solid: 'bg-score-unknown',
    onSolid: 'text-white',
    soft: 'bg-score-unknown-soft',
    line: 'border-score-unknown-line',
    text: 'text-score-unknown',
    label: 'Unclear',
  },
};

export const SCALE_STEPS: { range: string; band: ScoreBand; meaning: string }[] = [
  { range: '9 - 10', band: 'strong', meaning: 'Nothing in the usual recipe matches your profile.' },
  {
    range: '7 - 8',
    band: 'good',
    meaning: 'Looks workable, with one or two small things to note.',
  },
  { range: '4 - 6', band: 'ask', meaning: 'Something needs checking with the kitchen first.' },
  { range: '1 - 3', band: 'avoid', meaning: 'Contains something you told us to avoid.' },
  { range: '—', band: 'unknown', meaning: 'We do not know the recipe, so we do not guess.' },
];

/**
 * Hex equivalents of the score tokens, for icon and other native colour props
 * that cannot read a class name. Keep these in step with global.css.
 */
export const BAND_HEX: Record<ScoreBand, string> = {
  avoid: '#A82A1E',
  ask: '#87590F',
  good: '#1E6942',
  strong: '#1E6942',
  unknown: '#6A6E75',
};
