export type {
  DataPoint,
  ChartDimensions,
  ScaleConfig,
  LineConfig,
  AreaConfig,
  AxisConfig,
  DepthChartConfig,
  DepthOrder,
} from './types.js';

export {
  createLinearScale,
  computeDomain,
  computeDomainFromPoints,
  niceNumber,
  niceTicks,
} from './scales.js';

export { moveTo, lineTo, cubicBezier, horizontalTo, verticalTo, closePath } from './paths.js';
export { linearLine, monotoneLine, generateLinePath } from './line.js';
export { generateAreaPath } from './area.js';
export { generateSparklinePath } from './sparkline.js';
export { generateBidPath, generateAskPath, generateDepthLinePath } from './depth-chart.js';
export { computeAxisTicks, type TickData } from './axis.js';
export { computeGridLines, type GridLineData } from './grid.js';
export { bisectNearest } from './tooltip-math.js';
