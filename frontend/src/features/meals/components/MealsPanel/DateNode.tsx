import { CalendarIcon, ChevronRightIcon, ClockIcon } from '@/components/common/icons';
import { parseYYYYMMDD } from '@/utils/date';

import type { Meal } from '@/types';

interface Props {
  date: string;
  data: { [timeRange: string]: Meal };
  isExpanded: boolean;
  selectedMealId: number | null;
  onToggle: () => void;
  onMealClick: (meal: Meal, event: React.MouseEvent) => void;
}


export function DateNode({ date, data, isExpanded, selectedMealId, onToggle, onMealClick }: Props) {
  // Sort time ranges chronologically.
  const timeRanges = Object.keys(data).sort();

  // Check if date has any unanalysed meals.
  const hasUnanalyzed = timeRanges.some(tr => !data[tr].is_analysed);

  return (
    <div className="meals-tree-node">
      {/* Date header */}
      <button className="meals-tree-node-header" onClick={onToggle}>
        <ChevronRightIcon className={`meals-tree-chevron ${isExpanded ? "expanded" : ""}`} />
        <CalendarIcon className="meals-date-icon" />

        <span className="meals-tree-label secondary">{parseYYYYMMDD(date)}</span>
        <span className={`meals-tree-badge ${hasUnanalyzed ? "amber" : ""}`}>{timeRanges.length}</span>
      </button>

      {/* Time range children (meals) */}
      {isExpanded && (
        <div className="meals-tree-children">
          {timeRanges.map(timeRange => {
            const meal = data[timeRange];
            const isSelected = selectedMealId === meal.id;
            return (
              <button
                className={`meals-tree-meal ${isSelected ? 'selected' : ''}`}
                key={timeRange}
                onClick={e => onMealClick(meal, e)}
                onContextMenu={e => { e.preventDefault(); onMealClick(meal, e); }}
              >
                <ClockIcon className="meals-tree-clock" />

                <span>{timeRange}</span>

                {!meal.is_analysed && (<span className="meals-tree-dot" title="Not analysed" />)}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
