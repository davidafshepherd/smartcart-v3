import { NumberBadge } from '@/components/common';
import { imageService } from '@/services/imageService';
import { parseYYYYMMDD } from '@/utils/date';

import type { Snapshot } from '@/types';


interface Props {
  label: string;
  number: number;
  snapshot: Snapshot | null;
}


export default function SnapshotPreview({ label, number, snapshot }: Props) {
  return (
    <div className={`snapshot-preview ${snapshot ? "selected" : "empty"}`}>
      {/* Header */}
      <div className="snapshot-preview-header">
        <NumberBadge number={number} color="var(--accent-primary)" size="sm" />
        <span className="snapshot-preview-header-text">{label}</span>
      </div>

      {/* Snapshot image and details or placeholder */}
      {snapshot ? (
        <div>
          <img
            className="snapshot-preview-image"
            src={imageService.getImageUrl(snapshot.rgb_path)}
            alt={`${label} RGB`}
          />

          <p className="snapshot-preview-detail">
            Patient: {snapshot.patient_id} | {parseYYYYMMDD(snapshot.date)} {snapshot.time}
          </p>

          <p className="snapshot-preview-weight">Weight: {snapshot.weight}g</p>
        </div>
      ) : (
        <p className="snapshot-preview-placeholder">Select snapshot {number}...</p>
      )}
    </div>
  );
}
