import type { Snapshot } from "@/types";

import { SnapshotCard } from "../SnapshotCard/SnapshotCard";

import './SnapshotGrid.css';


interface Props {
  snapshots: Snapshot[];
  selectedIds: number[];
  discardingIds: number[];
  onSelect: (snapshotId: number) => void;
  onDiscard: (snapshotId: number) => void;
}


export function SnapshotGrid({ snapshots, selectedIds, discardingIds, onSelect, onDiscard }: Props) {
  return (
    <div>
      {/* Grid title */}
      <h2 className="snapshot-grid-title">Available Snapshots ({snapshots.length})</h2>

      {/* Snapshots */}
      <div className="snapshot-grid">
        {snapshots.map((snapshot, index) => {
          const selectionIndex = selectedIds.indexOf(snapshot.id);
          const isSelected = selectionIndex !== -1;
          const isDiscarding = discardingIds.includes(snapshot.id);

          {/* Snapshot */}
          return (
            <SnapshotCard
              key={snapshot.id}
              snapshot={snapshot}
              isSelected={isSelected}
              selectionIndex={selectionIndex}
              animationDelay={index * 50}
              onSelect={() => onSelect(snapshot.id)}
              onDiscard={() => onDiscard(snapshot.id)}
              isDiscarding={isDiscarding}
            />
          );
        })}
      </div>
    </div>
  );
}
