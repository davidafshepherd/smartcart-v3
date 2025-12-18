'use client';

import { useState, useEffect, useRef } from 'react';
import type { Food, FoodMask } from '../../lib/types';
import { analysisApi, ApiError } from '../../lib/api';
import { ImageWithMasks } from './ImageWithMasks';

// =============================================================================
// Types
// =============================================================================

/** Props for the AutomatedModeInterface component. */
interface AutomatedModeInterfaceProps {
  /** List of foods to segment. */
  foods: Food[];
  /** URL for the before-meal image. */
  beforeImageUrl: string;
  /** URL for the after-meal image. */
  afterImageUrl: string;
  /** Backend path to the before RGB image. */
  beforeRgbPath: string;
  /** Backend path to the after RGB image. */
  afterRgbPath: string;
  /** Callback to return to input mode selection. */
  onBackToInputSelection: () => void;
  /** Callback to compute nutrition from masks. */
  onComputeVolume: (beforeMasks: FoodMask[], afterMasks: FoodMask[]) => void;
  /** Whether nutrition computation is in progress. */
  isComputingNutrition?: boolean;
}

// =============================================================================
// Component
// =============================================================================

export function AutomatedModeInterface({
  foods,
  beforeImageUrl,
  afterImageUrl,
  beforeRgbPath,
  afterRgbPath,
  onBackToInputSelection,
  onComputeVolume,
  isComputingNutrition = false,
}: AutomatedModeInterfaceProps) {
  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------
  
  // Confidence threshold
  const [confidenceThreshold, setConfidenceThreshold] = useState(0.5);
  
  // Generated masks from SAM3
  const [generatedBeforeMasks, setGeneratedBeforeMasks] = useState<FoodMask[]>([]);
  const [generatedAfterMasks, setGeneratedAfterMasks] = useState<FoodMask[]>([]);
  
  // Loading state
  const [isRunning, setIsRunning] = useState(false);

  // Refs for buttons to reset hover state when disabled
  const runSam3ButtonRef = useRef<HTMLButtonElement>(null);
  const computeButtonRef = useRef<HTMLButtonElement>(null);

  // ---------------------------------------------------------------------------
  // Derived State
  // ---------------------------------------------------------------------------
  
  const hasMasks = generatedBeforeMasks.length > 0 || generatedAfterMasks.length > 0;
  const canRunSam3 = foods.length > 0;

  // Reset button backgrounds when they become disabled/running
  useEffect(() => {
    if (runSam3ButtonRef.current && (isRunning || !canRunSam3)) {
      runSam3ButtonRef.current.style.background = 'var(--accent-primary)';
    }
  }, [isRunning, canRunSam3]);

  useEffect(() => {
    if (computeButtonRef.current && (isComputingNutrition || !hasMasks)) {
      computeButtonRef.current.style.background = '#10B981';
    }
  }, [isComputingNutrition, hasMasks]);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------
  
  const handleRunSam3 = async () => {
    setIsRunning(true);
    try {
      const foodIds = foods.map(f => f.id);
      const response = await analysisApi.sam3Automated(
        beforeRgbPath,
        afterRgbPath,
        foodIds,
        confidenceThreshold
      );
      setGeneratedBeforeMasks(response.before_masks);
      setGeneratedAfterMasks(response.after_masks);
    } catch (err) {
      console.error('SAM3 inference failed:', err);
      alert(err instanceof ApiError ? err.message : 'Failed to run SAM3 inference');
    } finally {
      setIsRunning(false);
    }
  };

  const handleComputeVolume = () => {
    // Convert masks to FoodMask format (one per food)
    const beforeMasks: FoodMask[] = generatedBeforeMasks;
    const afterMasks: FoodMask[] = generatedAfterMasks;
    
    onComputeVolume(beforeMasks, afterMasks);
  };


  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 border-b shrink-0" style={{ borderColor: 'var(--card-border)' }}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--foreground)' }}>
              Automated Segmentation
            </h2>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Automatically segment all foods in the images.
            </p>
          </div>
          <button
            onClick={onBackToInputSelection}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border transition-all duration-200 cursor-pointer"
            style={{
              borderColor: 'var(--card-border)',
              background: 'var(--card-bg)',
              color: 'var(--foreground)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(0, 0, 0, 0.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--card-bg)';
            }}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="text-sm font-medium">Back</span>
          </button>
        </div>
      </div>

      {/* Main Content - Scrollable */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Controls Row */}
        <div className="flex items-end gap-6 mb-6">
          {/* Confidence Threshold - Full width */}
          <div className="flex-1">
            <label className="text-sm font-semibold mb-2 block whitespace-nowrap" style={{ color: 'var(--foreground)' }}>
              Confidence Threshold
            </label>
            <div className="flex items-center gap-2 py-2 w-full">
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={confidenceThreshold}
                onChange={(e) => setConfidenceThreshold(parseFloat(e.target.value))}
                className="flex-1 h-2 rounded-lg appearance-none cursor-pointer range-slider"
                style={{ background: 'var(--card-border)' }}
              />
              <span className="text-sm" style={{ color: 'var(--text-muted)', minWidth: '3rem' }}>
                {confidenceThreshold.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Images with Masks - Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          {/* Before Image */}
          <ImageWithMasks
            imageUrl={beforeImageUrl}
            alt="Before meal"
            masks={generatedBeforeMasks}
            label="Before Image"
            required
            statusText={
              hasMasks
                ? `• ${generatedBeforeMasks.length} mask${generatedBeforeMasks.length !== 1 ? 's' : ''}`
                : undefined
            }
            isRunning={isRunning}
          />

          {/* After Image */}
          <ImageWithMasks
            imageUrl={afterImageUrl}
            alt="After meal"
            masks={generatedAfterMasks}
            label="After Image"
            required={false}
            statusText={
              hasMasks
                ? `• ${generatedAfterMasks.length} mask${generatedAfterMasks.length !== 1 ? 's' : ''}`
                : undefined
            }
            isRunning={isRunning}
          />
        </div>

        {/* Info: At least 1 before mask required */}
        <div className="mb-6 p-3 rounded-lg flex items-center gap-2" style={{ background: '#3B82F620', border: '1px solid #3B82F6' }}>
          <svg className="w-4 h-4 shrink-0" style={{ color: '#3B82F6' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm" style={{ color: '#3B82F6' }}>
            At least one mask per food in the before image is required.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            ref={runSam3ButtonRef}
            onClick={handleRunSam3}
            disabled={!canRunSam3 || isRunning}
            className="px-6 py-3 rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            style={{
              background: 'var(--accent-primary)',
              color: 'white',
            }}
            onMouseEnter={(e) => {
              if (!isRunning && canRunSam3 && !e.currentTarget.disabled) {
                e.currentTarget.style.background = 'var(--accent-primary-dim)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--accent-primary)';
            }}
          >
            {isRunning ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Running SAM3...
              </span>
            ) : hasMasks ? (
              'Re-run SAM3'
            ) : (
              'Run SAM3'
            )}
          </button>
          
          <button
            ref={computeButtonRef}
            onClick={handleComputeVolume}
            disabled={!hasMasks || isComputingNutrition}
            className="px-6 py-3 rounded-xl font-semibold transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: '#10B981',
              color: 'white',
            }}
            onMouseEnter={(e) => {
              if (!isComputingNutrition && hasMasks && !e.currentTarget.disabled) {
                e.currentTarget.style.background = '#059669';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#10B981';
            }}
          >
            {isComputingNutrition ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Computing Nutrients...
              </span>
            ) : (
              'Compute Nutrients'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
