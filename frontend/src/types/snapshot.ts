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
