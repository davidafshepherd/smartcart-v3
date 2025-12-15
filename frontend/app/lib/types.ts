/**
 * @fileoverview Shared TypeScript type definitions for the SmartCart frontend.
 *
 * This module defines all data transfer object (DTO) interfaces that mirror
 * the backend Pydantic schemas. These types are used throughout the frontend
 * for type-safe API communication and component props.
 *
 * @see backend/app/schemas/ for corresponding backend schema definitions.
 */

// =============================================================================
// Snapshot Types
// =============================================================================

/**
 * Represents a meal snapshot uploaded by the user.
 *
 * A snapshot captures a single moment of a patient's meal tray, including
 * RGB and depth images along with weight measurements. Two snapshots (before
 * and after eating) are paired to create a meal record.
 */
export interface Snapshot {
  /** Unique identifier for the snapshot. */
  id: number;
  /** UUID of the upload batch this snapshot belongs to. */
  upload_id: string;
  /** Original folder name from the uploaded ZIP file. */
  folder: string;
  /** ID of the patient associated with this snapshot. */
  patient_id: number;
  /** Date when the snapshot was taken (ISO format: YYYY-MM-DD). */
  date: string;
  /** Time when the snapshot was taken (HH:MM:SS format). */
  time: string;
  /** Weight of the meal tray in grams. */
  weight: number;
  /** Relative path to the RGB image file. */
  rgb_path: string;
  /** Relative path to the depth image file. */
  depth_path: string;
}

/**
 * Represents a snapshot that failed validation during upload.
 *
 * Invalid snapshots are reported to the user so they can fix issues
 * in the source data and re-upload.
 */
export interface InvalidSnapshot {
  /** Name of the folder that contained invalid data. */
  folder: string;
  /** Human-readable description of the validation error. */
  error: string;
}

// =============================================================================
// Food Types
// =============================================================================

/**
 * Represents a food item from the nutrition dataset.
 *
 * Food items contain nutritional information per 100g and are used
 * as ingredients in menu items.
 */
export interface Food {
  /** Unique identifier for the food. */
  id: number;
  /** Full human-readable name of the food (e.g., "apples, eating, dried"). */
  food_name: string;
  /** Shortened name of the food (e.g., "apples") - for display and OWLv2. */
  short_name: string;
  /** Energy (kcal) per 100g. */
  kcal: number | null;
  /** Protein (g) per 100g. */
  protein: number | null;
  /** Fat (g) per 100g. */
  fat: number | null;
  /** Carbohydrate (g) per 100g. */
  carbohydrate: number | null;
}

// =============================================================================
// Menu Types
// =============================================================================

/**
 * Represents a menu item that can be associated with meals.
 *
 * Menu items describe what food was served to the patient and are used
 * for nutritional analysis and reporting.
 */
export interface MenuItem {
  /** Unique identifier for the menu item. */
  id: number;
  /** Display name of the menu item (e.g., "Chicken & Vegetables"). */
  name: string;
  /** List of foods/ingredients in this menu item. */
  foods: Food[];
}

// =============================================================================
// Patient Types
// =============================================================================

/**
 * Represents a patient in the system.
 *
 * Patients are automatically created when meals are saved if they don't
 * already exist in the database.
 */
export interface Patient {
  /** Unique identifier for the patient. */
  id: number;
}

// =============================================================================
// Meal Types
// =============================================================================

/**
 * Represents a complete meal record.
 *
 * A meal is created by matching two snapshots (before and after eating)
 * and associating them with a menu item. The meal stores weight data
 * and image paths for both snapshots.
 */
export interface MealData {
  /** Unique identifier for the meal. */
  id: number;
  /** Date of the meal (ISO format: YYYY-MM-DD). */
  date: string;
  /** Start time of the meal (HH:MM:SS format). */
  start_time: string;
  /** End time of the meal (HH:MM:SS format). */
  end_time: string;
  /** Weight of the tray before eating (grams). */
  before_weight: number;
  /** Weight of the tray after eating (grams). */
  after_weight: number;
  /** Path to the before-meal RGB image. */
  before_rgb_path: string;
  /** Path to the before-meal depth image. */
  before_depth_path: string;
  /** Path to the after-meal RGB image. */
  after_rgb_path: string;
  /** Path to the after-meal depth image. */
  after_depth_path: string;
  /** The patient who consumed this meal. */
  patient: Patient;
  /** The menu item that was served. */
  menu_item: MenuItem;
}

// =============================================================================
// API Response Types
// =============================================================================

/**
 * Response from the upload ZIP endpoint.
 *
 * Contains both successfully processed snapshots and any that failed
 * validation, allowing the frontend to display appropriate feedback.
 */
export interface UploadResponse {
  /** UUID identifying this upload batch. */
  upload_id: string;
  /** List of successfully processed snapshots. */
  meal_snapshots: Snapshot[];
  /** List of snapshots that failed validation. */
  invalid_snapshots: InvalidSnapshot[];
}

/**
 * Hierarchical structure for organizing meals in the tree view.
 *
 * Meals are organized by patient ID, then by date, then by time range.
 * This structure enables efficient rendering of the meals tree view
 * component.
 *
 * @example
 * ```typescript
 * {
 *   "1": {                           // Patient ID
 *     "2024-01-15": {                // Date
 *       "12:00-12:30": { ... },      // Time range -> MealData
 *       "18:00-18:45": { ... }
 *     }
 *   }
 * }
 * ```
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
 * A 2D point on an image.
 */
export interface Point {
  x: number;
  y: number;
}

/**
 * A bounding box on an image.
 */
export interface Box {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

/**
 * A point group with associated food ID.
 */
export interface FoodPoints {
  food_id: number;
  points: Point[];
}

/**
 * A bounding box with associated food ID.
 */
export interface FoodBox {
  food_id: number;
  box: Box;
  confidence?: number;
}

/**
 * A segmentation mask.
 * 
 * Note: mask_id and image_type are added by the frontend API layer
 * for compatibility with existing components. The backend only sends
 * food_id and mask_data.
 */
export interface Mask {
  food_id: number;
  mask_data: number[][]; // 2D numpy array as nested list (mask values)
  mask_id?: string; // Generated by frontend for identification
  image_type?: 'before' | 'after'; // Added by frontend for filtering
}

/**
 * A group of boxes for a specific food.
 */
export interface BoxGroup {
  food_id: number;
  boxes: Box[];
}

/**
 * Volume consumed for a specific food.
 */
export interface FoodVolume {
  food_id: number;
  volume: number; // Volume in m³
}

/**
 * Mass consumed for a specific food.
 */
export interface FoodMass {
  food_id: number;
  mass: number; // Mass in grams
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
