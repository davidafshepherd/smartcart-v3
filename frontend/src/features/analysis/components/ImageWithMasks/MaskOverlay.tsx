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

  return (
    <>
      {/* Paint each mask's pixels onto a canvas. */}
      {masks.map((mask) => {
        if (!mask.mask_id) return null;

        const canvas = document.createElement("canvas");
        canvas.width = imageWidth;
        canvas.height = imageHeight;

        const ctx = canvas.getContext("2d");
        if (!ctx) return null;

        const color = mask.color_index !== undefined
            ? getMaskColor(mask.color_index)
            : mask.food_id !== null
              ? getFoodColor(mask.food_id)
              : getMaskColor(0);

        const r = parseInt(color.slice(1, 3), 16);
        const g = parseInt(color.slice(3, 5), 16);
        const b = parseInt(color.slice(5, 7), 16);

        const maskImageData = ctx.createImageData(imageWidth, imageHeight);
        const data = maskImageData.data;

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

        ctx.putImageData(maskImageData, 0, 0);

        /* Render the canvas as an overlay image. */
        return (
          <img className="mask-overlay-img" key={mask.mask_id} src={canvas.toDataURL()} alt="Mask overlay" />
        );
      })}
    </>
  );
}
