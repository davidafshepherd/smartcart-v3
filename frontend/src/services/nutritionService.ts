import { appConfig } from '@/config/appConfig';
import { handleApiCall } from '@/services/apiClient';
import type { ComputeNutritionResponse, NutritionReport } from '@/types';


/**
 * API client for nutrition report operations.
 */
export const nutritionService = {
  /**
   * Saves a nutrition report for a meal.
   * @param mealId - The ID of the meal to save the nutrition report for.
   * @param nutritionData - The nutrition data to save.
   * @returns A promise resolving to the saved nutrition report.
   * @throws {ApiError} If the save fails.
   */
  async saveReport(mealId: number, nutritionData: ComputeNutritionResponse): Promise<NutritionReport> {
    return handleApiCall<NutritionReport>(
      fetch(`${appConfig.apiUrl}/nutrition`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          meal_id: mealId,
          meal_nutrition: nutritionData.meal_nutrition,
          food_nutrition: nutritionData.food_nutrition,
        }),
      })
    );
  },

  
  /**
   * Retrieves a nutrition report for a meal.
   * @param mealId - The ID of the meal to retrieve the nutrition report for.
   * @returns A promise resolving to the nutrition report.
   * @throws {ApiError} If the nutrition report doesn't exist.
   */
  async getReport(mealId: number): Promise<NutritionReport> {
    return handleApiCall<NutritionReport>(
      fetch(`${appConfig.apiUrl}/nutrition/${mealId}`)
    );
  },


  /**
   * Deletes a nutrition report.
   * @param mealId - The ID of the nutrition report to delete.
   * @returns A promise that resolves when the nutrition report is deleted.
   * @throws {ApiError} If the nutrition report doesn't exist or deletion fails.
   */
  async delete(mealId: number): Promise<void> {
    return handleApiCall<void>(
      fetch(`${appConfig.apiUrl}/nutrition/${mealId}`, { method: 'DELETE' })
    );
  },

  
  /**
   * Retrieves a nutrition report for a patient over a date period
   * @param patientId - Id for a patient
   * @param startDate - Start date of range
   * @param endDate - End date of range
   * @returns A promise resolving to the set of nutrition reports to compile
   */
  async getPatientReport(
    patientId: number, 
    startDate: Date, 
    endDate: Date
  ): Promise<Record<string, NutritionReport> | null> {
    return handleApiCall<Record<string, NutritionReport>>(
      fetch(`${appConfig.apiUrl}/nutrition/patient/${patientId}?report_from=${startDate.toISOString()}&report_to=${endDate.toISOString()}`)
    );
  },
};
