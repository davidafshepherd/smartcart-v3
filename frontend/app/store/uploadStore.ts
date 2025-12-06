/**
 * Zustand store for upload state management.
 */

import { create } from 'zustand';
import type { MealSnapshot, InvalidSnapshot } from '../lib/types';

// Helper to create a unique key for an entry
export const getEntryKey = (entry: MealSnapshot): string => 
  `${entry.upload_id}::${entry.id}`;

export const parseEntryKey = (key: string): { uploadId: string; entryId: string } => {
  const [uploadId, entryId] = key.split('::');
  return { uploadId, entryId };
};

interface UploadState {
  entries: MealSnapshot[];
  invalidEntries: InvalidSnapshot[];
  selectedKeys: string[]; // Now stores composite keys
  isUploading: boolean;
}

interface UploadActions {
  addUpload: (uploadId: string, entries: Omit<MealSnapshot, 'upload_id'>[], invalidEntries: InvalidSnapshot[]) => void;
  removeEntry: (key: string) => void;
  getEntryByKey: (key: string) => MealSnapshot | undefined;
  toggleSelection: (key: string) => void;
  clearSelection: () => void;
  clearInvalidEntries: () => void;
  setUploading: (isUploading: boolean) => void;
  clearAll: () => void;
}

export const useUploadStore = create<UploadState & UploadActions>((set, get) => ({
  // State
  entries: [],
  invalidEntries: [],
  selectedKeys: [],
  isUploading: false,

  // Actions
  addUpload: (uploadId, newEntries, newInvalidEntries) =>
    set((state) => ({
      entries: [
        ...state.entries,
        ...newEntries.map((entry) => ({ ...entry, upload_id: uploadId })),
      ],
      invalidEntries: [...state.invalidEntries, ...newInvalidEntries],
    })),

  removeEntry: (key: string) =>
    set((state) => {
      const { uploadId, entryId } = parseEntryKey(key);
      return {
        entries: state.entries.filter(
          (e) => !(e.upload_id === uploadId && e.id === entryId)
        ),
        selectedKeys: state.selectedKeys.filter((k) => k !== key),
      };
    }),

  getEntryByKey: (key: string) => {
    const { uploadId, entryId } = parseEntryKey(key);
    return get().entries.find((e) => e.upload_id === uploadId && e.id === entryId);
  },

  toggleSelection: (key: string) =>
    set((state) => {
      const isSelected = state.selectedKeys.includes(key);

      if (isSelected) {
        return { selectedKeys: state.selectedKeys.filter((k) => k !== key) };
      }

      // Max 2 selections - replace oldest if at limit
      if (state.selectedKeys.length >= 2) {
        return { selectedKeys: [state.selectedKeys[1], key] };
      }

      return { selectedKeys: [...state.selectedKeys, key] };
    }),

  clearSelection: () => set({ selectedKeys: [] }),

  clearInvalidEntries: () => set({ invalidEntries: [] }),

  setUploading: (isUploading) => set({ isUploading }),

  clearAll: () =>
    set({
      entries: [],
      invalidEntries: [],
      selectedKeys: [],
      isUploading: false,
    }),
}));
