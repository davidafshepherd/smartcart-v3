'use client';

import type { Snapshot, MenuItem } from '../../lib/types';
import { SnapshotPreview } from './SnapshotPreview';
import { MenuItemSelector } from './MenuItemSelector';

// =============================================================================
// Type Definitions
// =============================================================================

/** Props for the MatchingPanel component. */
interface MatchingPanelProps {
  /** The first selected snapshot (before eating), or null. */
  beforeSnapshot: Snapshot | null;
  /** The second selected snapshot (after eating), or null. */
  afterSnapshot: Snapshot | null;
  /** List of available menu items for selection. */
  menuItems: MenuItem[];
  /** Currently selected menu item ID, or null. */
  selectedMenuItemId: number | null;
  /** Callback invoked when a menu item is selected. */
  onMenuItemSelect: (id: number | null) => void;
  /** Callback invoked when a new menu item is created. */
  onMenuItemCreated: (item: MenuItem) => void;
  /** Callback invoked when the save button is clicked. */
  onSave: () => void;
  /** Callback invoked when the clear selection button is clicked. */
  onClearSelection: () => void;
  /** Whether a save operation is in progress. */
  isSaving: boolean;
  /** Whether the save button should be enabled. */
  canSave: boolean;
  /** Optional additional CSS classes. */
  className?: string;
}

// =============================================================================
// Component
// =============================================================================

/**
 * Renders a panel for matching snapshots and creating meals.
 *
 * @param props - The component props.
 * @returns The matching panel element.
 */
export function MatchingPanel({
  beforeSnapshot,
  afterSnapshot,
  menuItems,
  selectedMenuItemId,
  onMenuItemSelect,
  onMenuItemCreated,
  onSave,
  onClearSelection,
  isSaving,
  canSave,
  className = '',
}: MatchingPanelProps) {
  // Show menu selector when at least one snapshot is selected.
  const showMenuSelector = beforeSnapshot || afterSnapshot;

  return (
    <div
      className={`p-4 sm:p-6 rounded-2xl border shadow-sm ${className}`}
      style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
    >
      <h2 className="text-lg sm:text-xl font-bold mb-4" style={{ color: 'var(--foreground)' }}>
        Match Snapshots
      </h2>

      {/* Before/After Snapshot Previews */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6">
        <SnapshotPreview
          label="Before (Pre-meal)"
          number={1}
          snapshot={beforeSnapshot}
          color="var(--accent-primary)"
        />
        <SnapshotPreview
          label="After (Post-meal)"
          number={2}
          snapshot={afterSnapshot}
          color="var(--accent-secondary)"
        />
      </div>

      {/* Menu Item Selection (shown when both snapshots selected) */}
      {showMenuSelector && (
        <MenuItemSelector
          menuItems={menuItems}
          selectedId={selectedMenuItemId}
          onSelect={onMenuItemSelect}
          onItemCreated={onMenuItemCreated}
          className="mb-6"
        />
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={onSave}
          disabled={!canSave || isSaving}
          className="px-6 py-3 rounded-xl font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          style={{
            background: 'var(--accent-primary)',
            color: 'white',
          }}
        >
          {isSaving ? 'Saving...' : 'Save Meal'}
        </button>
        <button
          onClick={onClearSelection}
          className="px-6 py-3 rounded-xl font-medium border transition-colors hover:bg-gray-50 cursor-pointer"
          style={{ borderColor: 'var(--card-border)', color: 'var(--text-secondary)' }}
        >
          Clear Selection
        </button>
      </div>
    </div>
  );
}
