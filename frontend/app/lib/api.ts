/**
 * @fileoverview Centralized API client for backend communication.
 *
 * This module provides a type-safe interface for all API operations,
 * including file uploads, menu management, and meal CRUD operations.
 * All API functions handle errors consistently and return typed responses.
 *
 * @example
 * ```typescript
 * import { uploadApi, menuApi, mealsApi, ApiError } from './api';
 *
 * try {
 *   const response = await uploadApi.uploadZip(file);
 *   console.log(`Uploaded ${response.meal_snapshots.length} snapshots`);
 * } catch (error) {
 *   if (error instanceof ApiError) {
 *     console.error(`API Error ${error.status}: ${error.message}`);
 *   }
 * }
 * ```
 */

import { config } from './config';
import type { UploadResponse, MenuItem, MealsData, MealData } from './types';

// =============================================================================
// Error Handling
// =============================================================================

/**
 * Custom error class for API-related errors.
 *
 * Extends the standard Error class with HTTP status code and optional
 * response details for more informative error handling.
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
 *
 * Handles ZIP file uploads, snapshot management, and image URL generation.
 */
export const uploadApi = {
  /**
   * Uploads a ZIP file containing meal snapshot folders.
   *
   * The ZIP file should contain folders with RGB images, depth images,
   * and metadata.json files. The backend will validate and process
   * each folder, returning both valid and invalid snapshots.
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
   * Removes the snapshot from the database and deletes its associated
   * files from the upload directory.
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

  /**
   * Generates the full URL for an image.
   *
   * Converts a relative image path to a complete URL that can be used
   * in img src attributes.
   *
   * @param path - The relative path to the image.
   * @returns The complete URL to fetch the image.
   */
  getImageUrl(path: string): string {
    return `${config.apiUrl}/uploads/images/${path}`;
  },
};

// =============================================================================
// Menu API
// =============================================================================

/**
 * API client for menu item operations.
 *
 * Handles retrieval and creation of menu items.
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
   * @param ingredients - List of ingredient names.
   * @returns A promise resolving to the newly created menu item.
   * @throws {ApiError} If creation fails (e.g., duplicate name).
   */
  async create(name: string, ingredients: string[]): Promise<MenuItem> {
    const response = await fetch(`${config.apiUrl}/menu`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, ingredients }),
    });

    return handleResponse<MenuItem>(response);
  },
};

// =============================================================================
// Meals API
// =============================================================================

/**
 * API client for meal operations.
 *
 * Handles retrieval, creation, and deletion of meal records.
 */
export const mealsApi = {
  /**
   * Retrieves all meals organized in a hierarchical structure.
   *
   * The backend returns a flat list of meals, which this function
   * transforms into a nested structure organized by patient ID,
   * date, and time range for efficient tree view rendering.
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
   * Pairs two snapshots (before and after eating) with a menu item
   * to create a complete meal record. The snapshots are validated
   * to ensure they have the same patient ID and date, and that the
   * before time precedes the after time.
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
};
