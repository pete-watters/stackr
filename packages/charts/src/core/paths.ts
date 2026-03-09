export function moveTo(x: number, y: number): string {
  return `M${x},${y}`;
}

export function lineTo(x: number, y: number): string {
  return `L${x},${y}`;
}

export function cubicBezier(
  cp1x: number,
  cp1y: number,
  cp2x: number,
  cp2y: number,
  x: number,
  y: number,
): string {
  return `C${cp1x},${cp1y},${cp2x},${cp2y},${x},${y}`;
}

export function horizontalTo(x: number): string {
  return `H${x}`;
}

export function verticalTo(y: number): string {
  return `V${y}`;
}

export function closePath(): string {
  return 'Z';
}
