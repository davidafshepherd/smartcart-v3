'use client';

interface NutritionActionsProps {
  onSave: () => void;
  onDiscard: () => void;
  isSaving?: boolean;
}

/**
 * Renders the action buttons for the nutrition report.
 */
export function NutritionActions({ onSave, onDiscard, isSaving = false }: NutritionActionsProps) {
  return (
    <div className="px-8 py-6 border-t flex gap-4" style={{ borderColor: 'var(--card-border)', background: 'var(--card-bg)' }}>
      <button
        onClick={onSave}
        disabled={isSaving}
        className="px-8 py-3 rounded-xl font-semibold transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        style={{
          background: 'var(--accent-primary)',
          color: 'white',
        }}
        onMouseEnter={(e) => {
          if (!isSaving && !e.currentTarget.disabled) {
            e.currentTarget.style.background = 'var(--accent-primary-dim)';
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'var(--accent-primary)';
        }}
      >
        {isSaving ? 'Saving...' : 'Save Report'}
      </button>
      <button
        onClick={onDiscard}
        className="px-8 py-3 rounded-xl font-semibold transition-all duration-200 cursor-pointer border"
        style={{
          background: 'var(--card-bg)',
          color: 'var(--foreground)',
          borderColor: 'var(--card-border)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(0, 0, 0, 0.05)';
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
