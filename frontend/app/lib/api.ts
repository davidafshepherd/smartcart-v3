/**
 * Centralized API client for backend communication.
 */

import { config } from './config';
import type { UploadResponse, MenuItem, MealsData } from './types';

class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new ApiError(
      errorData.detail?.message || errorData.detail || 'Request failed',
      response.status,
      errorData,
    );
  }
  
  // Handle 204 No Content
  if (response.status === 204) {
    return undefined as T;
  }
  
  return response.json();
}

/**
 * Upload API
 */
export const uploadApi = {
  /**
   * Uploads a ZIP file containing meal snapshots.
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
   * Discards a specific meal snapshot entry.
   */
  async discardEntry(uploadId: string, entryId: string): Promise<void> {
    const response = await fetch(
      `${config.apiUrl}/uploads/${uploadId}/entries/${entryId}`,
      { method: 'DELETE' },
    );

    return handleResponse<void>(response);
  },

  /**
   * Gets the URL for an image.
   */
  getImageUrl(path: string): string {
    return `${config.apiUrl}/uploads/images/${path}`;
  },
};

/**
 * Menu API
 */
export const menuApi = {
  /**
   * Gets all menu items.
   */
  async getAll(): Promise<MenuItem[]> {
    const response = await fetch(`${config.apiUrl}/menu`);
    return handleResponse<MenuItem[]>(response);
  },

  /**
   * Creates a new menu item.
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

/**
 * Meals API
 */
export const mealsApi = {
  /**
   * Gets all meals organized hierarchically.
   */
  async getAll(): Promise<MealsData> {
    const response = await fetch(`${config.apiUrl}/meals`);
    return handleResponse<MealsData>(response);
  },

  /**
   * Creates a new meal from matched snapshots.
   */
  async create(
    uploadId: string,
    beforeEntryId: string,
    afterEntryId: string,
    menuItemId: number,
  ): Promise<unknown> {
    const response = await fetch(`${config.apiUrl}/meals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        upload_id: uploadId,
        before_entry_id: beforeEntryId,
        after_entry_id: afterEntryId,
        menu_item_id: menuItemId,
      }),
    });

    return handleResponse<unknown>(response);
  },

  /**
   * Deletes a meal.
   */
  async delete(mealId: number): Promise<void> {
    const response = await fetch(`${config.apiUrl}/meals/${mealId}`, {
      method: 'DELETE',
    });

    return handleResponse<void>(response);
  },
};

export { ApiError };

