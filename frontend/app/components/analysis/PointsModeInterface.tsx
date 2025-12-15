/**
 * @fileoverview Points mode interface component for meal analysis.
 *
 * Allows users to mark points on images to identify food locations.
 * Only handles point selection and running SAM2.
 */

'use client';

import React, { useEffect, useState, useRef } from 'react';
import type { Food, FoodPoints, MealData } from '../../lib/types';

interface PointsModeInterfaceProps {
  foods: Food[];
  selectedFoodId: number | null;
  onFoodSelect: (foodId: number | null) => void;
  beforeImageUrl: string;
  afterImageUrl: string;
  beforePoints: FoodPoints[];
  afterPoints: FoodPoints[];
  onImageClick: (e: React.MouseEvent<HTMLImageElement>, imageType: 'before' | 'after') => void;
  onDeletePoint: (foodId: number, pointIndex: number, imageType: 'before' | 'after') => void;
  onRunSam2: () => void;
  isRunningSam2: boolean;
  setBeforePoints: React.Dispatch<React.SetStateAction<FoodPoints[]>>;
  setAfterPoints: React.Dispatch<React.SetStateAction<FoodPoints[]>>;
  onBackToInputSelection: () => void;
}

export function PointsModeInterface({
  foods,
  selectedFoodId,
  onFoodSelect,
  beforeImageUrl,
  afterImageUrl,
  beforePoints,
  afterPoints,
  onImageClick,
  onDeletePoint,
  onRunSam2,
  isRunningSam2,
  setBeforePoints,
  setAfterPoints,
  onBackToInputSelection,
}: PointsModeInterfaceProps) {
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

  // Check if all foods have at least one point in the before image
  const canRunSam2 = foods.every((food) =>
    beforePoints.some((pointGroup) => pointGroup.food_id === food.id && pointGroup.points.length > 0)
  );

  // Get total point count per food (both before and after images)
  const getTotalPointCount = (foodId: number) => {
    const beforePointGroup = beforePoints.find((p) => p.food_id === foodId);
    const afterPointGroup = afterPoints.find((p) => p.food_id === foodId);
    const beforeCount = beforePointGroup ? beforePointGroup.points.length : 0;
    const afterCount = afterPointGroup ? afterPointGroup.points.length : 0;
    return beforeCount + afterCount;
  };

  // Helper function to get short food name (title case for display)
  const getShortFoodName = (shortName: string): string => {
    return shortName
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const handleClearAllPoints = () => {
    setBeforePoints([]);
    setAfterPoints([]);
  };

  return (
    <div className="space-y-8">
      {/* Header with Back Button */}
      <div className="px-8 pt-8 pb-4 border-b" style={{ borderColor: 'var(--card-border)' }}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--foreground)' }}>
              Pinpoint Foods
            </h2>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Click on the images below to mark food locations.
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

      {/* Food Selection */}
      <div className="px-8">
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-semibold flex-shrink-0" style={{ color: 'var(--foreground)' }}>
            Select Food to Mark
          </label>
          <div className="w-[140px] h-[36px] flex justify-end items-center flex-shrink-0">
            {(beforePoints.length > 0 || afterPoints.length > 0) && (
              <button
                onClick={handleClearAllPoints}
                className="px-4 py-2 rounded-lg border transition-all hover:shadow-md flex items-center gap-2 whitespace-nowrap cursor-pointer"
                style={{
                  borderColor: 'var(--card-border)',
                  background: 'var(--background)',
                  color: 'var(--foreground)',
                }}
                title="Clear all points"
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
                <span className="text-sm font-medium">Clear Points</span>
              </button>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {foods.map((food) => {
            const pointCount = getTotalPointCount(food.id);
            const hasRequiredPoints = pointCount > 0;
            const isSelected = selectedFoodId === food.id;
            return (
              <button
                key={food.id}
                onClick={() => onFoodSelect(food.id === selectedFoodId ? null : food.id)}
                className={`px-4 py-2.5 rounded-lg border transition-all cursor-pointer ${
                  isSelected ? 'shadow-sm' : ''
                }`}
                style={{
                  borderColor: isSelected ? getFoodColor(food.id) : 'var(--card-border)',
                  background: isSelected ? `${getFoodColor(food.id)}15` : 'var(--background)',
                  color: 'var(--foreground)',
                }}
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ background: getFoodColor(food.id) }}
                  />
                  <span className="font-medium">{getShortFoodName(food.short_name)}</span>
                  {hasRequiredPoints && (
                    <span
                      className="ml-1 px-1.5 py-0.5 text-xs rounded"
                      style={{
                        background: 'var(--accent-light)',
                        color: 'var(--accent-primary)',
                      }}
                    >
                      {pointCount}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Images */}
      <div className="px-8">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
                Before Image
              </h3>
              <span
                className="px-2 py-0.5 text-xs rounded"
                style={{
                  background: 'var(--accent-light)',
                  color: 'var(--accent-primary)',
                }}
              >
                Required
              </span>
            </div>
            <div className="relative border-2 rounded-xl overflow-hidden shadow-sm" style={{ borderColor: 'var(--card-border)' }}>
              <img
                ref={beforeImageRef}
                src={beforeImageUrl}
                alt="Before meal"
                className="w-full h-auto cursor-crosshair"
                onClick={(e) => onImageClick(e, 'before')}
                onLoad={() => setBeforeImageLoaded(true)}
              />
              {/* Render points */}
              {beforeImageLoaded && beforeImageRef.current && beforePoints.map((pointGroup) =>
                pointGroup.points.map((point, idx) => {
                  const img = beforeImageRef.current!;
                  const rect = img.getBoundingClientRect();
                  const scaleX = rect.width / img.naturalWidth;
                  const scaleY = rect.height / img.naturalHeight;
                  return (
                    <div
                      key={`${pointGroup.food_id}-${idx}`}
                      className="absolute w-5 h-5 rounded-full border-2 cursor-pointer hover:scale-125 transition-transform z-20"
                      style={{
                        left: `${point.x * scaleX}px`,
                        top: `${point.y * scaleY}px`,
                        borderColor: getFoodColor(pointGroup.food_id),
                        background: `${getFoodColor(pointGroup.food_id)}80`,
                        transform: 'translate(-50%, -50%)',
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeletePoint(pointGroup.food_id, idx, 'before');
                      }}
                      title={`Click to delete point for ${foods.find((f) => f.id === pointGroup.food_id) ? getShortFoodName(foods.find((f) => f.id === pointGroup.food_id)!.short_name) : 'food'}`}
                    />
                  );
                })
              )}
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
                After Image
              </h3>
              <span
                className="px-2 py-0.5 text-xs rounded"
                style={{
                  background: 'var(--background)',
                  color: 'var(--text-muted)',
                  border: '1px solid var(--card-border)',
                }}
              >
                Optional
              </span>
            </div>
            <div className="relative border-2 rounded-xl overflow-hidden shadow-sm" style={{ borderColor: 'var(--card-border)' }}>
              <img
                ref={afterImageRef}
                src={afterImageUrl}
                alt="After meal"
                className="w-full h-auto cursor-crosshair"
                onClick={(e) => onImageClick(e, 'after')}
                onLoad={() => setAfterImageLoaded(true)}
              />
              {/* Render points */}
              {afterImageLoaded && afterImageRef.current && afterPoints.map((pointGroup) =>
                pointGroup.points.map((point, idx) => {
                  const img = afterImageRef.current!;
                  const rect = img.getBoundingClientRect();
                  const scaleX = rect.width / img.naturalWidth;
                  const scaleY = rect.height / img.naturalHeight;
                  return (
                    <div
                      key={`${pointGroup.food_id}-${idx}`}
                      className="absolute w-5 h-5 rounded-full border-2 cursor-pointer hover:scale-125 transition-transform z-20"
                      style={{
                        left: `${point.x * scaleX}px`,
                        top: `${point.y * scaleY}px`,
                        borderColor: getFoodColor(pointGroup.food_id),
                        background: `${getFoodColor(pointGroup.food_id)}80`,
                        transform: 'translate(-50%, -50%)',
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeletePoint(pointGroup.food_id, idx, 'after');
                      }}
                      title={`Click to delete point for ${foods.find((f) => f.id === pointGroup.food_id) ? getShortFoodName(foods.find((f) => f.id === pointGroup.food_id)!.short_name) : 'food'}`}
                    />
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Warning Message */}
      <div className="px-8">
        <div
          className="p-3 rounded-lg"
          style={{
            background: 'var(--accent-light)',
            border: '1px solid var(--accent-primary)',
          }}
        >
          <p className="text-sm" style={{ color: 'var(--accent-primary)' }}>
            ⓘ Select at least one point per food in the before image.
          </p>
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
