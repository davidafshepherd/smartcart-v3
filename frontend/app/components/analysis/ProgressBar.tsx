/**
 * @fileoverview Progress bar component for tracking food segmentation progress.
 *
 * Displays a visual progress indicator showing which foods have been completed
 * and which is currently being worked on.
 */

'use client';

import type { Food } from '../../lib/types';
import { getFoodColor } from '../../lib/utils';

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
 * Each food gets a segment in the bar:
 * - Completed foods: Full color
 * - Current food: Semi-transparent color
 * - Pending foods: Gray border
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

