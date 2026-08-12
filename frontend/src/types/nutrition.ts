/**
 * Nutrition values for a specific food.
 */
export interface FoodNutrition {
  food_id: number;
  mass: number;
  food_name?: string | null;
  short_name?: string | null;
  kcal: number | null;
  kj: number | null;
  protein: number | null;
  fat: number | null;
  carbohydrate: number | null;
  sugar: number | null;
  fibre: number | null;
  saturated_fat: number | null;
  sodium: number | null;
  potassium: number | null;
  calcium: number | null;
  magnesium: number | null;
  phosphorus: number | null;
  iron: number | null;
  copper: number | null;
  zinc: number | null;
  selenium: number | null;
  iodine: number | null;
  retinol: number | null;
  carotene: number | null;
  vitamin_d: number | null;
  vitamin_e: number | null;
  vitamin_k1: number | null;
  thiamin: number | null;
  riboflavin: number | null;
  niacin: number | null;
  vitamin_b6: number | null;
  vitamin_b12: number | null;
  folate: number | null;
  vitamin_c: number | null;
}


/**
 * Nutrition values for an entire meal.
 */
export interface MealNutrition {
  mass: number;
  kcal: number | null;
  kj: number | null;
  protein: number | null;
  fat: number | null;
  carbohydrate: number | null;
  sugar: number | null;
  fibre: number | null;
  saturated_fat: number | null;
  sodium: number | null;
  potassium: number | null;
  calcium: number | null;
  magnesium: number | null;
  phosphorus: number | null;
  iron: number | null;
  copper: number | null;
  zinc: number | null;
  selenium: number | null;
  iodine: number | null;
  retinol: number | null;
  carotene: number | null;
  vitamin_d: number | null;
  vitamin_e: number | null;
  vitamin_k1: number | null;
  thiamin: number | null;
  riboflavin: number | null;
  niacin: number | null;
  vitamin_b6: number | null;
  vitamin_b12: number | null;
  folate: number | null;
  vitamin_c: number | null;
}


/**
 * Response from nutrition computation.
 */
export interface ComputeNutritionResponse {
  meal_nutrition: MealNutrition;
  food_nutrition: FoodNutrition[];
}


/**
 * Nutrition report for a meal.
 */
export interface NutritionReport {
  meal_id: number;
  meal_nutrition: MealNutrition;
  food_nutrition: FoodNutrition[];
}


/**
 * Committed nutrition query.
 */
export interface NutritionQuery {
  patientId: number;
  start: string;
  end: string;
}
