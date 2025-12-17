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
