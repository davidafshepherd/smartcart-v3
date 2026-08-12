import { getFoodColor } from '@/utils/colour';

import type { Food } from '@/types';

import './ProgressBar.css';


interface Props {
  foods: Food[];
  currentIndex: number;
  completedIndices: boolean[];
}


export function ProgressBar({ foods, currentIndex, completedIndices }: Props) {
  return (
    <div className="progress-bar">
      {/* Bar segments */}
      {foods.map((food, index) => {
        const isComplete = completedIndices[index] ?? false;
        const isCurrent = index === currentIndex;

        // Filled, semi-transparent or grey depending on completion state.
        return (
          <div
            key={food.id}
            className="progress-bar-segment"
            style={{ 
              background: (() => {
                if (isComplete) return getFoodColor(food.id);
                if (isCurrent) return `${getFoodColor(food.id)}50`;
                return "var(--card-border)";
              })()
            }} 
          />
        );
      })}
    </div>
  );
}
