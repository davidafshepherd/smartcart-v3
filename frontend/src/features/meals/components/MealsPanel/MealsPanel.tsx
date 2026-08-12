import { ClipboardIcon } from '@/components/common/icons';

import type { Meal, Meals } from '@/types';

import { PatientNode } from './PatientNode';

import './MealsPanel.css';


interface Props {
  meals: Meals;
  selectedMealId: number | null;
  expandedPatients: string[];
  expandedDates: string[];
  onMealClick: (meal: Meal, event: React.MouseEvent) => void;
  onTogglePatient: (patientId: string) => void;
  onToggleDate: (key: string) => void;
  error: string | null;
}


export function MealsPanel({
  meals,
  selectedMealId,
  onMealClick,
  expandedPatients,
  expandedDates,
  onTogglePatient,
  onToggleDate,
  error,
}: Props) {
  // Sort patient IDs numerically.
  const patientIds = Object.keys(meals).sort((a, b) => Number(a) - Number(b));


  // Count total meals across all patients and dates.
  const totalMeals = Object.values(meals).reduce((total, dates) => {
    return total + Object.values(dates).reduce((sum, times) => {
      return sum + Object.keys(times).length;
    }, 0);
  }, 0);


  // Count meals for a single patient across all their dates.
  const getMealCount = (patientId: string) => {
    return Object.values(meals[patientId]).reduce((total, dateData) => {
      return total + Object.keys(dateData).length; 
    }, 0);
  };


  return (
    <div className="meals-panel">
      {/* Header */}
      <div className="meals-panel-header">
        <div className="meals-panel-title">
          <ClipboardIcon className="meals-panel-icon" />
          <span>Meals</span>
          <span className="meals-panel-count">{totalMeals}</span>
        </div>
      </div>

      {/* Data fetch error */}
      {error && (
        <div className="meals-panel-error">{error}</div>
      )} 
      
      {/* Empty state */}
      {!error && patientIds.length === 0 && (
        <div className="meals-panel-empty">
          <div className="meals-panel-empty-icon">
            <ClipboardIcon />
          </div>
          <p>No meals saved yet</p>
        </div>
      )}
      
      {/* Tree of meals*/}
      {!error && patientIds.length > 0 && (
        <div className="meals-panel-tree">
          {patientIds.map(patientId => (
            <PatientNode
              key={patientId}
              patientId={patientId}
              data={meals[patientId]}
              mealCount={getMealCount(patientId)}
              isExpanded={expandedPatients.includes(patientId)}
              expandedDates={expandedDates}
              selectedMealId={selectedMealId}
              onToggle={() => onTogglePatient(patientId)}
              onToggleDate={onToggleDate}
              onMealClick={onMealClick}
            />
          ))}
        </div>
      )}
    </div>
  );
}
