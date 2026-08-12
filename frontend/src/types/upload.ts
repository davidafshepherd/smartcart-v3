import type { InvalidSnapshot, Snapshot } from ".";


/**
 * Response from the upload ZIP endpoint.
 */
export interface UploadResponse {
  upload_id: string;
  meal_snapshots: Snapshot[];
  invalid_snapshots: InvalidSnapshot[];
}
