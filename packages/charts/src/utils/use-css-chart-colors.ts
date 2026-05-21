import { useState, useEffect } from 'react';
import { chartColors, resolveCssChartColors, type ChartColors } from './color.js';

/**
 * Reads chart colours from CSS custom properties on <html> and re-reads
 * whenever the element's class changes (i.e. when next-themes switches the
 * active theme). Falls back to the static `chartColors` on the server.
 */
export function useCssChartColors(): ChartColors {
  const [colors, setColors] = useState<ChartColors>(chartColors);

  useEffect(() => {
    const el = document.documentElement;
    setColors(resolveCssChartColors(el));

    const observer = new MutationObserver(() => {
      setColors(resolveCssChartColors(el));
    });
    observer.observe(el, { attributes: true, attributeFilter: ['class'] });

    return () => observer.disconnect();
  }, []);

  return colors;
}
