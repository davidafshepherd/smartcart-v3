/**
 * A 2D point on an image with a label indicating foreground (1) or background (0).
 */
export interface Point {
  label: number;
  x: number;
  y: number;
}


/**
 * A segmentation mask for a food item.
 */
export interface FoodMask {
  food_id: number | null;
  mask: number[][];
  mask_id?: string;
  image_type?: 'before' | 'after';
  color_index?: number;
}


/**
 * A warning message from SAM3 inference.
 */
export interface SAM3Warning{
  food_id: number;
  food_name: string;
  message: string;
}


/**
 * SAM3 response containing masks for before and after images.
 */
export interface SAM3Response {
  before_masks: FoodMask[];
  after_masks: FoodMask[];
  warnings: SAM3Warning[];
}
