'use client';

import { formatNumber } from '../../../lib/utils';

interface NutritionWheelProps {
  protein: number | null | undefined;
  carbs: number | null | undefined;
  fat: number | null | undefined;
}

/**
 * Renders a nutrition wheel (pie chart) showing macronutrient breakdown.
 */
export function NutritionWheel({ protein, carbs, fat }: NutritionWheelProps) {
  // Calculate total and percentages
  const total = (protein || 0) + (carbs || 0) + (fat || 0);
  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No data available</p>
      </div>
    );
  }

  const proteinPct = ((protein || 0) / total) * 100;
  const carbsPct = ((carbs || 0) / total) * 100;
  const fatPct = ((fat || 0) / total) * 100;

  // SVG circle calculations
  const size = 200;
  const radius = 75;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeWidth = 28;

  // Calculate stroke dasharray for each segment
  const proteinDash = (proteinPct / 100) * circumference;
  const carbsDash = (carbsPct / 100) * circumference;
  const fatDash = (fatPct / 100) * circumference;

  // Calculate offset for each segment (cumulative)
  const proteinOffset = 0;
  const carbsOffset = circumference - proteinDash;
  const fatOffset = circumference - proteinDash - carbsDash;

  // Helper to create arc path
  const createArc = (startAngle: number, endAngle: number) => {
    const startRad = ((startAngle - 90) * Math.PI) / 180;
    const endRad = ((endAngle - 90) * Math.PI) / 180;
    const x1 = center + radius * Math.cos(startRad);
    const y1 = center + radius * Math.sin(startRad);
    const x2 = center + radius * Math.cos(endRad);
    const y2 = center + radius * Math.sin(endRad);
    const largeArc = endAngle - startAngle > 180 ? 1 : 0;
    return `M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
  };

  // Calculate angles for each segment
  const proteinStart = 0;
  const proteinEnd = proteinPct * 3.6;
  const carbsStart = proteinEnd;
  const carbsEnd = carbsStart + carbsPct * 3.6;
  const fatStart = carbsEnd;
  const fatEnd = fatStart + fatPct * 3.6;

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* Protein segment */}
          {proteinPct > 0 && (
            <path
              d={createArc(proteinStart, proteinEnd)}
              fill="#3b82f6"
              opacity="0.9"
            />
          )}
          {/* Carbs segment */}
          {carbsPct > 0 && (
            <path
              d={createArc(carbsStart, carbsEnd)}
              fill="#10b981"
              opacity="0.9"
            />
          )}
          {/* Fat segment */}
          {fatPct > 0 && (
            <path
              d={createArc(fatStart, fatEnd)}
              fill="#f59e0b"
              opacity="0.9"
            />
          )}
          {/* Center circle for text background */}
          <circle
            cx={center}
            cy={center}
            r={radius - strokeWidth}
            fill="var(--card-bg)"
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>
            {formatNumber(total, 1)}g
          </span>
          <span className="text-xs font-medium mt-1" style={{ color: 'var(--text-muted)' }}>
            total
          </span>
        </div>
      </div>
      {/* Legend */}
      <div className="mt-6 space-y-2 w-full max-w-xs">
        <div className="flex items-center justify-between p-3 rounded-lg border" style={{ borderColor: 'var(--card-border)', background: 'var(--card-bg)' }}>
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 rounded" style={{ background: '#3b82f6' }}></div>
            <span className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>Protein</span>
          </div>
          <div className="text-right">
            <span className="text-sm font-bold" style={{ color: 'var(--foreground)' }}>
              {formatNumber(protein || 0, 1)}g
            </span>
            <span className="text-xs ml-2" style={{ color: 'var(--text-muted)' }}>
              {formatNumber(proteinPct, 1)}%
            </span>
          </div>
        </div>
        <div className="flex items-center justify-between p-3 rounded-lg border" style={{ borderColor: 'var(--card-border)', background: 'var(--card-bg)' }}>
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 rounded" style={{ background: '#10b981' }}></div>
            <span className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>Carbs</span>
          </div>
          <div className="text-right">
            <span className="text-sm font-bold" style={{ color: 'var(--foreground)' }}>
              {formatNumber(carbs || 0, 1)}g
            </span>
            <span className="text-xs ml-2" style={{ color: 'var(--text-muted)' }}>
              {formatNumber(carbsPct, 1)}%
            </span>
          </div>
        </div>
        <div className="flex items-center justify-between p-3 rounded-lg border" style={{ borderColor: 'var(--card-border)', background: 'var(--card-bg)' }}>
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 rounded" style={{ background: '#f59e0b' }}></div>
            <span className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>Fat</span>
          </div>
          <div className="text-right">
            <span className="text-sm font-bold" style={{ color: 'var(--foreground)' }}>
              {formatNumber(fat || 0, 1)}g
            </span>
            <span className="text-xs ml-2" style={{ color: 'var(--text-muted)' }}>
              {formatNumber(fatPct, 1)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
