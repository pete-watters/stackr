/**
 * Typography tokens following Bitcoin Design Guide recommendations:
 *
 * - Two-font system: proportional for UI, monospace for financial data
 * - Monospace with slashed zeros for addresses and amounts
 * - Text styles cover heading, label, body, and caption hierarchies
 */
export const fonts = {
  body: { value: "'Inter', system-ui, -apple-system, sans-serif" },
  heading: { value: "'Inter', system-ui, -apple-system, sans-serif" },
  mono: { value: "'JetBrains Mono', 'Fira Code', 'SF Mono', monospace" },
};

/**
 * Web text style variants.
 * Each variant specifies fontSize, lineHeight, fontWeight, and letterSpacing.
 */
export interface TextVariant {
  fontSize: string;
  lineHeight: string;
  fontWeight: number;
  letterSpacing: string;
  fontFamily?: string;
}

export const textVariants: Record<string, TextVariant> = {
  // Headings
  'heading.01': {
    fontSize: '2rem',
    lineHeight: '2.5rem',
    fontWeight: 700,
    letterSpacing: '-0.02em',
  },
  'heading.02': {
    fontSize: '1.5rem',
    lineHeight: '2rem',
    fontWeight: 700,
    letterSpacing: '-0.01em',
  },
  'heading.03': {
    fontSize: '1.25rem',
    lineHeight: '1.75rem',
    fontWeight: 600,
    letterSpacing: '-0.01em',
  },

  // Labels (UI controls, navigation)
  'label.01': {
    fontSize: '0.875rem',
    lineHeight: '1.25rem',
    fontWeight: 600,
    letterSpacing: '0',
  },
  'label.02': {
    fontSize: '0.75rem',
    lineHeight: '1rem',
    fontWeight: 600,
    letterSpacing: '0.01em',
  },

  // Body text
  'body.01': {
    fontSize: '1rem',
    lineHeight: '1.5rem',
    fontWeight: 400,
    letterSpacing: '0',
  },
  'body.02': {
    fontSize: '0.875rem',
    lineHeight: '1.25rem',
    fontWeight: 400,
    letterSpacing: '0',
  },

  // Caption / fine print
  'caption.01': {
    fontSize: '0.75rem',
    lineHeight: '1rem',
    fontWeight: 400,
    letterSpacing: '0.01em',
  },

  // Monospace variants (for financial data, addresses)
  'mono.01': {
    fontSize: '2rem',
    lineHeight: '2.5rem',
    fontWeight: 600,
    letterSpacing: '0',
    fontFamily: "'JetBrains Mono', 'Fira Code', 'SF Mono', monospace",
  },
  'mono.02': {
    fontSize: '1rem',
    lineHeight: '1.5rem',
    fontWeight: 500,
    letterSpacing: '0',
    fontFamily: "'JetBrains Mono', 'Fira Code', 'SF Mono', monospace",
  },
  'mono.03': {
    fontSize: '0.875rem',
    lineHeight: '1.25rem',
    fontWeight: 400,
    letterSpacing: '0',
    fontFamily: "'JetBrains Mono', 'Fira Code', 'SF Mono', monospace",
  },
};

/**
 * Get text variants formatted for Panda CSS defineTextStyles.
 */
export function getWebTextVariants(): Record<
  string,
  { value: TextVariant & { fontFamily?: string } }
> {
  const result: Record<string, { value: TextVariant }> = {};
  for (const [key, variant] of Object.entries(textVariants)) {
    result[key] = { value: variant };
  }
  return result;
}
