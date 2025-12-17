/**
 * @fileoverview Shared TypeScript type definitions for the SmartCart frontend.
 *
 * @see backend/app/schemas/ for corresponding backend schema definitions.
 */

// =============================================================================
// Snapshot Types
// =============================================================================

/**
 * Represents a meal snapshot uploaded by the user.
 */
export interface Snapshot {
  id: number;
  upload_id: string;
  folder: string;
  patient_id: number;
  date: string;
  time: string;
  weight: number;
  rgb_path: string;
  depth_path: string;
}

/**
 * Represents a snapshot that failed validation during upload.
 */
export interface InvalidSnapshot {
  folder: string;
  error: string;
}

// =============================================================================
// Database Types
// =============================================================================

/**
 * Represents a food item from the nutrition dataset.
 */
export interface Food {
  id: number;
  food_name: string;
  short_name: string;
  kcal: number | null;
  protein: number | null;
  fat: number | null;
  carbohydrate: number | null;
}

/**
 * Represents a menu item that can be associated with meals.
 */
export interface MenuItem {
  id: number;
  name: string;
  foods: Food[];
}

/**
 * Represents a patient in the system.
 */
export interface Patient {
  id: number;
}

/**
 * Represents a complete meal record.
 */
export interface MealData {
  id: number;
  date: string;
  start_time: string;
  end_time: string;
  before_weight: number;
  after_weight: number;
  before_rgb_path: string;
  before_depth_path: string;
  after_rgb_path: string;
  after_depth_path: string;
  patient: Patient;
  menu_item: MenuItem;
}

// =============================================================================
// API Response Types
// =============================================================================

/**
 * Response from the upload ZIP endpoint.
 */
export interface UploadResponse {
  upload_id: string;
  meal_snapshots: Snapshot[];
  invalid_snapshots: InvalidSnapshot[];
}

/**
 * Hierarchical structure for organizing meals in the tree view.
 */
export interface MealsData {
  [patientId: string]: {
    [date: string]: {
      [timeRange: string]: MealData;
    };
  };
}

// =============================================================================
// Analysis Types
// =============================================================================

/**
 * A 2D point on an image with a label indicating foreground (1) or background (0).
 */
export interface Point {
  label: number;
  x: number;
  y: number;
}

/**
 * A segmentation mask for a food item.
 */
export interface FoodMask {
  food_id: number | null;
  mask: number[][];
  mask_id?: string;
  image_type?: 'before' | 'after';
  color_index?: number;
}

/**
 * SAM3 response containing masks for before and after images.
 */
export interface SAM3Response {
  before_masks: FoodMask[];
  after_masks: FoodMask[];
}

/**
 * Nutrition values for a specific food.
 */
export interface FoodNutrition {
  food_id: number;
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
