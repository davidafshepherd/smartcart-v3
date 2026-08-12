import { getFoodColor, getMaskColor } from '@/utils/colour';

import type { FoodMask } from '@/types';


interface Props {
  masks: FoodMask[];
  imageWidth: number;
  imageHeight: number;
}


export function MaskOverlay({ masks, imageWidth, imageHeight }: Props) {
  // Return nothing if dimensions are not yet known.
  if (!imageWidth || !imageHeight) return null;

  // Return nothing if there are no masks with an assigned ID.
  const visibleMasks = masks.filter((mask) => mask.mask_id);
  if (visibleMasks.length === 0) return null;

  // Create a canvas matching the image's dimensions to paint the masks onto.
  const canvas = document.createElement("canvas");
  canvas.width = imageWidth;
  canvas.height = imageHeight;

  // Return nothing if a 2D drawing context isn't available.
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  // Pixel buffer shared by all masks, so overlaps overwrite rather than blend.
  const imageData = ctx.createImageData(imageWidth, imageHeight);
  const data = imageData.data;

  // Paint each mask's pixels.
  for (const mask of visibleMasks) {
    const color = mask.color_index !== undefined
        ? getMaskColor(mask.color_index)
        : mask.food_id !== null
          ? getFoodColor(mask.food_id)
          : getMaskColor(0);

    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);

    for (let y = 0; y < imageHeight; y++) {
      for (let x = 0; x < imageWidth; x++) {
        if (mask.mask[y]?.[x] === 1) {
          const idx = (y * imageWidth + x) * 4;
          data[idx] = r;
          data[idx + 1] = g;
          data[idx + 2] = b;
          data[idx + 3] = 128;
        }
      }
    }
  }

  // Draw the painted pixel buffer onto the canvas.
  ctx.putImageData(imageData, 0, 0);

  /* Render the canvas as an overlay image. */
  return <img className="mask-overlay-img" src={canvas.toDataURL()} alt="Mask overlay" />;
}
