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
export interface Meal {
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
  is_analysed: boolean;
  patient: Patient;
  menu_item: MenuItem;
}


/**
 * Hierarchical structure for organizing meals in the tree view.
 */
export interface Meals {
  [patientId: string]: {
    [date: string]: {
      [timeRange: string]: Meal;
    };
  };
}
