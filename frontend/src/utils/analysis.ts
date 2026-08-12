/**
 * Merges multiple binary masks into a single mask using OR operation.
 * @param masks - Array of 2D binary masks to merge.
 * @returns The merged mask, or null if the input array is empty.
 */
export function mergeMasks(masks: number[][][]): number[][] | null {
  if (masks.length === 0) return null;
  if (masks.length === 1) return masks[0];

  const height = masks[0].length;
  const width = masks[0][0]?.length ?? 0;
  const merged: number[][] = Array(height).fill(null).map(() => Array(width).fill(0));

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      for (const mask of masks) {
        if (mask[y]?.[x] === 1) {
          merged[y][x] = 1;
          break;
        }
      }
    }
  }

  return merged;
}
