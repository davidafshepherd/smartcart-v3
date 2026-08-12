/** Colour palette for food items and masks. */
export const FOOD_COLORS = [
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
  '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1',
  '#14B8A6', '#F43F5E', '#A855F7', '#22C55E', '#EAB308',
];


/**
 * Gets a consistent colour for a food item based on its ID.
 * @param foodId - The food's unique identifier.
 * @returns A hex colour string.
 */
export function getFoodColor(foodId: number): string {
  return FOOD_COLORS[foodId % FOOD_COLORS.length];
}


/**
 * Gets a unique colour for a mask based on its index.
 * @param index - The mask's index in the list.
 * @returns A hex colour string.
 */
export function getMaskColor(index: number): string {
  return FOOD_COLORS[index % FOOD_COLORS.length];
}
