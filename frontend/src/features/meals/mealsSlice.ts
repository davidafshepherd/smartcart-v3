import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

import type { Meal, Meals, MenuItem, Patient } from '@/types';


export type ViewMode = 'view' | 'analyse' | 'nutrition' | null;


interface ContextMenuState {
  meal: Meal;
  x: number;
  y: number;
}


interface MealsState {
  meals: Meals;
  patients: Patient[];
  menuItems: MenuItem[];

  expandedPatients: string[];
  expandedDates: string[];

  contextMenu: ContextMenuState | null;
  selectedMeal: Meal | null;
  viewMode: ViewMode;
  viewNonce: number;

  loading: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  mealsError: string | null;
  patientsError: string | null;
  menuItemsError: string | null;
  updateError: string | null;
}


const initialState: MealsState = {
  meals: {},
  patients: [],
  menuItems: [],

  expandedPatients: [],
  expandedDates: [],

  contextMenu: null,
  selectedMeal: null,
  viewMode: null,
  viewNonce: 0,

  loading: false,
  isUpdating: false,
  isDeleting: false,
  mealsError: null,
  patientsError: null,
  menuItemsError: null,
  updateError: null,
};


// Redux slice containing meal-related state and reducers.
const mealsSlice = createSlice({
  name: "meals",
  initialState,
  reducers: {
    // Sets the meals data.
    setMeals(state, action: PayloadAction<Meals>) {
      state.meals = action.payload;
    },

    // Sets the list of patients.
    setPatients(state, action: PayloadAction<Patient[]>) {
      state.patients = action.payload;
    },

    // Sets the list of menu items.
    setMenuItems(state, action: PayloadAction<MenuItem[]>) {
      state.menuItems = action.payload;
    },

    // Toggles a patient node open or closed in the meals tree.
    togglePatientExpansion(state, action: PayloadAction<string>) {
      const id = action.payload;
      if (state.expandedPatients.includes(id)) {
        state.expandedPatients = state.expandedPatients.filter(item => item !== id);
      } else {
        state.expandedPatients.push(id);
      }
    },

    // Toggles a date node open or closed in the meals tree.
    toggleDateExpansion(state, action: PayloadAction<string>) {
      const date = action.payload;
      if (state.expandedDates.includes(date)) {
        state.expandedDates = state.expandedDates.filter(item => item !== date);
      } else {
        state.expandedDates.push(date);
      }
    },

    // Replaces the expanded patients list (used for bulk updates).
    setExpandedPatients(state, action: PayloadAction<string[]>) {
      state.expandedPatients = action.payload;
    },

    // Replaces the expanded dates list (used for bulk updates).
    setExpandedDates(state, action: PayloadAction<string[]>) {
      state.expandedDates = action.payload;
    },

    // Sets the context menu state.
    setContextMenu(state, action: PayloadAction<ContextMenuState | null>) {
      state.contextMenu = action.payload;
    },

    // Sets the currently selected meal.
    setSelectedMeal(state, action: PayloadAction<Meal | null>) {
      state.selectedMeal = action.payload;
    },

    // Sets the active view mode.
    setViewMode(state, action: PayloadAction<ViewMode>) {
      state.viewMode = action.payload;
    },

    // Bumps the view nonce, forcing the right-panel content to remount.
    bumpViewNonce(state) {
      state.viewNonce += 1;
    },

    // Clears the selected meal and view mode.
    clearSelection(state) {
      state.selectedMeal = null;
      state.viewMode = null;
    },

    // Collapses the meals tree.
    resetTree(state) {
      state.expandedPatients = initialState.expandedPatients;
      state.expandedDates = initialState.expandedDates;
    },

    // Updates the load progress state.
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },

    // Updates the update progress state.
    setUpdating(state, action: PayloadAction<boolean>) {
      state.isUpdating = action.payload;
    },

    // Updates the delete progress state.
    setDeleting(state, action: PayloadAction<boolean>) {
      state.isDeleting = action.payload;
    },

    // Sets the meals fetch error message.
    setMealsError(state, action: PayloadAction<string | null>) {
      state.mealsError = action.payload;
    },

    // Sets the patients fetch error message.
    setPatientsError(state, action: PayloadAction<string | null>) {
      state.patientsError = action.payload;
    },

    // Sets the menu items fetch error message.
    setMenuItemsError(state, action: PayloadAction<string | null>) {
      state.menuItemsError = action.payload;
    },

    // Sets the update error message.
    setUpdateError(state, action: PayloadAction<string | null>) {
      state.updateError = action.payload;
    },
  },
});


// Export actions for dispatching state changes throughout the upload feature.
export const {
  setMeals,
  setPatients,
  setMenuItems,
  togglePatientExpansion,
  toggleDateExpansion,
  setExpandedPatients,
  setExpandedDates,
  setContextMenu,
  setSelectedMeal,
  setViewMode,
  bumpViewNonce,
  clearSelection,
  resetTree,
  setLoading,
  setUpdating,
  setDeleting,
  setMealsError,
  setPatientsError,
  setMenuItemsError,
  setUpdateError,
} = mealsSlice.actions;


// Export reducer to register this slice with the Redux store.
export default mealsSlice.reducer;
