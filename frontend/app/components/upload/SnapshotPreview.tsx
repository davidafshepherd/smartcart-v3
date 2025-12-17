/**
 * @fileoverview Preview component for displaying a selected snapshot.
 *
 * Shows a snapshot's image and metadata in a compact format, used in
 * the matching panel to display before and after snapshot selections.
 */

'use client';

import type { Snapshot } from '../../lib/types';
import { imagesApi } from '../../lib/api';
import { NumberBadge } from '../ui/NumberBadge';

// =============================================================================
// Type Definitions
// =============================================================================

/** Props for the SnapshotPreview component. */
interface SnapshotPreviewProps {
  /** Label text (e.g., "Before (Pre-meal)"). */
  label: string;
  /** The selection number (1 or 2). */
  number: number;
  /** The snapshot to preview, or null if not yet selected. */
  snapshot: Snapshot | null;
  /** The accent color for the badge and border. */
  color: string;
}

// =============================================================================
// Component
// =============================================================================

/**
 * Renders a preview of a selected snapshot in the matching panel.
 *
 * Displays either:
 * - A placeholder prompting the user to select a snapshot
 * - The snapshot's image, patient ID, date, time, and weight
 *
 * The border color changes based on whether a snapshot is selected,
 * providing visual feedback about the selection state.
 *
 * @param props - The component props.
 * @returns A snapshot preview element.
 *
 * @example
 * ```tsx
 * <SnapshotPreview
 *   label="Before (Pre-meal)"
 *   number={1}
 *   snapshot={beforeSnapshot}
 *   color="var(--accent-primary)"
 * />
 * ```
 */
export function SnapshotPreview({ label, number, snapshot, color }: SnapshotPreviewProps) {
  return (
    <div
      className="p-4 rounded-xl border-2"
      style={{
        borderColor: snapshot ? color : 'var(--card-border)',
        background: 'var(--background)',
      }}
    >
      {/* Header with number badge and label */}
      <div className="flex items-center gap-2 mb-3">
        <NumberBadge number={number} color={color} size="sm" />
        <span className="font-medium" style={{ color: 'var(--foreground)' }}>
          {label}
        </span>
      </div>

      {/* Content: snapshot details or placeholder */}
      {snapshot ? (
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imagesApi.getImageUrl(snapshot.rgb_path)}
            alt={`${label} RGB`}
            className="w-full h-32 object-cover rounded-lg mb-2"
          />
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Patient: {snapshot.patient_id} | {snapshot.date} {snapshot.time}
          </p>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Weight: {snapshot.weight}g
          </p>
        </div>
      ) : (
        <p style={{ color: 'var(--text-muted)' }}>Select snapshot {number}...</p>
      )}
    </div>
  );
}
