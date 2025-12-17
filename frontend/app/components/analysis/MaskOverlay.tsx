'use client';

import type { FoodMask } from '../../lib/types';
import { getFoodColor, getMaskColor } from '../../lib/utils';

// =============================================================================
// Types
// =============================================================================

/** Props for the MaskOverlay component. */
interface MaskOverlayProps {
  /** Array of masks to render. */
  masks: FoodMask[];
  /** Natural width of the image in pixels. */
  imageWidth: number;
  /** Natural height of the image in pixels. */
  imageHeight: number;
}

// =============================================================================
// Component
// =============================================================================

/**
 * Renders mask overlays on top of an image.
 *
 * @param props - The component props.
 * @returns Array of mask overlay image elements, or null if dimensions are invalid.
 */
export function MaskOverlay({ masks, imageWidth, imageHeight }: MaskOverlayProps) {
  if (!imageWidth || !imageHeight) return null;

  return (
    <>
      {masks.map((mask) => {
        if (!mask.mask_id) return null;

        // Create canvas matching image dimensions (mask is same size as image)
        const canvas = document.createElement('canvas');
        canvas.width = imageWidth;
        canvas.height = imageHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;

        // Use stable color_index or food color
        const color =
          mask.color_index !== undefined
            ? getMaskColor(mask.color_index)
            : mask.food_id !== null
              ? getFoodColor(mask.food_id)
              : getMaskColor(0);

        const r = parseInt(color.slice(1, 3), 16);
        const g = parseInt(color.slice(3, 5), 16);
        const b = parseInt(color.slice(5, 7), 16);

        // Create ImageData for the mask (same dimensions as image)
        const maskImageData = ctx.createImageData(imageWidth, imageHeight);
        const data = maskImageData.data;

        // Fill mask pixels directly (mask dimensions match image dimensions)
        for (let y = 0; y < imageHeight; y++) {
          for (let x = 0; x < imageWidth; x++) {
            if (mask.mask[y]?.[x] === 1) {
              const idx = (y * imageWidth + x) * 4;
              data[idx] = r; // R
              data[idx + 1] = g; // G
              data[idx + 2] = b; // B
              data[idx + 3] = 128; // A (0.5 opacity = 128/255)
            }
          }
        }

        // Put the ImageData directly onto the canvas
        ctx.putImageData(maskImageData, 0, 0);

        return (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={mask.mask_id}
            src={canvas.toDataURL()}
            alt="Mask overlay"
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{ objectFit: 'fill' }}
          />
        );
      })}
    </>
  );
}
