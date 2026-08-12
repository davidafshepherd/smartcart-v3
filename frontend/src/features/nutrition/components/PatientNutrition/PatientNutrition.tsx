import { BarChartIcon, TableIcon, TimeSeriesIcon } from '@/components/common/icons';

import { generateNutrientDisplayName } from '@/utils/nutrition';

import type { MealNutrition, NutritionQuery } from '@/types';

import { NutritionTable } from '../NutritionTable/NutritionTable';
import { TimePlot } from '../TimePlot/TimePlot';

import './PatientNutrition.css';


interface Props {
  fetchMessage: string | null;
  fetchError: boolean;
  isFetching: boolean;
  summedNutrition: MealNutrition | null;
  averageNutrition: MealNutrition | null;
  nutrientKeys: string[];
  selectedNutrient: string;
  onSelectedNutrientChange: (key: string) => void;
  xLabels: string[];
  yValues: number[];
  nutritionQuery: NutritionQuery | null;
}


export function PatientNutrition({
  fetchMessage,
  fetchError,
  isFetching,
  summedNutrition, 
  averageNutrition,
  nutrientKeys, 
  selectedNutrient, 
  onSelectedNutrientChange,
  xLabels, 
  yValues,
  nutritionQuery,
}: Props) {
  return (
    <>
      {/* Empty state */}
      {!summedNutrition && !isFetching && !fetchMessage && (
        <div className="patient-nutrition-empty">
          <div className="patient-nutrition-empty-icon">
            <BarChartIcon className="patient-nutrition-empty-icon-svg" />
          </div>
          <p className="patient-nutrition-empty-title">No data to display</p>
          <p className="patient-nutrition-empty-subtitle">
            Select a patient and date range to visualise their nutritional intake over time
          </p>
        </div>
      )}

      {/* Loading state */}
      {isFetching && (
        <div className="patient-nutrition-loading">
          <div className="patient-nutrition-loading-shimmer shimmer" />
        </div>
      )}

      {/* Error state */}
      {!isFetching && fetchMessage && (
        <div className="patient-nutrition-message-card">
          <p className={fetchError ? "patient-nutrition-error" : "patient-nutrition-message"}>{fetchMessage}</p>
        </div>
      )}


      {/* Results */}
      {summedNutrition && averageNutrition && !isFetching && (
        <div className="patient-nutrition-results">
          {/* Time series chart */}
          <div className="patient-nutrition-card">
            {/* Nutrient selector */}
            <div className="patient-nutrition-card-header patient-nutrition-card-header-row">
              <div className="patient-nutrition-card-header-left">
                <TimeSeriesIcon className="patient-nutrition-card-header-icon" />
                <span>Time Series</span>
              </div>

              <select
                className="patient-nutrition-nutrient-select"
                value={selectedNutrient}
                onChange={e => onSelectedNutrientChange(e.target.value)}
              >
                {nutrientKeys.map(key => (<option key={key} value={key}>{generateNutrientDisplayName(key)}</option>))}
              </select>
            </div>
            
            {/* Time plot */}
            <div className="patient-nutrition-chart-body">
              <TimePlot
                key={`${nutritionQuery?.patientId}-${nutritionQuery?.start}-${nutritionQuery?.end}-${selectedNutrient}`}
                xLabels={xLabels}
                yValues={yValues}
                label={generateNutrientDisplayName(selectedNutrient)}
              />
            </div>
          </div>

          {/* Average nutrition per day */}
          <div className="patient-nutrition-card">
            <div className="patient-nutrition-card-header">
              <TableIcon className="patient-nutrition-card-header-icon" />
              <span>Average Nutrition Per Day</span>
            </div>
            <NutritionTable nutrition={averageNutrition} perDay />
          </div>
        </div>
      )}
    </>
  );
}
