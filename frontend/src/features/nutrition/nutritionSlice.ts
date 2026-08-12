import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

import type { NutritionQuery, MealNutrition, Patient } from '@/types';


interface ReportEntry {
  key: string;
  nutrition: MealNutrition;
}


interface NutritionState {
  patients: Patient[];
  selectedPatientId: number | null;
  startDate: string;
  endDate: string;
  nutritionQuery: NutritionQuery | null;
  readOnly: boolean;

  reportEntries: ReportEntry[] | null;
  summedNutrition: MealNutrition | null;
  averageNutrition: MealNutrition | null;

  patientsError: string | null;
  fetchMessage: string | null;
  fetchError: boolean;
  isFetching: boolean;

  nutrientKeys: string[];
  selectedNutrient: string;
}


const initialState: NutritionState = {
  patients: [],
  selectedPatientId: null,
  startDate: "",
  endDate: "",
  nutritionQuery: null,
  readOnly: false,
  
  reportEntries: null,
  summedNutrition: null,
  averageNutrition: null,

  patientsError: null,
  fetchMessage: null,
  fetchError: false,
  isFetching: false,

  nutrientKeys: [],
  selectedNutrient: "",
};


// Redux slice containing patient-nutrition-related state and reducers.
const nutritionSlice = createSlice({
  name: "nutrition",
  initialState,
  reducers: {
    // Sets the list of patients.
    setPatients(state, action: PayloadAction<Patient[]>) {
      state.patients = action.payload;
    },

    // Sets the selected patient ID.
    setSelectedPatientId(state, action: PayloadAction<number | null>) {
      state.selectedPatientId = action.payload;
    },

    // Sets the nutrition query start date.
    setStartDate(state, action: PayloadAction<string>) {
      state.startDate = action.payload;
    },

    // Sets the nutrition query end date.
    setEndDate(state, action: PayloadAction<string>) {
      state.endDate = action.payload;
    },

    // Sets the last committed (fetched) nutrition query.
    setNutritionQuery(state, action: PayloadAction<NutritionQuery | null>) {
      state.nutritionQuery = action.payload;
    },

    // Sets whether the query card shows the read-only summary instead of the editable form.
    setReadOnly(state, action: PayloadAction<boolean>) {
      state.readOnly = action.payload;
    },

    // Sets the fetched report entries.
    setReportEntries(state, action: PayloadAction<ReportEntry[] | null>) {
      state.reportEntries = action.payload;
    },

    // Sets the summed nutrition across all fetched entries.
    setSummedNutrition(state, action: PayloadAction<MealNutrition | null>) {
      state.summedNutrition = action.payload;
    },

    // Sets the per-day average nutrition.
    setAverageNutrition(state, action: PayloadAction<MealNutrition | null>) {
      state.averageNutrition = action.payload;
    },

    // Sets the patients fetch error message.
    setPatientsError(state, action: PayloadAction<string | null>) {
      state.patientsError = action.payload;
    },

    // Sets the info / error message shown below the query card.
    setFetchMessage(state, action: PayloadAction<string | null>) {
      state.fetchMessage = action.payload;
    },

    // Sets whether the current fetch message represents an error.
    setFetchError(state, action: PayloadAction<boolean>) {
      state.fetchError = action.payload;
    },

    // Updates the report fetch progress state.
    setIsFetching(state, action: PayloadAction<boolean>) {
      state.isFetching = action.payload;
    },

    // Sets the nutrient keys available in the fetched report, for the chart dropdown.
    setNutrientKeys(state, action: PayloadAction<string[]>) {
      state.nutrientKeys = action.payload;
    },

    // Sets the nutrient currently selected in the chart dropdown.
    setSelectedNutrient(state, action: PayloadAction<string>) {
      state.selectedNutrient = action.payload;
    },

    // Clears the query form and any results.
    clearQuery(state) {
      state.patients =initialState.patients;
      state.selectedPatientId = initialState.selectedPatientId;
      state.startDate = initialState.startDate;
      state.endDate = initialState.endDate;
      state.nutritionQuery = initialState.nutritionQuery;
      state.readOnly = initialState.readOnly;

      state.reportEntries = initialState.reportEntries;
      state.summedNutrition = initialState.summedNutrition;
      state.averageNutrition = initialState.averageNutrition;

      state.fetchMessage = initialState.fetchMessage;
      state.fetchError = initialState.fetchError;
      state.isFetching = initialState.isFetching;

      state.nutrientKeys = initialState.nutrientKeys;
      state.selectedNutrient = initialState.selectedNutrient;
    },
  },
});


// Export actions for dispatching state changes throughout the nutrition feature.
export const {
  setPatients,
  setPatientsError,
  setSelectedPatientId,
  setStartDate,
  setEndDate,
  setReadOnly,
  setNutritionQuery,
  setReportEntries,
  setSummedNutrition,
  setAverageNutrition,
  setIsFetching,
  setFetchMessage,
  setFetchError,
  setNutrientKeys,
  setSelectedNutrient,
  clearQuery,
} = nutritionSlice.actions;


// Export reducer to register this slice with the Redux store.
export default nutritionSlice.reducer;
