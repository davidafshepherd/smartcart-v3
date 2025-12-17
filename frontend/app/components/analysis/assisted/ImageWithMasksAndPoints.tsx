'use client';

import React, { useState, useCallback } from 'react';
import type { FoodMask, Point } from '../../../lib/types';
import { MaskOverlay } from '../MaskOverlay';
import { PointMarker } from './PointMarker';

/** Image dimensions for rendering overlays and scaling points. */
interface ImageDimensions {
  naturalWidth: number;
  naturalHeight: number;
  displayWidth: number;
  displayHeight: number;
}

// =============================================================================
// Types
// =============================================================================

/** Props for the ImageWithMasksAndPoints component. */
interface ImageWithMasksAndPointsProps {
  /** Image URL. */
  imageUrl: string;
  /** Image alt text. */
  alt: string;
  /** Optional ref to attach to the image element (for parent's event handlers). */
  imageRef?: React.RefObject<HTMLImageElement | null>;
  /** Array of masks to overlay. */
  masks: FoodMask[];
  /** Array of points to display. */
  points: Point[];
  /** Input type ('points' or 'text'). */
  inputType: 'points' | 'text';
  /** Whether operations are running. */
  isRunning: boolean;
  /** Cursor state for text mode. */
  cursor: 'default' | 'pointer';
  /** Currently hovered point key. */
  hoveredPointKey: string | null;
  /** Callback when point hover state changes. */
  onPointHover: (key: string | null) => void;
  /** Callback when image is clicked (for adding points). */
  onImageClick: (e: React.MouseEvent<HTMLImageElement>) => void;
  /** Callback when mask area is clicked (for discarding masks in text mode). */
  onMaskClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
  /** Callback when mouse moves over mask area (for cursor updates). */
  onMaskMouseMove?: (e: React.MouseEvent<HTMLDivElement>) => void;
  /** Callback when mouse leaves mask area. */
  onMaskMouseLeave?: () => void;
  /** Callback when a point is deleted. */
  onPointDelete: (index: number) => void;
  /** Label text for the image. */
  label: string;
  /** Whether this image is required. */
  required?: boolean;
  /** Optional status text to display. */
  statusText?: string;
}

// =============================================================================
// Component
// =============================================================================

/**
 * Renders an image with mask overlays and interactive point markers.
 *
 * @param props - The component props.
 * @returns The image with overlays element.
 */
export function ImageWithMasksAndPoints({
  imageUrl,
  alt,
  imageRef,
  masks,
  points,
  inputType,
  isRunning,
  cursor,
  hoveredPointKey,
  onPointHover,
  onImageClick,
  onMaskClick,
  onMaskMouseMove,
  onMaskMouseLeave,
  onPointDelete,
  label,
  required = false,
  statusText,
}: ImageWithMasksAndPointsProps) {
  // Track image dimensions in state (updated on load)
  // This avoids reading refs during render which causes cascading renders
  const [dimensions, setDimensions] = useState<ImageDimensions | null>(null);

  // Handle image load - capture dimensions
  const handleImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setDimensions({
      naturalWidth: img.naturalWidth,
      naturalHeight: img.naturalHeight,
      displayWidth: img.clientWidth,
      displayHeight: img.clientHeight,
    });
  }, []);

  // Calculate scale factors for positioning points
  const scaleX = dimensions ? dimensions.displayWidth / dimensions.naturalWidth : 1;
  const scaleY = dimensions ? dimensions.displayHeight / dimensions.naturalHeight : 1;
  return (
    <div>
      {/* Image Header */}
      <div className="flex items-center gap-2 mb-2">
        <h3 className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
          {label}
        </h3>
        <span
          className="text-xs px-2 py-0.5 rounded"
          style={{
            background: required ? 'var(--accent-light)' : 'var(--background)',
            color: required ? 'var(--accent-primary)' : 'var(--text-muted)',
            border: required ? 'none' : '1px solid var(--card-border)',
          }}
        >
          {required ? 'Required' : 'Optional'}
        </span>
        {statusText && (
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {statusText}
          </span>
        )}
      </div>

      {/* Image Container */}
      <div
        className={`relative border-2 rounded-xl overflow-hidden ${
          isRunning ? 'opacity-50 pointer-events-none' : ''
        }`}
        style={{
          borderColor: 'var(--card-border)',
          cursor: inputType === 'text' && !isRunning ? cursor : 'default',
        }}
        onClick={onMaskClick}
        onMouseMove={onMaskMouseMove}
        onMouseLeave={onMaskMouseLeave}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={imageRef}
          src={imageUrl}
          alt={alt}
          className="w-full h-auto"
          style={{
            cursor: isRunning ? 'default' : inputType === 'points' ? 'crosshair' : 'inherit',
          }}
          onClick={onImageClick}
          onLoad={handleImageLoad}
        />

        {/* Mask Overlays */}
        {dimensions && (
          <MaskOverlay
            masks={masks}
            imageWidth={dimensions.naturalWidth}
            imageHeight={dimensions.naturalHeight}
          />
        )}

        {/* Point Markers */}
        {inputType === 'points' &&
          dimensions &&
          points.map((point, idx) => {
            const pointKey = `${alt}_${point.x}_${point.y}_${point.label}`;
            return (
              <PointMarker
                key={pointKey}
                point={point}
                index={idx}
                scaleX={scaleX}
                scaleY={scaleY}
                isRunning={isRunning}
                pointKey={pointKey}
                hoveredPointKey={hoveredPointKey ?? null}
                onHover={onPointHover}
                onDelete={onPointDelete}
              />
            );
          })}
      </div>
    </div>
  );
}
