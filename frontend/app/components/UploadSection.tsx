'use client';

import { useCallback, useState, useEffect } from 'react';
import { useUploadStore, getEntryKey, parseEntryKey } from '../store/uploadStore';
import { uploadApi, menuApi, mealsApi, ApiError } from '../lib/api';
import type { MenuItem, MealSnapshot } from '../lib/types';
import { SnapshotCard } from './upload/SnapshotCard';
import { MatchingPanel } from './upload/MatchingPanel';
import { UploadZone } from './upload/UploadZone';
import { AlertMessage } from './ui/AlertMessage';

export default function UploadSection() {
  const {
    entries,
    invalidEntries,
    selectedKeys,
    isUploading,
    addUpload,
    removeEntry,
    getEntryByKey,
    toggleSelection,
    clearSelection,
    clearInvalidEntries,
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
      addUpload(data.upload_id, data.entries, data.invalid_entries);
      setSuccessMessage(`Added ${data.entries.length} snapshot${data.entries.length !== 1 ? 's' : ''}`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }, [addUpload, setUploading]);

  const handleDiscard = async (key: string) => {
    const { uploadId, entryId } = parseEntryKey(key);

    try {
      await uploadApi.discardEntry(uploadId, entryId);
      removeEntry(key);
    } catch (err) {
      console.error('Failed to discard entry:', err);
    }
  };

  const handleMenuItemCreated = (newItem: MenuItem) => {
    setMenuItems([...menuItems, newItem]);
    setSelectedMenuItemId(newItem.id);
  };

  const handleSaveMeal = async () => {
    if (selectedKeys.length !== 2 || !selectedMenuItemId) return;

    const beforeEntry = getEntryByKey(selectedKeys[0]);
    const afterEntry = getEntryByKey(selectedKeys[1]);
    
    if (!beforeEntry || !afterEntry) return;

    setIsSaving(true);
    setError(null);

    try {
      await mealsApi.create(
        beforeEntry.upload_id,
        beforeEntry.id,
        afterEntry.id,
        selectedMenuItemId,
      );

      removeEntry(selectedKeys[0]);
      removeEntry(selectedKeys[1]);
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

  const getSelectedEntry = (index: number): MealSnapshot | null => {
    if (selectedKeys.length <= index) return null;
    return getEntryByKey(selectedKeys[index]) || null;
  };

  const beforeSnapshot = getSelectedEntry(0);
  const afterSnapshot = getSelectedEntry(1);

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
          hasExistingSnapshots={entries.length > 0}
          className="mb-8"
        />

        {/* Invalid Entries Warning */}
        {invalidEntries.length > 0 && (
          <div className="mb-6 p-4 rounded-xl border relative"
            style={{ background: '#fefce8', borderColor: 'var(--warning)' }}>
            <button
              onClick={clearInvalidEntries}
              className="absolute top-3 right-3 p-1 rounded-lg hover:bg-yellow-200 transition-colors"
              style={{ color: 'var(--warning)' }}
              aria-label="Dismiss"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <h3 className="font-medium mb-2" style={{ color: 'var(--warning)' }}>
              {invalidEntries.length} Invalid Snapshot{invalidEntries.length > 1 ? 's' : ''} Skipped
            </h3>
            <ul className="text-sm space-y-1">
              {invalidEntries.map((entry, idx) => (
                <li key={idx} style={{ color: 'var(--text-secondary)' }}>
                  <span className="font-mono">{entry.folder}</span>: {entry.error}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Matching Section */}
        {selectedKeys.length > 0 && (
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
            canSave={selectedKeys.length === 2 && !!selectedMenuItemId}
            className="mb-8"
          />
        )}

        {/* Snapshot Grid */}
        {entries.length > 0 && (
          <div>
            <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--foreground)' }}>
              Available Snapshots ({entries.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {entries.map((entry, index) => {
                const key = getEntryKey(entry);
                const selectionIndex = selectedKeys.indexOf(key);
                const isSelected = selectionIndex !== -1;

                return (
                  <SnapshotCard
                    key={key}
                    snapshot={entry}
                    isSelected={isSelected}
                    selectionIndex={selectionIndex}
                    animationDelay={index * 50}
                    onSelect={() => toggleSelection(key)}
                    onDiscard={() => handleDiscard(key)}
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
