'use client';

// =============================================================================
// Type Definitions
// =============================================================================

/** The type/severity of the alert message. */
type AlertType = 'error' | 'success' | 'warning';

/** Props for the AlertMessage component. */
interface AlertMessageProps {
  /** The type of alert, which determines its color scheme. */
  type: AlertType;
  /** The message text to display. */
  message: string;
  /** Optional callback to dismiss the alert. Shows close button if provided. */
  onDismiss?: () => void;
  /** Optional additional CSS classes. */
  className?: string;
}

// =============================================================================
// Style Configuration
// =============================================================================

/**
 * Style mappings for each alert type.
 *
 */
const ALERT_STYLES: Record<AlertType, {
  background: string;
  borderColor: string;
  color: string;
  hoverBg: string;
}> = {
  error: {
    background: '#fef2f2',
    borderColor: '#f87171',
    color: '#dc2626',
    hoverBg: '#fee2e2',
  },
  success: {
    background: '#ecfdf5',
    borderColor: '#34d399',
    color: '#059669',
    hoverBg: '#d1fae5',
  },
  warning: {
    background: '#fffbeb',
    borderColor: '#fbbf24',
    color: '#d97706',
    hoverBg: '#fef3c7',
  },
};

// =============================================================================
// Component
// =============================================================================

/**
 * Renders a styled alert message box with optional dismiss button.
 *
 * @param props - The component props.
 * @returns A styled alert element.
 */
export function AlertMessage({ type, message, onDismiss, className = '' }: AlertMessageProps) {
  const style = ALERT_STYLES[type];

  return (
    <div
      className={`p-4 rounded-xl border relative ${className}`}
      style={{ background: style.background, borderColor: style.borderColor }}
    >
      <p style={{ color: style.color }} className={onDismiss ? 'pr-8' : ''}>
        {message}
      </p>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="absolute top-3 right-3 p-1 rounded-lg transition-colors cursor-pointer"
          style={{ color: style.color }}
          onMouseEnter={(e) => (e.currentTarget.style.background = style.hoverBg)}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          aria-label="Dismiss"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}
