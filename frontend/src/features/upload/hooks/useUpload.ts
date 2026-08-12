import { useCallback, useEffect } from 'react';

import {
  addDiscardingId,
  addMenuItem,
  addUpload,
  clearInvalidSnapshots,
  clearSelection,
  removeDiscardingId,
  removeSnapshot,
  setErrorMessage,
  setMenuItems,
  setSaving,
  setSelectedMenuItemId,
  setSuccessMessage,
  setUploading,
  toggleSelection,
} from '@/features/upload/uploadSlice';
import { ApiError } from '@/services/apiError';
import { mealService } from '@/services/mealService';
import { menuItemService } from '@/services/menuItemService';
import { uploadService } from '@/services/uploadService';
import { useAppDispatch, useAppSelector } from '@/store/hooks';

import type { MenuItem } from '@/types';


export function useUpload() {
  // Retrieve upload state from the Redux store.
  const { 
    snapshots, 
    invalidSnapshots, 
    selectedIds,
    discardingIds,
    menuItems,
    selectedMenuItemId,
    isUploading,
    isSaving,
    successMessage, 
    errorMessage,
  } = useAppSelector(state => state.upload);

  // Redux dispatch function for updating upload state.
  const dispatch = useAppDispatch();


  // Reset upload state and load available menu items on mount.
  useEffect(() => {
    dispatch(clearSelection());
    dispatch(setSuccessMessage(null));
    dispatch(setErrorMessage(null));
    dispatch(clearInvalidSnapshots());

    menuItemService.getAll()
        .then(items => dispatch(setMenuItems(items)))
        .catch(error => console.error("Failed to fetch menu items:", error));
  }, [dispatch]);


  // Find a snapshot by ID from the current upload state.
  const getSnapshotById = useCallback((id: number) => {
    return snapshots.find(snapshot => snapshot.id === id) ?? null;
  }, [snapshots]);

  // Get the currently selected before and after snapshots.
  const beforeSnapshot = selectedIds.length > 0 ? getSnapshotById(selectedIds[0]) : null;
  const afterSnapshot = selectedIds.length > 1 ? getSnapshotById(selectedIds[1]) : null;

  // Whether the staging area already contains snapshots from a previous upload.
  const hasExistingSnapshots = snapshots.length > 0;


  // Upload a ZIP file and update the store with the received snapshots.
  const handleFileUpload = useCallback(async(file: File) => {
    if (isUploading) return;

    dispatch(setUploading(true));
    dispatch(setErrorMessage(null));
    dispatch(setSuccessMessage(null));

    try {
      const data = await uploadService.uploadZip(file);
      dispatch(addUpload({ snapshots: data.meal_snapshots, invalidSnapshots: data.invalid_snapshots }));

      const validCount = data.meal_snapshots.length;
      const invalidCount = data.invalid_snapshots.length;

      if (validCount === 0 && invalidCount > 0) {
        dispatch(setErrorMessage("No valid snapshots found."));
      }
      else if (validCount > 0) {
        dispatch(setSuccessMessage(`Added ${validCount} meal snapshot${validCount !== 1 ? "s" : ""}.`));
      }
    } catch(error) {
      dispatch(setErrorMessage(error instanceof ApiError ? error.message : "Upload failed."));
    } finally {
      dispatch(setUploading(false));
    }
  }, [dispatch, isUploading]);


  // Remove a snapshot from the staging area.
  const handleDiscard = useCallback(async(snapshotId: number) => {
    if (discardingIds.includes(snapshotId)) return;
    dispatch(addDiscardingId(snapshotId));

    try {
      await uploadService.discardSnapshot(snapshotId);
      dispatch(removeSnapshot(snapshotId));
    } catch(error) {
      dispatch(setErrorMessage(error instanceof ApiError ? error.message : "Failed to discard snapshot."));
    } finally {
      dispatch(removeDiscardingId(snapshotId));
    }
  }, [dispatch, discardingIds]);


  // Add a newly created menu item and select it automatically.
  const handleMenuItemCreated = (item: MenuItem) => {
    dispatch(addMenuItem(item));
    dispatch(setSelectedMenuItemId(item.id));
  };


  // Create a meal from the selected before/after snapshots and menu item.
  const handleSaveMeal = useCallback(async () => {
    if (isSaving) return;
    if (selectedIds.length !== 2 || !selectedMenuItemId) return;

    const beforeSnapshot =getSnapshotById(selectedIds[0]);
    const afterSnapshot = getSnapshotById(selectedIds[1]);

    if (!beforeSnapshot || !afterSnapshot) return;

    dispatch(setSaving(true));
    dispatch(setErrorMessage(null));
    dispatch(setSuccessMessage(null));

    try {
      await mealService.create(beforeSnapshot.id, afterSnapshot.id, selectedMenuItemId);

      dispatch(removeSnapshot(beforeSnapshot.id));
      dispatch(removeSnapshot(afterSnapshot.id));
      dispatch(clearSelection());
      dispatch(setSelectedMenuItemId(null));

      dispatch(setSuccessMessage("Meal saved successfully!"));
    } catch(error) {
      dispatch(setErrorMessage(error instanceof ApiError ? error.message : "Failed to save meal."));
    } finally {
      dispatch(setSaving(false));
    }
  }, [dispatch, getSnapshotById, isSaving, selectedIds, selectedMenuItemId]);


  // Dispatch wrappers for simple state updates.
  const handleToggleSelection = useCallback((id: number) => {
    dispatch(toggleSelection(id));
  },[dispatch]);

  const handleClearSelection = useCallback(() => {
    dispatch(clearSelection());
  }, [dispatch]);

  const handleClearInvalidSnapshots = useCallback(() => {
    dispatch(clearInvalidSnapshots());
  }, [dispatch]);

  const handleSetSelectedMenuItemId = useCallback((id: number | null) => {
    dispatch(setSelectedMenuItemId(id));
  }, [dispatch]);

  const handleSetErrorMessage = useCallback((message: string | null) => {
    dispatch(setErrorMessage(message));
  }, [dispatch]);

  const handleSetSuccessMessage = useCallback((message: string | null) => {
    dispatch(setSuccessMessage(message));
  }, [dispatch]);


  // Expose upload state and actions to upload components.
  return {
    // Snapshot state.
    snapshots,
    invalidSnapshots,
    selectedIds,
    discardingIds,

    // Menu state.
    menuItems,
    selectedMenuItemId,

    // UI State.
    isUploading,
    isSaving,
    successMessage,
    errorMessage,

    // Dervied State.
    beforeSnapshot,
    afterSnapshot,
    hasExistingSnapshots,

    // Snapshot actions.
    handleFileUpload,
    handleDiscard,
    handleToggleSelection,
    handleClearSelection,
    handleClearInvalidSnapshots,

    // Menu/Meal actions.
    handleMenuItemCreated,
    handleSetSelectedMenuItemId,
    handleSaveMeal,

    // UI actions.
    handleSetErrorMessage,
    handleSetSuccessMessage,
  };
}
