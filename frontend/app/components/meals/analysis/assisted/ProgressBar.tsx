'use client';

import type { Food } from '../../../../lib/types';
import { getFoodColor } from '../../../../lib/utils';

// =============================================================================
// Types
// =============================================================================

/** Props for the ProgressBar component. */
interface ProgressBarProps {
  /** List of all foods to segment. */
  foods: Food[];
  /** Index of the currently active food. */
  currentIndex: number;
  /** Array indicating which foods have been completed (have a before mask). */
  completedIndices: boolean[];
}

// =============================================================================
// Component
// =============================================================================

/**
 * Renders a progress bar showing segmentation progress across foods.
 *
 * @param props - The component props.
 * @returns The progress bar element.
 */
export function ProgressBar({ foods, currentIndex, completedIndices }: ProgressBarProps) {
  return (
    <div className="flex gap-1">
      {foods.map((food, index) => {
        const isComplete = completedIndices[index] ?? false;
        const isCurrent = index === currentIndex;
        return (
          <div
            key={food.id}
            className="flex-1 h-2 rounded-full"
            style={{
              background: isComplete
                ? getFoodColor(food.id)
                : isCurrent
                  ? `${getFoodColor(food.id)}50`
                  : 'var(--card-border)',
            }}
          />
        );
      })}
    </div>
  );
}
