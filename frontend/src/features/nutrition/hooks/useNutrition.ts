import { useEffect } from 'react';

import {
  clearQuery,
  setAverageNutrition,
  setEndDate,
  setFetchError,
  setFetchMessage,
  setIsFetching,
  setNutrientKeys,
  setNutritionQuery,
  setPatients,
  setPatientsError,
  setReadOnly,
  setReportEntries,
  setSelectedNutrient,
  setSelectedPatientId,
  setStartDate,
  setSummedNutrition,
} from '@/features/nutrition/nutritionSlice';
import { ApiError } from '@/services/apiError';
import { nutritionService } from '@/services/nutritionService';
import { patientService } from '@/services/patientService';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { parseDateKey } from '@/utils/date';
import { averagePerDay, sumMealNutrition } from '@/utils/nutrition';


export function useNutrition() {
  // Retrieve nutrition state from the Redux store.
  const state = useAppSelector(s => s.nutrition);

  // Redux dispatch function for updating nutrition state.
  const dispatch = useAppDispatch();


  // Clear the query and results when navigating away from the Nutrition page.
  useEffect(() => {
    return () => {
      dispatch(clearQuery());
    };
  }, [dispatch]);


  // Load patients on mount.
  useEffect(() => {
    async function loadPatients() {
      try {
        const data = await patientService.getAll();
        dispatch(setPatients(data));
        dispatch(setPatientsError(null));
      } catch (err) {
        dispatch(setPatientsError(err instanceof ApiError ? err.message : "Failed to load patients."));
      }
    }
    loadPatients();
  }, [dispatch]);


  // Allow the fetch button whenever the dates are both set and are in order.
  const isDateRangeValid = !state.startDate 
    || !state.endDate 
    || new Date(state.startDate) <= new Date(state.endDate);


  // Whether the form still matches the last committed query.
  const isQueryUnchanged = !!state.nutritionQuery
    && state.nutritionQuery.patientId === state.selectedPatientId
    && state.nutritionQuery.start === state.startDate
    && state.nutritionQuery.end === state.endDate;


  // Chart data for the selected nutrient.
  const xLabels = state.reportEntries?.map(e => e.key) ?? [];
  const yValues = state.reportEntries?.map(e => {
    const val = (e.nutrition as unknown as Record<string, unknown>)[state.selectedNutrient];
    return typeof val === "number" ? val : 0;
  }) ?? [];


  // Fetches nutrition data for the selected patient and date range, resetting prior results first.
  const handleFetch = async () => {
    const { selectedPatientId, startDate, endDate } = state;
    if (!selectedPatientId || !startDate || !endDate) return;

    dispatch(setFetchMessage(null));
    dispatch(setFetchError(false));
    dispatch(setReportEntries(null));
    dispatch(setSummedNutrition(null));
    dispatch(setAverageNutrition(null));
    dispatch(setNutrientKeys([]));
    dispatch(setSelectedNutrient(""));
    dispatch(setIsFetching(true));

    if (new Date(endDate) < new Date(startDate)) {
      dispatch(setFetchMessage("Invalid date range, end date cannot be before start date."));
      dispatch(setFetchError(true));
      dispatch(setIsFetching(false));
      return;
    }

    try {
      const response = await nutritionService.getPatientReport(
        selectedPatientId, 
        new Date(startDate), 
        new Date(endDate),
      );
      const dateKeys = response ? Object.keys(response) : [];

      if (!response || dateKeys.length === 0) {
        dispatch(setFetchMessage("No nutrition data for requested patient or period!"));
        return;
      }

      const entries = dateKeys.map(key => ({ key, nutrition: response[key].meal_nutrition }));
      const summed = sumMealNutrition(entries.map(e => e.nutrition));
      const uniqueDays = new Set(dateKeys.map(k => parseDateKey(k)?.toISOString())).size;

      dispatch(setReportEntries(entries));
      dispatch(setSummedNutrition(summed));
      dispatch(setAverageNutrition(averagePerDay(summed, uniqueDays)));
      dispatch(setNutrientKeys(Object.keys(entries[0].nutrition)));
      dispatch(setSelectedNutrient("kcal"));
      dispatch(setReadOnly(true));
      dispatch(setNutritionQuery({ patientId: selectedPatientId, start: startDate, end: endDate }));
    } catch (err) {
      dispatch(setFetchMessage(err instanceof ApiError ? err.message : "Failed to fetch nutrition data. Please try again."));
      dispatch(setFetchError(true));
    } finally {
      dispatch(setIsFetching(false));
    }
  };


  // Dispatch wrappers for simple state updates.
  const handleSetSelectedPatientId = (id: number | null) => {
    dispatch(setSelectedPatientId(id));
  }

  const handleSetStartDate = (date: string) => {
    dispatch(setStartDate(date));
  }

  const handleSetEndDate = (date: string) => {
    dispatch(setEndDate(date));
  }

  const handleEditQuery = () => {
    dispatch(setReadOnly(false));
  }

  const handleCancelEdit = () => {
    if (state.nutritionQuery) {
      dispatch(setSelectedPatientId(state.nutritionQuery.patientId));
      dispatch(setStartDate(state.nutritionQuery.start));
      dispatch(setEndDate(state.nutritionQuery.end));
    }
    dispatch(setReadOnly(true));
  };

  const handleSetSelectedNutrient = (key: string) => {
    dispatch(setSelectedNutrient(key));
  }


  return {
    // Query state.
    patients: state.patients,
    selectedPatientId: state.selectedPatientId,
    startDate: state.startDate,
    endDate: state.endDate,
    nutritionQuery: state.nutritionQuery,
    readOnly: state.readOnly,

    // Fetch state.
    reportEntries: state.reportEntries,
    summedNutrition: state.summedNutrition,
    averageNutrition: state.averageNutrition,

    // UI state.
    patientsError: state.patientsError,
    fetchMessage: state.fetchMessage,
    fetchError: state.fetchError,
    isDateRangeValid: isDateRangeValid,
    isQueryUnchanged: isQueryUnchanged,
    isFetching: state.isFetching,

    // Chart state.
    nutrientKeys: state.nutrientKeys,
    selectedNutrient: state.selectedNutrient,
    xLabels: xLabels,
    yValues: yValues,

    // Query actions.
    handleSetSelectedPatientId,
    handleSetStartDate,
    handleSetEndDate,
    handleEditQuery,
    handleCancelEdit,

    // Fetch / Chart actions.
    handleFetch,
    handleSetSelectedNutrient,
  };
}
