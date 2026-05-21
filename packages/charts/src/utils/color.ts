/**
 * Default chart colors — Kraken-inspired palette.
 */
export const chartColors = {
  bid: '#00b275',
  ask: '#e53935',
  bidFill: 'rgba(0, 178, 117, 0.15)',
  askFill: 'rgba(229, 57, 53, 0.15)',
  line: '#627EEA',
  areaFill: 'rgba(98, 126, 234, 0.1)',
  grid: 'rgba(255, 255, 255, 0.06)',
  crosshair: 'rgba(255, 255, 255, 0.3)',
  text: 'rgba(255, 255, 255, 0.5)',
  tooltipBg: 'rgba(13, 13, 13, 0.95)',
} as const;

export type ChartColors = { readonly [K in keyof typeof chartColors]: string };

/**
 * Reads chart colour CSS variables from a DOM element, falling back to the
 * static `chartColors` for any variable that is not set. Pass `null` to skip
 * CSS-var reading entirely and get the static defaults (useful on the server
 * or in test environments without a real stylesheet).
 */
export function resolveCssChartColors(el: Element | null | undefined): ChartColors {
  if (typeof window === 'undefined' || !el) return { ...chartColors };

  const style = getComputedStyle(el);
  const get = (v: string, fallback: string): string => style.getPropertyValue(v).trim() || fallback;

  return {
    bid: get('--color-chart-bid', chartColors.bid),
    ask: get('--color-chart-ask', chartColors.ask),
    bidFill: get('--color-chart-bid-fill', chartColors.bidFill),
    askFill: get('--color-chart-ask-fill', chartColors.askFill),
    line: get('--color-chart-line', chartColors.line),
    areaFill: get('--color-chart-area-fill', chartColors.areaFill),
    grid: get('--color-chart-grid', chartColors.grid),
    crosshair: get('--color-chart-crosshair', chartColors.crosshair),
    text: get('--color-chart-text', chartColors.text),
    tooltipBg: get('--color-chart-tooltip-bg', chartColors.tooltipBg),
  };
}
