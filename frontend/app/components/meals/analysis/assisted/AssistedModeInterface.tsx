'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { Food, Point, FoodMask, SAM3Warning } from '../../../../lib/types';
import { analysisApi, ApiError } from '../../../../lib/api';
import { getFoodColor, formatFoodName, mergeMasks } from '../../../../lib/utils';
import { ProgressBar } from './ProgressBar';
import { AssistedControls } from './AssistedControls';
import { ImageWithMasksAndPoints } from './ImageWithMasksAndPoints';

// =============================================================================
// Types
// =============================================================================

/** Input type for assisted segmentation. */
type InputType = 'points' | 'text';

/** State for a food's merged masks. */
interface FoodMaskState {
  food_id: number;
  before_mask: number[][] | null;
  after_mask: number[][] | null;
}

/** Props for the AssistedModeInterface component. */
interface AssistedModeInterfaceProps {
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

export function AssistedModeInterface({
  foods,
  beforeImageUrl,
  afterImageUrl,
  beforeRgbPath,
  afterRgbPath,
  onBackToInputSelection,
  onComputeVolume,
  isComputingNutrition = false,
}: AssistedModeInterfaceProps) {
  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------
  
  // Current food being worked on (sequential, no skipping)
  const [currentFoodIndex, setCurrentFoodIndex] = useState(0);
  const currentFood = foods[currentFoodIndex];
  
  // Input type selection
  const [inputType, setInputType] = useState<InputType>('text');
  
  // Confidence threshold
  const [confidenceThreshold, setConfidenceThreshold] = useState(0.5);
  
  // Points state (for current food)
  const [beforePoints, setBeforePoints] = useState<Point[]>([]);
  const [afterPoints, setAfterPoints] = useState<Point[]>([]);
  const [pointLabel, setPointLabel] = useState<0 | 1>(1); // 1 = foreground, 0 = background
  
  // Text prompt state
  const [textPrompt, setTextPrompt] = useState('');
  
  // Generated masks from SAM3 - stored separately per input type so they persist when switching
  const [textBeforeMasks, setTextBeforeMasks] = useState<FoodMask[]>([]);
  const [textAfterMasks, setTextAfterMasks] = useState<FoodMask[]>([]);
  const [pointsBeforeMasks, setPointsBeforeMasks] = useState<FoodMask[]>([]);
  const [pointsAfterMasks, setPointsAfterMasks] = useState<FoodMask[]>([]);
  
  // Active masks based on current input type
  const generatedBeforeMasks = inputType === 'text' ? textBeforeMasks : pointsBeforeMasks;
  const generatedAfterMasks = inputType === 'text' ? textAfterMasks : pointsAfterMasks;
  const setGeneratedBeforeMasks = inputType === 'text' ? setTextBeforeMasks : setPointsBeforeMasks;
  const setGeneratedAfterMasks = inputType === 'text' ? setTextAfterMasks : setPointsAfterMasks;
  
  // Saved masks for each food (final masks after user confirms)
  const [savedMasks, setSavedMasks] = useState<FoodMaskState[]>(
    foods.map(f => ({ food_id: f.id, before_mask: null, after_mask: null }))
  );
  
  // Loading state
  const [isRunning, setIsRunning] = useState(false);
  
  // Warnings from SAM3 (for text mode)
  const [warnings, setWarnings] = useState<SAM3Warning[]>([]);
  
  // Dismissed warnings (by index)
  const [dismissedWarnings, setDismissedWarnings] = useState<Set<number>>(new Set());

  // Refs for buttons to reset hover state when disabled
  const runSam3ButtonRef = useRef<HTMLButtonElement>(null);
  const saveMasksButtonRef = useRef<HTMLButtonElement>(null);
  
  // Image refs for coordinate calculation (used by mask click handlers)
  const beforeImageRef = useRef<HTMLImageElement>(null);
  const afterImageRef = useRef<HTMLImageElement>(null);
  
  // Cursor state for text mode (only show pointer when hovering over mask)
  const [beforeCursor, setBeforeCursor] = useState<'default' | 'pointer'>('default');
  const [afterCursor, setAfterCursor] = useState<'default' | 'pointer'>('default');

  // Track which point is being hovered to prevent hover effect during deletion
  const [hoveredPointKey, setHoveredPointKey] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // Derived State
  // ---------------------------------------------------------------------------
  
  const canRunSam3 = inputType === 'points' 
    ? beforePoints.some(p => p.label === 1) || afterPoints.some(p => p.label === 1)
    : textPrompt.trim().length > 0;
  
  const hasMasks = generatedBeforeMasks.length > 0 || generatedAfterMasks.length > 0;
  
  // Check if at least 1 before mask exists
  const hasBeforeMask = generatedBeforeMasks.length > 0;
  
  // Can save only if at least 1 before mask exists (after masks are optional)
  const canSave = hasBeforeMask;
  
  const isLastFood = currentFoodIndex === foods.length - 1;
  
  // Reset button backgrounds when they become disabled/running
  useEffect(() => {
    if (runSam3ButtonRef.current && (isRunning || !canRunSam3)) {
      runSam3ButtonRef.current.style.background = 'var(--accent-primary)';
    }
  }, [isRunning, canRunSam3]);
  
  useEffect(() => {
    if (saveMasksButtonRef.current && (isComputingNutrition || !canSave)) {
      saveMasksButtonRef.current.style.background = '#10B981';
    }
  }, [isComputingNutrition, canSave]);

  // ---------------------------------------------------------------------------
  // Effects
  // ---------------------------------------------------------------------------
  
  // Reset state when moving to next food
  useEffect(() => {
    setBeforePoints([]);
    setAfterPoints([]);
    setTextPrompt('');
    setTextBeforeMasks([]);
    setTextAfterMasks([]);
    setPointsBeforeMasks([]);
    setPointsAfterMasks([]);
    setWarnings([]);
    setDismissedWarnings(new Set());
  }, [currentFoodIndex]);
  
  // Clear warnings when switching input type
  useEffect(() => {
    setWarnings([]);
    setDismissedWarnings(new Set());
  }, [inputType]);

  // For points mode: when a foreground point is deleted, remove its corresponding mask
  // Each foreground point generates one mask at the same index
  useEffect(() => {
    if (inputType === 'points') {
      const beforeFgCount = beforePoints.filter(p => p.label === 1).length;
      const afterFgCount = afterPoints.filter(p => p.label === 1).length;
      
      // Trim masks to match foreground point count
      if (generatedBeforeMasks.length > beforeFgCount) {
        setGeneratedBeforeMasks(prev => prev.slice(0, beforeFgCount));
      }
      if (generatedAfterMasks.length > afterFgCount) {
        setGeneratedAfterMasks(prev => prev.slice(0, afterFgCount));
      }
    }
  }, [beforePoints, afterPoints, inputType, generatedBeforeMasks.length, generatedAfterMasks.length, setGeneratedBeforeMasks, setGeneratedAfterMasks]);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------
  
  const handleImageClick = useCallback((
    e: React.MouseEvent<HTMLImageElement>,
    imageType: 'before' | 'after'
  ) => {
    if (inputType !== 'points') return;
    
    const img = e.currentTarget;
    const rect = img.getBoundingClientRect();
    const scaleX = img.naturalWidth / rect.width;
    const scaleY = img.naturalHeight / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    const point: Point = { label: pointLabel, x, y };
    
    if (imageType === 'before') {
      setBeforePoints(prev => [...prev, point]);
    } else {
      setAfterPoints(prev => [...prev, point]);
    }
  }, [inputType, pointLabel]);

  const handleDeletePoint = (imageType: 'before' | 'after', index: number) => {
    if (imageType === 'before') {
      const point = beforePoints[index];
      setBeforePoints(prev => prev.filter((_, i) => i !== index));
      
      // If it was a foreground point, also remove its mask
      if (point?.label === 1) {
        const fgIndex = beforePoints.slice(0, index).filter(p => p.label === 1).length;
        setGeneratedBeforeMasks(prev => prev.filter((_, i) => i !== fgIndex));
      }
    } else {
      const point = afterPoints[index];
      setAfterPoints(prev => prev.filter((_, i) => i !== index));
      
      // If it was a foreground point, also remove its mask
      if (point?.label === 1) {
        const fgIndex = afterPoints.slice(0, index).filter(p => p.label === 1).length;
        setGeneratedAfterMasks(prev => prev.filter((_, i) => i !== fgIndex));
      }
    }
  };

  const handleClearPoints = () => {
    setBeforePoints([]);
    setAfterPoints([]);
    setGeneratedBeforeMasks([]);
    setGeneratedAfterMasks([]);
  };

  const handleRunSam3 = async () => {
    if (isRunning) return;
    
    setIsRunning(true);
    setWarnings([]);
    try {
      let response;
      if (inputType === 'text') {
        // Backend gets image dimensions from the image files
        response = await analysisApi.sam3AssistedText(
          beforeRgbPath,
          afterRgbPath,
          textPrompt,
          currentFood.id,
          confidenceThreshold
        );
        // Set warnings from backend
        setWarnings(response.warnings || []);
        setDismissedWarnings(new Set()); // Reset dismissed warnings when new results come in
      } else {
        // Send points directly in pixel coordinates (backend gets dimensions from image files)
        response = await analysisApi.sam3AssistedPoints(
          beforeRgbPath,
          afterRgbPath,
          beforePoints.length > 0 ? beforePoints : null,
          afterPoints.length > 0 ? afterPoints : null
        );
      }
      setGeneratedBeforeMasks(response.before_masks);
      setGeneratedAfterMasks(response.after_masks);
    } catch (err) {
      console.error('SAM3 inference failed:', err);
      alert(err instanceof ApiError ? err.message : 'Failed to run SAM3 inference');
    } finally {
      setIsRunning(false);
    }
  };

  const handleDiscardMask = useCallback((maskId: string, imageType: 'before' | 'after') => {
    if (imageType === 'before') {
      setGeneratedBeforeMasks(prev => prev.filter(m => m.mask_id !== maskId));
      // Reset cursor immediately after discarding mask
      setBeforeCursor('default');
    } else {
      setGeneratedAfterMasks(prev => prev.filter(m => m.mask_id !== maskId));
      // Reset cursor immediately after discarding mask
      setAfterCursor('default');
    }
  }, [setGeneratedBeforeMasks, setGeneratedAfterMasks]);

  const handleSaveMasks = () => {
    // Merge all masks (they're all selected by default now)
    const mergedBefore = mergeMasks(generatedBeforeMasks.map(m => m.mask));
    const mergedAfter = mergeMasks(generatedAfterMasks.map(m => m.mask));
    
    // If last food, compute nutrients with all saved masks including current
    if (isLastFood) {
      // Build the complete saved masks array with current food's masks
      const updatedSavedMasks = [...savedMasks];
      updatedSavedMasks[currentFoodIndex] = {
        food_id: currentFood.id,
        before_mask: mergedBefore,
        after_mask: mergedAfter,
      };
      
      // Convert saved masks to FoodMask format
      const beforeMasks: FoodMask[] = updatedSavedMasks
        .filter(m => m.before_mask !== null)
        .map(m => ({
          food_id: m.food_id,
          mask: m.before_mask!,
        }));
      
      const afterMasks: FoodMask[] = updatedSavedMasks
        .filter(m => m.after_mask !== null)
        .map(m => ({
          food_id: m.food_id,
          mask: m.after_mask!,
        }));
      
      // Save masks and compute nutrients
      setSavedMasks(updatedSavedMasks);
      onComputeVolume(beforeMasks, afterMasks);
    } else {
      // Save merged masks for current food and move to next
      setSavedMasks(prev => {
        const next = [...prev];
        next[currentFoodIndex] = {
          food_id: currentFood.id,
          before_mask: mergedBefore,
          after_mask: mergedAfter,
        };
        return next;
      });
      
      // Move to next food
      setCurrentFoodIndex(prev => prev + 1);
    }
  };


  // ---------------------------------------------------------------------------
  // Render Helpers
  // ---------------------------------------------------------------------------
  
  const handleMaskClick = useCallback((
    e: React.MouseEvent<HTMLDivElement>,
    masks: FoodMask[],
    imageRef: React.RefObject<HTMLImageElement | null>,
    imageType: 'before' | 'after'
  ) => {
    if (inputType !== 'text' || !imageRef.current) return;
    
    const img = imageRef.current;
    const rect = img.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    
    // Find which mask was clicked (check from last to first for top-to-bottom ordering)
    // Mask dimensions match image natural dimensions
    const imageWidth = img.naturalWidth;
    const imageHeight = img.naturalHeight;
    
    for (let i = masks.length - 1; i >= 0; i--) {
      const mask = masks[i];
      if (!mask.mask_id) continue;
      
      // Scale click coordinates from displayed size to natural image size (mask matches natural size)
      const maskX = Math.round((clickX / rect.width) * imageWidth);
      const maskY = Math.round((clickY / rect.height) * imageHeight);
      
      // Check current pixel and neighbors for edge tolerance
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const checkX = maskX + dx;
          const checkY = maskY + dy;
          if (checkY >= 0 && checkY < imageHeight && checkX >= 0 && checkX < imageWidth) {
            if (mask.mask[checkY]?.[checkX] === 1) {
              handleDiscardMask(mask.mask_id, imageType);
              return;
            }
          }
        }
      }
    }
  }, [inputType, handleDiscardMask]);

  const handleMaskMouseMove = useCallback((
    e: React.MouseEvent<HTMLDivElement>,
    masks: FoodMask[],
    imageRef: React.RefObject<HTMLImageElement | null>,
    setCursor: React.Dispatch<React.SetStateAction<'default' | 'pointer'>>
  ) => {
    if (inputType !== 'text' || !imageRef.current || masks.length === 0) {
      setCursor('default');
      return;
    }
    
    const img = imageRef.current;
    const rect = img.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // Check if mouse is over any mask pixel
    // Mask dimensions match image natural dimensions
    const imageWidth = img.naturalWidth;
    const imageHeight = img.naturalHeight;
    
    for (let i = masks.length - 1; i >= 0; i--) {
      const mask = masks[i];
      if (!mask.mask_id) continue;
      
      // Scale mouse coordinates from displayed size to natural image size (mask matches natural size)
      const maskX = Math.round((mouseX / rect.width) * imageWidth);
      const maskY = Math.round((mouseY / rect.height) * imageHeight);
      
      // Check current pixel and neighbors for edge tolerance
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const checkX = maskX + dx;
          const checkY = maskY + dy;
          if (checkY >= 0 && checkY < imageHeight && checkX >= 0 && checkX < imageWidth) {
            if (mask.mask[checkY]?.[checkX] === 1) {
              setCursor('pointer');
              return;
            }
          }
        }
      }
    }
    setCursor('default');
  }, [inputType]);


  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 border-b shrink-0" style={{ borderColor: 'var(--card-border)' }}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>
                Assisted Segmentation
              </h2>
              <span 
                className="px-3 py-1 rounded-full text-sm font-medium"
                style={{ 
                  background: `${getFoodColor(currentFood.id)}20`,
                  color: getFoodColor(currentFood.id),
                  border: `1px solid ${getFoodColor(currentFood.id)}`,
                }}
              >
                {currentFoodIndex + 1} of {foods.length}: {formatFoodName(currentFood.short_name)}
              </span>
            </div>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              {inputType === 'text' 
                ? 'Use a text prompt to segment each food in the images.'
                : 'Use points to segment each food in the images.'}
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
        
        {/* Progress Bar */}
        <div className="mt-4">
          <ProgressBar
            foods={foods}
            currentIndex={currentFoodIndex}
            completedIndices={savedMasks.map((m) => m.before_mask !== null)}
          />
        </div>
      </div>

      {/* Main Content - Scrollable */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Controls Row */}
        <AssistedControls
          inputType={inputType}
          onInputTypeChange={setInputType}
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
        />

        {/* Images - Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          {/* Before Image */}
          <ImageWithMasksAndPoints
            imageUrl={beforeImageUrl}
            alt="Before meal"
            imageRef={beforeImageRef}
            masks={generatedBeforeMasks}
            points={beforePoints}
            inputType={inputType}
            isRunning={isRunning}
            cursor={beforeCursor}
            hoveredPointKey={hoveredPointKey}
            onPointHover={setHoveredPointKey}
            onImageClick={(e) => !isRunning && inputType === 'points' && handleImageClick(e, 'before')}
            onMaskClick={(e) => !isRunning && inputType === 'text' && handleMaskClick(e, generatedBeforeMasks, beforeImageRef, 'before')}
            onMaskMouseMove={(e) => !isRunning && handleMaskMouseMove(e, generatedBeforeMasks, beforeImageRef, setBeforeCursor)}
            onMaskMouseLeave={() => setBeforeCursor('default')}
            onPointDelete={(idx) => {
              handleDeletePoint('before', idx);
            }}
            label="Before Image"
            required
            statusText={
              inputType === 'points'
                ? `(${beforePoints.filter((p) => p.label === 1).length} fg, ${beforePoints.filter((p) => p.label === 0).length} bg)`
                : hasMasks
                  ? `• ${generatedBeforeMasks.length} mask${generatedBeforeMasks.length !== 1 ? 's' : ''}`
                  : undefined
            }
          />

          {/* After Image */}
          <ImageWithMasksAndPoints
            imageUrl={afterImageUrl}
            alt="After meal"
            imageRef={afterImageRef}
            masks={generatedAfterMasks}
            points={afterPoints}
            inputType={inputType}
            isRunning={isRunning}
            cursor={afterCursor}
            hoveredPointKey={hoveredPointKey}
            onPointHover={setHoveredPointKey}
            onImageClick={(e) => !isRunning && inputType === 'points' && handleImageClick(e, 'after')}
            onMaskClick={(e) => !isRunning && inputType === 'text' && handleMaskClick(e, generatedAfterMasks, afterImageRef, 'after')}
            onMaskMouseMove={(e) => !isRunning && handleMaskMouseMove(e, generatedAfterMasks, afterImageRef, setAfterCursor)}
            onMaskMouseLeave={() => setAfterCursor('default')}
            onPointDelete={(idx) => {
              handleDeletePoint('after', idx);
            }}
            label="After Image"
            required={false}
            statusText={
              inputType === 'points'
                ? `(${afterPoints.filter((p) => p.label === 1).length} fg, ${afterPoints.filter((p) => p.label === 0).length} bg)`
                : hasMasks
                  ? `• ${generatedAfterMasks.length} mask${generatedAfterMasks.length !== 1 ? 's' : ''}`
                  : undefined
            }
          />
        </div>

        {/* Warnings (for text mode) */}
        {inputType === 'text' && warnings.length > 0 && (
          <div className="mb-6 space-y-2">
            {warnings.map((warning, index) => {
              if (dismissedWarnings.has(index)) return null;
              
              return (
                <div 
                  key={index} 
                  className="p-3 rounded-lg flex items-center gap-2 relative" 
                  style={{ background: '#F59E0B20', border: '1px solid #F59E0B' }}
                >
                  <svg className="w-4 h-4 shrink-0" style={{ color: '#F59E0B' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <p className="text-sm pr-8" style={{ color: '#F59E0B' }}>
                    {warning.message}
                  </p>
                  <button
                    onClick={() => setDismissedWarnings(prev => new Set(prev).add(index))}
                    className="absolute top-2 right-2 p-1 rounded-lg transition-colors cursor-pointer"
                    style={{ color: '#F59E0B' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#F59E0B40')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    aria-label="Dismiss"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Info: At least 1 before mask required */}
        <div className="mb-6 p-3 rounded-lg flex items-center gap-2" style={{ background: '#3B82F620', border: '1px solid #3B82F6' }}>
          <svg className="w-4 h-4 shrink-0" style={{ color: '#3B82F6' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm" style={{ color: '#3B82F6' }}>
            At least one mask per food in the before image is required.
          </p>
        </div>

        {/* Action Buttons - Always show Save button next to Run */}
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
            ref={saveMasksButtonRef}
            onClick={handleSaveMasks}
            disabled={!canSave || isComputingNutrition}
            className="px-6 py-3 rounded-xl font-semibold transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: '#10B981',
              color: 'white',
            }}
            onMouseEnter={(e) => {
              if (!isComputingNutrition && canSave && !e.currentTarget.disabled) {
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
            ) : isLastFood ? (
              'Compute Nutrients'
            ) : (
              'Save Food Masks'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}