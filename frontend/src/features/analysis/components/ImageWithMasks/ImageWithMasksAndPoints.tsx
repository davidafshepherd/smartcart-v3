import { useCallback, useEffect, useRef, useState } from 'react';

import type { FoodMask, Point } from '@/types';

import { MaskOverlay } from './MaskOverlay';
import { PointMarker } from './PointMarker';

import './ImageWithMasks.css';


interface ImageDimensions {
  naturalWidth: number;
  naturalHeight: number;
  displayWidth: number;
  displayHeight: number;
}


interface Props {
  imageUrl: string;
  alt: string;
  masks: FoodMask[];
  points: Point[];
  inputType: "points" | "text";
  pointLabel: 0 | 1;
  isRunning: boolean;
  onAddPoint: (point: Point) => void;
  onDiscardMask: (maskId: string) => void;
  onPointDelete: (index: number) => void;
  label: string;
  required?: boolean;
}


export function ImageWithMasksAndPoints({
  imageUrl,
  alt,
  masks,
  points,
  inputType,
  pointLabel,
  isRunning,
  onAddPoint,
  onDiscardMask,
  onPointDelete,
  label,
  required = false,
}: Props) {
  // Image state.
  const [dimensions, setDimensions] = useState<ImageDimensions | null>(null);
  const [hoveredPointKey, setHoveredPointKey] = useState<string | null>(null);
  const [cursor, setCursor] = useState<"default" | "pointer">("default");

  // Ref for reading the image's bounding rect in container-level mouse handlers.
  const imageRef = useRef<HTMLImageElement>(null);


  // Captures rendered dimensions so mask/point coordinates can be scaled correctly.
  const handleImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setDimensions({
      naturalWidth: img.naturalWidth,
      naturalHeight: img.naturalHeight,
      displayWidth: img.clientWidth,
      displayHeight: img.clientHeight,
    });
  }, []);

  // Keeps display dimensions in sync when the image is resized (e.g. window resize, browser zoom).
  useEffect(() => {
    const img = imageRef.current;
    if (!img) return;

    const observer = new ResizeObserver(() => {
      setDimensions(prev => prev ? {
        ...prev,
        displayWidth: img.clientWidth,
        displayHeight: img.clientHeight,
      } : null);
    });

    observer.observe(img);
    return () => observer.disconnect();
  }, []);


  // Adds a foreground or background point at the clicked image coordinate (points mode only).
  const handleImageClick = useCallback((e: React.MouseEvent<HTMLImageElement>) => {
    if (inputType !== "points" || isRunning) return;
    const img = e.currentTarget;
    const rect = img.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (img.naturalWidth / rect.width);
    const y = (e.clientY - rect.top) * (img.naturalHeight / rect.height);
    onAddPoint({ label: pointLabel, x, y });
  }, [inputType, isRunning, pointLabel, onAddPoint]);


  // Discards the topmost mask whose pixel falls under the click (text mode only).
  const handleMaskClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (inputType !== "text" || isRunning || !imageRef.current || !dimensions) return;

    const img = imageRef.current;
    const rect = img.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    for (let i = masks.length - 1; i >= 0; i--) {
      const mask = masks[i];
      if (!mask.mask_id) continue;

      const maskX = Math.round((clickX / rect.width) * dimensions.naturalWidth);
      const maskY = Math.round((clickY / rect.height) * dimensions.naturalHeight);

      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const checkX = maskX + dx;
          const checkY = maskY + dy;

          if (checkY >= 0 && checkY < dimensions.naturalHeight && checkX >= 0 && checkX < dimensions.naturalWidth) {
            if (mask.mask[checkY]?.[checkX] === 1) {
              setCursor("default");
              onDiscardMask(mask.mask_id);
              return;
            }
          }
        }
      }
    }
  }, [inputType, isRunning, masks, dimensions, onDiscardMask]);


  // Shows a pointer cursor when the mouse is over a clickable mask (text mode only).
  const handleMaskMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (inputType !== "text" || isRunning || !imageRef.current || !dimensions || masks.length === 0) {
      setCursor("default");
      return;
    }
    
    const img = imageRef.current;
    const rect = img.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    for (let i = masks.length - 1; i >= 0; i--) {
      const mask = masks[i];
      if (!mask.mask_id) continue;

      const maskX = Math.round((mouseX / rect.width) * dimensions.naturalWidth);
      const maskY = Math.round((mouseY / rect.height) * dimensions.naturalHeight);

      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const checkX = maskX + dx;
          const checkY = maskY + dy;
          
          if (checkY >= 0 && checkY < dimensions.naturalHeight && checkX >= 0 && checkX < dimensions.naturalWidth) {
            if (mask.mask[checkY]?.[checkX] === 1) { 
              setCursor("pointer"); 
              return; 
            }
          }
        }
      }
    }

    setCursor('default');
  }, [inputType, isRunning, masks, dimensions]);


  // Scale factors for converting natural image coordinates to display coordinates.
  const scaleX = dimensions ? dimensions.displayWidth / dimensions.naturalWidth : 1;
  const scaleY = dimensions ? dimensions.displayHeight / dimensions.naturalHeight : 1;

  // Header status text.
  const statusText = inputType === "points"
    ? `(${points.filter(p => p.label === 1).length} fg, ${points.filter(p => p.label === 0).length} bg)`
    : masks.length > 0 ? `• ${masks.length} mask${masks.length !== 1 ? "s" : ""}` : null;


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
      <div
        className={`image-container ${isRunning ? "image-container-running" : ""}`}
        style={{ cursor: inputType === "text" && !isRunning ? cursor : "default" }}
        onClick={handleMaskClick}
        onMouseMove={handleMaskMouseMove}
        onMouseLeave={() => setCursor("default")}
      >
        {/* Image */}
        <img
          ref={imageRef}
          src={imageUrl}
          alt={alt}
          className="image-el"
          style={{ cursor: isRunning ? "default" : inputType === "points" ? "crosshair" : "inherit" }}
          onClick={handleImageClick}
          onLoad={handleImageLoad}
        />

        {/* Mask overlay */}
        {dimensions && (
          <MaskOverlay masks={masks} imageWidth={dimensions.naturalWidth} imageHeight={dimensions.naturalHeight} />
        )}

        {/* Point markers */}
        {inputType === "points" && dimensions && points.map((point, idx) => {
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
              hoveredPointKey={hoveredPointKey}
              onHover={setHoveredPointKey}
              onDelete={onPointDelete}
            />
          );
        })}
      </div>
    </div>
  );
}
