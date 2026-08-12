import { appConfig } from '@/config/appConfig';
import { handleApiCall } from './apiClient';
import type { Meal, Meals } from '@/types';


/**
 * API client for meal operations.
 */
export const mealService = {
  /**
   * Retrieves all meals organized in a hierarchical structure.
   * @returns A promise resolving to the hierarchical meals data.
   * @throws {ApiError} If the request fails.
   */
  async getAll(): Promise<Meals> {
    // Fetch meals.
    const meals = await handleApiCall<Meal[]>(
      fetch(`${appConfig.apiUrl}/meals`)
    );

    // Transform flat list to hierarchical structure for tree view.
    const result: Meals = {};
    
    for (const meal of meals) {
      // Extract grouping keys for patient, date and meal time range.
      const patientId = String(meal.patient.id);
      const date = meal.date;
      const timeRange = `${meal.start_time.slice(0, 5)}-${meal.end_time.slice(0, 5)}`;

      // Create nested objects for missing patient and date entries.
      if (!result[patientId]) result[patientId] = {};
      if (!result[patientId][date]) result[patientId][date] = {};
      result[patientId][date][timeRange] = meal;
    }

    return result;
  },


  /**
   * Creates a new meal from matched snapshots.
   * @param beforeSnapshotId - ID of the pre-meal snapshot.
   * @param afterSnapshotId - ID of the post-meal snapshot.
   * @param menuItemId - ID of the menu item served.
   * @returns A promise resolving to the newly created meal.
   * @throws {ApiError} If validation fails or creation fails.
   */
  async create(beforeSnapshotId: number, afterSnapshotId: number, menuItemId: number): Promise<Meal> {
    return handleApiCall<Meal>(
      fetch(`${appConfig.apiUrl}/meals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          before_snapshot_id: beforeSnapshotId, 
          after_snapshot_id: afterSnapshotId, 
          menu_item_id: menuItemId 
        }),
      })
    );
  },


  /**
   * Deletes a meal and its associated image files.
   * @param mealId - The ID of the meal to delete.
   * @returns A promise that resolves when the meal is deleted.
   * @throws {ApiError} If the meal doesn't exist or deletion fails.
   */
  async delete(mealId: number): Promise<void> {
    return handleApiCall<void>(
      fetch(`${appConfig.apiUrl}/meals/${mealId}`, { method: 'DELETE' })
    );
  },


  /**
   * Updates a meal's patient and/or menu item.
   * @param mealId - The ID of the meal to update.
   * @param patientId - Optional new patient ID.
   * @param menuItemId - Optional new menu item ID.
   * @returns A promise resolving to the updated meal.
   * @throws {ApiError} If the meal, patient, or menu item doesn't exist.
   */
  async update(mealId: number, patientId?: number, menuItemId?: number): Promise<Meal> {
    return handleApiCall<Meal>(
      fetch(`${appConfig.apiUrl}/meals/${mealId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patient_id: patientId, menu_item_id: menuItemId }),
      })
    );
  },
};
