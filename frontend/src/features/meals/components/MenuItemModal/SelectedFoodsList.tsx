import { XIcon } from '@/components/common/icons';

import type { Food } from '@/types';


interface Props {
  selectedFoods: Food[];
  onRemoveFood: (foodId: number) => void;
}


export default function SelectedFoodsList({ selectedFoods, onRemoveFood }: Props) {
  return (
    <div>
      {/* Header */}
      <label className="foods-list-label">Selected Foods ({selectedFoods.length})</label>

      {/* Food list */}
      <div className="foods-list-items">
        {selectedFoods.length === 0 && (
          <p className="foods-list-empty">No foods selected.</p>
        )}

        {selectedFoods.map(food => (
          <div key={food.id} className="foods-list-item">
            {/* Food info */}
            <div className="foods-list-info">
              <div className="foods-list-name">{food.food_name}</div>
              {food.kcal != null && (
                <div className="foods-list-calories">{food.kcal} kcal/100g</div>
              )}
            </div>
            {/* Remove button */}
            <button className="foods-list-remove-button" onClick={() => onRemoveFood(food.id)}>
              <XIcon className="foods-list-remove-button-icon" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
