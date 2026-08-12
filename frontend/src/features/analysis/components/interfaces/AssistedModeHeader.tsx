import { ArrowLeftIcon } from '@/components/common/icons';
import { getFoodColor } from '@/utils/colour';
import { formatFoodName } from '@/utils/formatters';

import type { Food } from '@/types';

import { ProgressBar } from '../AssistedMode/ProgressBar/ProgressBar';


interface Props {
  foods: Food[];
  currentFoodIndex: number;
  completedIndices: boolean[];
  inputType: 'points' | 'text';
  onBack: () => void;
}


export function AssistedModeHeader({ foods, currentFoodIndex, completedIndices, inputType, onBack }: Props) {
  const currentFood = foods[currentFoodIndex];

  return (
    <div className="analysis-header">
      {/* Title row */}
      <div className="analysis-header-row">
        {/* Row content */}
        <div className="analysis-header-content">
          {/* Title and food badge */}
          <div className="assisted-mode-header-top">
            <h2 className="analysis-header-title">Assisted Segmentation</h2>
            <span
              className="assisted-mode-food-badge"
              style={{
                background: `${getFoodColor(currentFood.id)}20`,
                color: getFoodColor(currentFood.id),
                border: `1px solid ${getFoodColor(currentFood.id)}`,
              }}
            >
              {currentFoodIndex + 1} of {foods.length}: {formatFoodName(currentFood.short_name)}
            </span>
          </div>

          {/* Subtitle */}
          <p className="analysis-header-subtitle">
            {inputType === 'text'
              ? 'Use a text prompt to segment each food in the images.'
              : 'Use points to segment each food in the images.'}
          </p>
        </div>

        {/* Row back button */}
        <button className="analysis-back-button" onClick={onBack}>
          <ArrowLeftIcon className="analysis-back-button-icon" />
          <span>Back</span>
        </button>
      </div>

      {/* Progress bar */}
      <div className="analysis-header-progress">
        <ProgressBar foods={foods} currentIndex={currentFoodIndex} completedIndices={completedIndices} />
      </div>
    </div>
  );
}
