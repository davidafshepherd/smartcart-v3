/**
 * @fileoverview Alert message component for displaying feedback to users.
 *
 * Provides styled alert boxes for error, success, and warning messages.
 * Uses CSS custom properties for consistent theming across the application.
 */

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
  /** Optional additional CSS classes. */
  className?: string;
}

// =============================================================================
// Style Configuration
// =============================================================================

/**
 * Style mappings for each alert type.
 *
 * Each type has a distinct color scheme to provide clear visual
 * differentiation between error, success, and warning states.
 */
const ALERT_STYLES: Record<AlertType, { background: string; borderColor: string; color: string }> = {
  error: {
    background: '#fef2f2',
    borderColor: 'var(--danger)',
    color: 'var(--danger)',
  },
  success: {
    background: '#f0fdf4',
    borderColor: 'var(--success)',
    color: 'var(--success)',
  },
  warning: {
    background: '#fefce8',
    borderColor: 'var(--warning)',
    color: 'var(--warning)',
  },
};

// =============================================================================
// Component
// =============================================================================

/**
 * Renders a styled alert message box.
 *
 * The alert's appearance (colors, border) is determined by its type.
 * Commonly used to display API errors, success confirmations, and
 * validation warnings.
 *
 * @param props - The component props.
 * @returns A styled alert element.
 *
 * @example
 * ```tsx
 * <AlertMessage type="error" message="Failed to save meal" />
 * <AlertMessage type="success" message="Meal saved!" className="mb-4" />
 * <AlertMessage type="warning" message="Some files were skipped" />
 * ```
 */
export function AlertMessage({ type, message, className = '' }: AlertMessageProps) {
  const style = ALERT_STYLES[type];

  return (
    <div
      className={`p-4 rounded-xl border ${className}`}
      style={{ background: style.background, borderColor: style.borderColor }}
    >
      <p style={{ color: style.color }}>{message}</p>
    </div>
  );
}
