/**
 * Shared type definitions.
 */

export interface MealSnapshot {
  id: string;
  patient_id: number;
  date_str: string;
  time_str: string;
  weight: number;
  rgb_path: string;
  depth_path: string;
  upload_id: string; // Track which upload this snapshot belongs to
}

export interface InvalidSnapshot {
  folder: string;
  error: string;
}

export interface MenuItem {
  id: number;
  name: string;
  ingredients: string[];
}

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
  patient_id: number;
  menu_item: MenuItem | null;
}

export interface UploadResponse {
  upload_id: string;
  entries: Omit<MealSnapshot, 'upload_id'>[];
  invalid_entries: InvalidSnapshot[];
}

export interface MealsData {
  [patientId: string]: {
    [date: string]: {
      [timeRange: string]: MealData;
    };
  };
}
