'use client';

import React, { useState } from 'react';
import type { MealData, FoodMask, ComputeNutritionResponse } from '../../../lib/types';
import { imagesApi, nutritionApi, ApiError } from '../../../lib/api';
import { InputModeSelector } from './InputModeSelector';
import { AssistedModeInterface } from './assisted/AssistedModeInterface';
import { AutomatedModeInterface } from './automated/AutomatedModeInterface';
import { NutritionReportInterface } from '../nutrition/NutritionReportInterface';

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
  /** Callback to reset to empty state (close analysis view). */
  onClose?: () => void;
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
  onClose,
  onComputeVolume,
  nutritionData,
  setNutritionData,
  isComputingNutrition,
}: AnalysisInterfaceProps) {
  const [isSavingReport, setIsSavingReport] = useState(false);
  const [isDeletingReport, setIsDeletingReport] = useState(false);
  const [isReportSaved, setIsReportSaved] = useState(false);
  
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
    setIsReportSaved(false);
  };


  return (
    <>
      {/* Step 1: Input Mode Selection */}
      {step === 'select-input' && (
        <div
          className="rounded-2xl border shadow-sm"
          style={{
            background: 'var(--card-bg)',
            borderColor: 'var(--card-border)',
          }}
        >
          <InputModeSelector onSelect={handleInputModeSelect} />
        </div>
      )}

      {/* Step 2a: Automated Segmentation */}
      {step === 'automated' && (
        <div
          className="rounded-2xl border shadow-sm"
          style={{
            background: 'var(--card-bg)',
            borderColor: 'var(--card-border)',
          }}
        >
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
        </div>
      )}

      {/* Step 2b: Assisted Segmentation */}
      {step === 'assisted' && (
        <div
          className="rounded-2xl border shadow-sm"
          style={{
            background: 'var(--card-bg)',
            borderColor: 'var(--card-border)',
          }}
        >
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
        </div>
      )}

      {/* Step 3: Nutrition Report */}
      {step === 'nutrition-report' && (
        <NutritionReportInterface
          nutritionData={nutritionData}
          foods={
            isReportSaved && nutritionData
              ? nutritionData.food_nutrition.map(fn => ({
                  id: fn.food_id,
                  short_name: fn.short_name || `Food ${fn.food_id}`,
                })) as Array<{ id: number; short_name: string }>
              : foods
          }
          onSave={isReportSaved ? undefined : async () => {
            if (!nutritionData || isSavingReport) return;
            setIsSavingReport(true);
            try {
              await nutritionApi.saveReport(meal.id, nutritionData);
              setIsReportSaved(true);
              // Trigger a window event to refresh meals data
              window.dispatchEvent(new Event('nutrition-report-saved'));
            } catch {
              // Silently fail - if save fails, section won't reset and user can try again
            } finally {
              setIsSavingReport(false);
            }
          }}
          onDiscard={isReportSaved ? () => {
            // Close: go to empty state
            setNutritionData(null);
            setIsReportSaved(false);
            if (onClose) {
              onClose();
            } else {
              // Fallback to input selection if onClose not provided
              onInputModeChange(null);
            }
          } : () => {
            // Discard: go to empty state
            setNutritionData(null);
            setIsReportSaved(false);
            if (onClose) {
              onClose();
            } else {
              // Fallback to input selection if onClose not provided
              onInputModeChange(null);
            }
          }}
          onDelete={isReportSaved ? async () => {
            // Prevent double-clicks
            if (isDeletingReport) return;

            setIsDeletingReport(true);
            try {
              await nutritionApi.delete(meal.id);
              // Go to empty state first (before event dispatch)
              setNutritionData(null);
              setIsReportSaved(false);
              if (onClose) {
                onClose();
              } else {
                // Fallback to input selection if onClose not provided
                onInputModeChange(null);
              }
              // Trigger refresh after closing (so event listener sees viewMode as null)
              window.dispatchEvent(new Event('nutrition-report-saved'));
            } catch (err) {
              console.error('Failed to delete nutrition report:', err);
              const errorMessage = err instanceof Error ? err.message : 'Failed to delete nutrition report';
              alert(errorMessage);
            } finally {
              setIsDeletingReport(false);
            }
          } : undefined}
          isSavingReport={isSavingReport}
          isDeletingReport={isDeletingReport}
          readOnly={isReportSaved}
        />
      )}
    </>
  );
}
