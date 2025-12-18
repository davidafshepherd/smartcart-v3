'use client';

import { formatNumber } from '../../../lib/utils';

interface NutritionHeaderProps {
  mass: number;
}

/**
 * Renders the nutrition report header.
 */
export function NutritionHeader({ mass }: NutritionHeaderProps) {
  return (
    <div className="px-6 py-5 border-b bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-2xl" style={{ borderColor: 'var(--card-border)', background: 'var(--accent-light)' }}>
      <div className="flex items-center justify-between">
        <h4 className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>
          Nutrition Report
        </h4>
        <div className="px-4 py-2 rounded-lg border" style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
          <span className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Mass Consumed:</span>
          <span className="text-lg font-bold ml-2" style={{ color: 'var(--accent-primary)' }}>
            {formatNumber(mass, 1)}g
          </span>
        </div>
      </div>
    </div>
  );
}
