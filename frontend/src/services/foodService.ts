import { appConfig } from '@/config/appConfig';
import { handleApiCall } from './apiClient';
import type { Food } from '@/types';


/**
 * API client for food operations.
 */
export const foodService = {
  /**
   * Searches foods by name from the nutrition dataset.
   * @param term - Optional search term to filter foods by name.
   * @param limit - Maximum number of results to return (default: 50).
   * @returns A promise resolving to an array of matching foods.
   * @throws {ApiError} If the request fails.
   */
  async search(term?: string, limit: number = 50): Promise<Food[]> {
    const params = new URLSearchParams();
    if (term) params.append('term', term);
    params.append('limit', String(limit));

    return handleApiCall<Food[]>(
      fetch(`${appConfig.apiUrl}/foods?${params}`)
    );
  },


  /**
   * Retrieves a single food by its ID.
   * @param foodId - The unique ID of the food to retrieve.
   * @returns A promise resolving to the food details.
   * @throws {ApiError} If the food doesn't exist.
   */
  async get(foodId: number): Promise<Food> {
    return handleApiCall<Food>(
      fetch(`${appConfig.apiUrl}/foods/${foodId}`)
    );
  },
};
