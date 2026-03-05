/**
 * Panda CSS color tokens wrapping @stackr/tokens.
 *
 * We expose the full Radix gray scale as raw tokens for one-off use,
 * while semantic tokens (ink.*, accent.*, etc.) handle theming.
 */
import { defineTokens } from '@pandacss/dev';
import {
  gray,
  grayDark,
  blue,
  blueDark,
  red,
  redDark,
  amber,
  amberDark,
  green,
  greenDark,
} from '@radix-ui/colors';

function radixScale(scale: Record<string, string>, prefix: string) {
  const result: Record<string, { value: string }> = {};
  for (const [key, value] of Object.entries(scale)) {
    const step = key.replace(prefix, '');
    result[step] = { value };
  }
  return result;
}

export const colors = defineTokens.colors({
  current: { value: 'currentColor' },
  transparent: { value: 'transparent' },
  white: { value: '#ffffff' },
  black: { value: '#000000' },
  gray: radixScale(gray, 'gray'),
  grayDark: radixScale(grayDark, 'gray'),
  blue: radixScale(blue, 'blue'),
  blueDark: radixScale(blueDark, 'blue'),
  red: radixScale(red, 'red'),
  redDark: radixScale(redDark, 'red'),
  amber: radixScale(amber, 'amber'),
  amberDark: radixScale(amberDark, 'amber'),
  green: radixScale(green, 'green'),
  greenDark: radixScale(greenDark, 'green'),
});
