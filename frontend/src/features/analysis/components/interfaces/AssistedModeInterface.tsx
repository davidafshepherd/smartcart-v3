import { useEffect, useRef, useState } from 'react';

import { InfoCircleIcon, SpinnerIcon, WarningIcon, XIcon } from '@/components/common/icons';
import { ApiError } from '@/services/apiError';
import { analysisService } from '@/services/analysisService';
import { mergeMasks } from '@/utils/analysis';

import type { Food, FoodMask, Point, SAM3Response, SAM3Warning } from '@/types';

import { AssistedControls } from '../AssistedMode/AssistedControls/AssistedControls';
import { AnalysisWarnings } from '../AnalysisWarnings/AnalysisWarnings';
import { ImageWithMasksAndPoints } from '../ImageWithMasks/ImageWithMasksAndPoints';
import { AssistedModeHeader } from './AssistedModeHeader';

import './interfaces.css';


type InputType = 'points' | 'text';


interface FoodMaskState {
  food_id: number;
  before_mask: number[][] | null;
  after_mask: number[][] | null;
}


interface Props {
  foods: Food[];
  beforeImageUrl: string;
  afterImageUrl: string;
  beforeRgbPath: string;
  afterRgbPath: string;
  onBackToInputSelection: () => void;
  onComputeVolume: (beforeMasks: FoodMask[], afterMasks: FoodMask[]) => void;
  isComputingNutrition?: boolean;
}


export function AssistedModeInterface({
  foods,
  beforeImageUrl,
  afterImageUrl,
  beforeRgbPath,
  afterRgbPath,
  onBackToInputSelection,
  onComputeVolume,
  isComputingNutrition = false,
}: Props) {
  // Food state.
  const [currentFoodIndex, setCurrentFoodIndex] = useState(0);
  const currentFood = foods[currentFoodIndex];
  const isLastFood = currentFoodIndex === foods.length - 1;
  const [savedMasks, setSavedMasks] = useState<FoodMaskState[]>(foods.map(food => {
    return ({ food_id: food.id, before_mask: null, after_mask: null });
  }));
  
  // Input mode state.
  const [inputType, setInputType] = useState<InputType>("text");
  const [confidenceThreshold, setConfidenceThreshold] = useState(0.5);
  const [textPrompt, setTextPrompt] = useState("");
  const [pointLabel, setPointLabel] = useState<0 | 1>(1);
  const [beforePoints, setBeforePoints] = useState<Point[]>([]);
  const [afterPoints, setAfterPoints] = useState<Point[]>([]);

  // Mask state.
  const [textBeforeMasks, setTextBeforeMasks] = useState<FoodMask[]>([]);
  const [textAfterMasks, setTextAfterMasks] = useState<FoodMask[]>([]);
  const [pointsBeforeMasks, setPointsBeforeMasks] = useState<FoodMask[]>([]);
  const [pointsAfterMasks, setPointsAfterMasks] = useState<FoodMask[]>([]);
  const generatedBeforeMasks = inputType === "text" ? textBeforeMasks : pointsBeforeMasks;
  const generatedAfterMasks = inputType === "text" ? textAfterMasks : pointsAfterMasks;
  const setGeneratedBeforeMasks = inputType === "text" ? setTextBeforeMasks : setPointsBeforeMasks;
  const setGeneratedAfterMasks = inputType === "text" ? setTextAfterMasks : setPointsAfterMasks;

  // SAM3 run state.
  const [isRunning, setIsRunning] = useState(false);
  const [warnings, setWarnings] = useState<SAM3Warning[]>([]);
  const [dismissedWarnings, setDismissedWarnings] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);

  // Refs for resetting hover colour when disabled.
  const runButtonRef = useRef<HTMLButtonElement>(null);
  const saveButtonRef = useRef<HTMLButtonElement>(null);


  // SAM3 run eligibility.
  const canRunSam3 = inputType === "points"
    ? beforePoints.some(p => p.label === 1) || afterPoints.some(p => p.label === 1)
    : textPrompt.trim().length > 0;
  const hasMasks = generatedBeforeMasks.length > 0 || generatedAfterMasks.length > 0;

  // Food mask save eligibility.
  const canSave = generatedBeforeMasks.length > 0;


  // Reset Run button colour when disabled.
  useEffect(() => {
    if (runButtonRef.current && (isRunning || isComputingNutrition || !canRunSam3)) {
      runButtonRef.current.style.background = "var(--accent-primary)";
    }
  }, [isRunning, isComputingNutrition, canRunSam3]);


  // Reset Save button colour when disabled.
  useEffect(() => {
    if (saveButtonRef.current && (isComputingNutrition || isRunning || !canSave)) {
      saveButtonRef.current.style.background = "#10B981";
    }
  }, [isComputingNutrition, isRunning, canSave]);


  // Clear warnings and errors when changing input type.
  const handleInputTypeChange = (type: InputType) => {
    setInputType(type);
    setError(null);
    setWarnings([]);
    setDismissedWarnings(new Set());
  };


  // Remove a point and its corresponding mask.
  const handleDeletePoint = (imageType: "before" | "after", index: number) => {
    if (imageType === "before") {
      const point = beforePoints[index];
      setBeforePoints(prev => prev.filter((_, i) => i !== index));
      
      if (point?.label === 1) {
        const fgIndex = beforePoints.slice(0, index).filter(p => p.label === 1).length;
        setGeneratedBeforeMasks(prev => prev.filter((_, i) => i !== fgIndex));
      }
    } else {
      const point = afterPoints[index];
      setAfterPoints(prev => prev.filter((_, i) => i !== index));

      if (point?.label === 1) {
        const fgIndex = afterPoints.slice(0, index).filter(p => p.label === 1).length;
        setGeneratedAfterMasks(prev => prev.filter((_, i) => i !== fgIndex));
      }
    }
  };


  // Clear all points and generated masks.
  const handleClearPoints = () => {
    setBeforePoints([]);
    setAfterPoints([]);
    setGeneratedBeforeMasks([]);
    setGeneratedAfterMasks([]);
  };


  // Run SAM3 inference with the current input.
  const handleRunSam3 = async () => {
    if (isRunning) return;
    setIsRunning(true);
    setWarnings([]);
    setError(null);

    try {
      let response: SAM3Response;
      if (inputType === "text") {
        response = await analysisService.sam3AssistedText(
          beforeRgbPath, 
          afterRgbPath, 
          textPrompt, 
          currentFood.id, 
          confidenceThreshold
        );
        setWarnings(response.warnings || []);
        setDismissedWarnings(new Set());
      } else {
        response = await analysisService.sam3AssistedPoints(
          beforeRgbPath,
          afterRgbPath,
          beforePoints.length > 0 ? beforePoints : null,
          afterPoints.length > 0 ? afterPoints : null
        );
      }

      setGeneratedBeforeMasks(response.before_masks);
      setGeneratedAfterMasks(response.after_masks);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to run SAM3 inference.");
    } finally {
      setIsRunning(false);
    }
  };


  // Save masks for the current food and advance, or compute nutrients if last.
  const handleSaveMasks = async () => {
    const mergedBefore = mergeMasks(generatedBeforeMasks.map(m => m.mask));
    const mergedAfter = mergeMasks(generatedAfterMasks.map(m => m.mask));

    if (isLastFood) {
      const updatedSavedMasks = [...savedMasks];
      updatedSavedMasks[currentFoodIndex] = { 
        food_id: currentFood.id, 
        before_mask: mergedBefore, 
        after_mask: mergedAfter 
      };

      const beforeMasks: FoodMask[] = updatedSavedMasks
          .filter(m => m.before_mask !== null)
          .map(m => ({ food_id: m.food_id, mask: m.before_mask! }));

      const afterMasks: FoodMask[] = updatedSavedMasks
          .filter(m => m.after_mask !== null)
          .map(m => ({ food_id: m.food_id, mask: m.after_mask! }));

      setError(null);
      
      try {
        await onComputeVolume(beforeMasks, afterMasks);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Failed to compute nutrition.');
      }
    } else {
      setSavedMasks(prev => {
        const next = [...prev];
        next[currentFoodIndex] = { 
          food_id: currentFood.id,
          before_mask: mergedBefore, 
          after_mask: mergedAfter 
        };
        return next;
      });

      setCurrentFoodIndex(prev => prev + 1);
      setBeforePoints([]);
      setAfterPoints([]);
      setTextPrompt('');
      setTextBeforeMasks([]);
      setTextAfterMasks([]);
      setPointsBeforeMasks([]);
      setPointsAfterMasks([]);
      setWarnings([]);
      setDismissedWarnings(new Set());
    }
  };


  return (
    <div className="analysis-mode">
      {/* Header */}
      <AssistedModeHeader
        foods={foods}
        currentFoodIndex={currentFoodIndex}
        completedIndices={savedMasks.map(m => m.before_mask !== null)}
        inputType={inputType}
        onBack={onBackToInputSelection}
      />

      {/* Content */}
      <div className="analysis-body">
        {/* Controls */}
        <AssistedControls
          inputType={inputType}
          onInputTypeChange={handleInputTypeChange}
          confidenceThreshold={confidenceThreshold}
          onConfidenceThresholdChange={setConfidenceThreshold}
          pointLabel={pointLabel}
          onPointLabelChange={setPointLabel}
          textPrompt={textPrompt}
          onTextPromptChange={setTextPrompt}
          beforePointsCount={beforePoints.length}
          afterPointsCount={afterPoints.length}
          onClearPoints={handleClearPoints}
          isRunning={isRunning}
          isComputingNutrition={isComputingNutrition}
        />

        {/* Images */}
        <div className="analysis-images-grid">
          <ImageWithMasksAndPoints
            imageUrl={beforeImageUrl}
            alt="Before meal"
            masks={generatedBeforeMasks}
            points={beforePoints}
            inputType={inputType}
            pointLabel={pointLabel}
            isRunning={isRunning}
            onAddPoint={(point) => setBeforePoints(prev => [...prev, point])}
            onDiscardMask={(maskId) => setGeneratedBeforeMasks(prev => prev.filter(m => m.mask_id !== maskId))}
            onPointDelete={(idx) => handleDeletePoint("before", idx)}
            label="Before Image"
            required={true}
          />
          <ImageWithMasksAndPoints
            imageUrl={afterImageUrl}
            alt="After meal"
            masks={generatedAfterMasks}
            points={afterPoints}
            inputType={inputType}
            pointLabel={pointLabel}
            isRunning={isRunning}
            onAddPoint={(point) => setAfterPoints(prev => [...prev, point])}
            onDiscardMask={(maskId) => setGeneratedAfterMasks(prev => prev.filter(m => m.mask_id !== maskId))}
            onPointDelete={(idx) => handleDeletePoint("after", idx)}
            label="After Image"
            required={false}
          />
        </div>

        {/* Warnings (text mode only) */}
        {inputType === "text" && warnings.length > 0 && (
          <AnalysisWarnings
            warnings={warnings}
            dismissedWarnings={dismissedWarnings}
            onDismiss={(index) => setDismissedWarnings(prev => new Set(prev).add(index))}
          />
        )}

        {/* Info */}
        <div className="analysis-info">
          <InfoCircleIcon className="analysis-info-icon" />
          <p className="analysis-info-text">At least one mask per food in the before image is required.</p>
        </div>

        {/* Error */}
        {error && (
          <div className="analysis-error">
            <WarningIcon className="analysis-error-icon" />
            <p className="analysis-error-text">{error}</p>
            <button className="analysis-error-dismiss" onClick={() => setError(null)} aria-label="Dismiss">
              <XIcon className="analysis-error-dismiss-icon" />
            </button>
          </div>
        )}

        {/* Action buttons */}
        <div className="analysis-actions">
          <button
            ref={runButtonRef}
            className="analysis-run-button"
            onClick={handleRunSam3}
            disabled={!canRunSam3 || isRunning || isComputingNutrition}
            onMouseEnter={(e) => { if (!isRunning && !isComputingNutrition && canRunSam3) e.currentTarget.style.background = "var(--accent-primary-dim)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "var(--accent-primary)"; }}
          >
            {isRunning ? (
              <span className="analysis-button-loading">
                <SpinnerIcon className="analysis-spinner" />
                Running SAM3...
              </span>
            ) : hasMasks ? "Re-run SAM3" : "Run SAM3"}
          </button>

          <button
            ref={saveButtonRef}
            className="analysis-compute-button"
            onClick={handleSaveMasks}
            disabled={!canSave || isComputingNutrition || isRunning}
            onMouseEnter={(e) => { if (!isComputingNutrition && !isRunning && canSave) e.currentTarget.style.background = "#059669"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "#10B981"; }}
          >
            {isComputingNutrition ? (
              <span className="analysis-button-loading">
                <SpinnerIcon className="analysis-spinner" />
                Computing Nutrients...
              </span>
            ) : isLastFood ? "Compute Nutrients" : "Save Food Masks"}
          </button>
        </div>
      </div>
    </div>
  );
}
