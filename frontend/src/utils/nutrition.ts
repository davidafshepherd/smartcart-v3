import type { FoodNutrition, MealNutrition } from '@/types';

import { formatNumber } from './formatters';


/**
 * Converts a raw nutrient field name to a display label.
 * @param rawName - The raw field name (e.g. 'vitamin_b12').
 * @returns The title-cased label (e.g. 'Vitamin B12').
 */
export function generateNutrientDisplayName(rawName: string): string {
  if (rawName.length === 0) return '';
  return rawName
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}


/**
 * Formats a nutrition value with unit and decimals.
 * @param value - The value to format (can be null/undefined).
 * @param unit - The unit string to append.
 * @param decimals - Number of decimal places (default: 1).
 * @returns The formatted string with unit, or 'N/A' if value is null/undefined.
 */
export function formatNutritionValue(
  value: number | null | undefined,
  unit: string,
  decimals: number = 1,
): string {
  if (value === null || value === undefined) return 'N/A';
  return `${formatNumber(value, decimals)} ${unit}`;
}


/**
 * Calculates total macronutrients for bar normalization.
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
 * Converts a value to grams.
 * @param value - The value to convert (can be null/undefined).
 * @param unit - The unit of the value ('g', 'mg', 'μg', 'kcal', 'kJ').
 * @returns The value converted to grams, or 0 if null/undefined or energy unit.
 */
export function convertToGrams(value: number | null | undefined, unit: string): number {
  if (value === null || value === undefined) return 0;
  if (unit === 'g') return value;
  if (unit === 'mg') return value / 1000;
  if (unit === 'μg') return value / 1_000_000;
  if (unit === 'kcal' || unit === 'kJ') return 0;
  return value;
}


/**
 * Sums the nutrition of the selected foods into a single MealNutrition.
 * @param foodNutrition - The per-food nutrition values to combine.
 * @param selectedFoodIds - The IDs of the foods to include in the sum.
 * @returns A MealNutrition with each field summed across the selected foods.
 */
export function getCombinedNutrition(foodNutrition: FoodNutrition[], selectedFoodIds: Set<number>): MealNutrition {
  const result: Partial<MealNutrition> = {};

  for (const item of foodNutrition) {
    if (!selectedFoodIds.has(item.food_id)) continue;

    for (const key of Object.keys(item) as (keyof FoodNutrition)[]) {
      if (key === 'food_id') continue;
      
      const value = item[key];
      if (typeof value === 'number') {
        const current = result[key as keyof MealNutrition];
        result[key as keyof MealNutrition] = typeof current === 'number' ? current + value : value;
      }
    }
  }

  result.mass ??= 0;
  return result as MealNutrition;
}


/**
 * Sums an array of MealNutrition objects field-by-field.
 * @param items - The MealNutrition objects to sum.
 * @returns A MealNutrition with each field summed.
 */
export function sumMealNutrition(items: MealNutrition[]): MealNutrition {
  const result: Partial<MealNutrition> = {};

  for (const item of items) {
    for (const key of Object.keys(item) as (keyof MealNutrition)[]) {
      const value = item[key];
      if (typeof value === 'number') {
        const current = result[key];
        result[key] = typeof current === 'number' ? current + value : value;
      }
    }
  }

  result.mass ??= 0;
  return result as MealNutrition;
}


/**
 * Divides a summed MealNutrition by a number of days, for a per-day average.
 * @param total - The summed MealNutrition to average.
 * @param days - The number of days to divide by.
 * @returns A MealNutrition with each field averaged.
 */
export function averagePerDay(total: MealNutrition, days: number): MealNutrition {
  if (days <= 0) return total;

  const result: Partial<MealNutrition> = {};
  for (const key of Object.keys(total) as (keyof MealNutrition)[]) {
    const value = total[key];
    if (typeof value === 'number') result[key] = value / days;
  }

  return result as MealNutrition;
}
