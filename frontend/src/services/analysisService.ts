import { appConfig } from '@/config/appConfig';
import { handleApiCall } from '@/services/apiClient';
import type { ComputeNutritionResponse, FoodMask, Point, SAM3Response } from '@/types';


/**
 * API client for analysis-related operations.
 *
 */
export const analysisService = {
  /**
   * Runs SAM3 automated segmentation for all foods.
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
    // Send segmentation request with image paths, food IDs and confidence threshold.
    const data = await handleApiCall<SAM3Response>(
      fetch(`${appConfig.apiUrl}/analysis/sam3/automated`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          before_rgb_path: beforeRgbPath,
          after_rgb_path: afterRgbPath,
          confidence_threshold: confidenceThreshold,
          foods: foodIds,
        }),
      })
    );
    
    // Format masks for frontend compatibility.
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
      warnings: data.warnings || [],
    };
  },

  /**
   * Runs SAM3 assisted segmentation using a text prompt.
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
    foodId: number,
    confidenceThreshold: number = 0.5
  ): Promise<SAM3Response> {
    // Send segmentation request with image paths, food IDs, text prompt and confidence threshold.
    const data = await handleApiCall<SAM3Response>(
      fetch(`${appConfig.apiUrl}/analysis/sam3/assisted/text`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          before_rgb_path: beforeRgbPath,
          after_rgb_path: afterRgbPath,
          confidence_threshold: confidenceThreshold,
          text_prompt: textPrompt,
          food_id: foodId,
        }),
      })
    );
    
    // Format masks for frontend compatibility.
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
      warnings: data.warnings || [],
    };
  },

  /**
   * Runs SAM3 assisted segmentation using points.
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
    // Send segmentation request with image paths and points.
    const data = await handleApiCall<SAM3Response>(
      fetch(`${appConfig.apiUrl}/analysis/sam3/assisted/points`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          before_rgb_path: beforeRgbPath,
          after_rgb_path: afterRgbPath,
          before_points: beforePoints,
          after_points: afterPoints,
        }),
      })
    );
    
    // Format masks for frontend compatibility.
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
      warnings: data.warnings || [],
    };
  },

  /**
   * Computes nutrition by calculating volumes and converting to masses.
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
    // Format masks for backend compatibility.
    const formatMasks = (masks: FoodMask[]) => masks.map((m) => ({ food_id: m.food_id, mask: m.mask }));

    // Compute nutrition.
    return handleApiCall<ComputeNutritionResponse>(
      fetch(`${appConfig.apiUrl}/analysis/compute-nutrition`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          before_depth_path: beforeDepthPath,
          after_depth_path: afterDepthPath,
          before_masks: formatMasks(beforeMasks),
          after_masks: formatMasks(afterMasks),
        }),
      })
    );
  },
};
