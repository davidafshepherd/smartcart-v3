'use client';

// =============================================================================
// Types
// =============================================================================

/** Available segmentation input modes. */
type InputMode = 'automated' | 'assisted';

/** Props for the InputModeSelector component. */
interface InputModeSelectorProps {
  /** Callback invoked when a mode is selected. */
  onSelect: (mode: InputMode) => void;
}

// =============================================================================
// Component
// =============================================================================

/**
 * Renders a mode selection interface for choosing segmentation method.
 *
 * @param props - The component props.
 * @returns The mode selector element.
 */
export function InputModeSelector({ onSelect }: InputModeSelectorProps) {
  return (
    <div className="p-6 sm:p-8">
      <div className="mb-6">
        <h2 className="text-xl sm:text-2xl font-bold mb-2" style={{ color: 'var(--foreground)' }}>
          Select Segmentation Method
        </h2>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Choose how you want to identify and segment the foods in the images.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          onClick={() => onSelect('automated')}
          className="p-6 rounded-xl border text-left transition-all hover:shadow-md cursor-pointer"
          style={{
            borderColor: 'var(--card-border)',
            background: 'var(--background)',
          }}
        >
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ background: 'var(--accent-light)' }}
            >
              <svg
                className="w-5 h-5"
                style={{ color: 'var(--accent-primary)' }}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>
              Automated
            </h3>
          </div>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Let SAM3 automatically segment all foods at once. Fast and convenient.
          </p>
        </button>
        <button
          onClick={() => onSelect('assisted')}
          className="p-6 rounded-xl border text-left transition-all hover:shadow-md cursor-pointer"
          style={{
            borderColor: 'var(--card-border)',
            background: 'var(--background)',
          }}
        >
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ background: 'var(--accent-light)' }}
            >
              <svg
                className="w-5 h-5"
                style={{ color: 'var(--accent-primary)' }}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>
              Assisted
            </h3>
          </div>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Guide SAM3 with prompts or points for each food. More control and precision.
          </p>
        </button>
      </div>
    </div>
  );
}
