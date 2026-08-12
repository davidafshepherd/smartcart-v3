import { formatFoodName } from '@/utils/formatters';

import type { FoodNutrition } from '@/types';

import './FoodSelection.css';


interface Props {
  foods: FoodNutrition[];
  selectedIds: Set<number>;
  onToggle: (foodId: number) => void;
}


export function FoodSelection({ foods, selectedIds, onToggle }: Props) {
  return (
    <div className="food-selection">
      {/* Header */}
      <h3 className="food-selection-label">Select Foods to Include</h3>

      {/* Food selection list */}
      <div className="food-selection-list">
        {foods.map(f => (
          /* Food */
          <label key={f.food_id} className="food-selection-checkbox">
            <input
              type="checkbox"
              className="food-selection-checkbox-input"
              checked={selectedIds.has(f.food_id)}
              onChange={() => onToggle(f.food_id)}
            />
            <span className="food-selection-checkbox-label">
              {formatFoodName(f.short_name ?? f.food_name ?? 'Unknown')}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}
