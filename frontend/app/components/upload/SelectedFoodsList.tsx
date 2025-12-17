/**
 * @fileoverview Selected foods list component.
 *
 * Displays a list of selected foods with remove buttons. Used in menu item
 * creation and editing workflows.
 */

'use client';

import React from 'react';
import type { Food } from '../../lib/types';

// =============================================================================
// Types
// =============================================================================

/** Props for the SelectedFoodsList component. */
interface SelectedFoodsListProps {
  /** Array of selected foods to display. */
  selectedFoods: Food[];
  /** Callback when a food should be removed. */
  onRemoveFood: (foodId: number) => void;
  /** Optional maximum height for scrollable list. */
  maxHeight?: string;
}

// =============================================================================
// Component
// =============================================================================

/**
 * Renders a list of selected foods with remove buttons.
 *
 * Each food displays its name and nutritional information (kcal/100g).
 * Users can click the remove button to deselect a food.
 *
 * @param props - The component props.
 * @returns The selected foods list element.
 */
export function SelectedFoodsList({
  selectedFoods,
  onRemoveFood,
  maxHeight = 'max-h-32',
}: SelectedFoodsListProps) {
  if (selectedFoods.length === 0) return null;

  return (
    <div>
      <label
        className="block text-sm font-medium mb-2"
        style={{ color: 'var(--foreground)' }}
      >
        Selected Foods ({selectedFoods.length})
      </label>
      <div className={`space-y-2 overflow-y-auto ${maxHeight}`}>
        {selectedFoods.map((food) => (
          <div
            key={food.id}
            className="flex items-center justify-between px-3 py-2 rounded-lg border"
            style={{
              background: 'var(--accent-light)',
              borderColor: 'var(--card-border)',
            }}
          >
            <div className="flex-1 min-w-0">
              <div
                className="text-sm font-medium truncate"
                style={{ color: 'var(--foreground)' }}
              >
                {food.food_name}
              </div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {food.kcal != null ? `${food.kcal} kcal/100g` : ''}
              </div>
            </div>
            <button
              onClick={() => onRemoveFood(food.id)}
              className="ml-2 p-1 rounded-lg transition-colors hover:bg-red-100 cursor-pointer"
              style={{ color: 'var(--danger)' }}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

