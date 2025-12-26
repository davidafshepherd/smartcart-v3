'use client';

import type { Snapshot } from '../../lib/types';
import { imagesApi } from '../../lib/api';
import { NumberBadge } from '../ui/NumberBadge';

// =============================================================================
// Type Definitions
// =============================================================================

/** Props for the SnapshotCard component. */
interface SnapshotCardProps {
  /** The snapshot data to display. */
  snapshot: Snapshot;
  /** Whether this snapshot is currently selected. */
  isSelected: boolean;
  /** The selection order index (0 = first/before, 1 = second/after). -1 if not selected. */
  selectionIndex: number;
  /** Animation delay in milliseconds for staggered grid entrance. */
  animationDelay: number;
  /** Callback invoked when the card is clicked to toggle selection. */
  onSelect: () => void;
  /** Callback invoked when the discard button is clicked. */
  onDiscard: () => void;
  /** Whether this snapshot is currently being discarded. */
  isDiscarding?: boolean;
}

// =============================================================================
// Component
// =============================================================================

/**
 * Renders a card displaying a meal snapshot with selection capabilities.
 *
 * @param props - The component props.
 * @returns A snapshot card element.
 */
export function SnapshotCard({
  snapshot,
  isSelected,
  selectionIndex,
  animationDelay,
  onSelect,
  onDiscard,
  isDiscarding = false,
}: SnapshotCardProps) {
  // Determine border and badge colors based on selection state.
  const borderColor = isSelected
    ? selectionIndex === 0
      ? 'var(--accent-primary)'
      : 'var(--accent-secondary)'
    : 'var(--card-border)';

  const badgeColor = 'var(--accent-primary)';

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
      {/* Image Section */}
      <div className="relative h-40">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imagesApi.getImageUrl(snapshot.rgb_path)}
          alt={`Snapshot ${snapshot.id}`}
          className="w-full h-full object-cover"
        />
        {isSelected && (
          <div className="absolute top-3 left-3">
            <NumberBadge number={selectionIndex + 1} color={badgeColor} />
          </div>
        )}
      </div>

      {/* Info Section */}
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
          disabled={isDiscarding}
          className="mt-3 w-full py-2 rounded-lg text-sm font-medium transition-colors hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          style={{ color: 'var(--danger)' }}
        >
          {isDiscarding ? 'Discarding...' : 'Discard'}
        </button>
      </div>
    </div>
  );
}
