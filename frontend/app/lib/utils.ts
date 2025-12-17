/**
 * @fileoverview Shared utility functions for the SmartCart frontend.
 *
 * This module contains common helper functions used across multiple
 * components to avoid code duplication.
 */

// =============================================================================
// Color Utilities
// =============================================================================

/** Color palette for food items and masks. */
const FOOD_COLORS = [
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
  '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1',
  '#14B8A6', '#F43F5E', '#A855F7', '#22C55E', '#EAB308',
];

/**
 * Gets a consistent color for a food item based on its ID.
 *
 * @param foodId - The food's unique identifier.
 * @returns A hex color string.
 */
export function getFoodColor(foodId: number): string {
  return FOOD_COLORS[foodId % FOOD_COLORS.length];
}

/**
 * Gets a unique color for a mask based on its index.
 *
 * @param index - The mask's index in the list.
 * @returns A hex color string.
 */
export function getMaskColor(index: number): string {
  return FOOD_COLORS[index % FOOD_COLORS.length];
}

// =============================================================================
// String Utilities
// =============================================================================

/**
 * Formats a food short name to title case for display.
 *
 * @param shortName - The food's short name (e.g., "apple pie").
 * @returns The formatted name (e.g., "Apple Pie").
 *
 * @example
 * ```ts
 * formatFoodName("chicken breast") // "Chicken Breast"
 * formatFoodName("RICE") // "Rice"
 * ```
 */
export function formatFoodName(shortName: string): string {
  return shortName
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

// =============================================================================
// Mask Utilities
// =============================================================================

/**
 * Merges multiple binary masks into a single mask using OR operation.
 *
 * Each mask is a 2D array where 1 indicates a pixel belongs to the mask
 * and 0 indicates it does not. The merged result contains a 1 at any
 * position where at least one input mask has a 1.
 *
 * @param masks - Array of 2D binary masks to merge.
 * @returns The merged mask, or null if the input array is empty.
 *
 * @example
 * ```ts
 * const mask1 = [[1, 0], [0, 0]];
 * const mask2 = [[0, 1], [0, 0]];
 * mergeMasks([mask1, mask2]); // [[1, 1], [0, 0]]
 * ```
 */
export function mergeMasks(masks: number[][][]): number[][] | null {
  if (masks.length === 0) return null;
  if (masks.length === 1) return masks[0];

  const height = masks[0].length;
  const width = masks[0][0]?.length ?? 0;
  const merged: number[][] = Array(height)
    .fill(null)
    .map(() => Array(width).fill(0));

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      for (const mask of masks) {
        if (mask[y]?.[x] === 1) {
          merged[y][x] = 1;
          break;
        }
      }
    }
  }

  return merged;
}

// =============================================================================
// Number Utilities
// =============================================================================

/**
 * Formats a number with a specified number of decimal places.
 *
 * @param value - The value to format (can be null/undefined).
 * @param decimals - Number of decimal places (default: 1).
 * @returns The formatted string, or 'N/A' if value is null/undefined.
 */
export function formatNumber(
  value: number | null | undefined,
  decimals: number = 1
): string {
  if (value === null || value === undefined) return 'N/A';
  return value.toFixed(decimals);
}

