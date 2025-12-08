/**
 * @fileoverview Main meals section component for viewing saved meals.
 *
 * Displays a hierarchical tree view of all saved meals and a detail
 * panel for the selected meal. Provides meal browsing and deletion
 * functionality.
 */

'use client';

import { useEffect, useState } from 'react';
import { mealsApi } from '../lib/api';
import type { MealsData, MealData } from '../lib/types';
import { MealsTreeView } from './meals/MealsTreeView';
import { MealDetail } from './meals/MealDetail';

// =============================================================================
// Component
// =============================================================================

/**
 * Renders the meals section of the application.
 *
 * This component provides a two-panel interface:
 * - Left panel: Tree view for browsing meals by patient/date/time
 * - Right panel: Detailed view of the selected meal
 *
 * Meals are fetched from the API on mount and when changes occur
 * (e.g., after deletion).
 *
 * @returns The meals section element.
 *
 * @example
 * ```tsx
 * // Used in the main page
 * <MealsSection />
 * ```
 */
export default function MealsSection() {
  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------
  const [mealsData, setMealsData] = useState<MealsData>({});
  const [loading, setLoading] = useState(true);
  const [selectedMeal, setSelectedMeal] = useState<MealData | null>(null);

  // ---------------------------------------------------------------------------
  // Effects
  // ---------------------------------------------------------------------------

  /**
   * Fetches meals on component mount.
   */
  useEffect(() => {
    fetchMeals();
  }, []);

  // ---------------------------------------------------------------------------
  // Data Fetching
  // ---------------------------------------------------------------------------

  /**
   * Fetches all meals from the API.
   *
   * The API returns meals organized in a hierarchical structure
   * suitable for the tree view component.
   */
  const fetchMeals = async () => {
    try {
      const data = await mealsApi.getAll();
      setMealsData(data);
    } catch (err) {
      console.error('Failed to fetch meals:', err);
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Event Handlers
  // ---------------------------------------------------------------------------

  /**
   * Handles meal deletion.
   *
   * Deletes the meal from the backend, clears the selection, and
   * refreshes the meal list.
   *
   * @param mealId - The ID of the meal to delete.
   */
  const handleDeleteMeal = async (mealId: number) => {
    try {
      await mealsApi.delete(mealId);
      setSelectedMeal(null);
      fetchMeals();
    } catch (err) {
      console.error('Failed to delete meal:', err);
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
    <div className="p-8 animate-fade-in">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--foreground)' }}>
            Saved Meals
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>
            View and manage meals organized by patient, date, and time.
          </p>
        </div>

        {/* Two-Panel Layout */}
        <div className="flex gap-8">
          {/* Left Panel: Tree View */}
          <MealsTreeView
            mealsData={mealsData}
            selectedMealId={selectedMeal?.id ?? null}
            onMealSelect={setSelectedMeal}
          />

          {/* Right Panel: Meal Detail or Empty State */}
          <div className="flex-1">
            {selectedMeal ? (
              <MealDetail
                meal={selectedMeal}
                onDelete={() => handleDeleteMeal(selectedMeal.id)}
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
 *
 * Prompts the user to select a meal from the tree view.
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
