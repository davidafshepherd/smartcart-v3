/**
 * @fileoverview Main upload section component for the meal creation workflow.
 *
 * This is the primary view for uploading ZIP files, viewing snapshots,
 * matching before/after pairs, and creating meals. It orchestrates the
 * entire upload and meal creation flow.
 */

'use client';

import { useCallback, useState, useEffect } from 'react';
import { useUploadStore } from '../store/uploadStore';
import { uploadApi, menuApi, mealsApi, ApiError } from '../lib/api';
import type { MenuItem, Snapshot } from '../lib/types';
import { SnapshotCard } from './upload/SnapshotCard';
import { MatchingPanel } from './upload/MatchingPanel';
import { UploadZone } from './upload/UploadZone';
import { AlertMessage } from './ui/AlertMessage';

// =============================================================================
// Component
// =============================================================================

/**
 * Renders the upload section of the application.
 *
 * This component manages:
 * - ZIP file uploads containing meal snapshots
 * - Display of uploaded snapshots in a grid
 * - Selection of before/after snapshot pairs
 * - Menu item selection and creation
 * - Meal creation from matched snapshots
 *
 * State is managed through a combination of Zustand (for snapshot/selection
 * state) and local React state (for UI-specific concerns like menu items
 * and messages).
 *
 * @returns The upload section element.
 *
 * @example
 * ```tsx
 * // Used in the main page
 * <UploadSection />
 * ```
 */
export default function UploadSection() {
  // ---------------------------------------------------------------------------
  // Store State
  // ---------------------------------------------------------------------------
  const {
    snapshots,
    invalidSnapshots,
    selectedIds,
    isUploading,
    addUpload,
    removeSnapshot,
    getSnapshotById,
    toggleSelection,
    clearSelection,
    clearInvalidSnapshots,
    setUploading,
  } = useUploadStore();

  // ---------------------------------------------------------------------------
  // Local State
  // ---------------------------------------------------------------------------
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedMenuItemId, setSelectedMenuItemId] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // Effects
  // ---------------------------------------------------------------------------

  /**
   * Fetches menu items on component mount.
   *
   * Menu items are needed for the meal creation workflow, so we load
   * them proactively when the upload section is shown.
   */
  useEffect(() => {
    menuApi.getAll()
      .then(setMenuItems)
      .catch((err) => console.error('Failed to fetch menu items:', err));
  }, []);

  // ---------------------------------------------------------------------------
  // Event Handlers
  // ---------------------------------------------------------------------------

  /**
   * Handles ZIP file upload.
   *
   * Uploads the file to the backend, adds the resulting snapshots to
   * the store, and displays appropriate success/error messages.
   *
   * @param file - The ZIP file to upload.
   */
  const handleFileUpload = useCallback(async (file: File) => {
    setUploading(true);
    setError(null);

    try {
      const data = await uploadApi.uploadZip(file);
      addUpload(data.meal_snapshots, data.invalid_snapshots);
      
      const count = data.meal_snapshots.length;
      setSuccessMessage(`Added ${count} snapshot${count !== 1 ? 's' : ''}`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }, [addUpload, setUploading]);

  /**
   * Handles discarding a snapshot.
   *
   * Deletes the snapshot from the backend and removes it from the store.
   *
   * @param snapshotId - The ID of the snapshot to discard.
   */
  const handleDiscard = async (snapshotId: number) => {
    try {
      await uploadApi.discardSnapshot(snapshotId);
      removeSnapshot(snapshotId);
    } catch (err) {
      console.error('Failed to discard snapshot:', err);
    }
  };

  /**
   * Handles creation of a new menu item.
   *
   * Adds the new item to the local list and auto-selects it.
   *
   * @param newItem - The newly created menu item.
   */
  const handleMenuItemCreated = (newItem: MenuItem) => {
    setMenuItems((prev) => [...prev, newItem]);
    setSelectedMenuItemId(newItem.id);
  };

  /**
   * Handles saving a meal from matched snapshots.
   *
   * Creates a meal from the selected before/after snapshots and menu
   * item, then removes the used snapshots from the store.
   */
  const handleSaveMeal = async () => {
    if (selectedIds.length !== 2 || !selectedMenuItemId) return;

    const beforeSnapshot = getSnapshotById(selectedIds[0]);
    const afterSnapshot = getSnapshotById(selectedIds[1]);
    
    if (!beforeSnapshot || !afterSnapshot) return;

    setIsSaving(true);
    setError(null);

    try {
      await mealsApi.create(beforeSnapshot.id, afterSnapshot.id, selectedMenuItemId);

      // Clean up: remove used snapshots and reset selection.
      removeSnapshot(selectedIds[0]);
      removeSnapshot(selectedIds[1]);
      clearSelection();
      setSelectedMenuItemId(null);
      
      setSuccessMessage('Meal saved successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to save meal');
    } finally {
      setIsSaving(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Derived State
  // ---------------------------------------------------------------------------

  /**
   * Gets a selected snapshot by its selection index.
   *
   * @param index - The selection index (0 or 1).
   * @returns The snapshot at that index, or null if not selected.
   */
  const getSelectedSnapshot = (index: number): Snapshot | null => {
    if (selectedIds.length <= index) return null;
    return getSnapshotById(selectedIds[index]) || null;
  };

  const beforeSnapshot = getSelectedSnapshot(0);
  const afterSnapshot = getSelectedSnapshot(1);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="p-8 animate-fade-in">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--foreground)' }}>
            Upload Meal Snapshots
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>
            Upload ZIP files containing meal snapshot folders, then match before and after snapshots to create meals.
          </p>
        </div>

        {/* Feedback Messages */}
        {error && <AlertMessage type="error" message={error} className="mb-6" />}
        {successMessage && <AlertMessage type="success" message={successMessage} className="mb-6" />}

        {/* Upload Zone */}
        <UploadZone
          onFileSelect={handleFileUpload}
          isUploading={isUploading}
          hasExistingSnapshots={snapshots.length > 0}
          className="mb-8"
        />

        {/* Invalid Snapshots Warning */}
        {invalidSnapshots.length > 0 && (
          <div
            className="mb-6 p-4 rounded-xl border relative"
            style={{ background: '#fefce8', borderColor: 'var(--warning)' }}
          >
            <button
              onClick={clearInvalidSnapshots}
              className="absolute top-3 right-3 p-1 rounded-lg hover:bg-yellow-200 transition-colors"
              style={{ color: 'var(--warning)' }}
              aria-label="Dismiss"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <h3 className="font-medium mb-2" style={{ color: 'var(--warning)' }}>
              {invalidSnapshots.length} Invalid Snapshot{invalidSnapshots.length > 1 ? 's' : ''} Skipped
            </h3>
            <ul className="text-sm space-y-1">
              {invalidSnapshots.map((entry, idx) => (
                <li key={idx} style={{ color: 'var(--text-secondary)' }}>
                  <span className="font-mono">{entry.folder}</span>: {entry.error}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Matching Panel (shown when snapshots are selected) */}
        {selectedIds.length > 0 && (
          <MatchingPanel
            beforeSnapshot={beforeSnapshot}
            afterSnapshot={afterSnapshot}
            menuItems={menuItems}
            selectedMenuItemId={selectedMenuItemId}
            onMenuItemSelect={setSelectedMenuItemId}
            onMenuItemCreated={handleMenuItemCreated}
            onSave={handleSaveMeal}
            onClearSelection={clearSelection}
            isSaving={isSaving}
            canSave={selectedIds.length === 2 && !!selectedMenuItemId}
            className="mb-8"
          />
        )}

        {/* Snapshot Grid */}
        {snapshots.length > 0 && (
          <div>
            <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--foreground)' }}>
              Available Snapshots ({snapshots.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {snapshots.map((snapshot, index) => {
                const selectionIndex = selectedIds.indexOf(snapshot.id);
                const isSelected = selectionIndex !== -1;

                return (
                  <SnapshotCard
                    key={snapshot.id}
                    snapshot={snapshot}
                    isSelected={isSelected}
                    selectionIndex={selectionIndex}
                    animationDelay={index * 50}
                    onSelect={() => toggleSelection(snapshot.id)}
                    onDiscard={() => handleDiscard(snapshot.id)}
                  />
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
