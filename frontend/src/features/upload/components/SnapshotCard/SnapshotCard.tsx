import { NumberBadge } from '@/components/common';
import { imageService } from '@/services/imageService';
import { parseYYYYMMDD } from '@/utils/date';

import type { Snapshot } from '@/types';

import './SnapshotCard.css';


interface Props {
  snapshot: Snapshot;
  isSelected: boolean;
  selectionIndex: number;
  animationDelay: number;
  onSelect: () => void;
  onDiscard: () => void;
  isDiscarding?: boolean;
}


export function SnapshotCard({ snapshot,
  isSelected,
  selectionIndex,
  animationDelay,
  onSelect,
  onDiscard,
  isDiscarding = false,
}: Props) {
    // Border and badge colours based on selection state.
    const selectionColor = selectionIndex === 0 ? "var(--accent-primary)" : "var(--accent-secondary)";

    return (
      <div
        className={`snapshot-card ${isSelected ? "selected" : ""}`}
        style={{
          borderColor: isSelected ? selectionColor : "var(--card-border)",
          animationDelay: `${animationDelay}ms`,
        }}
        onClick={onSelect}
      >
        {/* Image section */}
        <div className="snapshot-card-image">
          <img src={imageService.getImageUrl(snapshot.rgb_path)} alt={`Snapshot ${snapshot.id}`} />
          {isSelected && (
            <div className="snapshot-card-badge">
              <NumberBadge number={selectionIndex + 1} color={selectionColor} />
            </div>
          )}
        </div>

        {/* Content section */}
        <div className="snapshot-card-content">
          {/* Header */}
          <div className="snapshot-card-header">
            <span className="snapshot-card-patient">Patient #{snapshot.patient_id}</span>
            <span className="snapshot-card-weight">{snapshot.weight}g</span>
          </div>

          {/* Date */}
          <p className="snapshot-card-date">{parseYYYYMMDD(snapshot.date)} at {snapshot.time}</p>

          {/* Discard button */}
          <button 
            className="snapshot-card-discard-button" 
            disabled={isDiscarding}
            onClick={(event) => { 
              event.stopPropagation(); 
              onDiscard(); 
            }}
          >
            {isDiscarding ? "Discarding..." : "Discard"}
          </button>
        </div>
      </div>
    );
}
