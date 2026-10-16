export function formatPrice(value?: number | null) {
  if (value === null || value === undefined) {
    return '';
  }
  return `₹${value.toLocaleString('en-IN')}`;
}
