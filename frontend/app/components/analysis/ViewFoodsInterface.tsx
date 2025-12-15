/**
 * @fileoverview View Foods interface component for meal analysis.
 *
 * Displays images with mask overlays and mask toggle controls.
 * Shared between points and boxes input modes.
 */

'use client';

import React, { useEffect, useState, useRef } from 'react';
import type { Food, Mask } from '../../lib/types';

interface ViewFoodsInterfaceProps {
  foods: Food[];
  beforeImageUrl: string;
  afterImageUrl: string;
  masks: Mask[];
  selectedMasks: Set<string>;
  onToggleMask: (maskId: string) => void;
  onBack: () => void;
  onComputeMass: () => void;
  isComputingNutrition?: boolean;
  backLabel: string;
}

export function ViewFoodsInterface({
  foods,
  beforeImageUrl,
  afterImageUrl,
  masks,
  selectedMasks,
  onToggleMask,
  onBack,
  onComputeMass,
  isComputingNutrition = false,
  backLabel,
}: ViewFoodsInterfaceProps) {
  const beforeImageRef = useRef<HTMLImageElement>(null);
  const afterImageRef = useRef<HTMLImageElement>(null);
  const beforeMaskCanvasRef = useRef<HTMLCanvasElement>(null);
  const afterMaskCanvasRef = useRef<HTMLCanvasElement>(null);
  const [beforeImageLoaded, setBeforeImageLoaded] = useState(false);
  const [afterImageLoaded, setAfterImageLoaded] = useState(false);

  const getFoodColor = (foodId: number) => {
    const colors = [
      '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
      '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1',
    ];
    return colors[foodId % colors.length];
  };

  /**
   * Converts a food short name to title case for display.
   */
  const formatFoodName = (shortName: string): string => {
    return shortName
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
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

  // Render masks on canvas when masks or selection changes (before image)
  useEffect(() => {
    if (!beforeImageLoaded || !beforeImageRef.current || !beforeMaskCanvasRef.current) return;
    
    const img = beforeImageRef.current;
    const canvas = beforeMaskCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx || !img.naturalWidth || !img.naturalHeight) return;
    
    const updateCanvas = () => {
      if (!beforeImageRef.current || !beforeMaskCanvasRef.current) return;
      const currentImg = beforeImageRef.current;
      const currentCanvas = beforeMaskCanvasRef.current;
      const currentCtx = currentCanvas.getContext('2d');
      if (!currentCtx) return;
      
      const rect = currentImg.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      
      currentCanvas.width = rect.width;
      currentCanvas.height = rect.height;
      currentCanvas.style.width = `${rect.width}px`;
      currentCanvas.style.height = `${rect.height}px`;
      currentCtx.clearRect(0, 0, currentCanvas.width, currentCanvas.height);
      
      const beforeMasks = masks.filter((m) => m.image_type === 'before' && m.mask_id && selectedMasks.has(m.mask_id));
      beforeMasks.forEach((mask) => {
        const maskWidth = mask.mask_data[0]?.length || 0;
        const maskHeight = mask.mask_data.length || 0;
        if (maskWidth === 0 || maskHeight === 0) return;
        
        const color = getFoodColor(mask.food_id);
        currentCtx.fillStyle = color;
        
        const xScale = rect.width / maskWidth;
        const yScale = rect.height / maskHeight;
        
        for (let y = 0; y < maskHeight; y++) {
          for (let x = 0; x < maskWidth; x++) {
            if (mask.mask_data[y] && mask.mask_data[y][x] === 1) {
              currentCtx.fillRect(x * xScale, y * yScale, Math.max(1, xScale), Math.max(1, yScale));
            }
          }
        }
      });
    };
    
    // Small delay to ensure DOM is fully rendered
    const timeoutId = setTimeout(updateCanvas, 10);
    window.addEventListener('resize', updateCanvas);
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', updateCanvas);
    };
  }, [masks, selectedMasks, beforeImageLoaded]);

  // Render masks on canvas when masks or selection changes (after image)
  useEffect(() => {
    if (!afterImageLoaded || !afterImageRef.current || !afterMaskCanvasRef.current) return;
    
    const img = afterImageRef.current;
    const canvas = afterMaskCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx || !img.naturalWidth || !img.naturalHeight) return;
    
    const updateCanvas = () => {
      if (!afterImageRef.current || !afterMaskCanvasRef.current) return;
      const currentImg = afterImageRef.current;
      const currentCanvas = afterMaskCanvasRef.current;
      const currentCtx = currentCanvas.getContext('2d');
      if (!currentCtx) return;
      
      const rect = currentImg.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      
      currentCanvas.width = rect.width;
      currentCanvas.height = rect.height;
      currentCanvas.style.width = `${rect.width}px`;
      currentCanvas.style.height = `${rect.height}px`;
      currentCtx.clearRect(0, 0, currentCanvas.width, currentCanvas.height);
      
      const afterMasks = masks.filter((m) => m.image_type === 'after' && m.mask_id && selectedMasks.has(m.mask_id));
      afterMasks.forEach((mask) => {
        const maskWidth = mask.mask_data[0]?.length || 0;
        const maskHeight = mask.mask_data.length || 0;
        if (maskWidth === 0 || maskHeight === 0) return;
        
        const color = getFoodColor(mask.food_id);
        currentCtx.fillStyle = color;
        
        const xScale = rect.width / maskWidth;
        const yScale = rect.height / maskHeight;
        
        for (let y = 0; y < maskHeight; y++) {
          for (let x = 0; x < maskWidth; x++) {
            if (mask.mask_data[y] && mask.mask_data[y][x] === 1) {
              currentCtx.fillRect(x * xScale, y * yScale, Math.max(1, xScale), Math.max(1, yScale));
            }
          }
        }
      });
    };
    
    // Small delay to ensure DOM is fully rendered
    const timeoutId = setTimeout(updateCanvas, 10);
    window.addEventListener('resize', updateCanvas);
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', updateCanvas);
    };
  }, [masks, selectedMasks, afterImageLoaded]);

  return (
    <div className="space-y-8">
      {/* Header with Back Button */}
      <div className="px-8 pt-8 pb-4 border-b" style={{ borderColor: 'var(--card-border)' }}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--foreground)' }}>
              View Foods
            </h2>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              View and toggle the identified food locations below.
            </p>
          </div>
          <button
            onClick={onBack}
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
            <span className="text-sm font-medium">{backLabel}</span>
          </button>
        </div>
      </div>

      {/* Images with Mask Overlays */}
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
              {/* Render masks as overlays */}
              {masks.some((m) => m.image_type === 'before') && (
                <canvas
                  ref={beforeMaskCanvasRef}
                  className="absolute top-0 left-0 pointer-events-none z-10"
                  style={{
                    opacity: 0.5,
                  }}
                />
              )}
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
              {/* Render masks as overlays */}
              {masks.some((m) => m.image_type === 'after') && (
                <canvas
                  ref={afterMaskCanvasRef}
                  className="absolute top-0 left-0 pointer-events-none z-10"
                  style={{
                    opacity: 0.5,
                  }}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Masks Display */}
      <div className="px-8">
        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-1" style={{ color: 'var(--foreground)' }}>
            Food Masks
          </h3>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Toggle food masks below to show/hide them on the images above.
          </p>
        </div>
        <div
          className="rounded-xl border p-4 space-y-2"
          style={{
            background: 'var(--background)',
            borderColor: 'var(--card-border)',
          }}
        >
          {masks.map((mask) => {
            if (!mask.mask_id) return null;
            const food = foods.find((f) => f.id === mask.food_id);
            const isSelected = selectedMasks.has(mask.mask_id);
            return (
              <label
                key={mask.mask_id}
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                  isSelected ? 'shadow-sm' : ''
                }`}
                style={{
                  borderColor: isSelected ? getFoodColor(mask.food_id) : 'var(--card-border)',
                  background: isSelected ? `${getFoodColor(mask.food_id)}10` : 'transparent',
                }}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => onToggleMask(mask.mask_id!)}
                  className="w-4 h-4"
                />
                <div
                  className="w-4 h-4 rounded"
                  style={{ background: getFoodColor(mask.food_id) }}
                />
                <span className="font-medium" style={{ color: 'var(--foreground)' }}>
                  {food ? formatFoodName(food.short_name) : `Food ${mask.food_id}`}
                </span>
                <span
                  className="ml-auto px-2 py-0.5 text-xs rounded"
                  style={{
                    background: 'var(--accent-light)',
                    color: 'var(--accent-primary)',
                  }}
                >
                  {mask.image_type}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Compute Mass Button */}
      <div className="px-8 py-4 border-t" style={{ borderColor: 'var(--card-border)' }}>
        <button
          onClick={onComputeMass}
          disabled={isComputingNutrition}
          className="px-6 py-3 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-md cursor-pointer"
          style={{
            background: 'var(--accent-primary)',
            color: 'white',
          }}
        >
          {isComputingNutrition ? (
            <span className="flex items-center gap-2">
              <svg
                className="animate-spin h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Computing Nutrients...
            </span>
          ) : (
            'Compute Nutrients'
          )}
        </button>
      </div>
    </div>
  );
}
