'use client';

import { useEffect, useLayoutEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { mealsApi, menuApi, patientsApi, analysisApi, nutritionApi, ApiError } from '../lib/api';
import type { MealsData, MealData, MenuItem, Patient, FoodMask, ComputeNutritionResponse } from '../lib/types';
import { MealsPanel } from './meals/MealsPanel';
import { MealDetail } from './meals/view/MealDetail';
import { PatientsPanel } from './meals/PatientsPanel';
import { MenuPanel } from './meals/MenuPanel';
import { MealContextMenu } from './meals/MealContextMenu';
import { AnalysisInterface } from './meals/analysis/AnalysisInterface';
import { NutritionReportInterface } from './meals/nutrition/NutritionReportInterface';

// =============================================================================
// Type Definitions
// =============================================================================

type InputMode = 'automated' | 'assisted';
type ViewMode = 'view' | 'analyse' | 'nutrition' | null;

// =============================================================================
// Component
// =============================================================================

/**
 * Renders the meals section of the application with merged view and analysis functionality.
 *
 * @returns The meals section element.
 */
export default function MealsSection() {
  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------
  const [mealsData, setMealsData] = useState<MealsData>({});
  const [patients, setPatients] = useState<Patient[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMeal, setSelectedMeal] = useState<MealData | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>(null);
  
  // Context menu state
  const [contextMenu, setContextMenu] = useState<{
    meal: MealData;
    x: number;
    y: number;
  } | null>(null);

  // View mode state
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  // Analysis mode state
  const [inputMode, setInputMode] = useState<InputMode | null>(null);
  const [nutritionData, setNutritionData] = useState<ComputeNutritionResponse | null>(null);
  const [isComputingNutrition, setIsComputingNutrition] = useState(false);
  
  // Nutrition report view state
  const [isLoadingNutritionReport, setIsLoadingNutritionReport] = useState(false);
  const [isDeletingNutritionReport, setIsDeletingNutritionReport] = useState(false);

  // Tree view expansion state (lifted up to preserve across patient ID changes)
  const [expandedPatients, setExpandedPatients] = useState<Set<string>>(new Set());
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());

  // Track meal ID for nutrition computation to prevent race conditions
  const computingMealIdRef = useRef<number | null>(null);
  
  // Track previous meal ID to detect actual meal changes (not just data updates)
  const prevMealIdRef = useRef<number | null>(null);
  // Track if we're closing the view (to prevent re-selecting meal in event listener)
  const isClosingRef = useRef<boolean>(false);

  // ---------------------------------------------------------------------------
  // Effects
  // ---------------------------------------------------------------------------

  /**
   * Fetches meals, patients, and menu items on component mount.
   */
  useEffect(() => {
    fetchAllData();
  }, []);

  // Track previous view mode to detect when switching to analyse mode
  const prevViewModeRef = useRef<ViewMode>(null);

  // Reset analysis state when meal changes (but not when just updating meal data)
  useEffect(() => {
    const currentMealId = selectedMeal?.id ?? null;
    const mealChanged = prevMealIdRef.current !== currentMealId;
    prevMealIdRef.current = currentMealId;
    
    if (mealChanged) {
      if (selectedMeal && viewMode === 'analyse') {
        setInputMode(null);
        setNutritionData(null);
      }
      if (selectedMeal && viewMode === 'nutrition') {
        setNutritionData(null);
      }
    }
  }, [selectedMeal?.id, viewMode]);

  // Reset analysis state when switching to analyse mode (e.g., from view mode)
  // Use useLayoutEffect to reset synchronously before browser paints to prevent flash
  useLayoutEffect(() => {
    const prevViewMode = prevViewModeRef.current;
    prevViewModeRef.current = viewMode;
    
    // If switching TO analyse mode (from a different mode or null)
    // Only reset if state hasn't already been reset (to avoid unnecessary updates)
    if (viewMode === 'analyse' && prevViewMode !== 'analyse' && selectedMeal) {
      // Check if state needs resetting (handleAnalyseMeal might have already done it)
      if (inputMode !== null || nutritionData !== null) {
        setInputMode(null);
        setNutritionData(null);
      }
    }
  }, [viewMode, selectedMeal, inputMode, nutritionData]);
  
  // Refresh meals data when nutrition report is saved or deleted (to update is_analysed)
  useEffect(() => {
    const handleNutritionReportSaved = async () => {
      const updatedMeals = await mealsApi.getAll();
      setMealsData(updatedMeals);
      
      // Don't update selected meal if we're closing the view
      if (isClosingRef.current) {
        return;
      }
      
      // Only update selected meal if we're still viewing/analysing that meal
      // (don't update if viewMode is null, meaning we've closed the view)
      if (selectedMeal && viewMode !== null) {
        // Find the updated meal in the new data
        for (const patientMeals of Object.values(updatedMeals)) {
          for (const dateMeals of Object.values(patientMeals)) {
            for (const meal of Object.values(dateMeals)) {
              if (meal.id === selectedMeal.id) {
                setSelectedMeal(meal);
                break;
              }
            }
          }
        }
      }
    };
    
    window.addEventListener('nutrition-report-saved', handleNutritionReportSaved);
    return () => {
      window.removeEventListener('nutrition-report-saved', handleNutritionReportSaved);
    };
  }, [selectedMeal, viewMode]);

  // ---------------------------------------------------------------------------
  // Data Fetching
  // ---------------------------------------------------------------------------

  /**
   * Fetches all required data from the API.
   */
  const fetchAllData = async () => {
    try {
      const [mealsResult, patientsResult, menuItemsResult] = await Promise.all([
        mealsApi.getAll(),
        patientsApi.getAll(),
        menuApi.getAll(),
      ]);
      setMealsData(mealsResult);
      setPatients(patientsResult);
      setMenuItems(menuItemsResult);
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Fetches all meals from the API.
   */
  const fetchMeals = async () => {
    try {
      const data = await mealsApi.getAll();
      setMealsData(data);
    } catch (err) {
      console.error('Failed to fetch meals:', err);
    }
  };

  // ---------------------------------------------------------------------------
  // Tree View Handlers
  // ---------------------------------------------------------------------------

  /**
   * Toggles the expansion state of a patient node.
   * When collapsing, also collapses all dates within that patient.
   * If the collapsed patient contains the currently selected meal, reset to empty state.
   */
  const togglePatient = (patientId: string) => {
    setExpandedPatients((prev) => {
      const next = new Set(prev);
      const isCurrentlyExpanded = next.has(patientId);
      
      if (isCurrentlyExpanded) {
        // Collapsing: remove patient and all its dates
        next.delete(patientId);
        
        // Check if the collapsed patient contains the currently selected meal
        if (selectedMeal && selectedMeal.patient.id.toString() === patientId) {
          // Reset to empty state
          setSelectedMeal(null);
          setViewMode(null);
          setContextMenu(null);
          setInputMode(null);
          setNutritionData(null);
        }
        
        // Also collapse all dates for this patient
        setExpandedDates((prevDates) => {
          const nextDates = new Set(prevDates);
          // Remove all date keys that start with this patientId
          prevDates.forEach((dateKey) => {
            if (dateKey.startsWith(`${patientId}-`)) {
              nextDates.delete(dateKey);
            }
          });
          return nextDates;
        });
      } else {
        // Expanding: just add the patient
        next.add(patientId);
      }
      return next;
    });
  };

  /**
   * Toggles the expansion state of a date node.
   * If the collapsed date contains the currently selected meal, reset to empty state.
   */
  const toggleDate = (key: string) => {
    const isCurrentlyExpanded = expandedDates.has(key);
    
    // Check if collapsing and if the collapsed date contains the currently selected meal
    // Do this before updating state to avoid stale closure issues
    let shouldReset = false;
    if (isCurrentlyExpanded && selectedMeal) {
      // Date key format is: `${patientId}-${date}` (date may contain dashes like "2024-01-15")
      const firstDashIndex = key.indexOf('-');
      if (firstDashIndex !== -1) {
        const patientId = key.substring(0, firstDashIndex);
        const date = key.substring(firstDashIndex + 1);
        const mealPatientId = selectedMeal.patient.id.toString();
        const mealDate = selectedMeal.date;
        
        if (mealPatientId === patientId && mealDate === date) {
          shouldReset = true;
        }
      }
    }
    
    // Update expanded dates
    setExpandedDates((prev) => {
      const next = new Set(prev);
      if (isCurrentlyExpanded) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
    
    // Reset to empty state if needed (outside the setState callback)
    if (shouldReset) {
      setSelectedMeal(null);
      setViewMode(null);
      setContextMenu(null);
      setInputMode(null);
      setNutritionData(null);
    }
  };

  // ---------------------------------------------------------------------------
  // Context Menu Handlers
  // ---------------------------------------------------------------------------

  /**
   * Handles meal click to show context menu.
   */
  const handleMealClick = (meal: MealData, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    // Use the exact click coordinates - these are viewport-relative
    // which matches fixed positioning perfectly
    setContextMenu({
      meal,
      x: event.clientX,
      y: event.clientY,
    });
  };

  /**
   * Handles viewing a meal.
   */
  const handleViewMeal = (meal: MealData) => {
    setSelectedMeal(meal);
    setViewMode('view');
    setContextMenu(null);
  };

  /**
   * Handles analysing a meal.
   */
  const handleAnalyseMeal = (meal: MealData) => {
    // Reset analysis state immediately to prevent flash of old state
    setInputMode(null);
    setNutritionData(null);
    // Clear any ongoing computation for the previous meal
    computingMealIdRef.current = null;
    setIsComputingNutrition(false);
    setSelectedMeal(meal);
    setViewMode('analyse');
    setContextMenu(null);
  };

  /**
   * Handles viewing a nutrition report for a meal.
   */
  const handleViewNutritionReport = async (meal: MealData) => {
    setSelectedMeal(meal);
    setViewMode('nutrition');
    setContextMenu(null);
    setIsLoadingNutritionReport(true);
    setNutritionData(null);
    
    try {
      const report = await nutritionApi.getReport(meal.id);
      setNutritionData({
        meal_nutrition: report.meal_nutrition,
        food_nutrition: report.food_nutrition,
      });
    } catch (err) {
      console.error('Failed to fetch nutrition report:', err);
      alert(err instanceof ApiError ? err.message : 'Failed to load nutrition report');
    } finally {
      setIsLoadingNutritionReport(false);
    }
  };

  /**
   * Handles closing the nutrition report view.
   */
  const handleCloseNutritionReport = () => {
    setViewMode(null);
    setSelectedMeal(null);
    setNutritionData(null);
  };

  /**
   * Handles deleting a nutrition report.
   */
  const handleDeleteNutritionReport = async (mealId: number) => {
    // Prevent double-clicks
    if (isDeletingNutritionReport) return;

    setIsDeletingNutritionReport(true);
    try {
      await nutritionApi.delete(mealId);
      // Refresh meals data to update is_analysed status
      const updatedMeals = await mealsApi.getAll();
      setMealsData(updatedMeals);
      
      // Update selected meal if it's the one that was deleted
      if (selectedMeal && selectedMeal.id === mealId) {
        // Find the updated meal in the new data
        for (const patientMeals of Object.values(updatedMeals)) {
          for (const dateMeals of Object.values(patientMeals)) {
            for (const meal of Object.values(dateMeals)) {
              if (meal.id === mealId) {
                setSelectedMeal(meal);
                break;
              }
            }
          }
        }
      }
      
      // Close the view
      handleCloseNutritionReport();
    } catch (err) {
      console.error('Failed to delete nutrition report:', err);
      alert(err instanceof ApiError ? err.message : 'Failed to delete nutrition report');
    } finally {
      setIsDeletingNutritionReport(false);
    }
  };

  // ---------------------------------------------------------------------------
  // View Mode Handlers
  // ---------------------------------------------------------------------------

  /**
   * Handles meal deletion.
   *
   * @param mealId - The ID of the meal to delete.
   */
  const handleDeleteMeal = async (mealId: number) => {
    // Prevent double-clicks.
    if (isDeleting) return;

    setIsDeleting(true);
    try {
      await mealsApi.delete(mealId);
      setSelectedMeal(null);
      setViewMode(null);
      fetchMeals();
    } catch (err) {
      console.error('Failed to delete meal:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  /**
   * Handles meal updates.
   *
   * @param mealId - The ID of the meal to update.
   * @param patientId - Optional new patient ID.
   * @param menuItemId - Optional new menu item ID.
   */
  const handleUpdateMeal = async (
    mealId: number,
    patientId?: number,
    menuItemId?: number,
  ) => {
    // Prevent double-clicks.
    if (isUpdating) return;

    setIsUpdating(true);
    setUpdateError(null);
    try {
      const updatedMeal = await mealsApi.update(mealId, patientId, menuItemId);
      setSelectedMeal(updatedMeal);
      fetchMeals();
    } catch (err) {
      if (err instanceof ApiError) {
        setUpdateError(err.message);
        setTimeout(() => setUpdateError(null), 5000);
      } else {
        console.error('Failed to update meal:', err);
        setUpdateError('Failed to update meal');
      }
    } finally {
      setIsUpdating(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Analysis Mode Handlers
  // ---------------------------------------------------------------------------

  /**
   * Handles computing nutrition from food masks.
   */
  const handleComputeVolume = async (beforeMasks: FoodMask[], afterMasks: FoodMask[]) => {
    if (!selectedMeal || isComputingNutrition) return;
    
    // Capture the meal ID at the start to prevent race conditions
    // if the user switches meals while computation is in progress
    const mealIdAtStart = selectedMeal.id;
    const beforeDepthPath = selectedMeal.before_depth_path;
    const afterDepthPath = selectedMeal.after_depth_path;
    
    // Store the meal ID in a ref so we can check it even if state changes
    computingMealIdRef.current = mealIdAtStart;
    setIsComputingNutrition(true);
    
    try {
      const result = await analysisApi.computeNutrition(
        beforeDepthPath,
        afterDepthPath,
        beforeMasks,
        afterMasks
      );
      
      // Only set nutrition data if we're still on the same meal
      // This prevents applying results to the wrong meal if user switched meals
      if (computingMealIdRef.current === mealIdAtStart && selectedMeal?.id === mealIdAtStart) {
        setNutritionData(result);
      }
    } catch (err) {
      console.error('Nutrition computation failed:', err);
      // Only show error if we're still on the same meal
      if (computingMealIdRef.current === mealIdAtStart && selectedMeal?.id === mealIdAtStart) {
        alert(err instanceof ApiError ? err.message : 'Failed to compute nutrition');
      }
    } finally {
      // Clear the ref and computing flag
      if (computingMealIdRef.current === mealIdAtStart) {
        computingMealIdRef.current = null;
        setIsComputingNutrition(false);
      }
    }
  };

  /**
   * Handles data changes from child components (e.g., PatientsPanel).
   *
   * @param patientIdChange - Optional info about a patient ID change.
   */
  const handleDataChange = async (patientIdChange?: { oldId: number; newId: number }) => {
    // Fetch fresh data first
    const [mealsResult, patientsResult, menuItemsResult] = await Promise.all([
      mealsApi.getAll(),
      patientsApi.getAll(),
      menuApi.getAll(),
    ]);

    // Update all state together to avoid visual flicker
    // If a patient ID changed, update the expansion state to use the new ID
    if (patientIdChange) {
      const { oldId, newId } = patientIdChange;
      const oldIdStr = String(oldId);
      const newIdStr = String(newId);

      // Update expanded patients
      setExpandedPatients((prev) => {
        if (prev.has(oldIdStr)) {
          const next = new Set(prev);
          next.delete(oldIdStr);
          next.add(newIdStr);
          return next;
        }
        return prev;
      });

      // Update expanded dates (keys are "patientId-date")
      setExpandedDates((prev) => {
        const next = new Set<string>();
        let changed = false;
        for (const key of prev) {
          if (key.startsWith(`${oldIdStr}-`)) {
            next.add(key.replace(`${oldIdStr}-`, `${newIdStr}-`));
            changed = true;
          } else {
            next.add(key);
          }
        }
        return changed ? next : prev;
      });
    }

    // Update data state
    setMealsData(mealsResult);
    setPatients(patientsResult);
    setMenuItems(menuItemsResult);

    // If a meal is selected, find it by ID in the fresh data and update it
    if (selectedMeal) {
      let foundMeal: MealData | null = null;

      // Search through all meals to find one with matching ID
      for (const patientMeals of Object.values(mealsResult)) {
        for (const dateMeals of Object.values(patientMeals)) {
          for (const meal of Object.values(dateMeals)) {
            if (meal.id === selectedMeal.id) {
              foundMeal = meal;
              break;
            }
          }
          if (foundMeal) break;
        }
        if (foundMeal) break;
      }

      // Update with fresh data or clear if meal no longer exists
      setSelectedMeal(foundMeal);
    }
  };

  // ---------------------------------------------------------------------------
  // Loading State
  // ---------------------------------------------------------------------------

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 rounded-xl shimmer"></div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="p-4 sm:p-6 lg:p-8 animate-fade-in pt-16 lg:pt-8">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2" style={{ color: 'var(--foreground)' }}>
            Analyse Meals
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>
            Analyse meals to generate detailed nutrition reports.
          </p>
        </div>

        {/* Two-Panel Layout (stacked on mobile, side-by-side on desktop) */}
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          {/* Left Panel: Tree View, Patients, and Menu Items */}
          <div className="w-full lg:w-80 lg:shrink-0 space-y-4">
            <MealsPanel
              mealsData={mealsData}
              selectedMealId={selectedMeal?.id ?? null}
              onMealClick={handleMealClick}
              expandedPatients={expandedPatients}
              expandedDates={expandedDates}
              onTogglePatient={togglePatient}
              onToggleDate={toggleDate}
            />
            <PatientsPanel onDataChange={handleDataChange} />
            <MenuPanel onDataChange={handleDataChange} />
          </div>

          {/* Right Panel: Meal Detail, Analysis Interface, or Empty State */}
          <div className="flex-1">
            {selectedMeal && viewMode === 'view' ? (
              <MealDetail
                meal={selectedMeal}
                onDelete={() => handleDeleteMeal(selectedMeal.id)}
                onClose={() => {
                  setViewMode(null);
                  setSelectedMeal(null);
                }}
                onUpdate={(patientId, menuItemId) =>
                  handleUpdateMeal(selectedMeal.id, patientId, menuItemId)
                }
                isDeleting={isDeleting}
                isUpdating={isUpdating}
                updateError={updateError}
                patients={patients}
                menuItems={menuItems}
              />
            ) : selectedMeal && viewMode === 'analyse' ? (
              <AnalysisInterface
                meal={selectedMeal}
                inputMode={inputMode}
                onInputModeChange={setInputMode}
                onBackToInputSelection={() => setInputMode(null)}
                onClose={() => {
                  isClosingRef.current = true;
                  setViewMode(null);
                  setSelectedMeal(null);
                  setNutritionData(null);
                  setInputMode(null);
                  // Clear any ongoing computation
                  computingMealIdRef.current = null;
                  setIsComputingNutrition(false);
                  // Reset the flag after a brief delay to allow event listeners to see it
                  setTimeout(() => {
                    isClosingRef.current = false;
                  }, 100);
                }}
                onComputeVolume={handleComputeVolume}
                nutritionData={nutritionData}
                setNutritionData={setNutritionData}
                isComputingNutrition={isComputingNutrition}
              />
            ) : selectedMeal && viewMode === 'nutrition' ? (
              isLoadingNutritionReport ? (
                <div className="rounded-2xl border p-8 text-center shadow-sm" style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
                  <div className="w-12 h-12 rounded-xl shimmer mx-auto"></div>
                  <p className="mt-4" style={{ color: 'var(--text-muted)' }}>Loading nutrition report...</p>
                </div>
              ) : nutritionData ? (
                <NutritionReportInterface
                  nutritionData={nutritionData}
                  foods={nutritionData.food_nutrition.map(fn => ({
                    id: fn.food_id,
                    short_name: fn.short_name || `Food ${fn.food_id}`,
                  })) as Array<{ id: number; short_name: string }>}
                  onDiscard={handleCloseNutritionReport}
                  onDelete={() => handleDeleteNutritionReport(selectedMeal.id)}
                  isDeletingReport={isDeletingNutritionReport}
                  readOnly={true}
                />
              ) : (
                <EmptySelection />
              )
            ) : (
              <EmptySelection />
            )}
          </div>
        </div>
      </div>

      {/* Context Menu - Render in portal to avoid positioning context issues */}
      {contextMenu && typeof document !== 'undefined' && createPortal(
        <MealContextMenu
          meal={contextMenu.meal}
          x={contextMenu.x}
          y={contextMenu.y}
          onViewMeal={handleViewMeal}
          onAnalyseMeal={handleAnalyseMeal}
          onViewNutritionReport={handleViewNutritionReport}
          onClose={() => setContextMenu(null)}
        />,
        document.body
      )}
    </div>
  );
}

// =============================================================================
// Sub-Components
// =============================================================================

/**
 * Renders an empty state when no meal is selected.
 */
function EmptySelection() {
  return (
    <div
      className="rounded-2xl border p-16 text-center shadow-sm"
      style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
    >
      <div
        className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center"
        style={{ background: 'var(--accent-light)' }}
      >
        <svg
          className="w-8 h-8"
          style={{ color: 'var(--accent-primary)' }}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
          />
        </svg>
      </div>
      <p className="text-lg font-medium" style={{ color: 'var(--foreground)' }}>
        Select a meal to get started
      </p>
      <p className="mt-1" style={{ color: 'var(--text-muted)' }}>
        Click on a time range in the tree view to view or analyse a meal
      </p>
    </div>
  );
}
