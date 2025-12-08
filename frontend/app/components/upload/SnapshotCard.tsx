'use client';

import type { Snapshot } from '../../lib/types';
import { uploadApi } from '../../lib/api';

interface SnapshotCardProps {
  snapshot: Snapshot;
  isSelected: boolean;
  selectionIndex: number;
  animationDelay: number;
  onSelect: () => void;
  onDiscard: () => void;
}

export function SnapshotCard({
  snapshot,
  isSelected,
  selectionIndex,
  animationDelay,
  onSelect,
  onDiscard,
}: SnapshotCardProps) {
  const borderColor = isSelected
    ? selectionIndex === 0
      ? 'var(--accent-primary)'
      : 'var(--accent-secondary)'
    : 'var(--card-border)';

  const badgeColor = selectionIndex === 0 ? 'var(--accent-primary)' : 'var(--accent-secondary)';

  return (
    <div
      className="rounded-xl border overflow-hidden transition-all duration-200 cursor-pointer hover:shadow-md"
      style={{
        background: 'var(--card-bg)',
        borderColor,
        borderWidth: isSelected ? '2px' : '1px',
        animationDelay: `${animationDelay}ms`,
      }}
      onClick={onSelect}
    >
      {/* Image */}
      <div className="relative h-40">
        <img
          src={uploadApi.getImageUrl(snapshot.rgb_path)}
          alt={`Snapshot ${snapshot.id}`}
          className="w-full h-full object-cover"
        />
        {isSelected && (
          <div
            className="absolute top-3 left-3 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold"
            style={{ background: badgeColor, color: 'white' }}
          >
            {selectionIndex + 1}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="font-medium" style={{ color: 'var(--foreground)' }}>
            Patient #{snapshot.patient_id}
          </span>
          <span
            className="text-sm px-2 py-1 rounded-lg"
            style={{ background: 'var(--accent-light)', color: 'var(--accent-primary)' }}
          >
            {snapshot.weight}g
          </span>
        </div>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          {snapshot.date} at {snapshot.time}
        </p>

        {/* Discard Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDiscard();
          }}
          className="mt-3 w-full py-2 rounded-lg text-sm font-medium transition-colors hover:bg-red-50"
          style={{ color: 'var(--danger)' }}
        >
          Discard
        </button>
      </div>
    </div>
  );
}
