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
import { Spinner } from './ui/Spinner';

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
 * state and messages) and local React state (for UI-specific concerns).
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
    successMessage,
    errorMessage,
    addUpload,
    removeSnapshot,
    getSnapshotById,
    toggleSelection,
    clearSelection,
    clearInvalidSnapshots,
    setUploading,
    setSuccessMessage,
    setErrorMessage,
  } = useUploadStore();

  // ---------------------------------------------------------------------------
  // Local State
  // ---------------------------------------------------------------------------
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedMenuItemId, setSelectedMenuItemId] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [discardingIds, setDiscardingIds] = useState<Set<number>>(new Set());

  // ---------------------------------------------------------------------------
  // Effects
  // ---------------------------------------------------------------------------

  /**
   * Resets UI state and fetches menu items on component mount.
   *
   * Clears any lingering selections and messages from previous sessions,
   * and loads menu items for the meal creation workflow.
   */
  useEffect(() => {
    // Clear selections and messages when switching to this section
    clearSelection();
    setSuccessMessage(null);
    setErrorMessage(null);
    clearInvalidSnapshots();

    // Fetch menu items
    menuApi.getAll()
      .then(setMenuItems)
      .catch((err) => console.error('Failed to fetch menu items:', err));
  }, [clearSelection, setSuccessMessage, setErrorMessage, clearInvalidSnapshots]);

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
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const data = await uploadApi.uploadZip(file);
      addUpload(data.meal_snapshots, data.invalid_snapshots);
      
      const validCount = data.meal_snapshots.length;
      const invalidCount = data.invalid_snapshots.length;

      // Show appropriate message based on results.
      if (validCount === 0 && invalidCount > 0) {
        // No valid snapshots - the invalid list will show details.
        setErrorMessage('No valid snapshots found.');
      } else if (validCount > 0) {
        setSuccessMessage(`Added ${validCount} meal snapshot${validCount !== 1 ? 's' : ''}.`);
      }
    } catch (err) {
      setErrorMessage(err instanceof ApiError ? err.message : 'Upload failed.');
    } finally {
      setUploading(false);
    }
  }, [addUpload, setUploading, setErrorMessage, setSuccessMessage]);

  /**
   * Handles discarding a snapshot.
   *
   * Deletes the snapshot from the backend and removes it from the store.
   * Prevents double-clicks by tracking which snapshots are being discarded.
   *
   * @param snapshotId - The ID of the snapshot to discard.
   */
  const handleDiscard = async (snapshotId: number) => {
    // Prevent double-clicks by checking if already discarding.
    if (discardingIds.has(snapshotId)) return;

    // Mark as discarding.
    setDiscardingIds((prev) => new Set(prev).add(snapshotId));

    try {
      await uploadApi.discardSnapshot(snapshotId);
      removeSnapshot(snapshotId);
    } catch (err) {
      console.error('Failed to discard snapshot:', err);
    } finally {
      // Remove from discarding set.
      setDiscardingIds((prev) => {
        const next = new Set(prev);
        next.delete(snapshotId);
        return next;
      });
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
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await mealsApi.create(beforeSnapshot.id, afterSnapshot.id, selectedMenuItemId);

      // Clean up: remove used snapshots and reset selection.
      removeSnapshot(selectedIds[0]);
      removeSnapshot(selectedIds[1]);
      clearSelection();
      setSelectedMenuItemId(null);
      
      setSuccessMessage('Meal saved successfully!');
    } catch (err) {
      setErrorMessage(err instanceof ApiError ? err.message : 'Failed to save meal.');
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
  const hasExistingSnapshots = snapshots.length > 0;

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="p-8 animate-fade-in">
      <div className="max-w-7xl mx-auto">
        {/* Page Header with Add More button */}
        <div className="mb-8 relative">
          <div className="pr-48">
            <h1 className="text-3xl font-bold" style={{ color: 'var(--foreground)' }}>
              Upload Meal Snapshots
            </h1>
            <p className="mt-2" style={{ color: 'var(--text-muted)' }}>
              Upload ZIP files containing meal snapshots, then match before and after snapshots to create meals.
            </p>
          </div>
          
          {/* Add More Snapshots button (absolutely positioned to prevent layout shift) */}
          {hasExistingSnapshots && (
            <label
              className={`absolute top-0 right-0 inline-flex items-center gap-2 px-5 py-3 rounded-xl border transition-all duration-200 ${
                isUploading ? 'opacity-50 pointer-events-none' : 'cursor-pointer'
              }`}
              style={{
                borderColor: 'var(--card-border)',
                background: 'var(--card-bg)',
              }}
              onMouseEnter={(e) => {
                if (!isUploading) {
                  e.currentTarget.style.background = '#eff6ff';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--card-bg)';
              }}
            >
              <input
                type="file"
                accept=".zip"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleFileUpload(file);
                    e.target.value = '';
                  }
                }}
                className="hidden"
                disabled={isUploading}
              />
              {isUploading ? (
                <Spinner size="sm" />
              ) : (
                <svg
                  className="w-4 h-4"
                  style={{ color: 'var(--accent-primary)' }}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              )}
              <span style={{ color: 'var(--accent-primary)' }} className="font-medium">
                {isUploading ? 'Uploading...' : 'Add More Snapshots'}
              </span>
            </label>
          )}
        </div>

        {/* Feedback Messages */}
        {errorMessage && (
          <AlertMessage
            type="error"
            message={errorMessage}
            onDismiss={() => setErrorMessage(null)}
            className="mb-6"
          />
        )}
        {successMessage && (
          <AlertMessage
            type="success"
            message={successMessage}
            onDismiss={() => setSuccessMessage(null)}
            className="mb-6"
          />
        )}

        {/* Invalid Snapshots Warning (directly below error/success) */}
        {invalidSnapshots.length > 0 && (
          <div
            className="mb-6 p-4 rounded-xl border relative"
            style={{ background: '#fffbeb', borderColor: '#fbbf24' }}
          >
            <button
              onClick={clearInvalidSnapshots}
              className="absolute top-3 right-3 p-1 rounded-lg transition-colors cursor-pointer"
              style={{ color: '#d97706' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#fef3c7')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              aria-label="Dismiss"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <h3 className="font-medium mb-2" style={{ color: '#d97706' }}>
              {invalidSnapshots.length} invalid snapshot{invalidSnapshots.length > 1 ? 's' : ''} skipped.
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

        {/* Upload Zone (only show full zone when no snapshots exist) */}
        {!hasExistingSnapshots && (
          <UploadZone
            onFileSelect={handleFileUpload}
            isUploading={isUploading}
            hasExistingSnapshots={false}
            className="mb-8"
          />
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
                const isDiscarding = discardingIds.has(snapshot.id);

                return (
                  <SnapshotCard
                    key={snapshot.id}
                    snapshot={snapshot}
                    isSelected={isSelected}
                    selectionIndex={selectionIndex}
                    animationDelay={index * 50}
                    onSelect={() => toggleSelection(snapshot.id)}
                    onDiscard={() => handleDiscard(snapshot.id)}
                    isDiscarding={isDiscarding}
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
