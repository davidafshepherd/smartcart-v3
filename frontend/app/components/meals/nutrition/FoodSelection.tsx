'use client';

import type { FoodNutrition } from '../../../lib/types';
import { formatFoodName } from '../../../lib/utils';

interface FoodSelectionProps {
  foodNutrition: FoodNutrition[];
  selectedFoodIds: Set<number>;
  onSelectionChange: (selectedIds: Set<number>) => void;
  foods: Array<{ id: number; short_name: string }>;
}

/**
 * Renders food selection checkboxes.
 */
export function FoodSelection({ foodNutrition, selectedFoodIds, onSelectionChange, foods }: FoodSelectionProps) {
  const getFoodName = (foodId: number): string => {
    const food = foods.find((f) => f.id === foodId);
    if (!food) return `Food ${foodId}`;
    return formatFoodName(food.short_name);
  };

  return (
    <div className="mb-6 pb-6 border-b" style={{ borderColor: 'var(--card-border)' }}>
      <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--foreground)' }}>
        Select Foods to Include
      </h3>
      <div className="flex flex-wrap gap-4">
        {foodNutrition.map((foodNut, index) => (
          <label
            key={`food-checkbox-${foodNut.food_id}-${index}`}
            className="flex items-center gap-2 cursor-pointer"
          >
            <input
              type="checkbox"
              checked={selectedFoodIds.has(foodNut.food_id)}
              onChange={(e) => {
                const newSelected = new Set(selectedFoodIds);
                if (e.target.checked) {
                  newSelected.add(foodNut.food_id);
                } else {
                  newSelected.delete(foodNut.food_id);
                }
                onSelectionChange(newSelected);
              }}
              className="w-4 h-4 rounded border-2 cursor-pointer"
              style={{
                accentColor: 'var(--accent-primary)',
                borderColor: 'var(--card-border)',
              }}
            />
            <span className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
              {getFoodName(foodNut.food_id)}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}
