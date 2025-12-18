'use client';

interface NutritionActionsProps {
  onSave: () => void;
  onDiscard: () => void;
}

/**
 * Renders the action buttons for the nutrition report.
 */
export function NutritionActions({ onSave, onDiscard }: NutritionActionsProps) {
  return (
    <div className="px-8 py-6 border-t border-b border-x flex gap-4 rounded-b-2xl" style={{ borderColor: 'var(--card-border)', background: 'var(--card-bg)' }}>
      <button
        onClick={onSave}
        className="px-8 py-3 rounded-xl font-semibold transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md"
        style={{
          background: 'var(--accent-primary)',
          color: 'white',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'var(--accent-primary-dim)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'var(--accent-primary)';
        }}
      >
        Save Report
      </button>
      <button
        onClick={onDiscard}
        className="px-8 py-3 rounded-xl font-semibold transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md border"
        style={{
          background: 'var(--card-bg)',
          color: 'var(--foreground)',
          borderColor: 'var(--card-border)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'var(--card-border)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'var(--card-bg)';
        }}
      >
        Discard Report
      </button>
    </div>
  );
}
