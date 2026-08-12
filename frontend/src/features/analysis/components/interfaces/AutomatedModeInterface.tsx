import { useEffect, useRef, useState } from 'react';

import { InfoCircleIcon, SpinnerIcon, WarningIcon, XIcon } from '@/components/common/icons';
import { ApiError } from '@/services/apiError';
import { analysisService } from '@/services/analysisService';

import type { Food, FoodMask, SAM3Warning } from '@/types';

import { AnalysisWarnings } from '../AnalysisWarnings/AnalysisWarnings';
import { ImageWithMasks } from '../ImageWithMasks/ImageWithMasks';
import { AutomatedModeHeader } from './AutomatedModeHeader';

import './interfaces.css';


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


export function AutomatedModeInterface({
  foods,
  beforeImageUrl,
  afterImageUrl,
  beforeRgbPath,
  afterRgbPath,
  onBackToInputSelection,
  onComputeVolume,
  isComputingNutrition = false,
}: Props) {
  // Input mode state.
  const [confidenceThreshold, setConfidenceThreshold] = useState(0.5);

  // Mask state.
  const [generatedBeforeMasks, setGeneratedBeforeMasks] = useState<FoodMask[]>([]);
  const [generatedAfterMasks, setGeneratedAfterMasks] = useState<FoodMask[]>([]);

  // SAM3 run state.
  const [isRunning, setIsRunning] = useState(false);
  const [warnings, setWarnings] = useState<SAM3Warning[]>([]);
  const [dismissedWarnings, setDismissedWarnings] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);

  // Refs for resetting hover colour when disabled.
  const runButtonRef = useRef<HTMLButtonElement>(null);
  const computeButtonRef = useRef<HTMLButtonElement>(null);


  // SAM3 run eligibility.
  const canRunSam3 = foods.length > 0;
  const hasMasks = generatedBeforeMasks.length > 0 || generatedAfterMasks.length > 0;


  // Compute nutrients eligibility.
  const hasAllBeforeMasks = warnings.length === 0 && generatedBeforeMasks.length === foods.length;
  const canComputeNutrients = hasMasks && hasAllBeforeMasks;


  // Reset Run button colour when disabled.
  useEffect(() => {
    if (runButtonRef.current && (isRunning || isComputingNutrition || !canRunSam3)) {
      runButtonRef.current.style.background = 'var(--accent-primary)';
    }
  }, [isRunning, isComputingNutrition, canRunSam3]);


  // Reset Compute button colour when disabled.
  useEffect(() => {
    if (computeButtonRef.current && (isComputingNutrition || isRunning || !canComputeNutrients)) {
      computeButtonRef.current.style.background = '#10B981';
    }
  }, [isComputingNutrition, isRunning, canComputeNutrients]);


  // Run SAM3 inference with the current input.
  const handleRunSam3 = async () => {
    if (isRunning) return;
    setIsRunning(true);
    setWarnings([]);
    setError(null);

    try {
      const foodIds = foods.map(f => f.id);
      const response = await analysisService.sam3Automated(
        beforeRgbPath, 
        afterRgbPath, 
        foodIds, 
        confidenceThreshold
      );

      setGeneratedBeforeMasks(response.before_masks);
      setGeneratedAfterMasks(response.after_masks);
      setWarnings(response.warnings || []);
      setDismissedWarnings(new Set());
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to run SAM3 inference.');
    } finally {
      setIsRunning(false);
    }
  };


  // Pass generated masks to the parent to compute nutrients.
  const handleComputeVolume = async () => {
    setError(null);
    
    try {
      await onComputeVolume(generatedBeforeMasks, generatedAfterMasks);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to compute nutrition.');
    }
  };

  
  return (
    <div className="analysis-mode">
      {/* Header */}
      <AutomatedModeHeader onBack={onBackToInputSelection} />

      {/* Content */}
      <div className="analysis-body">
        {/* Confidence threshold */}
        <div className="automated-threshold-row">
          <div className="automated-threshold">
            <label className="analysis-field-label">Confidence Threshold</label>
            <div className="automated-threshold-slider-row">
              <input
                className="automated-threshold-slider"
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={confidenceThreshold}
                onChange={(e) => setConfidenceThreshold(parseFloat(e.target.value))}
              />
              <span className="automated-threshold-value">{confidenceThreshold.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Images */}
        <div className="analysis-images-grid">
          <ImageWithMasks
            imageUrl={beforeImageUrl}
            alt="Before meal"
            masks={generatedBeforeMasks}
            label="Before Image"
            required={true}
            isRunning={isRunning}
          />
          <ImageWithMasks
            imageUrl={afterImageUrl}
            alt="After meal"
            masks={generatedAfterMasks}
            label="After Image"
            required={false}
            isRunning={isRunning}
          />
        </div>

        {/* Warnings */}
        {warnings.length > 0 && (
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
            ref={computeButtonRef}
            className="analysis-compute-button"
            onClick={handleComputeVolume}
            disabled={!canComputeNutrients || isComputingNutrition || isRunning}
            onMouseEnter={(e) => { if (!isComputingNutrition && !isRunning && canComputeNutrients) e.currentTarget.style.background = "#059669"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "#10B981"; }}
          >
            {isComputingNutrition ? (
              <span className="analysis-button-loading">
                <SpinnerIcon className="analysis-spinner" />
                Computing Nutrients...
              </span>
            ) : "Compute Nutrients"}
          </button>
        </div>
      </div>
    </div>
  );
}
