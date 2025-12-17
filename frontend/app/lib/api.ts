import { config } from './config';
import type { 
  UploadResponse, 
  MenuItem, 
  MealsData, 
  MealData, 
  Patient, 
  Food, 
  Point, 
  FoodMask, 
  SAM3Response, 
  ComputeNutritionResponse, 
} from './types';

// =============================================================================
// Error Handling
// =============================================================================

/**
 * Custom error class for API-related errors.
 */
export class ApiError extends Error {
  /**
   * Creates a new ApiError instance.
   *
   * @param message - Human-readable error message.
   * @param status - HTTP status code from the response.
   * @param details - Optional additional error details from the response body.
   */
  constructor(
    message: string,
    public status: number,
    public details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Handles API response and extracts JSON data or throws an error.
 *
 * @typeParam T - The expected type of the response data.
 * @param response - The fetch Response object to process.
 * @returns A promise resolving to the parsed response data.
 * @throws {ApiError} If the response indicates an error (non-2xx status).
 */
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new ApiError(
      errorData.detail?.message || errorData.detail || 'Request failed',
      response.status,
      errorData,
    );
  }
  
  // Handle 204 No Content responses.
  if (response.status === 204) {
    return undefined as T;
  }
  
  return response.json();
}

// =============================================================================
// Upload API
// =============================================================================

/**
 * API client for upload-related operations.
 */
export const uploadApi = {
  /**
   * Uploads a ZIP file containing meal snapshot folders.
   *
   * @param file - The ZIP file to upload.
   * @returns A promise resolving to the upload response with snapshots.
   * @throws {ApiError} If the upload fails.
   */
  async uploadZip(file: File): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${config.apiUrl}/uploads`, {
      method: 'POST',
      body: formData,
    });

    return handleResponse<UploadResponse>(response);
  },

  /**
   * Discards a specific snapshot from the staging area.
   *
   * @param snapshotId - The ID of the snapshot to discard.
   * @returns A promise that resolves when the snapshot is deleted.
   * @throws {ApiError} If the snapshot doesn't exist or deletion fails.
   */
  async discardSnapshot(snapshotId: number): Promise<void> {
    const response = await fetch(
      `${config.apiUrl}/uploads/snapshots/${snapshotId}`,
      { method: 'DELETE' },
    );

    return handleResponse<void>(response);
  },

};

// =============================================================================
// Images API
// =============================================================================

/**
 * API client for image operations.
 */
export const imagesApi = {
  /**
   * Generates the full URL for an image.
   *
   * @param path - The relative path to the image.
   * @returns The complete URL to fetch the image.
   */
  getImageUrl(path: string): string {
    return `${config.apiUrl}/images/${path}`;
  },
};

// =============================================================================
// Menu API
// =============================================================================

/**
 * API client for food operations.
 */
export const foodsApi = {
  /**
   * Searches foods by name from the nutrition dataset.
   *
   * @param term - Optional search term to filter foods by name.
   * @param limit - Maximum number of results to return (default: 50).
   * @returns A promise resolving to an array of matching foods.
   * @throws {ApiError} If the request fails.
   */
  async search(term?: string, limit: number = 50): Promise<Food[]> {
    const params = new URLSearchParams();
    if (term) params.append('term', term);
    params.append('limit', String(limit));

    const response = await fetch(`${config.apiUrl}/foods?${params}`);
    return handleResponse<Food[]>(response);
  },

  /**
   * Retrieves a single food by its ID.
   *
   * @param foodId - The unique ID of the food to retrieve.
   * @returns A promise resolving to the food details.
   * @throws {ApiError} If the food doesn't exist.
   */
  async get(foodId: number): Promise<Food> {
    const response = await fetch(`${config.apiUrl}/foods/${foodId}`);
    return handleResponse<Food>(response);
  },
};

/**
 * API client for menu item operations.
 */
export const menuApi = {
  /**
   * Retrieves all menu items from the database.
   *
   * @returns A promise resolving to an array of all menu items.
   * @throws {ApiError} If the request fails.
   */
  async getAll(): Promise<MenuItem[]> {
    const response = await fetch(`${config.apiUrl}/menu`);
    return handleResponse<MenuItem[]>(response);
  },

  /**
   * Creates a new menu item.
   *
   * @param name - The display name for the menu item.
   * @param foodIds - List of food IDs from the nutrition dataset.
   * @returns A promise resolving to the newly created menu item.
   * @throws {ApiError} If creation fails (e.g., invalid food IDs).
   */
  async create(name: string, foodIds: number[]): Promise<MenuItem> {
    const response = await fetch(`${config.apiUrl}/menu`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, food_ids: foodIds }),
    });

    return handleResponse<MenuItem>(response);
  },

  /**
   * Updates a menu item.
   *
   * @param menuItemId - The ID of the menu item to update.
   * @param name - Optional new name.
   * @param foodIds - Optional new list of food IDs.
   * @returns A promise resolving to the updated menu item.
   * @throws {ApiError} If the menu item doesn't exist.
   */
  async update(
    menuItemId: number,
    name?: string,
    foodIds?: number[],
  ): Promise<MenuItem> {
    const response = await fetch(`${config.apiUrl}/menu/${menuItemId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, food_ids: foodIds }),
    });

    return handleResponse<MenuItem>(response);
  },

  /**
   * Deletes a menu item.
   *
   * @param menuItemId - The ID of the menu item to delete.
   * @returns A promise that resolves when the menu item is deleted.
   * @throws {ApiError} If the menu item doesn't exist or is in use by a meal.
   */
  async delete(menuItemId: number): Promise<void> {
    const response = await fetch(`${config.apiUrl}/menu/${menuItemId}`, {
      method: 'DELETE',
    });

    return handleResponse<void>(response);
  },
};

// =============================================================================
// Meals API
// =============================================================================

/**
 * API client for meal operations.
 */
export const mealsApi = {
  /**
   * Retrieves all meals organized in a hierarchical structure.
   *
   * @returns A promise resolving to the hierarchical meals data.
   * @throws {ApiError} If the request fails.
   */
  async getAll(): Promise<MealsData> {
    const response = await fetch(`${config.apiUrl}/meals`);
    const meals = await handleResponse<MealData[]>(response);

    // Transform flat list to hierarchical structure for tree view.
    const result: MealsData = {};
    for (const meal of meals) {
      const patientId = String(meal.patient.id);
      const date = meal.date;
      const timeRange = `${meal.start_time.slice(0, 5)}-${meal.end_time.slice(0, 5)}`;

      if (!result[patientId]) {
        result[patientId] = {};
      }
      if (!result[patientId][date]) {
        result[patientId][date] = {};
      }
      result[patientId][date][timeRange] = meal;
    }

    return result;
  },

  /**
   * Creates a new meal from matched snapshots.
   *
   * @param beforeSnapshotId - ID of the pre-meal snapshot.
   * @param afterSnapshotId - ID of the post-meal snapshot.
   * @param menuItemId - ID of the menu item served.
   * @returns A promise resolving to the newly created meal.
   * @throws {ApiError} If validation fails or creation fails.
   */
  async create(
    beforeSnapshotId: number,
    afterSnapshotId: number,
    menuItemId: number,
  ): Promise<MealData> {
    const response = await fetch(`${config.apiUrl}/meals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        before_snapshot_id: beforeSnapshotId,
        after_snapshot_id: afterSnapshotId,
        menu_item_id: menuItemId,
      }),
    });

    return handleResponse<MealData>(response);
  },

  /**
   * Deletes a meal and its associated image files.
   *
   * @param mealId - The ID of the meal to delete.
   * @returns A promise that resolves when the meal is deleted.
   * @throws {ApiError} If the meal doesn't exist or deletion fails.
   */
  async delete(mealId: number): Promise<void> {
    const response = await fetch(`${config.apiUrl}/meals/${mealId}`, {
      method: 'DELETE',
    });

    return handleResponse<void>(response);
  },

  /**
   * Updates a meal's patient and/or menu item.
   *
   * @param mealId - The ID of the meal to update.
   * @param patientId - Optional new patient ID.
   * @param menuItemId - Optional new menu item ID.
   * @returns A promise resolving to the updated meal.
   * @throws {ApiError} If the meal, patient, or menu item doesn't exist.
   */
  async update(
    mealId: number,
    patientId?: number,
    menuItemId?: number,
  ): Promise<MealData> {
    const response = await fetch(`${config.apiUrl}/meals/${mealId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patient_id: patientId,
        menu_item_id: menuItemId,
      }),
    });

    return handleResponse<MealData>(response);
  },
};

// =============================================================================
// Patients API
// =============================================================================

/**
 * API client for patient operations.
 */
export const patientsApi = {
  /**
   * Retrieves all patients from the database.
   *
   * @returns A promise resolving to an array of all patients.
   * @throws {ApiError} If the request fails.
   */
  async getAll(): Promise<Patient[]> {
    const response = await fetch(`${config.apiUrl}/patients`);
    return handleResponse<Patient[]>(response);
  },

  /**
   * Creates a new patient.
   *
   * @param id - The ID for the new patient.
   * @returns A promise resolving to the newly created patient.
   * @throws {ApiError} If creation fails (e.g., ID already exists).
   */
  async create(id: number): Promise<Patient> {
    const response = await fetch(`${config.apiUrl}/patients`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });

    return handleResponse<Patient>(response);
  },

  /**
   * Updates a patient's ID.
   *
   * @param patientId - The current ID of the patient to update.
   * @param newId - The new ID for the patient.
   * @returns A promise resolving to the updated patient.
   * @throws {ApiError} If the patient doesn't exist or new ID is taken.
   */
  async update(patientId: number, newId: number): Promise<Patient> {
    const response = await fetch(`${config.apiUrl}/patients/${patientId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: newId }),
    });

    return handleResponse<Patient>(response);
  },

  /**
   * Deletes a patient and all their associated meals.
   *
   * @param patientId - The ID of the patient to delete.
   * @returns A promise that resolves when the patient is deleted.
   * @throws {ApiError} If the patient doesn't exist or deletion fails.
   */
  async delete(patientId: number): Promise<void> {
    const response = await fetch(`${config.apiUrl}/patients/${patientId}`, {
      method: 'DELETE',
    });

    return handleResponse<void>(response);
  },
};

// =============================================================================
// Analysis API
// =============================================================================

/**
 * API client for analysis-related operations.
 *
 */
export const analysisApi = {
  /**
   * Runs SAM3 automated segmentation for all foods.
   *
   * @param beforeRgbPath - Path to the before-meal RGB image.
   * @param afterRgbPath - Path to the after-meal RGB image.
   * @param foodIds - List of food IDs to segment.
   * @param confidenceThreshold - Confidence threshold for SAM3 (default: 0.5).
   * @returns A promise resolving to the generated masks for both images.
   * @throws {ApiError} If the inference fails.
   */
  async sam3Automated(
    beforeRgbPath: string,
    afterRgbPath: string,
    foodIds: number[],
    confidenceThreshold: number = 0.5
  ): Promise<SAM3Response> {
    const response = await fetch(`${config.apiUrl}/analysis/sam3/automated`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        before_rgb_path: beforeRgbPath,
        after_rgb_path: afterRgbPath,
        confidence_threshold: confidenceThreshold,
        foods: foodIds,
      }),
    });

    const data = await handleResponse<SAM3Response>(response);
    
    // Add mask_id, image_type, and color_index for frontend compatibility
    // Use timestamp to create unique IDs across runs
    const timestamp = Date.now();
    return {
      before_masks: data.before_masks.map((m, idx) => ({
        ...m,
        image_type: 'before' as const,
        mask_id: `before_${timestamp}_${idx}`,
        color_index: idx,
      })),
      after_masks: data.after_masks.map((m, idx) => ({
        ...m,
        image_type: 'after' as const,
        mask_id: `after_${timestamp}_${idx}`,
        color_index: idx,
      })),
    };
  },

  /**
   * Runs SAM3 assisted segmentation using a text prompt.
   *
   * @param beforeRgbPath - Path to the before-meal RGB image.
   * @param afterRgbPath - Path to the after-meal RGB image.
   * @param textPrompt - Text prompt describing what to segment.
   * @param confidenceThreshold - Confidence threshold for SAM3 (default: 0.5).
   * @returns A promise resolving to the generated masks for both images.
   * @throws {ApiError} If the inference fails.
   */
  async sam3AssistedText(
    beforeRgbPath: string,
    afterRgbPath: string,
    textPrompt: string,
    confidenceThreshold: number = 0.5
  ): Promise<SAM3Response> {
    const response = await fetch(`${config.apiUrl}/analysis/sam3/assisted/text`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        before_rgb_path: beforeRgbPath,
        after_rgb_path: afterRgbPath,
        confidence_threshold: confidenceThreshold,
        text_prompt: textPrompt,
      }),
    });

    const data = await handleResponse<SAM3Response>(response);
    
    // Add mask_id, image_type, and color_index for frontend compatibility
    // Use timestamp to create unique IDs across runs
    const timestamp = Date.now();
    return {
      before_masks: data.before_masks.map((m, idx) => ({
        ...m,
        image_type: 'before' as const,
        mask_id: `before_${timestamp}_${idx}`,
        color_index: idx,
      })),
      after_masks: data.after_masks.map((m, idx) => ({
        ...m,
        image_type: 'after' as const,
        mask_id: `after_${timestamp}_${idx}`,
        color_index: idx,
      })),
    };
  },

  /**
   * Runs SAM3 assisted segmentation using points.
   *
   * @param beforeRgbPath - Path to the before-meal RGB image.
   * @param afterRgbPath - Path to the after-meal RGB image.
   * @param beforePoints - Points for the before image (with labels: 1=foreground, 0=background).
   * @param afterPoints - Points for the after image (with labels: 1=foreground, 0=background).
   * @returns A promise resolving to the generated masks for both images.
   * @throws {ApiError} If the inference fails.
   */
  async sam3AssistedPoints(
    beforeRgbPath: string,
    afterRgbPath: string,
    beforePoints: Point[] | null,
    afterPoints: Point[] | null
  ): Promise<SAM3Response> {
    // Send points directly in pixel coordinates (backend gets dimensions from image files)
    const response = await fetch(`${config.apiUrl}/analysis/sam3/assisted/points`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        before_rgb_path: beforeRgbPath,
        after_rgb_path: afterRgbPath,
        before_points: beforePoints,
        after_points: afterPoints,
      }),
    });

    const data = await handleResponse<SAM3Response>(response);
    
    // Add mask_id, image_type, and color_index for frontend compatibility
    // Use timestamp to create unique IDs across runs
    const timestamp = Date.now();
    return {
      before_masks: data.before_masks.map((m, idx) => ({
        ...m,
        image_type: 'before' as const,
        mask_id: `before_${timestamp}_${idx}`,
        color_index: idx,
      })),
      after_masks: data.after_masks.map((m, idx) => ({
        ...m,
        image_type: 'after' as const,
        mask_id: `after_${timestamp}_${idx}`,
        color_index: idx,
      })),
    };
  },

  /**
   * Computes nutrition by calculating volumes and converting to masses.
   *
   * @param beforeDepthPath - Path to the before-meal depth image.
   * @param afterDepthPath - Path to the after-meal depth image.
   * @param beforeMasks - Masks for the before image.
   * @param afterMasks - Masks for the after image.
   * @returns A promise resolving to computed nutrition data.
   * @throws {ApiError} If the computation fails.
   */
  async computeNutrition(
    beforeDepthPath: string,
    afterDepthPath: string,
    beforeMasks: FoodMask[],
    afterMasks: FoodMask[]
  ): Promise<ComputeNutritionResponse> {
    // Convert masks to backend format (remove mask_id and image_type)
    const formatMasks = (masks: FoodMask[]) =>
      masks.map((m) => ({
        food_id: m.food_id,
        mask: m.mask,
      }));

    const response = await fetch(`${config.apiUrl}/analysis/compute-nutrition`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        before_depth_path: beforeDepthPath,
        after_depth_path: afterDepthPath,
        before_masks: formatMasks(beforeMasks),
        after_masks: formatMasks(afterMasks),
      }),
    });

    return handleResponse<ComputeNutritionResponse>(response);
  },
};
