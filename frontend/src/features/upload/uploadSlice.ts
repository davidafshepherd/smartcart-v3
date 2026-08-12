import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

import type { InvalidSnapshot, MenuItem, Snapshot } from '@/types';


interface UploadState {
  snapshots: Snapshot[];
  invalidSnapshots: InvalidSnapshot[];
  selectedIds: number[];
  discardingIds: number[];
  menuItems: MenuItem[];
  selectedMenuItemId: number | null;
  isUploading: boolean;
  isSaving: boolean;
  successMessage: string | null;
  errorMessage: string | null;
}


interface AddUploadPayload {
  snapshots: Snapshot[];
  invalidSnapshots: InvalidSnapshot[];
};


const initialState: UploadState = {
  snapshots: [],
  invalidSnapshots: [],
  selectedIds: [],
  discardingIds: [],
  menuItems: [],
  selectedMenuItemId: null,
  isUploading: false,
  isSaving: false,
  successMessage: null,
  errorMessage: null,
};


// Redux slice containing upload-related state and reducers.
const uploadSlice = createSlice({
  name: "upload",
  initialState,
  reducers: {
    // Adds newly uploaded snapshots to the store.
    addUpload(state, action: PayloadAction<AddUploadPayload>) {
      state.snapshots.push(...action.payload.snapshots);
      state.invalidSnapshots = action.payload.invalidSnapshots;
    },

    // Removes a snapshot from the store.
    removeSnapshot(state, action: PayloadAction<number>) {
      state.snapshots = state.snapshots.filter(snapshot => snapshot.id !== action.payload);
      state.selectedIds = state.selectedIds.filter(id => id !== action.payload);
    },

    // Toggles selection state of a snapshot.
    toggleSelection(state, action: PayloadAction<number>) {
      const id = action.payload;
      if(state.selectedIds.includes(id)) {
        state.selectedIds = state.selectedIds.filter(selectedId => selectedId !== id);
        return;
      }
      if(state.selectedIds.length < 2) {
        state.selectedIds.push(id);
      }
    },

    // Clears all snapshot selections.
    clearSelection(state) {
      state.selectedIds = [];
    },

    // Clears the list of invalid snapshots (dismisses warnings).
    clearInvalidSnapshots(state) {
      state.invalidSnapshots = [];
    },

    // Marks a snapshot as being discarded.
    addDiscardingId(state, action: PayloadAction<number>) {
      if (!state.discardingIds.includes(action.payload)) {
        state.discardingIds.push(action.payload);
      }
    },

    // Unmarks a snapshot as being discarded.
    removeDiscardingId(state, action: PayloadAction<number>) {
      state.discardingIds = state.discardingIds.filter(id => id !== action.payload,);
    },

    // Sets the list of available menu items.
    setMenuItems(state, action: PayloadAction<MenuItem[]>) {
      state.menuItems = action.payload;
    },

    // Appends a newly created menu item to the list.
    addMenuItem(state, action: PayloadAction<MenuItem>) {
      state.menuItems.push(action.payload);
    },

    // Sets the selected menu item for the meal being saved.
    setSelectedMenuItemId(state, action: PayloadAction<number | null>) {
      state.selectedMenuItemId = action.payload;
    },

    // Updates the upload progress state.
    setUploading(state, action: PayloadAction<boolean>) {
      state.isUploading = action.payload;
    },

    // Updates the save progress state.
    setSaving(state, action: PayloadAction<boolean>) {
      state.isSaving = action.payload;
    },

    // Sets the success message.
    setSuccessMessage(state, action: PayloadAction<string | null>) {
      state.successMessage = action.payload;
    },
    
    // Sets the error message.
    setErrorMessage(state, action: PayloadAction<string | null>) {
      state.errorMessage = action.payload;
    },
  },
});


// Export actions for dispatching state changes throughout the upload feature.
export const {
  addUpload,
  removeSnapshot,
  toggleSelection,
  clearSelection,
  clearInvalidSnapshots,
  addDiscardingId,
  removeDiscardingId,
  setMenuItems,
  addMenuItem,
  setSelectedMenuItemId,
  setUploading,
  setSaving,
  setSuccessMessage,
  setErrorMessage,
} = uploadSlice.actions;


// Export reducer to register this slice with the Redux store.
export default uploadSlice.reducer;
