/**
 * @fileoverview A circular badge component displaying a number.
 *
 * Used throughout the application to indicate selection order (e.g., "1" for
 * the first selected snapshot, "2" for the second) or to label items in a
 * sequence.
 */

'use client';

/** Props for the NumberBadge component. */
interface NumberBadgeProps {
  /** The number to display inside the badge. */
  number: number;
  /** The background color of the badge. */
  color: string;
  /** Optional size variant. Defaults to 'md'. */
  size?: 'sm' | 'md';
}

/**
 * Renders a circular badge with a number inside.
 *
 * @param props - The component props.
 * @returns A styled circular badge element.
 *
 * @example
 * ```tsx
 * <NumberBadge number={1} color="var(--accent-primary)" />
 * <NumberBadge number={2} color="var(--accent-secondary)" size="sm" />
 * ```
 */
export function NumberBadge({ number, color, size = 'md' }: NumberBadgeProps) {
  const sizeClasses = size === 'sm' 
    ? 'w-6 h-6 text-xs' 
    : 'w-7 h-7 text-sm';

  return (
    <div
      className={`${sizeClasses} rounded-full flex items-center justify-center font-bold`}
      style={{ background: color, color: 'white' }}
    >
      {number}
    </div>
  );
}

