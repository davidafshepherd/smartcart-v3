// =============================================================================
// Color Utilities
// =============================================================================

import { MealNutrition } from "./types";

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
 * @param masks - Array of 2D binary masks to merge.
 * @returns The merged mask, or null if the input array is empty.
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

// =============================================================================
// Nutrition Utilities
// =============================================================================

/**
 * Converts a value to grams for comparison.
 *
 * @param value - The value to convert (can be null/undefined).
 * @param unit - The unit of the value ('g', 'mg', 'μg', 'kcal', 'kJ').
 * @returns The value converted to grams, or 0 if null/undefined or energy unit.
 */
export function convertToGrams(value: number | null | undefined, unit: string): number {
  if (value === null || value === undefined) return 0;
  if (unit === 'g') return value;
  if (unit === 'mg') return value / 1000;
  if (unit === 'μg') return value / 1000000;
  if (unit === 'kcal' || unit === 'kJ') return 0; // Energy not included in bar calculations
  return value; // Fallback
}

/**
 * Calculates total macronutrients for bar normalization.
 *
 * @param data - Object containing protein, fat, and carbohydrate values.
 * @returns The total in grams.
 */
export function calculateTotalMacros(data: {
  protein: number | null | undefined;
  fat: number | null | undefined;
  carbohydrate: number | null | undefined;
}): number {
  return (
    convertToGrams(data.protein, 'g') +
    convertToGrams(data.fat, 'g') +
    convertToGrams(data.carbohydrate, 'g')
  );
}

/**
 * Formats a nutrition value with unit and decimals.
 *
 * @param value - The value to format (can be null/undefined).
 * @param unit - The unit string to append.
 * @param decimals - Number of decimal places (default: 1).
 * @returns The formatted string with unit, or 'N/A' if value is null/undefined.
 */
export function formatNutritionValue(
  value: number | null | undefined,
  unit: string,
  decimals: number = 1
): string {
  if (value === null || value === undefined) return 'N/A';
  return `${formatNumber(value, decimals)} ${unit}`;
}

export function sumMealNutrition(
  items: MealNutrition[]
): MealNutrition {
  const result: Partial<MealNutrition> = {};

  for (const item of items) {
    for (const key of Object.keys(item) as (keyof MealNutrition)[]) {
      const value = item[key];

      if (typeof value === "number") {
        const current = result[key];

        result[key] =
          typeof current === "number" ? current + value : value;
      }
    }
  }

  // Ensure required field
  result.mass ??= 0;

  return result as MealNutrition;
}

export function mergeObjects<T>(objects: T[]): T | null {
    if (objects.length === 0) {
      return null;
    }

    const result: Record<string, number> = {};

    for (const obj of objects) {
        for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                const value = obj[key];
                if (typeof value === 'number') {
                    result[key] = (result[key] ?? 0) + value;
                }
            }
        }
    }

    return result as T;
}
