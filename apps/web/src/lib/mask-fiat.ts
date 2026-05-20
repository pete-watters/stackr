export function maskFiat(formatted: string, hidden: boolean): string {
  return hidden ? '••••' : formatted;
}
