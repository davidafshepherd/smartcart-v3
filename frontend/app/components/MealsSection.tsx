'use client';

import { useEffect, useState } from 'react';
import { mealsApi, menuApi, patientsApi, ApiError } from '../lib/api';
import type { MealsData, MealData, MenuItem, Patient } from '../lib/types';
import { MealsPanel } from './meals/MealsPanel';
import { MealDetail } from './meals/MealDetail';
import { PatientsPanel } from './meals/PatientsPanel';
import { MenuPanel } from './meals/MenuPanel';

// =============================================================================
// Component
// =============================================================================

/**
 * Renders the meals section of the application.
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
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  // Tree view expansion state (lifted up to preserve across patient ID changes)
  const [expandedPatients, setExpandedPatients] = useState<Set<string>>(new Set());
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());

  // ---------------------------------------------------------------------------
  // Effects
  // ---------------------------------------------------------------------------

  /**
   * Fetches meals, patients, and menu items on component mount.
   */
  useEffect(() => {
    fetchAllData();
  }, []);

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
   */
  const togglePatient = (patientId: string) => {
    setExpandedPatients((prev) => {
      const next = new Set(prev);
      if (next.has(patientId)) {
        next.delete(patientId);
      } else {
        next.add(patientId);
      }
      return next;
    });
  };

  /**
   * Toggles the expansion state of a date node.
   */
  const toggleDate = (key: string) => {
    setExpandedDates((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  // ---------------------------------------------------------------------------
  // Event Handlers
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
            View Meals
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>
            View and manage meals organized by patient, date and time.
          </p>
        </div>

        {/* Two-Panel Layout (stacked on mobile, side-by-side on desktop) */}
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          {/* Left Panel: Tree View, Patients, and Menu Items */}
          <div className="w-full lg:w-80 lg:shrink-0 space-y-4">
            <MealsPanel
              mealsData={mealsData}
              selectedMealId={selectedMeal?.id ?? null}
              onMealSelect={setSelectedMeal}
              expandedPatients={expandedPatients}
              expandedDates={expandedDates}
              onTogglePatient={togglePatient}
              onToggleDate={toggleDate}
            />
            <PatientsPanel onDataChange={handleDataChange} />
            <MenuPanel onDataChange={handleDataChange} />
          </div>

          {/* Right Panel: Meal Detail or Empty State */}
          <div className="flex-1">
            {selectedMeal ? (
              <MealDetail
                meal={selectedMeal}
                onDelete={() => handleDeleteMeal(selectedMeal.id)}
                onUpdate={(patientId, menuItemId) =>
                  handleUpdateMeal(selectedMeal.id, patientId, menuItemId)
                }
                isDeleting={isDeleting}
                isUpdating={isUpdating}
                updateError={updateError}
                patients={patients}
                menuItems={menuItems}
              />
            ) : (
              <EmptySelection />
            )}
          </div>
        </div>
      </div>
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
        Select a meal to view details
      </p>
      <p className="mt-1" style={{ color: 'var(--text-muted)' }}>
        Click on a time range in the tree view
      </p>
    </div>
  );
}
