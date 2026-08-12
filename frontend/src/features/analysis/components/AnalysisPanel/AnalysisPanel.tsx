import { useEffect, useState } from 'react';

import { analysisService } from '@/services/analysisService';
import { imageService } from '@/services/imageService';
import { NutritionReportPanel } from '@/features/nutrition/components';

import type { ComputeNutritionResponse, FoodMask, Meal } from '@/types';

import { AutomatedModeInterface } from '../interfaces/AutomatedModeInterface';
import { AssistedModeInterface } from '../interfaces/AssistedModeInterface';
import { InputModeSelector } from '../InputModeSelector/InputModeSelector';

import './AnalysisPanel.css';


type InputMode = "automated" | "assisted";
type AnalysisStep = "select-input" | "automated" | "assisted" | "nutrition";


interface Props {
  meal: Meal;
  onClose: () => void;
}


export function AnalysisPanel({ meal, onClose }: Props) {
  // Analysis state.
  const [inputMode, setInputMode] = useState<InputMode | null>(null);
  const [isComputing, setIsComputing] = useState(false);
  const [nutritionResult, setNutritionResult] = useState<ComputeNutritionResponse | null>(null);


  // Derived meal data.
  const foods = meal.menu_item.foods;
  const foodIds = foods.map(f => f.id).join(",");
  const beforeImageUrl = imageService.getImageUrl(meal.before_rgb_path);
  const afterImageUrl = imageService.getImageUrl(meal.after_rgb_path);


  // Reset analysis state if the meal's patient, menu item or foods change.
  useEffect(() => {
    const resetInputMode = () => {
      setInputMode(null);
      setNutritionResult(null);
    };
    resetInputMode();
  }, [meal.patient.id, meal.menu_item.id, foodIds]);


  // Derived analysis step.
  const step: AnalysisStep = nutritionResult !== null
    ? "nutrition"
    : inputMode === "assisted"
      ? "assisted"
      : inputMode === "automated"
        ? "automated"
        : "select-input";


  // Reset to input mode selection.
  const handleBackToInputSelection = () => {
    setInputMode(null);
  };


  // Compute nutrition and show the report.
  const handleComputeVolume = async (beforeMasks: FoodMask[], afterMasks: FoodMask[]) => {
    setIsComputing(true);
    try {
      const result = await analysisService.computeNutrition(
        meal.before_depth_path, 
        meal.after_depth_path, 
        beforeMasks, 
        afterMasks,
      );
      setNutritionResult(result);
    } finally {
      setIsComputing(false);
    }
  };


  return (
    <>
      {/* Input mode selector */}
      {step === "select-input" && (
        <div className="analysis-card">
          <InputModeSelector onSelect={setInputMode} />
        </div>
      )}

      {/* Automated analysis */}
      {step === "automated" && (
        <div className="analysis-card">
          <AutomatedModeInterface
            foods={foods}
            beforeImageUrl={beforeImageUrl}
            afterImageUrl={afterImageUrl}
            beforeRgbPath={meal.before_rgb_path}
            afterRgbPath={meal.after_rgb_path}
            onBackToInputSelection={handleBackToInputSelection}
            onComputeVolume={handleComputeVolume}
            isComputingNutrition={isComputing}
          />
        </div>
      )}

      {/* Assisted analysis */}
      {step === "assisted" && (
        <div className="analysis-card">
          <AssistedModeInterface
            foods={foods}
            beforeImageUrl={beforeImageUrl}
            afterImageUrl={afterImageUrl}
            beforeRgbPath={meal.before_rgb_path}
            afterRgbPath={meal.after_rgb_path}
            onBackToInputSelection={handleBackToInputSelection}
            onComputeVolume={handleComputeVolume}
            isComputingNutrition={isComputing}
          />
        </div>
      )}

      {/* Nutrition report */}
      {step === "nutrition" && nutritionResult && (
        <NutritionReportPanel
          meal={meal}
          nutrition={nutritionResult}
          onDiscard={() => { setNutritionResult(null); onClose(); }}
          onDeleted={() => { setNutritionResult(null); onClose(); }}
          onClose={onClose}
        />
      )}
    </>
  );
}
