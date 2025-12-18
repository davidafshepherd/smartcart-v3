'use client';

import React from 'react';
import type { MealData, FoodMask, ComputeNutritionResponse } from '../../lib/types';
import { imagesApi } from '../../lib/api';
import { InputModeSelector } from './InputModeSelector';
import { AssistedModeInterface } from './AssistedModeInterface';
import { AutomatedModeInterface } from './AutomatedModeInterface';
import { NutritionReportInterface } from './NutritionReportInterface';

// =============================================================================
// Types
// =============================================================================

/** Available segmentation input modes. */
type InputMode = 'automated' | 'assisted';

/** Steps in the analysis workflow. */
type AnalysisStep = 'select-input' | 'automated' | 'assisted' | 'nutrition-report';

/** Props for the AnalysisInterface component. */
interface AnalysisInterfaceProps {
  /** The meal being analyzed. */
  meal: MealData;
  /** Currently selected input mode. */
  inputMode: InputMode | null;
  /** Callback to change the input mode. */
  onInputModeChange: (mode: InputMode | null) => void;
  /** Callback to return to input selection. */
  onBackToInputSelection: () => void;
  /** Callback to compute nutrition from masks. */
  onComputeVolume: (beforeMasks: FoodMask[], afterMasks: FoodMask[]) => void;
  /** Computed nutrition data. */
  nutritionData: ComputeNutritionResponse | null;
  /** Setter for nutrition data. */
  setNutritionData: React.Dispatch<React.SetStateAction<ComputeNutritionResponse | null>>;
  /** Whether nutrition computation is in progress. */
  isComputingNutrition: boolean;
}

// =============================================================================
// Component
// =============================================================================

/**
 * Renders the main analysis interface for a meal.
 *
 * @param props - The component props.
 * @returns The analysis interface element.
 */

export function AnalysisInterface({
  meal,
  inputMode,
  onInputModeChange,
  onBackToInputSelection,
  onComputeVolume,
  nutritionData,
  setNutritionData,
  isComputingNutrition,
}: AnalysisInterfaceProps) {
  const foods = meal.menu_item.foods;
  const beforeImageUrl = imagesApi.getImageUrl(meal.before_rgb_path);
  const afterImageUrl = imagesApi.getImageUrl(meal.after_rgb_path);

  // Derive step directly from inputMode and nutritionData
  // This avoids cascading renders from setState in useEffect
  const step: AnalysisStep = nutritionData
    ? 'nutrition-report'
    : inputMode === 'assisted'
      ? 'assisted'
      : inputMode === 'automated'
        ? 'automated'
        : 'select-input';

  // Handle input mode selection
  const handleInputModeSelect = (mode: InputMode) => {
    onInputModeChange(mode);
  };

  // Handle back from assisted/automated to input selection
  const handleBackToInputSelection = () => {
    onBackToInputSelection();
    setNutritionData(null);
  };


  return (
    <div
      className="rounded-2xl border shadow-sm"
      style={{
        background: 'var(--card-bg)',
        borderColor: 'var(--card-border)',
      }}
    >
      {/* Step 1: Input Mode Selection */}
      {step === 'select-input' && (
        <InputModeSelector onSelect={handleInputModeSelect} />
      )}

      {/* Step 2a: Automated Segmentation */}
      {step === 'automated' && (
        <AutomatedModeInterface
          foods={foods}
          beforeImageUrl={beforeImageUrl}
          afterImageUrl={afterImageUrl}
          beforeRgbPath={meal.before_rgb_path}
          afterRgbPath={meal.after_rgb_path}
          onBackToInputSelection={handleBackToInputSelection}
          onComputeVolume={onComputeVolume}
          isComputingNutrition={isComputingNutrition}
        />
      )}

      {/* Step 2b: Assisted Segmentation */}
      {step === 'assisted' && (
        <AssistedModeInterface
          foods={foods}
          beforeImageUrl={beforeImageUrl}
          afterImageUrl={afterImageUrl}
          beforeRgbPath={meal.before_rgb_path}
          afterRgbPath={meal.after_rgb_path}
          onBackToInputSelection={handleBackToInputSelection}
          onComputeVolume={onComputeVolume}
          isComputingNutrition={isComputingNutrition}
        />
      )}

      {/* Step 3: Nutrition Report */}
      {step === 'nutrition-report' && (
        <NutritionReportInterface
          nutritionData={nutritionData}
          foods={foods}
          onSave={() => {
            // TODO: Implement save nutrition report
          }}
          onDiscard={() => {
            setNutritionData(null);
            onInputModeChange(null);
          }}
        />
      )}

    </div>
  );
}
