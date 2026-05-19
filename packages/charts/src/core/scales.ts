import type { DataPoint, ScaleConfig } from './types.js';

export function createLinearScale(config: ScaleConfig) {
  const { domain, range } = config;
  const domainSpan = domain[1] - domain[0];
  const rangeSpan = range[1] - range[0];

  return (value: number): number => {
    if (domainSpan === 0) return range[0];
    return range[0] + ((value - domain[0]) / domainSpan) * rangeSpan;
  };
}

export function computeDomain(values: number[], padding: number = 0): [number, number] {
  if (values.length === 0) return [0, 1];
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  return [min - span * padding, max + span * padding];
}

export function computeDomainFromPoints(points: DataPoint[]): {
  xDomain: [number, number];
  yDomain: [number, number];
} {
  return {
    xDomain: computeDomain(points.map(p => p.x)),
    yDomain: computeDomain(
      points.map(p => p.y),
      0.05,
    ),
  };
}

export function niceNumber(value: number, round: boolean): number {
  const exponent = Math.floor(Math.log10(value));
  const fraction = value / Math.pow(10, exponent);
  let nice: number;

  if (round) {
    if (fraction < 1.5) nice = 1;
    else if (fraction < 3) nice = 2;
    else if (fraction < 7) nice = 5;
    else nice = 10;
  } else {
    if (fraction <= 1) nice = 1;
    else if (fraction <= 2) nice = 2;
    else if (fraction <= 5) nice = 5;
    else nice = 10;
  }

  return nice * Math.pow(10, exponent);
}

export function niceTicks(min: number, max: number, count: number = 5): number[] {
  const range = niceNumber(max - min, false);
  const step = niceNumber(range / (count - 1), true);
  const niceMin = Math.floor(min / step) * step;
  const niceMax = Math.ceil(max / step) * step;

  const ticks: number[] = [];
  for (let v = niceMin; v <= niceMax + step * 0.5; v += step) {
    ticks.push(parseFloat(v.toPrecision(12)));
  }
  return ticks;
}
