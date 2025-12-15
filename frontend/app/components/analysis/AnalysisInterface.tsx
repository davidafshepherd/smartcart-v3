/**
 * @fileoverview Analysis interface component for meal analysis.
 *
 * Main interface that handles the analysis flow:
 * 1. Select Input Method (points or boxes)
 * 2. Pinpoint Foods (point selection) or Bound Foods (box detection)
 * 3. View Foods (shared mask display)
 * 4. Nutrition Report (shared)
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import type { MealData, FoodPoints, FoodBox, Mask, ComputeNutritionResponse } from '../../lib/types';
import { imagesApi, analysisApi, ApiError } from '../../lib/api';
import { InputModeSelector } from './InputModeSelector';
import { PointsModeInterface } from './PointsModeInterface';
import { BoxesModeInterface } from './BoxesModeInterface';
import { ViewFoodsInterface } from './ViewFoodsInterface';
import { NutritionReportInterface } from './NutritionReportInterface';

type InputMode = 'points' | 'boxes';
type DetectionModel = 'owlv2' | 'owlv2-sahi';
type AnalysisStep = 'select-input' | 'pinpoint' | 'bound' | 'view-foods' | 'nutrition-report';

interface AnalysisInterfaceProps {
  meal: MealData;
  inputMode: InputMode | null;
  onInputModeChange: (mode: InputMode | null) => void;
  selectedFoodId: number | null;
  onFoodSelect: (foodId: number | null) => void;
  beforePoints: FoodPoints[];
  afterPoints: FoodPoints[];
  onImageClick: (e: React.MouseEvent<HTMLImageElement>, imageType: 'before' | 'after') => void;
  onDeletePoint: (foodId: number, pointIndex: number, imageType: 'before' | 'after') => void;
  onRunSam2Points: () => void;
  detectionModel: DetectionModel;
  onDetectionModelChange: (model: DetectionModel) => void;
  threshold: number;
  onThresholdChange: (threshold: number) => void;
  iouThreshold: number;
  onIouThresholdChange: (threshold: number) => void;
  beforeBoxes: FoodBox[];
  afterBoxes: FoodBox[];
  onRunDetection: () => void;
  onRunSam2Boxes: () => void;
  isDetecting: boolean;
  masks: Mask[];
  selectedMasks: Set<string>;
  onToggleMask: (maskId: string) => void;
  isRunningSam2: boolean;
  setSelectedMasks: React.Dispatch<React.SetStateAction<Set<string>>>;
  setMasks: React.Dispatch<React.SetStateAction<Mask[]>>;
  setBeforePoints: React.Dispatch<React.SetStateAction<FoodPoints[]>>;
  setAfterPoints: React.Dispatch<React.SetStateAction<FoodPoints[]>>;
  onBackToInputSelection: () => void;
  nutritionData: ComputeNutritionResponse | null;
  setNutritionData: React.Dispatch<React.SetStateAction<ComputeNutritionResponse | null>>;
}

export function AnalysisInterface({
  meal,
  inputMode,
  onInputModeChange,
  onBackToInputSelection,
  selectedFoodId,
  onFoodSelect,
  beforePoints,
  afterPoints,
  onImageClick,
  onDeletePoint,
  onRunSam2Points,
  detectionModel,
  onDetectionModelChange,
  threshold,
  onThresholdChange,
  iouThreshold,
  onIouThresholdChange,
  beforeBoxes,
  afterBoxes,
  onRunDetection,
  onRunSam2Boxes,
  isDetecting,
  masks,
  selectedMasks,
  onToggleMask,
  isRunningSam2,
  setSelectedMasks,
  setMasks,
  setBeforePoints,
  setAfterPoints,
  nutritionData,
  setNutritionData,
}: AnalysisInterfaceProps) {
  const foods = meal.menu_item.foods;
  const beforeImageUrl = imagesApi.getImageUrl(meal.before_rgb_path);
  const afterImageUrl = imagesApi.getImageUrl(meal.after_rgb_path);

  // Step management
  const [step, setStep] = useState<AnalysisStep>('select-input');
  const [isComputingNutrition, setIsComputingNutrition] = useState(false);

  // Sync step with inputMode changes from parent
  useEffect(() => {
    if (inputMode === null) {
      setStep('select-input');
    } else if (inputMode === 'points' && step === 'select-input') {
      setStep('pinpoint');
    } else if (inputMode === 'boxes' && step === 'select-input') {
      setStep('bound');
    }
  }, [inputMode, step]);

  // Auto-transition to view-foods when masks are generated
  useEffect(() => {
    if (masks.length > 0 && (step === 'pinpoint' || step === 'bound')) {
      setStep('view-foods');
    }
  }, [masks.length, step]);

  // Track if we've already auto-selected masks (to avoid re-selecting when user clears all)
  const hasAutoSelectedMasks = useRef(false);

  // Auto-select all masks when they're first generated (only once)
  useEffect(() => {
    if (masks.length > 0 && !hasAutoSelectedMasks.current) {
      const allMaskIds = masks.map((m) => m.mask_id).filter((id): id is string => id !== undefined);
      setSelectedMasks(new Set(allMaskIds));
      hasAutoSelectedMasks.current = true;
    }
    // Reset the flag when masks are cleared
    if (masks.length === 0) {
      hasAutoSelectedMasks.current = false;
    }
  }, [masks.length, setSelectedMasks]);

  // Handle input mode selection
  const handleInputModeSelect = (mode: InputMode) => {
    onInputModeChange(mode);
    if (mode === 'points') {
      setStep('pinpoint');
    } else {
      setStep('bound');
    }
  };

  // Handle back from pinpoint/bound to input selection
  const handleBackToInputSelection = () => {
    setStep('select-input');
    onBackToInputSelection();
  };

  // Handle back from view-foods to pinpoint/bound
  const handleBackToFoodIdentification = () => {
    setMasks([]);
    setSelectedMasks(new Set());
    if (inputMode === 'points') {
      setStep('pinpoint');
    } else {
      setStep('bound');
    }
  };

  // Handle compute mass
  const handleComputeMass = async () => {
    setIsComputingNutrition(true);
    try {
      // Separate masks by image type (use all masks, not just selected ones)
      // Selected masks only affect display, not nutrition calculation
      const beforeMasks = masks.filter(
        (m) => m.image_type === 'before' && m.mask_id
      );
      const afterMasks = masks.filter(
        (m) => m.image_type === 'after' && m.mask_id
      );

      // Call compute nutrition endpoint
      const result = await analysisApi.computeNutrition(
        meal.before_depth_path,
        meal.after_depth_path,
        beforeMasks,
        afterMasks
      );

      setNutritionData(result);
      setStep('nutrition-report');
    } catch (err) {
      console.error('Nutrition computation failed:', err);
      alert(err instanceof ApiError ? err.message : 'Failed to compute nutrition');
    } finally {
      setIsComputingNutrition(false);
    }
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

      {/* Step 2a: Pinpoint Foods (Points Mode) */}
      {step === 'pinpoint' && (
        <PointsModeInterface
          foods={foods}
          selectedFoodId={selectedFoodId}
          onFoodSelect={onFoodSelect}
          beforeImageUrl={beforeImageUrl}
          afterImageUrl={afterImageUrl}
          beforePoints={beforePoints}
          afterPoints={afterPoints}
          onImageClick={onImageClick}
          onDeletePoint={onDeletePoint}
          onRunSam2={onRunSam2Points}
          isRunningSam2={isRunningSam2}
          setBeforePoints={setBeforePoints}
          setAfterPoints={setAfterPoints}
          onBackToInputSelection={handleBackToInputSelection}
        />
      )}

      {/* Step 2b: Bound Foods (Boxes Mode) */}
      {step === 'bound' && (
        <BoxesModeInterface
          foods={foods}
          detectionModel={detectionModel}
          onDetectionModelChange={onDetectionModelChange}
          threshold={threshold}
          onThresholdChange={onThresholdChange}
          iouThreshold={iouThreshold}
          onIouThresholdChange={onIouThresholdChange}
          beforeImageUrl={beforeImageUrl}
          afterImageUrl={afterImageUrl}
          beforeBoxes={beforeBoxes}
          afterBoxes={afterBoxes}
          onRunDetection={onRunDetection}
          onRunSam2={onRunSam2Boxes}
          isDetecting={isDetecting}
          isRunningSam2={isRunningSam2}
          onBackToInputSelection={handleBackToInputSelection}
        />
      )}

      {/* Step 3: View Foods (Shared) */}
      {step === 'view-foods' && (
        <ViewFoodsInterface
          foods={foods}
          beforeImageUrl={beforeImageUrl}
          afterImageUrl={afterImageUrl}
          masks={masks}
          selectedMasks={selectedMasks}
          onToggleMask={onToggleMask}
          onBack={handleBackToFoodIdentification}
          onComputeMass={handleComputeMass}
          isComputingNutrition={isComputingNutrition}
          backLabel={inputMode === 'points' ? 'Back to Food Pinpointing' : 'Back to Food Bounding'}
        />
      )}

      {/* Step 4: Nutrition Report (Shared) */}
      {step === 'nutrition-report' && (
        <NutritionReportInterface
          nutritionData={nutritionData}
          foods={foods}
          onSave={() => {
            // TODO: Implement save nutrition report
          }}
        />
      )}
    </div>
  );
}
