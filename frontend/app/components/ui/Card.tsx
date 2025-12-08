/**
 * @fileoverview A reusable card container component.
 *
 * Provides consistent styling for card-like containers throughout the
 * application, including background, border, and shadow styles.
 */

'use client';

import type { ReactNode } from 'react';

/** Props for the Card component. */
interface CardProps {
  /** The content to render inside the card. */
  children: ReactNode;
  /** Optional additional CSS classes. */
  className?: string;
  /** Optional padding size. Defaults to 'md'. */
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

/** Padding configurations mapping size variants to Tailwind classes. */
const PADDING_CLASSES = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
} as const;

/**
 * Renders a styled card container.
 *
 * Uses CSS custom properties for theming (--card-bg, --card-border) to
 * ensure consistent appearance across light and dark modes.
 *
 * @param props - The component props.
 * @returns A styled card container element.
 *
 * @example
 * ```tsx
 * <Card>
 *   <h2>Card Title</h2>
 *   <p>Card content goes here.</p>
 * </Card>
 *
 * <Card padding="lg" className="my-4">
 *   <p>Large padding card with margin.</p>
 * </Card>
 * ```
 */
export function Card({ children, className = '', padding = 'md' }: CardProps) {
  return (
    <div
      className={`rounded-2xl border shadow-sm ${PADDING_CLASSES[padding]} ${className}`}
      style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
    >
      {children}
    </div>
  );
}

