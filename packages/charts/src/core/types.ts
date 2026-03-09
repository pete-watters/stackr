export interface DataPoint {
  x: number;
  y: number;
}

export interface ChartDimensions {
  width: number;
  height: number;
  margin: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

export interface ScaleConfig {
  domain: [number, number];
  range: [number, number];
}

export interface LineConfig {
  interpolation?: 'linear' | 'monotone';
  strokeWidth?: number;
  color?: string;
}

export interface AreaConfig extends LineConfig {
  fillOpacity?: number;
  fillColor?: string;
}

export interface AxisConfig {
  tickCount?: number;
  formatTick?: (value: number) => string;
}

export interface DepthChartConfig {
  bidColor?: string;
  askColor?: string;
  bidFillOpacity?: number;
  askFillOpacity?: number;
}

export interface DepthOrder {
  price: number;
  amount: number;
  cumulativeAmount: number;
}
