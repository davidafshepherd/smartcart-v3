import { useEffect, useLayoutEffect, useRef } from 'react';

import {
  bumpViewNonce,
  clearSelection,
  resetTree,
  setContextMenu,
  setDeleting,
  setExpandedDates,
  setExpandedPatients,
  setLoading,
  setMenuItems,
  setMenuItemsError,
  setMeals,
  setMealsError,
  setPatients,
  setPatientsError,
  setSelectedMeal,
  setUpdateError,
  setUpdating,
  setViewMode,
  toggleDateExpansion,
  togglePatientExpansion,
} from '@/features/meals/mealsSlice';
import { ApiError } from '@/services/apiError';
import { mealService } from '@/services/mealService';
import { menuItemService } from '@/services/menuItemService';
import { patientService } from '@/services/patientService';
import { useAppDispatch, useAppSelector } from '@/store/hooks';

import type { Meal, Meals } from '@/types';


export function useMeals() {
  // Retrieve meals state from the Redux store.
  const state = useAppSelector(s => s.meals);

  // Redux dispatch function for updating meals state.
  const dispatch = useAppDispatch();


  // Always-fresh reference to avoid stale closures in effects and handlers
  const stateRef = useRef(state);
  useLayoutEffect(() => { stateRef.current = state; });

  // Refs for tracking the last auto-expanded meal and the closing state.
  const lastExpandedMealRef = useRef<{ id: number; patientId: number; date: string } | null>(null);
  const isClosingRef = useRef(false);


  // Clear the selected meal and collapse the tree when navigating away from the Meals page.
  useEffect(() => {
    return () => {
      dispatch(clearSelection());
      dispatch(resetTree());
    };
  }, [dispatch]);


  // Fetch all required data from the API.
  useEffect(() => {
    let cancelled = false;

    async function load() {
      dispatch(setLoading(true));

      const [mealsResult, patientsResult, menuItemsResult] = await Promise.allSettled([
        mealService.getAll(),
        patientService.getAll(),
        menuItemService.getAll(),
      ]);

      if (cancelled) return;

      const toMessage = (err: unknown, fallback: string) => {
        if (err instanceof ApiError && err.status === 0) {
          return "Unable to reach the server. Please check your connection.";
        } else {
          return fallback;
        }
      };

      if (mealsResult.status === "fulfilled") {
        dispatch(setMeals(mealsResult.value));
        dispatch(setMealsError(null));
      } else {
        dispatch(setMeals({}));
        dispatch(setMealsError(toMessage(mealsResult.reason, "Failed to load meals")));
      }

      if (patientsResult.status === "fulfilled") {
        dispatch(setPatients(patientsResult.value));
        dispatch(setPatientsError(null));
      } else {
        dispatch(setPatients([]));
        dispatch(setPatientsError(toMessage(patientsResult.reason, "Failed to load patients")));
      }

      if (menuItemsResult.status === "fulfilled") {
        dispatch(setMenuItems(menuItemsResult.value));
        dispatch(setMenuItemsError(null));
      } else {
        dispatch(setMenuItems([]));
        dispatch(setMenuItemsError(toMessage(menuItemsResult.reason, "Failed to load menu items")));
      }

      dispatch(setLoading(false));
    }
    load();
    return () => { cancelled = true; };
  }, [dispatch]);


  // Auto-expand the patient and date nodes when a meal is selected.
  useEffect(() => {
    const { selectedMeal, viewMode, expandedPatients, expandedDates } = stateRef.current;
    if (!selectedMeal || viewMode === null) return;

    const patientId = selectedMeal.patient.id.toString();
    const dateKey = `${patientId}-${selectedMeal.date}`;
    const last = lastExpandedMealRef.current;

    if (
      !last || 
      last.id !== selectedMeal.id || 
      last.patientId !== selectedMeal.patient.id || 
      last.date !== selectedMeal.date
    ) {
      if (!expandedPatients.includes(patientId)) {
        dispatch(setExpandedPatients([...expandedPatients, patientId]));
      }
      if (!expandedDates.includes(dateKey)) {
        dispatch(setExpandedDates([...expandedDates, dateKey]));
      }

      lastExpandedMealRef.current = {
        id: selectedMeal.id,
        patientId: selectedMeal.patient.id,
        date: selectedMeal.date,
      };
    }
  }, [dispatch, state.selectedMeal?.id, state.selectedMeal?.patient.id, state.selectedMeal?.date, state.viewMode]);


  // Refresh meals and re-sync the selected meal after a nutrition report is saved.
  useEffect(() => {
    const handler = async () => {
      try {
        const updatedMeals = await mealService.getAll();
        dispatch(setMeals(updatedMeals));

        if (isClosingRef.current) return;

        const { selectedMeal, viewMode } = stateRef.current;
        if (!selectedMeal || viewMode === null) return;

        const meal = findInMeals(updatedMeals, selectedMeal.id);
        if (meal) dispatch(setSelectedMeal(meal));
      } catch (err) {
        console.error("Failed to refresh meals after nutrition report save:", err);
      }
    };
    window.addEventListener("nutrition-report-saved", handler);
    return () => window.removeEventListener("nutrition-report-saved", handler);
  }, [dispatch]);


  // Refreshes the meals list without updating loading state.
  const fetchMeals = async () => {
    try {
      dispatch(setMeals(await mealService.getAll()));
    } catch (err) {
      if (err instanceof ApiError && err.status === 0) {
        dispatch(setMealsError("Unable to reach the server. Please check your connection."));
      }
    }
  };


  // Finds a meal by ID in the nested meals structure.
  function findInMeals(meals: Meals, id: number): Meal | null {
    for (const patientMeals of Object.values(meals)) {
      for (const dateMeals of Object.values(patientMeals)) {
        for (const meal of Object.values(dateMeals)) {
          if (meal.id === id) return meal;
        }
      }
    }
    return null;
  }


  // Deletes a meal and clears the selection on success.
  const handleDeleteMeal = async (mealId: number) => {
    if (stateRef.current.isDeleting) return;
    
    dispatch(setDeleting(true));

    try {
      await mealService.delete(mealId);
      dispatch(clearSelection());
      await fetchMeals();
    } catch (err) {
      console.error("Failed to delete meal:", err);
    } finally {
      dispatch(setDeleting(false));
    }
  };


  // Updates a meal's patient or menu item, expanding the new patient node if it changed.
  const handleUpdateMeal = async (mealId: number, patientId?: number, menuItemId?: number) => {
    if (stateRef.current.isUpdating) return;

    const { selectedMeal } = stateRef.current;
    const isPatientChanging = patientId !== undefined && patientId !== selectedMeal?.patient.id;

    dispatch(setUpdating(true));
    dispatch(setUpdateError(null));

    try {
      const updatedMeal = await mealService.update(mealId, patientId, menuItemId);

      if (isPatientChanging && updatedMeal) {
        const { expandedPatients, expandedDates } = stateRef.current;
        const newPatientId = updatedMeal.patient.id.toString();
        const dateKey = `${newPatientId}-${updatedMeal.date}`;

        if (!expandedPatients.includes(newPatientId)) {
          dispatch(setExpandedPatients([...expandedPatients, newPatientId]));
        }
        if (!expandedDates.includes(dateKey)) {
          dispatch(setExpandedDates([...expandedDates, dateKey]));
        }
      }

      dispatch(setSelectedMeal(updatedMeal));
      fetchMeals();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Failed to update meal";
      dispatch(setUpdateError(message));
      setTimeout(() => dispatch(setUpdateError(null)), 5000);
    } finally {
      dispatch(setUpdating(false));
    }
  };


  // Refreshes all data after a mutation, re-syncing the selected meal to the fresh data.
  const handleDataChange = async (patientIdChange?: { oldId: number; newId: number }) => {
    if (patientIdChange) migratePatientExpansion(patientIdChange.oldId, patientIdChange.newId);

    const [mealsResult, patientsResult, menuItemsResult] = await Promise.allSettled([
      mealService.getAll(),
      patientService.getAll(),
      menuItemService.getAll(),
    ]);

    const toMessage = (err: unknown, fallback: string) => {
      if (err instanceof ApiError && err.status === 0) {
        return "Unable to reach the server. Please check your connection.";
      } else {
        return fallback;
      }
    }

    if (mealsResult.status === "fulfilled") {
      dispatch(setMeals(mealsResult.value));
      dispatch(setMealsError(null));
      const { selectedMeal } = stateRef.current;
      if (selectedMeal) dispatch(setSelectedMeal(findInMeals(mealsResult.value, selectedMeal.id)));
    } else {
      dispatch(setMealsError(toMessage(mealsResult.reason, "Failed to load meals")));
    }

    if (patientsResult.status === "fulfilled") {
      dispatch(setPatients(patientsResult.value));
      dispatch(setPatientsError(null));
    } else {
      dispatch(setPatientsError(toMessage(patientsResult.reason, "Failed to load patients")));
    }

    if (menuItemsResult.status === "fulfilled") {
      dispatch(setMenuItems(menuItemsResult.value));
      dispatch(setMenuItemsError(null));
    } else {
      dispatch(setMenuItemsError(toMessage(menuItemsResult.reason, "Failed to load menu items")));
    }
  };

  
  // Migrate tree expansion keys when a patient ID changes.
  const migratePatientExpansion = (oldId: number, newId: number) => {
    const oldStr = String(oldId);
    const newStr = String(newId);

    const { expandedPatients, expandedDates } = stateRef.current;
    dispatch(setExpandedPatients(
      expandedPatients.includes(oldStr) 
        ? [...expandedPatients.filter(id => id !== oldStr), newStr] 
        : expandedPatients
    ));   
    dispatch(setExpandedDates(
      expandedDates.map(key =>
        key.startsWith(`${oldStr}-`) ? key.replace(`${oldStr}-`, `${newStr}-`) : key,
      )
    ));
  };


  // Toggles a patient node; collapses its dates and clears the selection if it was open.
  const togglePatient = (patientId: string) => {
    const { expandedPatients, expandedDates, selectedMeal } = stateRef.current;
    const isExpanded = expandedPatients.includes(patientId);

    dispatch(togglePatientExpansion(patientId));

    if (isExpanded) {
      dispatch(setExpandedDates(expandedDates.filter(key => !key.startsWith(`${patientId}-`))));
      if (selectedMeal && selectedMeal.patient.id.toString() === patientId) {
        dispatch(clearSelection());
        dispatch(setContextMenu(null));
      }
    }
  };


  // Toggles a date node; clears the selection if the selected meal was in that date.
  const toggleDate = (key: string) => {
    const { expandedDates, selectedMeal } = stateRef.current;
    const isExpanded = expandedDates.includes(key);

    dispatch(toggleDateExpansion(key));

    if (isExpanded && selectedMeal) {
      const dash = key.indexOf('-');
      if (dash !== -1) {
        const patientId = key.substring(0, dash);
        const date = key.substring(dash + 1);

        if (selectedMeal.patient.id.toString() === patientId && selectedMeal.date === date) {
          dispatch(clearSelection());
          dispatch(setContextMenu(null));
        }
      }
    }
  };


  // Meal selection and view handlers.
  const handleContextMenu = (menu: { meal: Meal; x: number; y: number } | null) => {
    dispatch(setContextMenu(menu));
  };

  const handleMealClick = (meal: Meal, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    dispatch(setContextMenu({ meal, x: event.clientX, y: event.clientY }));
  };

  const handleViewMeal = (meal: Meal) => {
    dispatch(setSelectedMeal(meal));
    dispatch(setViewMode("view"));
    dispatch(setContextMenu(null));
    dispatch(bumpViewNonce());
  };

  const handleAnalyseMeal = (meal: Meal) => {
    dispatch(setSelectedMeal(meal));
    dispatch(setViewMode("analyse"));
    dispatch(setContextMenu(null));
    dispatch(bumpViewNonce());
  };

  const handleViewNutritionReport = (meal: Meal) => {
    dispatch(setSelectedMeal(meal));
    dispatch(setViewMode("nutrition"));
    dispatch(setContextMenu(null));
    dispatch(bumpViewNonce());
  };

  const closeMealView = () => {
    isClosingRef.current = true;
    dispatch(clearSelection());
    setTimeout(() => { isClosingRef.current = false; }, 100);
  };


  // Expose meals state and actions to meals components.
  return {
    // Data state.
    meals: state.meals,
    patients: state.patients,
    menuItems: state.menuItems,

    // Tree state.
    expandedPatients: state.expandedPatients,
    expandedDates: state.expandedDates,

    // Selection state.
    contextMenu: state.contextMenu,
    selectedMeal: state.selectedMeal,
    viewMode: state.viewMode,
    viewNonce: state.viewNonce,

    // UI state.
    loading: state.loading,
    isUpdating: state.isUpdating,
    isDeleting: state.isDeleting,
    mealsError: state.mealsError,
    patientsError: state.patientsError,
    menuItemsError: state.menuItemsError,
    updateError: state.updateError,

    // Tree actions.
    togglePatient,
    toggleDate,
    
    // View actions.
    handleMealClick,
    handleContextMenu,
    handleViewMeal,
    handleAnalyseMeal,
    handleViewNutritionReport,
    closeMealView,

    // Meal actions.
    handleUpdateMeal,
    handleDeleteMeal,
    handleDataChange,
  };
}
