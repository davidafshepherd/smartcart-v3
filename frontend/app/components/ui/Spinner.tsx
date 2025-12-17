'use client';

/** Props for the Spinner component. */
interface SpinnerProps {
  /** Optional size variant. Defaults to 'md'. */
  size?: 'sm' | 'md' | 'lg';
  /** Optional color. Defaults to the accent primary color. */
  color?: string;
  /** Optional additional CSS classes. */
  className?: string;
}

/** Size configurations mapping size variants to Tailwind classes. */
const SIZE_CLASSES = {
  sm: 'w-4 h-4',
  md: 'w-8 h-8',
  lg: 'w-12 h-12',
} as const;

/**
 * Renders an animated loading spinner.
 *
 * @param props - The component props.
 * @returns An animated spinner element.
 */
export function Spinner({ 
  size = 'md', 
  color = 'var(--accent-primary)',
  className = '',
}: SpinnerProps) {
  return (
    <svg
      className={`animate-spin ${SIZE_CLASSES[size]} ${className}`}
      style={{ color }}
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}
