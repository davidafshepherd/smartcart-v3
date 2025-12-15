/**
 * @fileoverview Boxes mode interface component for meal analysis.
 *
 * Allows users to use OWLv2 to detect food bounding boxes.
 * Only handles box detection and running SAM2.
 */

'use client';

import React, { useEffect, useState, useRef } from 'react';
import type { Food, FoodBox } from '../../lib/types';

type DetectionModel = 'owlv2' | 'owlv2-sahi';

interface BoxesModeInterfaceProps {
  foods: Food[];
  detectionModel: DetectionModel;
  onDetectionModelChange: (model: DetectionModel) => void;
  threshold: number;
  onThresholdChange: (threshold: number) => void;
  iouThreshold: number;
  onIouThresholdChange: (threshold: number) => void;
  beforeImageUrl: string;
  afterImageUrl: string;
  beforeBoxes: FoodBox[];
  afterBoxes: FoodBox[];
  onRunDetection: () => void;
  onRunSam2: () => void;
  isDetecting: boolean;
  isRunningSam2: boolean;
  onBackToInputSelection: () => void;
}

export function BoxesModeInterface({
  foods,
  detectionModel,
  onDetectionModelChange,
  threshold,
  onThresholdChange,
  iouThreshold,
  onIouThresholdChange,
  beforeImageUrl,
  afterImageUrl,
  beforeBoxes,
  afterBoxes,
  onRunDetection,
  onRunSam2,
  isDetecting,
  isRunningSam2,
  onBackToInputSelection,
}: BoxesModeInterfaceProps) {
  const beforeImageRef = useRef<HTMLImageElement>(null);
  const afterImageRef = useRef<HTMLImageElement>(null);
  const [beforeImageLoaded, setBeforeImageLoaded] = useState(false);
  const [afterImageLoaded, setAfterImageLoaded] = useState(false);

  const getFoodColor = (foodId: number) => {
    const colors = [
      '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
      '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1',
    ];
    return colors[foodId % colors.length];
  };

  // Reset image loaded state when images change
  useEffect(() => {
    setBeforeImageLoaded(false);
    setAfterImageLoaded(false);
  }, [beforeImageUrl, afterImageUrl]);

  // Check if images are already loaded (cached) on mount
  useEffect(() => {
    if (beforeImageRef.current?.complete && beforeImageRef.current.naturalWidth > 0) {
      setBeforeImageLoaded(true);
    }
    if (afterImageRef.current?.complete && afterImageRef.current.naturalWidth > 0) {
      setAfterImageLoaded(true);
    }
  }, []);

  // Helper function to get short food name (title case for display)
  const getShortFoodName = (shortName: string): string => {
    return shortName
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  // Check if all foods have at least one box in the before image
  const canRunSam2 = foods.every((food) =>
    beforeBoxes.some((box) => box.food_id === food.id)
  );

  return (
    <div className="space-y-8">
      {/* Header with Back Button */}
      <div className="px-8 pt-8 pb-4 border-b" style={{ borderColor: 'var(--card-border)' }}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--foreground)' }}>
              Bound Foods
            </h2>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Generate bounding boxes to mark food locations.
            </p>
          </div>
          <button
            onClick={onBackToInputSelection}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border transition-all hover:shadow-md cursor-pointer"
            style={{
              borderColor: 'var(--card-border)',
              background: 'var(--background)',
              color: 'var(--foreground)',
            }}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            <span className="text-sm font-medium">Back to Input Selection</span>
          </button>
        </div>
      </div>
      
      {/* Detection Configuration */}
      <div className="px-8">
        {/* Model Selection with Run Detection Button */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <label className="block text-sm font-semibold mb-3" style={{ color: 'var(--foreground)' }}>
            Detection Model
          </label>
          <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                checked={detectionModel === 'owlv2'}
                onChange={() => onDetectionModelChange('owlv2')}
                  className="w-4 h-4"
              />
              <span style={{ color: 'var(--foreground)' }}>OWLv2</span>
            </label>
              <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                checked={detectionModel === 'owlv2-sahi'}
                onChange={() => onDetectionModelChange('owlv2-sahi')}
                  className="w-4 h-4"
              />
              <span style={{ color: 'var(--foreground)' }}>OWLv2 + SAHI</span>
            </label>
            </div>
          </div>
          <div className="flex items-end">
            <button
              onClick={onRunDetection}
              disabled={isDetecting}
              className="px-6 py-3 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-md cursor-pointer"
              style={{
                background: 'var(--accent-primary)',
                color: 'white',
              }}
            >
              {isDetecting ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Computing Boxes...
                </span>
              ) : (
                'Compute Boxes'
              )}
            </button>
          </div>
          </div>
        </div>

        {/* Parameters */}
      <div className="px-8">
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
                Confidence Threshold
            </label>
              <span className="text-sm font-medium" style={{ color: 'var(--accent-primary)' }}>
                {threshold.toFixed(2)}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={threshold}
              onChange={(e) => onThresholdChange(parseFloat(e.target.value))}
              className="w-full h-2 rounded-lg appearance-none cursor-pointer"
              style={{
                background: 'var(--card-border)',
              }}
            />
          </div>
          {detectionModel === 'owlv2-sahi' && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
                  IOU Threshold
              </label>
                <span className="text-sm font-medium" style={{ color: 'var(--accent-primary)' }}>
                  {iouThreshold.toFixed(2)}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={iouThreshold}
                onChange={(e) => onIouThresholdChange(parseFloat(e.target.value))}
                className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                style={{
                  background: 'var(--card-border)',
                }}
              />
            </div>
          )}
        </div>
      </div>

        {/* Images with Boxes */}
      <div className="px-8">
        <div className="grid grid-cols-2 gap-6">
            <div>
            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
                Before Image
              </h3>
            </div>
            <div className="relative border-2 rounded-xl overflow-hidden shadow-sm" style={{ borderColor: 'var(--card-border)' }}>
              <img
                ref={beforeImageRef}
                src={beforeImageUrl}
                alt="Before meal"
                className="w-full h-auto"
                onLoad={() => setBeforeImageLoaded(true)}
              />
              {/* Render boxes */}
              {beforeImageLoaded && beforeImageRef.current && beforeBoxes.map((foodBox, idx) => {
                const img = beforeImageRef.current!;
                const rect = img.getBoundingClientRect();
                const scaleX = rect.width / img.naturalWidth;
                const scaleY = rect.height / img.naturalHeight;
                const x1 = foodBox.box.x1 * scaleX;
                const y1 = foodBox.box.y1 * scaleY;
                const x2 = foodBox.box.x2 * scaleX;
                const y2 = foodBox.box.y2 * scaleY;
                const width = x2 - x1;
                const height = y2 - y1;
                const color = getFoodColor(foodBox.food_id);
                const food = foods.find((f) => f.id === foodBox.food_id);
                const labelAbove = y1 > 30; // Show label above if box is not too close to top
                
                return (
                  <div
                    key={`before-${foodBox.food_id}-${idx}`}
                    className="absolute border-2 z-20"
                    style={{
                      left: `${x1}px`,
                      top: `${y1}px`,
                      width: `${width}px`,
                      height: `${height}px`,
                      borderColor: color,
                      background: `${color}20`,
                    }}
                  >
                    <div
                      className={`absolute left-0 px-2 py-0.5 text-xs font-medium rounded whitespace-nowrap ${
                        labelAbove ? '-top-6' : 'top-full mt-1'
                      }`}
                      style={{
                        background: color,
                        color: 'white',
                      }}
                    >
                      {food ? getShortFoodName(food.short_name) : `Food ${foodBox.food_id}`}
                      {foodBox.confidence !== undefined && (
                        <span className="ml-1 opacity-90">
                          ({(foodBox.confidence * 100).toFixed(0)}%)
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
              </div>
            </div>
            <div>
            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
                After Image
              </h3>
            </div>
            <div className="relative border-2 rounded-xl overflow-hidden shadow-sm" style={{ borderColor: 'var(--card-border)' }}>
              <img
                ref={afterImageRef}
                src={afterImageUrl}
                alt="After meal"
                className="w-full h-auto"
                onLoad={() => setAfterImageLoaded(true)}
              />
              {/* Render boxes */}
              {afterImageLoaded && afterImageRef.current && afterBoxes.map((foodBox, idx) => {
                const img = afterImageRef.current!;
                const rect = img.getBoundingClientRect();
                const scaleX = rect.width / img.naturalWidth;
                const scaleY = rect.height / img.naturalHeight;
                const x1 = foodBox.box.x1 * scaleX;
                const y1 = foodBox.box.y1 * scaleY;
                const x2 = foodBox.box.x2 * scaleX;
                const y2 = foodBox.box.y2 * scaleY;
                const width = x2 - x1;
                const height = y2 - y1;
                const color = getFoodColor(foodBox.food_id);
                const food = foods.find((f) => f.id === foodBox.food_id);
                const labelAbove = y1 > 30; // Show label above if box is not too close to top
                
                return (
                  <div
                    key={`after-${foodBox.food_id}-${idx}`}
                    className="absolute border-2 z-20"
                    style={{
                      left: `${x1}px`,
                      top: `${y1}px`,
                      width: `${width}px`,
                      height: `${height}px`,
                      borderColor: color,
                      background: `${color}20`,
                    }}
                  >
                    <div
                      className={`absolute left-0 px-2 py-0.5 text-xs font-medium rounded whitespace-nowrap ${
                        labelAbove ? '-top-6' : 'top-full mt-1'
                      }`}
                      style={{
                        background: color,
                        color: 'white',
                      }}
                    >
                      {food ? getShortFoodName(food.short_name) : `Food ${foodBox.food_id}`}
                      {foodBox.confidence !== undefined && (
                        <span className="ml-1 opacity-90">
                          ({(foodBox.confidence * 100).toFixed(0)}%)
                        </span>
                      )}
                    </div>
              </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

        {/* Run SAM2 Button */}
      <div className="px-8 py-4 border-t" style={{ borderColor: 'var(--card-border)' }}>
          <button
            onClick={onRunSam2}
          disabled={!canRunSam2 || isRunningSam2}
          className="px-6 py-3 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-md cursor-pointer"
            style={{
              background: 'var(--accent-primary)',
              color: 'white',
            }}
          >
          {isRunningSam2 ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Computing Masks...
            </span>
          ) : (
            'Compute Masks'
          )}
          </button>
      </div>
    </div>
  );
}
