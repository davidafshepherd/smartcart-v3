'use client';

import { useCallback, useState, useEffect } from 'react';
import { useUploadStore } from '../store/uploadStore';
import { uploadApi, menuApi, mealsApi, ApiError } from '../lib/api';
import type { MenuItem, Snapshot } from '../lib/types';
import { SnapshotCard } from './upload/SnapshotCard';
import { MatchingPanel } from './upload/MatchingPanel';
import { UploadZone } from './upload/UploadZone';
import { AlertMessage } from './ui/AlertMessage';

export default function UploadSection() {
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

  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedMenuItemId, setSelectedMenuItemId] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fetch menu items on mount
  useEffect(() => {
    menuApi.getAll()
      .then(setMenuItems)
      .catch((err) => console.error('Failed to fetch menu items:', err));
  }, []);

  const handleFileUpload = useCallback(async (file: File) => {
    setUploading(true);
    setError(null);

    try {
      const data = await uploadApi.uploadZip(file);
      addUpload(data.snapshots, data.invalid_snapshots);
      setSuccessMessage(`Added ${data.snapshots.length} snapshot${data.snapshots.length !== 1 ? 's' : ''}`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }, [addUpload, setUploading]);

  const handleDiscard = async (snapshotId: number) => {
    try {
      await uploadApi.discardSnapshot(snapshotId);
      removeSnapshot(snapshotId);
    } catch (err) {
      console.error('Failed to discard snapshot:', err);
    }
  };

  const handleMenuItemCreated = (newItem: MenuItem) => {
    setMenuItems([...menuItems, newItem]);
    setSelectedMenuItemId(newItem.id);
  };

  const handleSaveMeal = async () => {
    if (selectedIds.length !== 2 || !selectedMenuItemId) return;

    const beforeSnapshot = getSnapshotById(selectedIds[0]);
    const afterSnapshot = getSnapshotById(selectedIds[1]);
    
    if (!beforeSnapshot || !afterSnapshot) return;

    setIsSaving(true);
    setError(null);

    try {
      await mealsApi.create(
        beforeSnapshot.id,
        afterSnapshot.id,
        selectedMenuItemId,
      );

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

  const getSelectedSnapshot = (index: number): Snapshot | null => {
    if (selectedIds.length <= index) return null;
    return getSnapshotById(selectedIds[index]) || null;
  };

  const beforeSnapshot = getSelectedSnapshot(0);
  const afterSnapshot = getSelectedSnapshot(1);

  return (
    <div className="p-8 animate-fade-in">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--foreground)' }}>
            Upload Meal Snapshots
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>
            Upload ZIP files containing meal snapshot folders, then match before and after snapshots to create meals.
          </p>
        </div>

        {/* Messages */}
        {error && <AlertMessage type="error" message={error} className="mb-6" />}
        {successMessage && <AlertMessage type="success" message={successMessage} className="mb-6" />}

        {/* Upload Zone - Always visible */}
        <UploadZone
          onFileSelect={handleFileUpload}
          isUploading={isUploading}
          hasExistingSnapshots={snapshots.length > 0}
          className="mb-8"
        />

        {/* Invalid Snapshots Warning */}
        {invalidSnapshots.length > 0 && (
          <div className="mb-6 p-4 rounded-xl border relative"
            style={{ background: '#fefce8', borderColor: 'var(--warning)' }}>
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

        {/* Matching Section */}
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
