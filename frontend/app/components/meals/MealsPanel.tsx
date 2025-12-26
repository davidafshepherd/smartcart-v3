'use client';

import type { MealsData, MealData } from '../../lib/types';

// =============================================================================
// Type Definitions
// =============================================================================

/** Props for the MealsPanel component. */
interface MealsPanelProps {
  /** Hierarchical meals data organized by patient → date → time. */
  mealsData: MealsData;
  /** ID of the currently selected meal, or null. */
  selectedMealId: number | null;
  /** Callback invoked when a meal is clicked (for context menu). */
  onMealClick: (meal: MealData, event: React.MouseEvent) => void;
  /** Set of expanded patient IDs (controlled). */
  expandedPatients: Set<string>;
  /** Set of expanded date keys (controlled). */
  expandedDates: Set<string>;
  /** Callback to toggle patient expansion. */
  onTogglePatient: (patientId: string) => void;
  /** Callback to toggle date expansion. */
  onToggleDate: (key: string) => void;
}

/** Props for the PatientNode sub-component. */
interface PatientNodeProps {
  /** The patient ID string. */
  patientId: string;
  /** Meals data for this patient, organized by date → time. */
  data: { [date: string]: { [timeRange: string]: MealData } };
  /** Total number of meals for this patient. */
  mealCount: number;
  /** Whether this patient node is expanded. */
  isExpanded: boolean;
  /** Set of expanded date keys for this patient. */
  expandedDates: Set<string>;
  /** Currently selected meal ID, or null. */
  selectedMealId: number | null;
  /** Callback to toggle expansion of this patient node. */
  onToggle: () => void;
  /** Callback to toggle expansion of a date node. */
  onToggleDate: (key: string) => void;
  /** Callback invoked when a meal is clicked. */
  onMealClick: (meal: MealData, event: React.MouseEvent) => void;
}

/** Props for the DateNode sub-component. */
interface DateNodeProps {
  /** The patient ID (for generating unique keys). */
  patientId: string;
  /** The date string (YYYY-MM-DD). */
  date: string;
  /** Meals data for this date, organized by time range. */
  data: { [timeRange: string]: MealData };
  /** Whether this date node is expanded. */
  isExpanded: boolean;
  /** Currently selected meal ID, or null. */
  selectedMealId: number | null;
  /** Callback to toggle expansion of this date node. */
  onToggle: () => void;
  /** Callback invoked when a meal is clicked. */
  onMealClick: (meal: MealData, event: React.MouseEvent) => void;
}

// =============================================================================
// Main Component
// =============================================================================

/**
 * Renders a hierarchical tree view of all meals.
 *
 * @param props - The component props.
 * @returns The meals panel element.
 */
export function MealsPanel({
  mealsData,
  selectedMealId,
  onMealClick,
  expandedPatients,
  expandedDates,
  onTogglePatient,
  onToggleDate,
}: MealsPanelProps) {
  // Sort patient IDs numerically.
  const patientIds = Object.keys(mealsData).sort((a, b) => Number(a) - Number(b));

  /**
   * Calculates the total number of meals for a patient.
   */
  const getMealCount = (patientId: string): number => {
    return Object.values(mealsData[patientId]).reduce(
      (acc, dateData) => acc + Object.keys(dateData).length,
      0
    );
  };

  return (
    <div
      className="rounded-2xl border overflow-hidden shadow-sm"
      style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
    >
        {/* Header */}
        <div
          className="px-4 py-3 border-b flex items-center justify-between"
          style={{ borderColor: 'var(--card-border)' }}
        >
          <div className="flex items-center gap-2">
            <svg
              className="w-4 h-4"
              style={{ color: 'var(--accent-primary)' }}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            <span className="font-medium text-sm" style={{ color: 'var(--foreground)' }}>
              Meals
            </span>
            <span
              className="px-2 py-0.5 rounded-full text-xs font-medium"
              style={{ background: 'var(--accent-light)', color: 'var(--accent-primary)' }}
            >
              {Object.values(mealsData).reduce(
                (total, dates) =>
                  total + Object.values(dates).reduce((sum, times) => sum + Object.keys(times).length, 0),
                0
              )}
            </span>
          </div>
        </div>

        {/* Tree Content */}
        {patientIds.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="p-2 max-h-[600px] overflow-y-auto">
            {patientIds.map((patientId) => (
              <PatientNode
                key={patientId}
                patientId={patientId}
                data={mealsData[patientId]}
                mealCount={getMealCount(patientId)}
                isExpanded={expandedPatients.has(patientId)}
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

// =============================================================================
// Sub-Components
// =============================================================================

/**
 * Renders an empty state when no meals exist.
 */
function EmptyState() {
  return (
    <div className="p-8 text-center">
      <div
        className="w-12 h-12 mx-auto mb-3 rounded-xl flex items-center justify-center"
        style={{ background: 'var(--accent-light)' }}
      >
        <svg
          className="w-6 h-6"
          style={{ color: 'var(--accent-primary)' }}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          />
        </svg>
      </div>
      <p style={{ color: 'var(--text-muted)' }}>No meals saved yet</p>
    </div>
  );
}

/**
 * Renders a patient node in the tree.
 */
function PatientNode({
  patientId,
  data,
  mealCount,
  isExpanded,
  expandedDates,
  selectedMealId,
  onToggle,
  onToggleDate,
  onMealClick,
}: PatientNodeProps) {
  // Sort dates in reverse chronological order.
  const dates = Object.keys(data).sort().reverse();
  
  // Check if patient has any unanalyzed meals
  const hasUnanalyzedMeals = dates.some((date) =>
    Object.values(data[date]).some((meal) => !meal.is_analysed)
  );

  return (
    <div className="mb-1">
      {/* Patient Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors hover:bg-blue-50 cursor-pointer"
      >
        <ChevronIcon isExpanded={isExpanded} />
        <div
          className="w-6 h-6 rounded-full flex items-center justify-center"
          style={{ background: 'var(--accent-primary)', color: 'white' }}
        >
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
          </svg>
        </div>
        <span className="font-medium" style={{ color: 'var(--foreground)' }}>
          Patient #{patientId}
        </span>
        <CountBadge count={mealCount} isAmber={hasUnanalyzedMeals} />
      </button>

      {/* Date Children */}
      {isExpanded && (
        <div className="ml-6 mt-1">
          {dates.map((date) => (
            <DateNode
              key={date}
              patientId={patientId}
              date={date}
              data={data[date]}
              isExpanded={expandedDates.has(`${patientId}-${date}`)}
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

/**
 * Renders a date node in the tree.
 */
function DateNode({
  date,
  data,
  isExpanded,
  selectedMealId,
  onToggle,
  onMealClick,
}: DateNodeProps) {
  // Sort time ranges chronologically.
  const timeRanges = Object.keys(data).sort();
  
  // Check if date has any unanalyzed meals
  const hasUnanalyzedMeals = timeRanges.some((timeRange) => !data[timeRange].is_analysed);

  return (
    <div className="mb-1">
      {/* Date Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors hover:bg-blue-50 cursor-pointer"
      >
        <ChevronIcon isExpanded={isExpanded} />
        <svg
          className="w-4 h-4"
          style={{ color: 'var(--accent-primary)' }}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <span style={{ color: 'var(--text-secondary)' }}>{date}</span>
        <CountBadge count={timeRanges.length} isAmber={hasUnanalyzedMeals} />
      </button>

      {/* Time Range Children (Meals) */}
      {isExpanded && (
        <div className="ml-6 mt-1">
          {timeRanges.map((timeRange) => {
            const meal = data[timeRange];
            const isSelected = selectedMealId === meal.id;

            return (
              <button
                key={timeRange}
                onClick={(e) => onMealClick(meal, e)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  onMealClick(meal, e);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors cursor-pointer"
                style={{
                  background: isSelected ? 'var(--accent-primary)' : 'transparent',
                  color: isSelected ? 'white' : 'var(--text-secondary)',
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.background = '#eff6ff';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>{timeRange}</span>
                {!meal.is_analysed && (
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0 ml-auto mr-1.5"
                    style={{ background: '#f59e0b' }}
                    title="Not analysed"
                  />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * Renders an expand/collapse chevron icon.
 */
function ChevronIcon({ isExpanded }: { isExpanded: boolean }) {
  return (
    <svg
      className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
      style={{ color: 'var(--text-muted)' }}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}

/**
 * Renders a count badge (e.g., number of meals).
 */
function CountBadge({ count, isAmber = false }: { count: number; isAmber?: boolean }) {
  return (
    <span
      className="ml-auto text-xs px-2 py-0.5 rounded-full"
      style={{
        background: isAmber ? '#fde68a' : 'var(--accent-light)',
        color: isAmber ? '#d97706' : 'var(--accent-primary)',
      }}
    >
      {count}
    </span>
  );
}
