// Pure Inch dimension formatting
export function formatInches(value: number): string {
  // If whole number, e.g. 72 -> 72″, if fractional, e.g. 0.75 -> 0.75″
  const formatted = Number.isInteger(value) ? `${value}` : `${parseFloat(value.toFixed(2))}`;
  return `${formatted}″`;
}

export function formatDimensions(length: number, width: number, thickness: number): string {
  return `${formatInches(length)} × ${formatInches(width)} × ${formatInches(thickness)}`;
}
