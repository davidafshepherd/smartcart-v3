'use client';

import { useState } from 'react';
import type { MealsData, MealData } from '../../lib/types';

interface MealsTreeViewProps {
  mealsData: MealsData;
  selectedMealId: number | null;
  onMealSelect: (meal: MealData) => void;
}

export function MealsTreeView({ mealsData, selectedMealId, onMealSelect }: MealsTreeViewProps) {
  const patientIds = Object.keys(mealsData).sort((a, b) => Number(a) - Number(b));

  const [expandedPatients, setExpandedPatients] = useState<Set<string>>(() => {
    const first = patientIds[0];
    return first ? new Set([first]) : new Set();
  });
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());

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

  const getMealCount = (patientId: string) => {
    return Object.values(mealsData[patientId]).reduce(
      (acc, d) => acc + Object.keys(d).length,
      0
    );
  };

  return (
    <div className="w-80 shrink-0">
      <div
        className="rounded-2xl border overflow-hidden shadow-sm"
        style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
      >
        <div className="p-4 border-b" style={{ borderColor: 'var(--card-border)' }}>
          <h2 className="font-semibold" style={{ color: 'var(--foreground)' }}>
            Patients & Meals
          </h2>
        </div>

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
                onToggle={() => togglePatient(patientId)}
                onToggleDate={toggleDate}
                onMealSelect={onMealSelect}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

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

interface PatientNodeProps {
  patientId: string;
  data: { [date: string]: { [timeRange: string]: MealData } };
  mealCount: number;
  isExpanded: boolean;
  expandedDates: Set<string>;
  selectedMealId: number | null;
  onToggle: () => void;
  onToggleDate: (key: string) => void;
  onMealSelect: (meal: MealData) => void;
}

function PatientNode({
  patientId,
  data,
  mealCount,
  isExpanded,
  expandedDates,
  selectedMealId,
  onToggle,
  onToggleDate,
  onMealSelect,
}: PatientNodeProps) {
  const dates = Object.keys(data).sort().reverse();

  return (
    <div className="mb-1">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors hover:bg-blue-50"
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
        <CountBadge count={mealCount} />
      </button>

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
              onMealSelect={onMealSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface DateNodeProps {
  patientId: string;
  date: string;
  data: { [timeRange: string]: MealData };
  isExpanded: boolean;
  selectedMealId: number | null;
  onToggle: () => void;
  onMealSelect: (meal: MealData) => void;
}

function DateNode({
  date,
  data,
  isExpanded,
  selectedMealId,
  onToggle,
  onMealSelect,
}: DateNodeProps) {
  const timeRanges = Object.keys(data).sort();

  return (
    <div className="mb-1">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors hover:bg-blue-50"
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
        <CountBadge count={timeRanges.length} />
      </button>

      {isExpanded && (
        <div className="ml-6 mt-1">
          {timeRanges.map((timeRange) => {
            const meal = data[timeRange];
            const isSelected = selectedMealId === meal.id;

            return (
              <button
                key={timeRange}
                onClick={() => onMealSelect(meal)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                  isSelected ? '' : 'hover:bg-blue-50'
                }`}
                style={{
                  background: isSelected ? 'var(--accent-primary)' : 'transparent',
                  color: isSelected ? 'white' : 'var(--text-secondary)',
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
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

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

function CountBadge({ count }: { count: number }) {
  return (
    <span
      className="ml-auto text-xs px-2 py-0.5 rounded-full"
      style={{ background: 'var(--accent-light)', color: 'var(--accent-primary)' }}
    >
      {count}
    </span>
  );
}
