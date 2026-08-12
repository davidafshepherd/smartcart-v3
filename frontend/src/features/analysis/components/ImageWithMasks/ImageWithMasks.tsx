import { useState, useCallback } from 'react';

import type { FoodMask } from '@/types';

import { MaskOverlay } from './MaskOverlay';

import './ImageWithMasks.css';


interface ImageDimensions {
  naturalWidth: number;
  naturalHeight: number;
}


interface Props {
  imageUrl: string;
  alt: string;
  masks: FoodMask[];
  label: string;
  required?: boolean;
  isRunning?: boolean;
}


export function ImageWithMasks({ imageUrl, alt, masks, label, required = false, isRunning = false }: Props) {
  // Image state.
  const [dimensions, setDimensions] = useState<ImageDimensions | null>(null);


  // Captures natural dimensions on load so masks can be scaled correctly.
  const handleImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setDimensions({ naturalWidth: img.naturalWidth, naturalHeight: img.naturalHeight });
  }, []);


  // Header status text.
  const statusText = masks.length > 0
    ? `• ${masks.length} mask${masks.length !== 1 ? "s" : ""}`
    : null;


  return (
    <div>
      {/* Header */}
      <div className="image-header">
        <h3 className="image-header-title">{label}</h3>
        <span className={`image-header-badge ${required ? "image-header-badge-required" : "image-header-badge-optional"}`}>
          {required ? "Required" : "Optional"}
        </span>
        {statusText && <span className="image-header-status">{statusText}</span>}
      </div>

      {/* Content */}
      <div className={`image-container ${isRunning ? 'image-container-running' : ''}`}>
        {/* Image */}
        <img src={imageUrl} alt={alt} className="image-el" onLoad={handleImageLoad} />

        {/* Mask overlay */}
        {dimensions && (
          <MaskOverlay masks={masks} imageWidth={dimensions.naturalWidth} imageHeight={dimensions.naturalHeight} />
        )}
      </div>
    </div>
  );
}
