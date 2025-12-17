'use client';

import { useEffect, useState } from 'react';
import { mealsApi, menuApi, patientsApi, analysisApi, ApiError } from '../lib/api';
import type { MealsData, MealData, MenuItem, Patient, FoodMask, ComputeNutritionResponse } from '../lib/types';
import { MealsPanel } from './meals/MealsPanel';
import { AnalysisInterface } from './analysis/AnalysisInterface';

// =============================================================================
// Type Definitions
// =============================================================================

type InputMode = 'automated' | 'assisted';

// =============================================================================
// Component
// =============================================================================

/**
 * Renders the analysis section of the application.
 *
 * @returns The analysis section element.
 */
export default function AnalysisSection() {
  // ===========================================================================
  // State
  // ===========================================================================
  const [mealsData, setMealsData] = useState<MealsData>({});
  // These are fetched for future use (e.g., meal editing, filtering)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [patients, setPatients] = useState<Patient[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMeal, setSelectedMeal] = useState<MealData | null>(null);
  const [inputMode, setInputMode] = useState<InputMode | null>(null);
  
  // Nutrition state
  const [nutritionData, setNutritionData] = useState<ComputeNutritionResponse | null>(null);
  const [isComputingNutrition, setIsComputingNutrition] = useState(false);
  
  // Tree view expansion state
  const [expandedPatients, setExpandedPatients] = useState<Set<string>>(new Set());
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());

  // ===========================================================================
  // Effects
  // ===========================================================================

  useEffect(() => {
    fetchAllData();
  }, []);

  // Reset state when meal changes
  useEffect(() => {
    if (selectedMeal) {
      setInputMode(null);
      setNutritionData(null);
    }
  }, [selectedMeal]);

  // ===========================================================================
  // Data Fetching
  // ===========================================================================

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

  // ===========================================================================
  // Tree View Handlers
  // ===========================================================================

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

  const handleMealSelect = (meal: MealData) => {
    setSelectedMeal(meal);
  };

  // ===========================================================================
  // Nutrition Handlers
  // ===========================================================================

  const handleComputeVolume = async (beforeMasks: FoodMask[], afterMasks: FoodMask[]) => {
    if (!selectedMeal) return;
    
    setIsComputingNutrition(true);
    try {
      const result = await analysisApi.computeNutrition(
        selectedMeal.before_depth_path,
        selectedMeal.after_depth_path,
        beforeMasks,
        afterMasks
      );
      setNutritionData(result);
    } catch (err) {
      console.error('Nutrition computation failed:', err);
      alert(err instanceof ApiError ? err.message : 'Failed to compute nutrition');
    } finally {
      setIsComputingNutrition(false);
    }
  };

  // ===========================================================================
  // Render
  // ===========================================================================

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 rounded-xl shimmer"></div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 animate-fade-in pt-16 lg:pt-8">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2" style={{ color: 'var(--foreground)' }}>
            Analyse Meals
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>
            Select a meal to analyse and generate a detailed nutritional report.
          </p>
        </div>

        {/* Two-Panel Layout (stacked on mobile, side-by-side on desktop) */}
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          {/* Left Panel: Meal Selection */}
          <div className="w-full lg:w-80 lg:shrink-0">
            <MealsPanel
              mealsData={mealsData}
              selectedMealId={selectedMeal?.id ?? null}
              onMealSelect={handleMealSelect}
              expandedPatients={expandedPatients}
              expandedDates={expandedDates}
              onTogglePatient={togglePatient}
              onToggleDate={toggleDate}
            />
          </div>

          {/* Right Panel: Analysis Interface */}
          <div className="flex-1">
            {!selectedMeal ? (
              <div
                className="rounded-2xl border p-16 text-center shadow-sm"
                style={{
                  background: 'var(--card-bg)',
                  borderColor: 'var(--card-border)',
                }}
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
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                    />
                  </svg>
                </div>
                <p className="text-lg font-medium" style={{ color: 'var(--foreground)' }}>
                  Select a meal to analyse
                </p>
                <p className="mt-1" style={{ color: 'var(--text-muted)' }}>
                  Click on a time range in the tree view
                </p>
              </div>
            ) : (
              <AnalysisInterface
                meal={selectedMeal}
                inputMode={inputMode}
                onInputModeChange={setInputMode}
                onBackToInputSelection={() => setInputMode(null)}
                onComputeVolume={handleComputeVolume}
                nutritionData={nutritionData}
                setNutritionData={setNutritionData}
                isComputingNutrition={isComputingNutrition}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
