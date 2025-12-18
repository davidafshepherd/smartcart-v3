'use client';

import { useState, useEffect } from 'react';
import type { ComputeNutritionResponse, Food } from '../../lib/types';
import { NutritionWheel } from './nutrition/NutritionWheel';
import { NutritionTable } from './nutrition/NutritionTable';
import { FoodSelection } from './nutrition/FoodSelection';
import { NutritionHeader } from './nutrition/NutritionHeader';
import { NutritionActions } from './nutrition/NutritionActions';

// =============================================================================
// Types
// =============================================================================

/** Props for the NutritionReportInterface component. */
interface NutritionReportInterfaceProps {
  /** Computed nutrition data from the backend. */
  nutritionData: ComputeNutritionResponse | null;
  /** List of foods for displaying names. */
  foods?: Food[];
  /** Callback to save the nutrition report. */
  onSave: () => void;
  /** Callback to discard/clear the nutrition report. */
  onDiscard: () => void;
}

// =============================================================================
// Component
// =============================================================================

/**
 * Renders the nutrition report interface.
 *
 * @param props - The component props.
 * @returns The nutrition report interface element.
 */
export function NutritionReportInterface({
  nutritionData,
  foods = [],
  onSave,
  onDiscard,
}: NutritionReportInterfaceProps) {
  // Selected food IDs (initially all foods are selected)
  const [selectedFoodIds, setSelectedFoodIds] = useState<Set<number>>(new Set());

  // Initialize selectedFoodIds with all food IDs when nutritionData changes
  useEffect(() => {
    if (nutritionData && nutritionData.food_nutrition.length > 0) {
      const allFoodIds = new Set(nutritionData.food_nutrition.map((food) => food.food_id));
      setSelectedFoodIds(allFoodIds);
    }
  }, [nutritionData]);

  /**
   * Combines nutrition data from selected foods.
   */
  const getCombinedNutrition = () => {
    if (!nutritionData) return null;

    const selectedFoods = nutritionData.food_nutrition.filter((food) =>
      selectedFoodIds.has(food.food_id)
    );

    if (selectedFoods.length === 0) return null;

    // Helper to combine a nutrient value across all foods
    // Returns null only if ALL foods have null for that nutrient (to show N/A)
    // Otherwise sums values, treating null as 0
    const combineNutrient = (key: keyof typeof selectedFoods[0]): number | null => {
      let sum = 0;
      let allNull = true;
      
      for (const food of selectedFoods) {
        const value = food[key] as number | null | undefined;
        if (value === null || value === undefined) {
          // Treat null as 0 for summing
        } else {
          allNull = false;
          sum += value;
        }
      }
      
      // If all foods had null, return null (to show N/A)
      // Otherwise return the sum (even if 0, if it was a real 0 or sum of nulls)
      return allNull ? null : sum;
    };

    // Combine all nutrition values
    const combined = {
      mass: selectedFoods.reduce((sum, food) => sum + (food.mass || 0), 0),
      kcal: combineNutrient('kcal'),
      kj: combineNutrient('kj'),
      protein: combineNutrient('protein'),
      fat: combineNutrient('fat'),
      carbohydrate: combineNutrient('carbohydrate'),
      sugar: combineNutrient('sugar'),
      fibre: combineNutrient('fibre'),
      saturated_fat: combineNutrient('saturated_fat'),
      sodium: combineNutrient('sodium'),
      potassium: combineNutrient('potassium'),
      calcium: combineNutrient('calcium'),
      magnesium: combineNutrient('magnesium'),
      phosphorus: combineNutrient('phosphorus'),
      iron: combineNutrient('iron'),
      copper: combineNutrient('copper'),
      zinc: combineNutrient('zinc'),
      selenium: combineNutrient('selenium'),
      iodine: combineNutrient('iodine'),
      retinol: combineNutrient('retinol'),
      carotene: combineNutrient('carotene'),
      vitamin_d: combineNutrient('vitamin_d'),
      vitamin_e: combineNutrient('vitamin_e'),
      vitamin_k1: combineNutrient('vitamin_k1'),
      thiamin: combineNutrient('thiamin'),
      riboflavin: combineNutrient('riboflavin'),
      niacin: combineNutrient('niacin'),
      vitamin_b6: combineNutrient('vitamin_b6'),
      vitamin_b12: combineNutrient('vitamin_b12'),
      folate: combineNutrient('folate'),
      vitamin_c: combineNutrient('vitamin_c'),
    };

    return combined;
  };

  const combinedNutrition = nutritionData ? getCombinedNutrition() : null;
  
  // Create empty nutrition data structure when no foods are selected
  const displayNutrition = combinedNutrition || {
    mass: 0,
    kcal: null,
    kj: null,
    protein: null,
    fat: null,
    carbohydrate: null,
    sugar: null,
    fibre: null,
    saturated_fat: null,
    sodium: null,
    potassium: null,
    calcium: null,
    magnesium: null,
    phosphorus: null,
    iron: null,
    copper: null,
    zinc: null,
    selenium: null,
    iodine: null,
    retinol: null,
    carotene: null,
    vitamin_d: null,
    vitamin_e: null,
    vitamin_k1: null,
    thiamin: null,
    riboflavin: null,
    niacin: null,
    vitamin_b6: null,
    vitamin_b12: null,
    folate: null,
    vitamin_c: null,
  };

  return (
    <>
      {nutritionData ? (
        <div
          className="rounded-t-2xl border-t border-x"
          style={{
            background: 'var(--card-bg)',
            borderColor: 'var(--card-border)',
          }}
        >
          <NutritionHeader mass={displayNutrition.mass} />

          <div className="p-6">
            <FoodSelection
              foodNutrition={nutritionData.food_nutrition}
              selectedFoodIds={selectedFoodIds}
              onSelectionChange={setSelectedFoodIds}
              foods={foods}
            />

            {/* Nutrition Wheel and Table Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Nutrition Wheel - Takes 1/3 on large screens */}
              <div className="lg:col-span-1">
                <h5 className="text-lg font-bold mb-4 flex items-center" style={{ color: 'var(--foreground)' }}>
                  <span className="w-1 h-6 rounded-full mr-3" style={{ background: 'var(--accent-primary)' }}></span>
                  Macronutrient Breakdown
                </h5>
                <NutritionWheel
                  protein={displayNutrition.protein}
                  carbs={displayNutrition.carbohydrate}
                  fat={displayNutrition.fat}
                />
              </div>

              {/* Nutrition Table - Takes 2/3 on large screens */}
              <div className="lg:col-span-2">
                <h5 className="text-lg font-bold mb-4 flex items-center" style={{ color: 'var(--foreground)' }}>
                  <span className="w-1 h-6 rounded-full mr-3" style={{ background: 'var(--accent-primary)' }}></span>
                  Nutrition Table
                </h5>
                <div className="rounded-lg border overflow-hidden" style={{ borderColor: 'var(--card-border)', background: 'var(--card-bg)' }}>
                  <NutritionTable data={displayNutrition} />
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div
          className="rounded-2xl border p-8 text-center"
          style={{
            background: 'var(--card-bg)',
            borderColor: 'var(--card-border)',
          }}
        >
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            No nutrition data available. Please compute nutrition first.
          </p>
        </div>
      )}

      {/* Action Buttons */}
      {nutritionData && (
        <NutritionActions onSave={onSave} onDiscard={onDiscard} />
      )}
    </>
  );
}
