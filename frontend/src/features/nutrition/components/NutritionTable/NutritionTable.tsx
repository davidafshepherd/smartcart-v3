import { Fragment, useState } from 'react';

import { calculateTotalMacros, convertToGrams, formatNutritionValue } from '@/utils/nutrition';

import type { MealNutrition } from '@/types';

import './NutritionTable.css';


interface NutrientRow {
  key: keyof MealNutrition;
  label: string;
  unit: string;
  barColor?: string;
}

// Rows for the Macronutrients tab.
const MACROS: NutrientRow[] = [
  { key: "kcal",          label: "Energy (kcal)", unit: "kcal" },
  { key: "kj",            label: "Energy (kJ)",   unit: "kJ"   },
  { key: "protein",       label: "Protein",       unit: "g",   barColor: "#3b82f6" },
  { key: "carbohydrate",  label: "Carbohydrate",  unit: "g",   barColor: "#10b981" },
  { key: "fibre",         label: "Fibre",         unit: "g",   barColor: "#8b5cf6" },
  { key: "sugar",         label: "Sugar",         unit: "g",   barColor: "#ec4899" },
  { key: "fat",           label: "Fat",           unit: "g",   barColor: "#f59e0b" },
  { key: "saturated_fat", label: "Saturated Fat", unit: "g",   barColor: "#f43f5e" },
];

// Rows for the Minerals tab.
const MINERALS: NutrientRow[] = [
  { key: "sodium",     label: "Sodium",     unit: "mg" },
  { key: "potassium",  label: "Potassium",  unit: "mg" },
  { key: "calcium",    label: "Calcium",    unit: "mg" },
  { key: "magnesium",  label: "Magnesium",  unit: "mg" },
  { key: "phosphorus", label: "Phosphorus", unit: "mg" },
  { key: "iron",       label: "Iron",       unit: "mg" },
  { key: "copper",     label: "Copper",     unit: "mg" },
  { key: "zinc",       label: "Zinc",       unit: "mg" },
  { key: "selenium",   label: "Selenium",   unit: "μg" },
  { key: "iodine",     label: "Iodine",     unit: "μg" },
];

// Rows for the Vitamins tab.
const VITAMINS: NutrientRow[] = [
  { key: "retinol",     label: "Retinol",         unit: "μg" },
  { key: "carotene",    label: "Carotene",        unit: "μg" },
  { key: "vitamin_d",   label: "Vitamin D",       unit: "μg" },
  { key: "vitamin_e",   label: "Vitamin E",       unit: "mg" },
  { key: "vitamin_k1",  label: "Vitamin K1",      unit: "μg" },
  { key: "thiamin",     label: "Thiamin (B1)",    unit: "mg" },
  { key: "riboflavin",  label: "Riboflavin (B2)", unit: "mg" },
  { key: "niacin",      label: "Niacin (B3)",     unit: "mg" },
  { key: "vitamin_b6",  label: "Vitamin B6",      unit: "mg" },
  { key: "vitamin_b12", label: "Vitamin B12",     unit: "μg" },
  { key: "folate",      label: "Folate",          unit: "μg" },
  { key: "vitamin_c",   label: "Vitamin C",       unit: "mg" },
];


type Tab = "macros" | "minerals" | "vitamins";

// Tab definitions in display order.
const TABS: { id: Tab; label: string; rows: NutrientRow[] }[] = [
  { id: "macros",   label: "Macronutrients", rows: MACROS   },
  { id: "minerals", label: "Minerals",       rows: MINERALS },
  { id: "vitamins", label: "Vitamins",       rows: VITAMINS },
];


interface Props {
  nutrition: MealNutrition;
  perDay?: boolean;
}


export function NutritionTable({ nutrition, perDay = false }: Props) {
  // Active tab.
  const [activeTab, setActiveTab] = useState<Tab>("macros");


  // Total macro grams. Rows for the active tab.
  const totalMacros = calculateTotalMacros(nutrition);
  const rows = TABS.find(t => t.id === activeTab)!.rows;

  
  // Appends "/ day" to the unit for per-day averaged reports.
  const formatUnit = (unit: string): string => {
    return perDay ? `${unit} / day` : unit;
  }


  return (
    <div className="nutrition-table">
      {/* Tab switcher */}
      <div className="nutrition-table-tabs">
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={`nutrition-table-tab ${activeTab === tab.id ? "nutrition-table-tab-active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Scrollable nutrient rows */}
      <div className="nutrition-table-scroll">
        <table className="nutrition-table-grid">
          <tbody>
            {rows.map(row => {
              const value = nutrition[row.key];
              const barPct = row.barColor && totalMacros > 0
                ? Math.min(100, (convertToGrams(value, row.unit) / totalMacros) * 100)
                : 0;

              return (
                /* Scrollable nutrient row */
                <Fragment key={row.key}>
                  {/* Nutrient name and formatted value */}
                  <tr className="nutrition-table-row">
                    <td className="nutrition-table-label">{row.label}</td>
                    <td className="nutrition-table-value">{formatNutritionValue(value, formatUnit(row.unit))}</td>
                  </tr>

                  {/* Progress bar strip */}
                  {row.barColor && (
                    <tr>
                      <td colSpan={2} className="nutrition-table-bar-cell">
                        <div className="nutrition-table-bar-track">
                          <div
                            className="nutrition-table-bar-fill"
                            style={{ width: `${barPct}%`, background: row.barColor }}
                          />
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
