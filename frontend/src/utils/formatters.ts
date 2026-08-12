/**
 * Formats a food short name to title case for display.
 * @param shortName - The food's short name (e.g., "apple pie").
 * @returns The formatted name (e.g., "Apple Pie").
 */
export function formatFoodName(shortName: string): string {
  return shortName
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}


/**
 * Formats a number with a specified number of decimal places.
 * @param value - The value to format (can be null/undefined).
 * @param decimals - Number of decimal places (default: 1).
 * @returns The formatted string, or 'N/A' if value is null/undefined.
 */
export function formatNumber(value: number | null | undefined, decimals: number = 1): string {
  if (value === null || value === undefined) return 'N/A';
  return value.toFixed(decimals);
}
