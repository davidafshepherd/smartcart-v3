import { ChevronRightIcon, UserSolidIcon } from '@/components/common/icons';

import type { Meal } from '@/types';

import { DateNode } from './DateNode';


interface Props {
  patientId: string;
  data: { [date: string]: { [timeRange: string]: Meal } };
  mealCount: number;
  isExpanded: boolean;
  expandedDates: string[];
  selectedMealId: number | null;
  onToggle: () => void;
  onToggleDate: (key: string) => void;
  onMealClick: (meal: Meal, event: React.MouseEvent) => void;
}


export function PatientNode({
  patientId,
  data,
  mealCount,
  isExpanded,
  expandedDates,
  selectedMealId,
  onToggle,
  onToggleDate,
  onMealClick,
}: Props) {
  // Sort dates in reverse chronological order.
  const dates = Object.keys(data).sort().reverse();

  // Check if patient has any unanalysed meals.
  const hasUnanalyzed = dates.some(date => Object.values(data[date]).some(meal => !meal.is_analysed));

  return (
    <div className="meals-tree-node">
      {/* Patient header */}
      <button className="meals-tree-node-header" onClick={onToggle}>
        <ChevronRightIcon className={`meals-tree-chevron ${isExpanded ? "expanded" : ""}`} />

        <div className="meals-patient-avatar">
          <UserSolidIcon />
        </div>

        <span className="meals-tree-label">Patient #{patientId}</span>
        <span className={`meals-tree-badge ${hasUnanalyzed ? "amber" : ""}`}>{mealCount}</span>
      </button>

      {/* Date children */}
      {isExpanded && (
        <div className="meals-tree-children">
          {dates.map(date => (
            <DateNode
              key={date}
              date={date}
              data={data[date]}
              isExpanded={expandedDates.includes(`${patientId}-${date}`)}
              selectedMealId={selectedMealId}
              onToggle={() => onToggleDate(`${patientId}-${date}`)}
              onMealClick={onMealClick}
            />
          ))}
        </div>
      )}
    </div>
  );
}
