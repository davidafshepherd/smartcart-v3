import { NumberBadge } from '@/components/common';

import { ImageCard } from './ImageCard';


interface Props {
  label: string;
  number: number;
  rgbPath: string;
  depthPath: string;
}


export function ImageColumn({ label, number, rgbPath, depthPath }: Props) {
  return (
    <div>
      {/* Column Header */}
      <div className="meal-details-image-col-header">
        <NumberBadge number={number} color="var(--accent-primary)" size="sm" />
        <span className="meal-details-image-col-label">{label}</span>
      </div>

      {/* Image cards */}
      <div className="meal-details-image-cards">
        <ImageCard label="RGB" path={rgbPath} />
        <ImageCard label="Depth" path={depthPath} />
      </div>
    </div>
  );
}
