'use client';

import type { Snapshot, MenuItem } from '../../lib/types';
import { SnapshotPreview } from './SnapshotPreview';
import { MenuItemSelector } from './MenuItemSelector';

interface MatchingPanelProps {
  beforeSnapshot: Snapshot | null;
  afterSnapshot: Snapshot | null;
  menuItems: MenuItem[];
  selectedMenuItemId: number | null;
  onMenuItemSelect: (id: number | null) => void;
  onMenuItemCreated: (item: MenuItem) => void;
  onSave: () => void;
  onClearSelection: () => void;
  isSaving: boolean;
  canSave: boolean;
  className?: string;
}

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
  const showMenuSelector = beforeSnapshot && afterSnapshot;

  return (
    <div
      className={`p-6 rounded-2xl border shadow-sm ${className}`}
      style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
    >
      <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--foreground)' }}>
        Match Snapshots
      </h2>

      {/* Before/After Previews */}
      <div className="grid grid-cols-2 gap-6 mb-6">
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

      {/* Menu Item Selection */}
      {showMenuSelector && (
        <MenuItemSelector
          menuItems={menuItems}
          selectedId={selectedMenuItemId}
          onSelect={onMenuItemSelect}
          onItemCreated={onMenuItemCreated}
          className="mb-6"
        />
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={onSave}
          disabled={!canSave || isSaving}
          className="px-6 py-3 rounded-xl font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background: 'var(--accent-primary)',
            color: 'white',
          }}
        >
          {isSaving ? 'Saving...' : 'Save Meal'}
        </button>
        <button
          onClick={onClearSelection}
          className="px-6 py-3 rounded-xl font-medium border transition-colors hover:bg-gray-50"
          style={{ borderColor: 'var(--card-border)', color: 'var(--text-secondary)' }}
        >
          Clear Selection
        </button>
      </div>
    </div>
  );
}
