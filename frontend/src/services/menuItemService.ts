import { appConfig } from '@/config/appConfig';
import { handleApiCall } from './apiClient';
import type { MenuItem } from '@/types';


/**
 * API client for menu item operations.
 */
export const menuItemService = {
  /**
   * Retrieves all menu items from the database.
   * @returns A promise resolving to an array of all menu items.
   * @throws {ApiError} If the request fails.
   */
  async getAll(): Promise<MenuItem[]> {
    return handleApiCall<MenuItem[]>(
      fetch(`${appConfig.apiUrl}/menu`)
    );
  },


  /**
   * Creates a new menu item.
   * @param name - The display name for the menu item.
   * @param foodIds - List of food IDs from the nutrition dataset.
   * @returns A promise resolving to the newly created menu item.
   * @throws {ApiError} If creation fails (e.g., invalid food IDs).
   */
  async create(name: string, foodIds: number[]): Promise<MenuItem> {
    return handleApiCall<MenuItem>(
      fetch(`${appConfig.apiUrl}/menu`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, food_ids: foodIds }),
      })
    );
  },


  /**
   * Updates a menu item.
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
    return handleApiCall<MenuItem>(
      fetch(`${appConfig.apiUrl}/menu/${menuItemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, food_ids: foodIds }),
      })
    );
  },


  /**
   * Deletes a menu item.
   * @param menuItemId - The ID of the menu item to delete.
   * @returns A promise that resolves when the menu item is deleted.
   * @throws {ApiError} If the menu item doesn't exist or is in use by a meal.
   */
  async delete(menuItemId: number): Promise<void> {
    return handleApiCall<void>(
      fetch(`${appConfig.apiUrl}/menu/${menuItemId}`, { method: 'DELETE' })
    );
  },
};
