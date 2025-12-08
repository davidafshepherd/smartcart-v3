/**
 * Zustand store for upload state management.
 */

import { create } from 'zustand';
import type { Snapshot, InvalidSnapshot } from '../lib/types';

interface UploadState {
  snapshots: Snapshot[];
  invalidSnapshots: InvalidSnapshot[];
  selectedIds: number[]; // Snapshot IDs
  isUploading: boolean;
}

interface UploadActions {
  addUpload: (snapshots: Snapshot[], invalidSnapshots: InvalidSnapshot[]) => void;
  removeSnapshot: (id: number) => void;
  getSnapshotById: (id: number) => Snapshot | undefined;
  toggleSelection: (id: number) => void;
  clearSelection: () => void;
  clearInvalidSnapshots: () => void;
  setUploading: (isUploading: boolean) => void;
  clearAll: () => void;
}

export const useUploadStore = create<UploadState & UploadActions>((set, get) => ({
  // State
  snapshots: [],
  invalidSnapshots: [],
  selectedIds: [],
  isUploading: false,

  // Actions
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

      if (isSelected) {
        return { selectedIds: state.selectedIds.filter((selectedId) => selectedId !== id) };
      }

      // Max 2 selections - replace oldest if at limit
      if (state.selectedIds.length >= 2) {
        return { selectedIds: [state.selectedIds[1], id] };
      }

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
