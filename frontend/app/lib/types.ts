/**
 * Shared type definitions.
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

export interface InvalidSnapshot {
  folder: string;
  error: string;
}

export interface MenuItem {
  id: number;
  name: string;
  ingredients: string[];
}

export interface Patient {
  id: number;
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
  patient: Patient;
  menu_item: MenuItem;
}

export interface UploadResponse {
  upload_id: string;
  meal_snapshots: Snapshot[];
  invalid_snapshots: InvalidSnapshot[];
}

export interface MealsData {
  [patientId: string]: {
    [date: string]: {
      [timeRange: string]: MealData;
    };
  };
}
