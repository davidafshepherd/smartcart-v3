import { create } from 'zustand';
import type { Snapshot, InvalidSnapshot } from '../lib/types';

// =============================================================================
// Type Definitions
// =============================================================================

/**
 * State shape for the upload store.
 */
interface UploadState {
  /** List of successfully uploaded snapshots awaiting meal creation. */
  snapshots: Snapshot[];
  /** List of snapshots that failed validation during the last upload. */
  invalidSnapshots: InvalidSnapshot[];
  /** IDs of currently selected snapshots (max 2 for before/after pairing). */
  selectedIds: number[];
  /** Whether a file upload is currently in progress. */
  isUploading: boolean;
  /** Success message to display to the user. */
  successMessage: string | null;
  /** Error message to display to the user. */
  errorMessage: string | null;
}

/**
 * Actions available on the upload store.
 */
interface UploadActions {
  /**
   * Adds newly uploaded snapshots to the store.
   *
   * @param snapshots - Valid snapshots from the upload.
   * @param invalidSnapshots - Invalid snapshots that failed validation.
   */
  addUpload: (snapshots: Snapshot[], invalidSnapshots: InvalidSnapshot[]) => void;

  /**
   * Removes a snapshot from the store.
   *
   * @param id - The ID of the snapshot to remove.
   */
  removeSnapshot: (id: number) => void;

  /**
   * Retrieves a snapshot by its ID.
   *
   * @param id - The ID of the snapshot to find.
   * @returns The snapshot if found, undefined otherwise.
   */
  getSnapshotById: (id: number) => Snapshot | undefined;

  /**
   * Toggles selection state of a snapshot.
   *
   * @param id - The ID of the snapshot to toggle.
   */
  toggleSelection: (id: number) => void;

  /** Clears all snapshot selections. */
  clearSelection: () => void;

  /** Clears the list of invalid snapshots (dismisses warnings). */
  clearInvalidSnapshots: () => void;

  /**
   * Updates the upload progress state.
   *
   * @param isUploading - Whether an upload is in progress.
   */
  setUploading: (isUploading: boolean) => void;

  /**
   * Sets the success message.
   *
   * @param message - The message to display, or null to clear.
   */
  setSuccessMessage: (message: string | null) => void;

  /**
   * Sets the error message.
   *
   * @param message - The message to display, or null to clear.
   */
  setErrorMessage: (message: string | null) => void;

  /** Resets the entire store to its initial state. */
  clearAll: () => void;
}

// =============================================================================
// Store Implementation
// =============================================================================

/** Maximum number of snapshots that can be selected at once. */
const MAX_SELECTIONS = 2;

/**
 * Zustand store for managing upload-related state.
 *
 * @returns Combined state and actions object.
 */
export const useUploadStore = create<UploadState & UploadActions>((set, get) => ({
  // -------------------------------------------------------------------------
  // Initial State
  // -------------------------------------------------------------------------
  snapshots: [],
  invalidSnapshots: [],
  selectedIds: [],
  isUploading: false,
  successMessage: null,
  errorMessage: null,

  // -------------------------------------------------------------------------
  // Actions
  // -------------------------------------------------------------------------
  addUpload: (newSnapshots, newInvalidSnapshots) =>
    set((state) => ({
      snapshots: [...state.snapshots, ...newSnapshots],
      // Replace invalid snapshots (only show errors from latest upload)
      invalidSnapshots: newInvalidSnapshots,
    })),

  removeSnapshot: (id: number) =>
    set((state) => ({
      snapshots: state.snapshots.filter((s) => s.id !== id),
      selectedIds: state.selectedIds.filter((selectedId) => selectedId !== id),
    })),

  getSnapshotById: (id: number) => {
    return get().snapshots.find((s) => s.id === id);
  },

  toggleSelection: (id: number) =>
    set((state) => {
      const isSelected = state.selectedIds.includes(id);

      // Deselect if already selected.
      if (isSelected) {
        return { selectedIds: state.selectedIds.filter((selectedId) => selectedId !== id) };
      }

      // Replace oldest selection if at limit.
      if (state.selectedIds.length >= MAX_SELECTIONS) {
        return { selectedIds: [state.selectedIds[1], id] };
      }

      // Add to selections.
      return { selectedIds: [...state.selectedIds, id] };
    }),

  clearSelection: () => set({ selectedIds: [] }),

  clearInvalidSnapshots: () => set({ invalidSnapshots: [] }),

  setUploading: (isUploading) => set({ isUploading }),

  setSuccessMessage: (message) => set({ successMessage: message }),

  setErrorMessage: (message) => set({ errorMessage: message }),

  clearAll: () =>
    set({
      snapshots: [],
      invalidSnapshots: [],
      selectedIds: [],
      isUploading: false,
      successMessage: null,
      errorMessage: null,
    }),
}));
