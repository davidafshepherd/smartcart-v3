import { useEffect, useState } from 'react';

import { SpinnerIcon, WarningIcon, XIcon } from '@/components/common/icons';
import { ApiError } from '@/services/apiError';
import { nutritionService } from '@/services/nutritionService';
import { getCombinedNutrition } from '@/utils/nutrition';

import type { ComputeNutritionResponse, Meal } from '@/types';

import { FoodSelection } from '../FoodSelection/FoodSelection';
import { NutritionTable } from '../NutritionTable/NutritionTable';
import { NutritionWheel } from '../NutritionWheel/NutritionWheel';

import './NutritionReportPanel.css';


interface Props {
  meal: Meal;
  onClose: () => void;
  nutrition?: ComputeNutritionResponse;
  readOnly?: boolean;
  onDiscard?: () => void;
  onDeleted?: () => void;
}


export function NutritionReportPanel({ meal, onClose, nutrition, readOnly = false, onDiscard, onDeleted }: Props) {
  // Data state.
  const [fetchedData, setFetchedData] = useState<ComputeNutritionResponse | null>(null);
  const [selectedFoodIds, setSelectedFoodIds] = useState<Set<number>>(
    () => new Set(nutrition?.food_nutrition.map(f => f.food_id) ?? [])
  );

  // UI state.
  const [isLoading, setIsLoading] = useState(readOnly);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaved, setIsSaved] = useState(readOnly);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);


  // Fetches the saved nutrition report when opened in read-only mode.
  useEffect(() => {
    if (!readOnly) return;

    async function loadReport() {
      setIsLoading(true);
      try {
        const report = await nutritionService.getReport(meal.id);
        setFetchedData({ meal_nutrition: report.meal_nutrition, food_nutrition: report.food_nutrition });
      } catch (err) {
        setLoadError(err instanceof ApiError ? err.message : "Failed to load nutrition report.");
      } finally {
        setIsLoading(false);
      }
    }

    loadReport();
  }, [meal.id, readOnly]);


  // Selects all foods in the freshly fetched nutrition report by default.
  useEffect(() => {
    const selectAllFetchedFoods = () => {
      setSelectedFoodIds(new Set(fetchedData!.food_nutrition.map(f => f.food_id)));
    }
    if (readOnly && fetchedData) selectAllFetchedFoods();
  }, [readOnly, fetchedData]);


  // Resolved nutrition report data and its combined nutrition for the selected foods.
  const data = readOnly ? fetchedData : (nutrition ?? null);
  const combined = data ? getCombinedNutrition(data.food_nutrition, selectedFoodIds) : null;


  // Toggles a food's inclusion in the combined totals.
  const toggleFood = (foodId: number) => {
    setSelectedFoodIds(prev => {
      const next = new Set(prev);
      if (next.has(foodId)) {
        next.delete(foodId);
      }
      else {
        next.add(foodId);
      }
      return next;
    });
  };


  // Saves the nutrition report.
  const handleSave = async () => {
    if (!data || isSaving) return;

    setIsSaving(true);
    setActionError(null);

    try {
      await nutritionService.saveReport(meal.id, data);
      window.dispatchEvent(new Event('nutrition-report-saved'));
      setIsSaved(true);
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Failed to save nutrition report.');
    } finally {
      setIsSaving(false);
    }
  };


  // Deletes the saved nutrition report.
  const handleDelete = async () => {
    if (isDeleting) return;

    setIsDeleting(true);
    setActionError(null);

    try {
      await nutritionService.delete(meal.id);
      onDeleted?.();
      window.dispatchEvent(new Event('nutrition-report-saved'));
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Failed to delete nutrition report.');
    } finally {
      setIsDeleting(false);
    }
  };


  // Return a shimmer if loading nutrition report.
  if (readOnly && isLoading) {
    return (
      <div className="nutrition-report-loading">
        <div className="nutrition-report-loading-shimmer shimmer" />
        <p>Loading nutrition report…</p>
      </div>
    )
  }


  // Return error state if failed to load nutrition report.
  if (readOnly && loadError) {
    return (
        <div className="nutrition-report-load-error">
          <div className="nutrition-report-load-error-icon">
            <WarningIcon />
          </div>
          <p className="nutrition-report-load-error-title">Failed to load report</p>
          <p className="nutrition-report-load-error-subtitle">{loadError}</p>
        </div>
    )
  }


  return (
    <div className="nutrition-report-panel">
        {/* Header */}
        <div className="nutrition-report-header">
          <h2 className="nutrition-report-header-title">Nutrition Report</h2>
          {combined && (
            <div className="nutrition-report-mass-pill">
              <span className="nutrition-report-mass-pill-label">Mass Consumed:</span>
              <span className="nutrition-report-mass-pill-value">{combined.mass.toFixed(1)}g</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="nutrition-report-body">
          {/* Food selection */}
          {data!.food_nutrition.length > 0 && (
            <FoodSelection foods={data!.food_nutrition} selectedIds={selectedFoodIds} onToggle={toggleFood} />
          )}

          {/* Nutrition wheel + Nutrition table */}
          {combined && (
            <div className="nutrition-report-content">
              <div className="nutrition-report-wheel-col">
                <h5 className="nutrition-report-section-title">
                  <span className="nutrition-report-section-tick" />
                  Macronutrient Breakdown
                </h5>
                <div className="nutrition-report-wheel-center">
                  <NutritionWheel protein={combined.protein} carbs={combined.carbohydrate} fat={combined.fat} />
                </div>
              </div>
              <div className="nutrition-report-table-col">
                <h5 className="nutrition-report-section-title">
                  <span className="nutrition-report-section-tick" />
                  Nutrition Table
                </h5>
                <div className="nutrition-report-table-card">
                  <NutritionTable nutrition={combined} />
                </div>
              </div>
            </div>
          )}

          {/* Error */}
          {actionError && (
            <div className="nutrition-report-error">
              <WarningIcon className="nutrition-report-error-icon" />
              <p className="nutrition-report-error-text">{actionError}</p>
              <button className="nutrition-report-error-dismiss" onClick={() => setActionError(null)} aria-label="Dismiss">
                <XIcon className="nutrition-report-error-dismiss-icon" />
              </button>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="nutrition-report-actions">
          {isSaved ? (
            <>
              <button className="nutrition-report-delete-button" onClick={handleDelete} disabled={isDeleting}>
                {isDeleting ? (
                  <span className="nutrition-report-button-loading">
                    <SpinnerIcon className="nutrition-report-action-spinner" />
                    Deleting…
                  </span>
                ) : "Delete Report"}
              </button>
              <button className="nutrition-report-close-button" onClick={onClose}>
                Close Report
              </button>
            </>
          ) : (
            <>
              <button className="nutrition-report-save-button" onClick={handleSave} disabled={isSaving || !data}>
                {isSaving ? (
                  <span className="nutrition-report-button-loading">
                    <SpinnerIcon className="nutrition-report-action-spinner" />
                    Saving…
                  </span>
                ) : "Save Report"}
              </button>
              <button className="nutrition-report-discard-button" onClick={onDiscard} disabled={isSaving}>
                Discard Report
              </button>
            </>
          )}
        </div>
    </div>
  );
}
