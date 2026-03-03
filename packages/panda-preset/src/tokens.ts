import { defineTokens } from '@pandacss/dev';

export const tokens = defineTokens({
  colors: {
    gray: {
      50: { value: '#fafafa' },
      100: { value: '#f5f5f5' },
      200: { value: '#e5e5e5' },
      300: { value: '#d4d4d4' },
      400: { value: '#a3a3a3' },
      500: { value: '#737373' },
      600: { value: '#525252' },
      700: { value: '#404040' },
      800: { value: '#2B2B2B' },
      900: { value: '#1a1a1a' },
      950: { value: '#0d0d0d' },
    },
    brand: {
      50: { value: '#eff6ff' },
      100: { value: '#dbeafe' },
      200: { value: '#bfdbfe' },
      300: { value: '#93c5fd' },
      400: { value: '#60a5fa' },
      500: { value: '#3b82f6' },
      600: { value: '#2563eb' },
      700: { value: '#1d4ed8' },
      800: { value: '#1e40af' },
      900: { value: '#1e3a8a' },
    },
    green: {
      400: { value: '#4ade80' },
      500: { value: '#22c55e' },
    },
    red: {
      400: { value: '#f87171' },
      500: { value: '#ef4444' },
    },
  },
  fonts: {
    body: { value: 'Inter, system-ui, -apple-system, sans-serif' },
    mono: { value: "'JetBrains Mono', 'Fira Code', monospace" },
  },
  radii: {
    sm: { value: '6px' },
    md: { value: '8px' },
    lg: { value: '12px' },
    xl: { value: '16px' },
    full: { value: '9999px' },
  },
});
