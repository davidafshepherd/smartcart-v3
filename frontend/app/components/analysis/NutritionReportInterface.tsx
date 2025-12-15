/**
 * @fileoverview Nutrition Report interface component for meal analysis.
 *
 * Displays the nutrition report with save functionality.
 * Shared between points and boxes input modes.
 */

'use client';

import { useState } from 'react';
import type { ComputeNutritionResponse, Food } from '../../lib/types';

interface NutritionReportInterfaceProps {
  nutritionData: ComputeNutritionResponse | null;
  foods?: Food[];
  onSave: () => void;
}

export function NutritionReportInterface({ nutritionData, foods = [], onSave }: NutritionReportInterfaceProps) {
  // Tab state: 'total' for total nutrition, or food_id for individual foods
  const [activeTab, setActiveTab] = useState<string>('total');

  const getFoodName = (foodId: number): string => {
    const food = foods.find((f) => f.id === foodId);
    if (!food) return `Food ${foodId}`;
    return food.short_name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const formatNumber = (value: number | null | undefined, decimals: number = 1): string => {
    if (value === null || value === undefined) return 'N/A';
    return value.toFixed(decimals);
  };

  const formatLabel = (key: string): string => {
    return key
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  // Helper to render nutrition value
  const renderNutritionValue = (label: string, value: number | null | undefined, unit: string = 'g', decimals: number = 1) => {
    return (
      <div>
        <span className="text-xs block mb-1" style={{ color: 'var(--text-muted)' }}>
          {label}
        </span>
        <p className="font-medium" style={{ color: 'var(--foreground)' }}>
          {value === null || value === undefined ? 'N/A' : `${formatNumber(value, decimals)} ${unit}`}
        </p>
      </div>
    );
  };

  // Helper to render nutrition value for totals (larger)
  const renderTotalNutritionValue = (label: string, value: number | null | undefined, unit: string = 'g', decimals: number = 1) => {
    return (
      <div>
        <span className="text-xs block mb-1" style={{ color: 'var(--text-muted)' }}>
          {label}
        </span>
        <p className="text-xl font-semibold" style={{ color: 'var(--foreground)' }}>
          {value === null || value === undefined ? 'N/A' : `${formatNumber(value, decimals)} ${unit}`}
        </p>
      </div>
    );
  };
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="px-8 pt-8 pb-4 border-b" style={{ borderColor: 'var(--card-border)' }}>
        <div>
          <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--foreground)' }}>
            Nutrition Report
          </h2>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            View nutritional information based on computed food masses.
          </p>
        </div>
      </div>

      {/* Report Content */}
      <div className="px-8 py-4">
        {nutritionData ? (
          <div className="space-y-4">
            {/* Tabs */}
            <div className="border-b" style={{ borderColor: 'var(--card-border)' }}>
              <nav className="flex space-x-1 overflow-x-auto">
                {/* Total Nutrition Tab */}
                <button
                  onClick={() => setActiveTab('total')}
                  className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors cursor-pointer ${
                    activeTab === 'total'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                  style={{
                    color: activeTab === 'total' ? 'var(--accent-primary)' : 'var(--text-muted)',
                    borderBottomColor: activeTab === 'total' ? 'var(--accent-primary)' : 'transparent',
                  }}
                >
                  Total Nutrition
                </button>
                {/* Food Tabs */}
                {nutritionData.food_nutrition.map((foodNut, index) => (
                  <button
                    key={`food-${foodNut.food_id}-${index}`}
                    onClick={() => setActiveTab(foodNut.food_id.toString())}
                    className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors cursor-pointer ${
                      activeTab === foodNut.food_id.toString()
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                    style={{
                      color: activeTab === foodNut.food_id.toString() ? 'var(--accent-primary)' : 'var(--text-muted)',
                      borderBottomColor: activeTab === foodNut.food_id.toString() ? 'var(--accent-primary)' : 'transparent',
                    }}
                  >
                    {getFoodName(foodNut.food_id)}
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab Content */}
            <div>
              {/* Total Nutrition Content */}
              {activeTab === 'total' && (
                <div
                  className="rounded-lg border p-6"
                  style={{
                    background: 'var(--background)',
                    borderColor: 'var(--card-border)',
                  }}
                >
                  <div className="flex items-center justify-between mb-6">
                    <h4 className="text-xl font-semibold" style={{ color: 'var(--foreground)' }}>
                      Total Nutrition
                    </h4>
                    <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                      Mass: {formatNumber(nutritionData.meal_nutrition.mass, 1)}g
                    </span>
                  </div>

                  {/* Basic Macronutrients */}
                  <div className="mb-6">
                    <h5 className="text-base font-semibold mb-3" style={{ color: 'var(--foreground)' }}>
                      Macronutrients
                    </h5>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {renderTotalNutritionValue('Energy (kcal)', nutritionData.meal_nutrition.kcal, 'kcal', 0)}
                      {renderTotalNutritionValue('Energy (kJ)', nutritionData.meal_nutrition.kj, 'kJ', 0)}
                      {renderTotalNutritionValue('Protein', nutritionData.meal_nutrition.protein)}
                      {renderTotalNutritionValue('Fat', nutritionData.meal_nutrition.fat)}
                      {renderTotalNutritionValue('Carbohydrate', nutritionData.meal_nutrition.carbohydrate)}
                      {renderTotalNutritionValue('Sugar', nutritionData.meal_nutrition.sugar)}
                      {renderTotalNutritionValue('Fibre', nutritionData.meal_nutrition.fibre)}
                      {renderTotalNutritionValue('Saturated Fat', nutritionData.meal_nutrition.saturated_fat)}
                    </div>
                  </div>

                  {/* Minerals */}
                  <div className="mb-6">
                    <h5 className="text-base font-semibold mb-3" style={{ color: 'var(--foreground)' }}>
                      Minerals
                    </h5>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {renderTotalNutritionValue('Sodium', nutritionData.meal_nutrition.sodium, 'mg', 1)}
                      {renderTotalNutritionValue('Potassium', nutritionData.meal_nutrition.potassium, 'mg', 1)}
                      {renderTotalNutritionValue('Calcium', nutritionData.meal_nutrition.calcium, 'mg', 1)}
                      {renderTotalNutritionValue('Magnesium', nutritionData.meal_nutrition.magnesium, 'mg', 1)}
                      {renderTotalNutritionValue('Phosphorus', nutritionData.meal_nutrition.phosphorus, 'mg', 1)}
                      {renderTotalNutritionValue('Iron', nutritionData.meal_nutrition.iron, 'mg', 2)}
                      {renderTotalNutritionValue('Copper', nutritionData.meal_nutrition.copper, 'mg', 2)}
                      {renderTotalNutritionValue('Zinc', nutritionData.meal_nutrition.zinc, 'mg', 2)}
                      {renderTotalNutritionValue('Selenium', nutritionData.meal_nutrition.selenium, 'μg', 1)}
                      {renderTotalNutritionValue('Iodine', nutritionData.meal_nutrition.iodine, 'μg', 1)}
                    </div>
                  </div>

                  {/* Vitamins */}
                  <div>
                    <h5 className="text-base font-semibold mb-3" style={{ color: 'var(--foreground)' }}>
                      Vitamins
                    </h5>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {renderTotalNutritionValue('Retinol (A)', nutritionData.meal_nutrition.retinol, 'μg', 1)}
                      {renderTotalNutritionValue('Carotene', nutritionData.meal_nutrition.carotene, 'μg', 1)}
                      {renderTotalNutritionValue('Vitamin D', nutritionData.meal_nutrition.vitamin_d, 'μg', 2)}
                      {renderTotalNutritionValue('Vitamin E', nutritionData.meal_nutrition.vitamin_e, 'mg', 2)}
                      {renderTotalNutritionValue('Vitamin K1', nutritionData.meal_nutrition.vitamin_k1, 'μg', 1)}
                      {renderTotalNutritionValue('Thiamin (B1)', nutritionData.meal_nutrition.thiamin, 'mg', 2)}
                      {renderTotalNutritionValue('Riboflavin (B2)', nutritionData.meal_nutrition.riboflavin, 'mg', 2)}
                      {renderTotalNutritionValue('Niacin (B3)', nutritionData.meal_nutrition.niacin, 'mg', 2)}
                      {renderTotalNutritionValue('Vitamin B6', nutritionData.meal_nutrition.vitamin_b6, 'mg', 2)}
                      {renderTotalNutritionValue('Vitamin B12', nutritionData.meal_nutrition.vitamin_b12, 'μg', 2)}
                      {renderTotalNutritionValue('Folate', nutritionData.meal_nutrition.folate, 'μg', 1)}
                      {renderTotalNutritionValue('Vitamin C', nutritionData.meal_nutrition.vitamin_c, 'mg', 1)}
                    </div>
                  </div>
                </div>
              )}

              {/* Individual Food Content */}
              {nutritionData.food_nutrition.map((foodNut, index) => (
                activeTab === foodNut.food_id.toString() && (
                  <div
                    key={`food-content-${foodNut.food_id}-${index}`}
                    className="rounded-lg border p-6"
                    style={{
                      background: 'var(--background)',
                      borderColor: 'var(--card-border)',
                    }}
                  >
                    <div className="flex items-center justify-between mb-6">
                      <h4 className="text-xl font-semibold" style={{ color: 'var(--foreground)' }}>
                        {getFoodName(foodNut.food_id)}
                      </h4>
                      <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                        Mass: {formatNumber(foodNut.mass, 1)}g
                      </span>
                    </div>

                    {/* Basic Macronutrients */}
                    <div className="mb-6">
                      <h5 className="text-base font-semibold mb-3" style={{ color: 'var(--foreground)' }}>
                        Macronutrients
                      </h5>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {renderTotalNutritionValue('Energy (kcal)', foodNut.kcal, 'kcal', 0)}
                        {renderTotalNutritionValue('Energy (kJ)', foodNut.kj, 'kJ', 0)}
                        {renderTotalNutritionValue('Protein', foodNut.protein)}
                        {renderTotalNutritionValue('Fat', foodNut.fat)}
                        {renderTotalNutritionValue('Carbohydrate', foodNut.carbohydrate)}
                        {renderTotalNutritionValue('Sugar', foodNut.sugar)}
                        {renderTotalNutritionValue('Fibre', foodNut.fibre)}
                        {renderTotalNutritionValue('Saturated Fat', foodNut.saturated_fat)}
                      </div>
                    </div>

                    {/* Minerals */}
                    <div className="mb-6">
                      <h5 className="text-base font-semibold mb-3" style={{ color: 'var(--foreground)' }}>
                        Minerals
                      </h5>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {renderTotalNutritionValue('Sodium', foodNut.sodium, 'mg', 1)}
                        {renderTotalNutritionValue('Potassium', foodNut.potassium, 'mg', 1)}
                        {renderTotalNutritionValue('Calcium', foodNut.calcium, 'mg', 1)}
                        {renderTotalNutritionValue('Magnesium', foodNut.magnesium, 'mg', 1)}
                        {renderTotalNutritionValue('Phosphorus', foodNut.phosphorus, 'mg', 1)}
                        {renderTotalNutritionValue('Iron', foodNut.iron, 'mg', 2)}
                        {renderTotalNutritionValue('Copper', foodNut.copper, 'mg', 2)}
                        {renderTotalNutritionValue('Zinc', foodNut.zinc, 'mg', 2)}
                        {renderTotalNutritionValue('Selenium', foodNut.selenium, 'μg', 1)}
                        {renderTotalNutritionValue('Iodine', foodNut.iodine, 'μg', 1)}
                      </div>
                    </div>

                    {/* Vitamins */}
                    <div>
                      <h5 className="text-base font-semibold mb-3" style={{ color: 'var(--foreground)' }}>
                        Vitamins
                      </h5>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {renderTotalNutritionValue('Retinol (A)', foodNut.retinol, 'μg', 1)}
                        {renderTotalNutritionValue('Carotene', foodNut.carotene, 'μg', 1)}
                        {renderTotalNutritionValue('Vitamin D', foodNut.vitamin_d, 'μg', 2)}
                        {renderTotalNutritionValue('Vitamin E', foodNut.vitamin_e, 'mg', 2)}
                        {renderTotalNutritionValue('Vitamin K1', foodNut.vitamin_k1, 'μg', 1)}
                        {renderTotalNutritionValue('Thiamin (B1)', foodNut.thiamin, 'mg', 2)}
                        {renderTotalNutritionValue('Riboflavin (B2)', foodNut.riboflavin, 'mg', 2)}
                        {renderTotalNutritionValue('Niacin (B3)', foodNut.niacin, 'mg', 2)}
                        {renderTotalNutritionValue('Vitamin B6', foodNut.vitamin_b6, 'mg', 2)}
                        {renderTotalNutritionValue('Vitamin B12', foodNut.vitamin_b12, 'μg', 2)}
                        {renderTotalNutritionValue('Folate', foodNut.folate, 'μg', 1)}
                        {renderTotalNutritionValue('Vitamin C', foodNut.vitamin_c, 'mg', 1)}
                      </div>
                    </div>
                  </div>
                )
              ))}
            </div>
          </div>
        ) : (
          <div
            className="rounded-xl border p-8 text-center"
            style={{
              background: 'var(--background)',
              borderColor: 'var(--card-border)',
            }}
          >
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              No nutrition data available. Please compute nutrition first.
            </p>
          </div>
        )}
      </div>

      {/* Save Nutrition Report Button */}
      <div className="px-8 py-4 border-t" style={{ borderColor: 'var(--card-border)' }}>
        <button
          onClick={onSave}
          className="px-6 py-3 rounded-xl font-semibold transition-all hover:shadow-md cursor-pointer"
          style={{
            background: 'var(--accent-primary)',
            color: 'white',
          }}
        >
          Save Nutrition Report
        </button>
      </div>
    </div>
  );
}
