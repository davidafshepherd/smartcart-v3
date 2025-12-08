/**
 * @fileoverview Zustand store for upload state management.
 *
 * Manages the state of uploaded meal snapshots during the meal creation
 * workflow. This includes tracking uploaded snapshots, invalid entries,
 * user selections, and upload progress.
 *
 * The store uses Zustand for lightweight, hook-based state management
 * without the boilerplate of Redux.
 *
 * @example
 * ```typescript
 * import { useUploadStore } from '../store/uploadStore';
 *
 * function MyComponent() {
 *   const { snapshots, toggleSelection } = useUploadStore();
 *
 *   return (
 *     <div>
 *       {snapshots.map((s) => (
 *         <button key={s.id} onClick={() => toggleSelection(s.id)}>
 *           {s.folder}
 *         </button>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */

import { create } from 'zustand';
import type { Snapshot, InvalidSnapshot } from '../lib/types';

// =============================================================================
// Type Definitions
// =============================================================================

/**
 * State shape for the upload store.
 *
 * Contains all data related to the current upload session, including
 * snapshots awaiting meal creation and user selections.
 */
interface UploadState {
  /** List of successfully uploaded snapshots awaiting meal creation. */
  snapshots: Snapshot[];
  /** List of snapshots that failed validation during upload. */
  invalidSnapshots: InvalidSnapshot[];
  /** IDs of currently selected snapshots (max 2 for before/after pairing). */
  selectedIds: number[];
  /** Whether a file upload is currently in progress. */
  isUploading: boolean;
}

/**
 * Actions available on the upload store.
 *
 * These methods modify the store state and should be used via the
 * useUploadStore hook.
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
   * Also clears the snapshot from selections if it was selected.
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
   * If already selected, deselects it. If not selected and fewer than
   * 2 snapshots are selected, adds it to selections. If 2 are already
   * selected, replaces the oldest selection with the new one.
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
 * Provides a centralized state container for the upload workflow,
 * accessible via the useUploadStore hook.
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

  // -------------------------------------------------------------------------
  // Actions
  // -------------------------------------------------------------------------
  addUpload: (newSnapshots, newInvalidSnapshots) =>
    set((state) => ({
      snapshots: [...state.snapshots, ...newSnapshots],
      invalidSnapshots: [...state.invalidSnapshots, ...newInvalidSnapshots],
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

  clearAll: () =>
    set({
      snapshots: [],
      invalidSnapshots: [],
      selectedIds: [],
      isUploading: false,
    }),
}));
