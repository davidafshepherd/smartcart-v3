'use client';

// =============================================================================
// Types
// =============================================================================

/** Input type for assisted segmentation. */
type InputType = 'points' | 'text';

/** Props for the AssistedControls component. */
interface AssistedControlsProps {
  /** Currently selected input type. */
  inputType: InputType;
  /** Callback to change input type. */
  onInputTypeChange: (type: InputType) => void;
  /** Confidence threshold value. */
  confidenceThreshold: number;
  /** Callback to change confidence threshold. */
  onConfidenceThresholdChange: (value: number) => void;
  /** Current point label (1 = foreground, 0 = background). */
  pointLabel: 0 | 1;
  /** Callback to change point label. */
  onPointLabelChange: (label: 0 | 1) => void;
  /** Text prompt value. */
  textPrompt: string;
  /** Callback to change text prompt. */
  onTextPromptChange: (value: string) => void;
  /** Number of before points. */
  beforePointsCount: number;
  /** Number of after points. */
  afterPointsCount: number;
  /** Callback to clear all points. */
  onClearPoints: () => void;
  /** Whether operations are running. */
  isRunning: boolean;
}

// =============================================================================
// Component
// =============================================================================

/**
 * Renders the control panel for assisted segmentation.
 *
 * @param props - The component props.
 * @returns The controls element.
 */
export function AssistedControls({
  inputType,
  onInputTypeChange,
  confidenceThreshold,
  onConfidenceThresholdChange,
  pointLabel,
  onPointLabelChange,
  textPrompt,
  onTextPromptChange,
  beforePointsCount,
  afterPointsCount,
  onClearPoints,
  isRunning,
}: AssistedControlsProps) {
  return (
    <div className="flex items-end gap-6 mb-6 flex-wrap">
      {/* Input Type Selection */}
      <div className="shrink-0">
        <label className="text-sm font-semibold mb-2 block" style={{ color: 'var(--foreground)' }}>
          Input Type
        </label>
        <div className="flex gap-2">
          <button
            onClick={() => !isRunning && onInputTypeChange('text')}
            disabled={isRunning && inputType !== 'text'}
            className={`px-4 py-2 rounded-lg border transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap ${
              inputType === 'text' ? 'shadow-sm' : ''
            }`}
            style={{
              borderColor: inputType === 'text' ? 'var(--accent-primary)' : 'var(--card-border)',
              background: inputType === 'text' ? 'var(--accent-light)' : 'var(--background)',
              color: inputType === 'text' ? 'var(--accent-primary)' : 'var(--foreground)',
            }}
          >
            Text Prompt
          </button>
          <button
            onClick={() => !isRunning && onInputTypeChange('points')}
            disabled={isRunning && inputType !== 'points'}
            className={`px-4 py-2 rounded-lg border transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap ${
              inputType === 'points' ? 'shadow-sm' : ''
            }`}
            style={{
              borderColor: inputType === 'points' ? 'var(--accent-primary)' : 'var(--card-border)',
              background: inputType === 'points' ? 'var(--accent-light)' : 'var(--background)',
              color: inputType === 'points' ? 'var(--accent-primary)' : 'var(--foreground)',
            }}
          >
            Points
          </button>
        </div>
      </div>

      {/* Confidence Threshold - Only for text mode */}
      {inputType === 'text' && (
        <div className="flex-1 max-w-xs mx-auto">
          <label
            className="text-sm font-semibold mb-2 block whitespace-nowrap"
            style={{ color: 'var(--foreground)' }}
          >
            Confidence Threshold
          </label>
          <div className="flex items-center gap-2 py-2">
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={confidenceThreshold}
              onChange={(e) => onConfidenceThresholdChange(parseFloat(e.target.value))}
              className="flex-1 h-2 rounded-lg appearance-none cursor-pointer"
              style={{ background: 'var(--card-border)' }}
            />
            <span className="text-sm" style={{ color: 'var(--text-muted)', minWidth: '3rem' }}>
              {confidenceThreshold.toFixed(2)}
            </span>
          </div>
        </div>
      )}

      {/* Points Mode Controls */}
      {inputType === 'points' && (
        <div className="ml-auto">
          <label className="text-sm font-semibold mb-2 block" style={{ color: 'var(--foreground)' }}>
            Point Type
          </label>
          <div className="flex items-center gap-2">
            <div className="flex gap-2">
              <button
                onClick={() => onPointLabelChange(1)}
                className={`px-4 py-2 rounded-lg border transition-all cursor-pointer ${
                  pointLabel === 1 ? 'shadow-sm' : ''
                }`}
                style={{
                  borderColor: pointLabel === 1 ? '#10B981' : 'var(--card-border)',
                  background: pointLabel === 1 ? '#10B98120' : 'var(--background)',
                  color: pointLabel === 1 ? '#10B981' : 'var(--foreground)',
                }}
              >
                Foreground
              </button>
              <button
                onClick={() => onPointLabelChange(0)}
                className={`px-4 py-2 rounded-lg border transition-all cursor-pointer ${
                  pointLabel === 0 ? 'shadow-sm' : ''
                }`}
                style={{
                  borderColor: pointLabel === 0 ? '#EF4444' : 'var(--card-border)',
                  background: pointLabel === 0 ? '#EF444420' : 'var(--background)',
                  color: pointLabel === 0 ? '#EF4444' : 'var(--foreground)',
                }}
              >
                Background
              </button>
            </div>
            {(beforePointsCount > 0 || afterPointsCount > 0) && (
              <button
                onClick={onClearPoints}
                disabled={isRunning}
                className="px-4 py-2 rounded-lg border transition-all hover:shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  borderColor: 'var(--card-border)',
                  background: 'var(--background)',
                  color: 'var(--foreground)',
                }}
              >
                Clear Points
              </button>
            )}
          </div>
        </div>
      )}

      {/* Text Prompt Input */}
      {inputType === 'text' && (
        <div className="flex-1">
          <label
            className="text-sm font-semibold mb-2 block whitespace-nowrap"
            style={{ color: 'var(--foreground)' }}
          >
            Text Prompt
          </label>
          <input
            type="text"
            value={textPrompt}
            onChange={(e) => onTextPromptChange(e.target.value)}
            placeholder="e.g. chicken drumstick"
            className="w-full px-4 py-2 rounded-lg border transition-all"
            style={{
              borderColor: 'var(--card-border)',
              background: 'var(--background)',
              color: 'var(--foreground)',
            }}
          />
        </div>
      )}
    </div>
  );
}
