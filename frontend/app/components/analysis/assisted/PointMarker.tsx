'use client';

import type { Point } from '../../../lib/types';

// =============================================================================
// Types
// =============================================================================

/** Props for the PointMarker component. */
interface PointMarkerProps {
  /** The point to render. */
  point: Point;
  /** Index of the point in the array. */
  index: number;
  /** Scale factor for X coordinate (displayWidth / naturalWidth). */
  scaleX: number;
  /** Scale factor for Y coordinate (displayHeight / naturalHeight). */
  scaleY: number;
  /** Whether operations are currently running (disables interactions). */
  isRunning: boolean;
  /** Unique key for this point (for hover state tracking). */
  pointKey: string;
  /** Currently hovered point key, or null. */
  hoveredPointKey: string | null;
  /** Callback when point is hovered. */
  onHover: (key: string | null) => void;
  /** Callback when point is clicked (to delete). */
  onDelete: (index: number) => void;
}

// =============================================================================
// Component
// =============================================================================

/**
 * Renders a single point marker on an image.
 *
 * @param props - The component props.
 * @returns The point marker element.
 */
export function PointMarker({
  point,
  index,
  scaleX,
  scaleY,
  isRunning,
  pointKey,
  hoveredPointKey,
  onHover,
  onDelete,
}: PointMarkerProps) {
  const isHovered = hoveredPointKey === pointKey;
  const isForeground = point.label === 1;

  return (
    <div
      className={`absolute w-5 h-5 rounded-full border-2 transition-transform z-20 ${
        isRunning ? 'cursor-default' : 'cursor-pointer'
      }`}
      style={{
        left: `${point.x * scaleX}px`,
        top: `${point.y * scaleY}px`,
        borderColor: isForeground ? '#10B981' : '#EF4444',
        background: isForeground ? '#10B98180' : '#EF444480',
        transform: `translate(-50%, -50%) ${isHovered ? 'scale(1.25)' : 'scale(1)'}`,
      }}
      onMouseEnter={() => onHover(pointKey)}
      onMouseLeave={() => onHover(null)}
      onClick={(e) => {
        e.stopPropagation();
        onHover(null);
        if (!isRunning) onDelete(index);
      }}
      title={isRunning ? undefined : 'Click to delete point'}
    />
  );
}
