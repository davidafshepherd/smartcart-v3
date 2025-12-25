'use client';

import React, { useState, useCallback } from 'react';
import type { FoodMask } from '../../../../lib/types';
import { MaskOverlay } from '../MaskOverlay';

/** Image dimensions for rendering overlays. */
interface ImageDimensions {
  naturalWidth: number;
  naturalHeight: number;
}

// =============================================================================
// Types
// =============================================================================

/** Props for the ImageWithMasks component. */
interface ImageWithMasksProps {
  /** Image URL. */
  imageUrl: string;
  /** Image alt text. */
  alt: string;
  /** Array of masks to overlay. */
  masks: FoodMask[];
  /** Label text for the image. */
  label: string;
  /** Whether this image is required. */
  required?: boolean;
  /** Optional status text to display. */
  statusText?: string;
  /** Whether operations are running. */
  isRunning?: boolean;
}

// =============================================================================
// Component
// =============================================================================

/**
 * Renders an image with mask overlays.
 *
 * @param props - The component props.
 * @returns The image with overlays element.
 */
export function ImageWithMasks({
  imageUrl,
  alt,
  masks,
  label,
  required = false,
  statusText,
  isRunning = false,
}: ImageWithMasksProps) {
  // Track image dimensions in state (updated on load)
  const [dimensions, setDimensions] = useState<ImageDimensions | null>(null);

  // Handle image load - capture dimensions
  const handleImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setDimensions({
      naturalWidth: img.naturalWidth,
      naturalHeight: img.naturalHeight,
    });
  }, []);

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
        style={{ borderColor: 'var(--card-border)' }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt={alt}
          className="w-full h-auto"
          onLoad={handleImageLoad}
        />
        {dimensions && (
          <MaskOverlay
            masks={masks}
            imageWidth={dimensions.naturalWidth}
            imageHeight={dimensions.naturalHeight}
          />
        )}
      </div>
    </div>
  );
}
