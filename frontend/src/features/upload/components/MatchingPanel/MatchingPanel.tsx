import type { MenuItem, Snapshot } from '@/types';

import MenuItemSelector from './MenuItemSelector';
import SnapshotPreview from './SnapshotPreview';

import './MatchingPanel.css';


interface Props {
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
}: Props) {
  // Show menu selector when at least one snapshot is selected.
  const showMenuSelector = beforeSnapshot || afterSnapshot;

  return (
    <div className="matching-panel">
      {/* Panel title */}
      <h2 className="matching-panel-title">Match Snapshots</h2>

      {/* Before/After snapshot previews */}
      <div className="matching-panel-previews">
        <SnapshotPreview 
          label="Before (Pre-meal)" 
          number={1} 
          snapshot={beforeSnapshot} 
        />
        <SnapshotPreview
          label="After (Post-meal)" 
          number={2} 
          snapshot={afterSnapshot}
        />
      </div>
      
      {/* Menu item selection */}
      {showMenuSelector && (
        <MenuItemSelector
          menuItems={menuItems}
          selectedId={selectedMenuItemId}
          onSelect={onMenuItemSelect}
          onItemCreated={onMenuItemCreated}
        />
      )}

      {/* Action buttons */}
      <div className="matching-panel-actions">
        <button
          className={`matching-panel-save-button ${!canSave || isSaving ? "disabled" : "enabled"}`}
          onClick={onSave}
          disabled={!canSave || isSaving}
        >
          {isSaving ? "Saving..." : "Save Meal"}
        </button>

        <button className="matching-panel-clear-button" onClick={onClearSelection}>Clear Selection</button>
      </div>
    </div>
  );
}
