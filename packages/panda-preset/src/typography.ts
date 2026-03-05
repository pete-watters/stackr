import { defineTextStyles } from '@pandacss/dev';

export const textStyles = defineTextStyles({
  'heading.01': {
    value: { fontSize: '2rem', lineHeight: '2.5rem', fontWeight: '700', letterSpacing: '-0.02em' },
  },
  'heading.02': {
    value: { fontSize: '1.5rem', lineHeight: '2rem', fontWeight: '700', letterSpacing: '-0.01em' },
  },
  'heading.03': {
    value: {
      fontSize: '1.25rem',
      lineHeight: '1.75rem',
      fontWeight: '600',
      letterSpacing: '-0.01em',
    },
  },
  'label.01': {
    value: { fontSize: '0.875rem', lineHeight: '1.25rem', fontWeight: '600', letterSpacing: '0' },
  },
  'label.02': {
    value: { fontSize: '0.75rem', lineHeight: '1rem', fontWeight: '600', letterSpacing: '0.01em' },
  },
  'body.01': {
    value: { fontSize: '1rem', lineHeight: '1.5rem', fontWeight: '400', letterSpacing: '0' },
  },
  'body.02': {
    value: { fontSize: '0.875rem', lineHeight: '1.25rem', fontWeight: '400', letterSpacing: '0' },
  },
  'caption.01': {
    value: { fontSize: '0.75rem', lineHeight: '1rem', fontWeight: '400', letterSpacing: '0.01em' },
  },
  'mono.01': {
    value: {
      fontSize: '2rem',
      lineHeight: '2.5rem',
      fontWeight: '600',
      letterSpacing: '0',
      fontFamily: "'JetBrains Mono', 'Fira Code', 'SF Mono', monospace",
    },
  },
  'mono.02': {
    value: {
      fontSize: '1rem',
      lineHeight: '1.5rem',
      fontWeight: '500',
      letterSpacing: '0',
      fontFamily: "'JetBrains Mono', 'Fira Code', 'SF Mono', monospace",
    },
  },
  'mono.03': {
    value: {
      fontSize: '0.875rem',
      lineHeight: '1.25rem',
      fontWeight: '400',
      letterSpacing: '0',
      fontFamily: "'JetBrains Mono', 'Fira Code', 'SF Mono', monospace",
    },
  },
});
