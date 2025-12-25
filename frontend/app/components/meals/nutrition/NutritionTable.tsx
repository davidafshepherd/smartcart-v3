'use client';

import { useState } from 'react';
import { convertToGrams, formatNutritionValue, calculateTotalMacros } from '../../../lib/utils';

interface NutritionData {
  kcal: number | null | undefined;
  kj: number | null | undefined;
  protein: number | null | undefined;
  fat: number | null | undefined;
  carbohydrate: number | null | undefined;
  sugar: number | null | undefined;
  fibre: number | null | undefined;
  saturated_fat: number | null | undefined;
  sodium: number | null | undefined;
  potassium: number | null | undefined;
  calcium: number | null | undefined;
  magnesium: number | null | undefined;
  phosphorus: number | null | undefined;
  iron: number | null | undefined;
  copper: number | null | undefined;
  zinc: number | null | undefined;
  selenium: number | null | undefined;
  iodine: number | null | undefined;
  retinol: number | null | undefined;
  carotene: number | null | undefined;
  vitamin_d: number | null | undefined;
  vitamin_e: number | null | undefined;
  vitamin_k1: number | null | undefined;
  thiamin: number | null | undefined;
  riboflavin: number | null | undefined;
  niacin: number | null | undefined;
  vitamin_b6: number | null | undefined;
  vitamin_b12: number | null | undefined;
  folate: number | null | undefined;
  vitamin_c: number | null | undefined;
}

interface NutritionTableProps {
  data: NutritionData;
}

/**
 * Renders a nutrition table with tabs for different nutrient categories.
 */
export function NutritionTable({ data }: NutritionTableProps) {
  const [tableTab, setTableTab] = useState<string>('macros');

  // Color palette for different nutrients
  const getNutrientColor = (label: string): string => {
    const colors: { [key: string]: string } = {
      // Macronutrients
      'Energy (kcal)': '#ef4444',
      'Energy (kJ)': '#f97316',
      'Protein': '#3b82f6',
      'Fat': '#f59e0b',
      'Carbohydrate': '#10b981',
      'Sugar': '#ec4899',
      'Fibre': '#8b5cf6',
      'Saturated Fat': '#f43f5e',
      // Minerals
      'Sodium': '#06b6d4',
      'Potassium': '#14b8a6',
      'Calcium': '#6366f1',
      'Magnesium': '#a855f7',
      'Phosphorus': '#ec4899',
      'Iron': '#dc2626',
      'Copper': '#ea580c',
      'Zinc': '#f59e0b',
      'Selenium': '#84cc16',
      'Iodine': '#22c55e',
      // Vitamins
      'Retinol (A)': '#f59e0b',
      'Carotene': '#f97316',
      'Vitamin D': '#eab308',
      'Vitamin E': '#84cc16',
      'Vitamin K1': '#22c55e',
      'Thiamin (B1)': '#3b82f6',
      'Riboflavin (B2)': '#6366f1',
      'Niacin (B3)': '#8b5cf6',
      'Vitamin B6': '#a855f7',
      'Vitamin B12': '#ec4899',
      'Folate': '#f43f5e',
      'Vitamin C': '#ef4444',
    };
    return colors[label] || '#64748b';
  };

  const tableRow = (
    label: string,
    value: number | null | undefined,
    unit: string,
    decimals: number,
    totalValue: number,
    showBar: boolean = true
  ) => {
    // Convert value to grams for comparison
    const numericValueInGrams = convertToGrams(value, unit);
    const percentage = totalValue > 0 ? (numericValueInGrams / totalValue) * 100 : 0;
    const color = getNutrientColor(label);
    const displayValue = formatNutritionValue(value, unit, decimals);

    return (
      <>
        <tr
          className="border-b"
          style={{
            borderColor: 'var(--card-border)',
          }}
        >
          <td className="px-4 py-3 font-medium" style={{ color: 'var(--foreground)' }}>
            {label}
          </td>
          <td className="px-4 py-3 text-right font-semibold" style={{ color: 'var(--foreground)' }}>
            {displayValue}
          </td>
        </tr>
        {showBar && (
          <tr>
            <td colSpan={2} className="p-0">
              <div className="w-full h-1.5 relative overflow-hidden">
                <div
                  className="h-full absolute left-0 top-0 transition-all duration-300"
                  style={{
                    width: `${percentage}%`,
                    background: color,
                  }}
                />
              </div>
            </td>
          </tr>
        )}
      </>
    );
  };

  // Calculate total from data (protein + fat + carbohydrate) for all bars
  const totalMacrosValue = calculateTotalMacros(data);

  const renderTableContent = () => {
    if (tableTab === 'macros') {
      return (
        <>
          {tableRow('Energy (kcal)', data.kcal, 'kcal', 0, totalMacrosValue, false)}
          {tableRow('Energy (kJ)', data.kj, 'kJ', 0, totalMacrosValue, false)}
          {tableRow('Protein', data.protein, 'g', 1, totalMacrosValue)}
          {tableRow('Carbohydrate', data.carbohydrate, 'g', 1, totalMacrosValue)}
          {tableRow('Fibre', data.fibre, 'g', 1, totalMacrosValue)}
          {tableRow('Sugar', data.sugar, 'g', 1, totalMacrosValue)}
          {tableRow('Fat', data.fat, 'g', 1, totalMacrosValue)}
          {tableRow('Saturated Fat', data.saturated_fat, 'g', 1, totalMacrosValue)}
        </>
      );
    } else if (tableTab === 'minerals') {
      return (
        <>
          {tableRow('Sodium', data.sodium, 'mg', 1, totalMacrosValue, false)}
          {tableRow('Potassium', data.potassium, 'mg', 1, totalMacrosValue, false)}
          {tableRow('Calcium', data.calcium, 'mg', 1, totalMacrosValue, false)}
          {tableRow('Magnesium', data.magnesium, 'mg', 1, totalMacrosValue, false)}
          {tableRow('Phosphorus', data.phosphorus, 'mg', 1, totalMacrosValue, false)}
          {tableRow('Iron', data.iron, 'mg', 2, totalMacrosValue, false)}
          {tableRow('Copper', data.copper, 'mg', 2, totalMacrosValue, false)}
          {tableRow('Zinc', data.zinc, 'mg', 2, totalMacrosValue, false)}
          {tableRow('Selenium', data.selenium, 'μg', 1, totalMacrosValue, false)}
          {tableRow('Iodine', data.iodine, 'μg', 1, totalMacrosValue, false)}
        </>
      );
    } else {
      return (
        <>
          {tableRow('Retinol (A)', data.retinol, 'μg', 1, totalMacrosValue, false)}
          {tableRow('Carotene', data.carotene, 'μg', 1, totalMacrosValue, false)}
          {tableRow('Vitamin D', data.vitamin_d, 'μg', 2, totalMacrosValue, false)}
          {tableRow('Vitamin E', data.vitamin_e, 'mg', 2, totalMacrosValue, false)}
          {tableRow('Vitamin K1', data.vitamin_k1, 'μg', 1, totalMacrosValue, false)}
          {tableRow('Thiamin (B1)', data.thiamin, 'mg', 2, totalMacrosValue, false)}
          {tableRow('Riboflavin (B2)', data.riboflavin, 'mg', 2, totalMacrosValue, false)}
          {tableRow('Niacin (B3)', data.niacin, 'mg', 2, totalMacrosValue, false)}
          {tableRow('Vitamin B6', data.vitamin_b6, 'mg', 2, totalMacrosValue, false)}
          {tableRow('Vitamin B12', data.vitamin_b12, 'μg', 2, totalMacrosValue, false)}
          {tableRow('Folate', data.folate, 'μg', 1, totalMacrosValue, false)}
          {tableRow('Vitamin C', data.vitamin_c, 'mg', 1, totalMacrosValue, false)}
        </>
      );
    }
  };

  return (
    <div>
      {/* Table Tabs */}
      <div className="border-b mb-0" style={{ borderColor: 'var(--card-border)' }}>
        <nav className="flex space-x-1">
          <button
            onClick={() => setTableTab('macros')}
            className={`px-4 py-2 text-sm font-semibold whitespace-nowrap border-b-2 transition-all duration-200 cursor-pointer ${
              tableTab === 'macros' ? '' : 'hover:bg-gray-50'
            }`}
            style={{
              color: tableTab === 'macros' ? 'var(--accent-primary)' : 'var(--text-muted)',
              borderBottomColor: tableTab === 'macros' ? 'var(--accent-primary)' : 'transparent',
              borderBottomWidth: tableTab === 'macros' ? '3px' : '2px',
            }}
          >
            Macronutrients
          </button>
          <button
            onClick={() => setTableTab('minerals')}
            className={`px-4 py-2 text-sm font-semibold whitespace-nowrap border-b-2 transition-all duration-200 cursor-pointer ${
              tableTab === 'minerals' ? '' : 'hover:bg-gray-50'
            }`}
            style={{
              color: tableTab === 'minerals' ? 'var(--accent-primary)' : 'var(--text-muted)',
              borderBottomColor: tableTab === 'minerals' ? 'var(--accent-primary)' : 'transparent',
              borderBottomWidth: tableTab === 'minerals' ? '3px' : '2px',
            }}
          >
            Minerals
          </button>
          <button
            onClick={() => setTableTab('vitamins')}
            className={`px-4 py-2 text-sm font-semibold whitespace-nowrap border-b-2 transition-all duration-200 cursor-pointer ${
              tableTab === 'vitamins' ? '' : 'hover:bg-gray-50'
            }`}
            style={{
              color: tableTab === 'vitamins' ? 'var(--accent-primary)' : 'var(--text-muted)',
              borderBottomColor: tableTab === 'vitamins' ? 'var(--accent-primary)' : 'transparent',
              borderBottomWidth: tableTab === 'vitamins' ? '3px' : '2px',
            }}
          >
            Vitamins
          </button>
        </nav>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse" style={{ borderColor: 'var(--card-border)' }}>
          <thead>
            <tr style={{ background: 'var(--card-border)', borderColor: 'var(--card-border)' }}>
              <th className="px-4 py-3 text-left font-semibold border-b" style={{ color: 'var(--foreground)', borderColor: 'var(--card-border)' }}>
                Nutrient
              </th>
              <th className="px-4 py-3 text-right font-semibold border-b" style={{ color: 'var(--foreground)', borderColor: 'var(--card-border)' }}>
                Amount
              </th>
            </tr>
          </thead>
          <tbody>
            {renderTableContent()}
          </tbody>
        </table>
      </div>
    </div>
  );
}
