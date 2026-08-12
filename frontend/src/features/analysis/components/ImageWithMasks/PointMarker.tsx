import type { Point } from '@/types';


interface Props {
  point: Point;
  index: number;
  scaleX: number;
  scaleY: number;
  isRunning: boolean;
  pointKey: string;
  hoveredPointKey: string | null;
  onHover: (key: string | null) => void;
  onDelete: (index: number) => void;
}


export function PointMarker({ 
  point, 
  index,
  scaleX, 
  scaleY, 
  isRunning, 
  pointKey, 
  hoveredPointKey, 
  onHover, 
  onDelete 
}: Props) {
  // Derived display state.
  const isHovered = hoveredPointKey === pointKey;
  const isForeground = point.label === 1;


  // Positions the marker and applies colour and hover scale based on point type.
  const markerStyle = {
    left: `${point.x * scaleX}px`,
    top: `${point.y * scaleY}px`,
    borderColor: isForeground ? "#10B981" : "#EF4444",
    background: isForeground ? "#10B98180" : "#EF444480",
    transform: `translate(-50%, -50%) ${isHovered ? "scale(1.25)" : "scale(1)"}`,
  };


  // Deletes the point on click, unless SAM3 is running.
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onHover(null);
    if (!isRunning) onDelete(index);
  };


  return (
    <div
      className={`point-marker ${isRunning ? "point-marker-running" : ""}`}
      style={markerStyle}
      onMouseEnter={() => onHover(pointKey)}
      onMouseLeave={() => onHover(null)}
      onClick={handleClick}
      title={isRunning ? undefined : "Click to delete point"}
    />
  );
}
