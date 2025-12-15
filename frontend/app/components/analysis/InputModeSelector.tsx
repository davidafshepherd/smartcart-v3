/**
 * @fileoverview Input mode selector component for analysis.
 *
 * Allows users to choose between points and boxes input methods.
 */

'use client';

type InputMode = 'points' | 'boxes';

interface InputModeSelectorProps {
  onSelect: (mode: InputMode) => void;
}

export function InputModeSelector({ onSelect }: InputModeSelectorProps) {
  return (
    <div className="p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--foreground)' }}>
          Select Input Method
        </h2>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Choose how you want to identify the foods in the images
        </p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => onSelect('boxes')}
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
                  d="M16.5 8.25V6a2.25 2.25 0 0 0-2.25-2.25H6A2.25 2.25 0 0 0 3.75 6v8.25A2.25 2.25 0 0 0 6 16.5h2.25m8.25-8.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-7.5A2.25 2.25 0 0 1 8.25 18v-1.5m8.25-8.25h-6a2.25 2.25 0 0 0-2.25 2.25v6"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>
              Boxes
            </h3>
          </div>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Use OWLv2 to automatically detect food locations. Fast and automated.
          </p>
        </button>
        <button
          onClick={() => onSelect('points')}
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
              Points
            </h3>
          </div>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Click directly on images to mark food locations. Simple and precise.
          </p>
        </button>
      </div>
    </div>
  );
}
