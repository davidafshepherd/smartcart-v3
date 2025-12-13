/**
 * @fileoverview Root layout component for the Next.js application.
 *
 * Defines the HTML structure, metadata, and global font configuration
 * for all pages in the application. This layout wraps all page content
 * and provides consistent styling across the app.
 */

import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

// =============================================================================
// Font Configuration
// =============================================================================

/**
 * Geist Sans font configuration.
 *
 * Used as the primary font for body text and UI elements.
 */
const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

/**
 * Geist Mono font configuration.
 *
 * Used for code snippets and monospace text.
 */
const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

// =============================================================================
// Metadata
// =============================================================================

/**
 * Application metadata for SEO and browser display.
 */
export const metadata: Metadata = {
  title: 'SmartCart v3 - Hospital Nutrition Dashboard',
  description: 'Track and analyse patient meal consumption',
};

// =============================================================================
// Layout Component
// =============================================================================

/**
 * Root layout component.
 *
 * Wraps all page content with the HTML structure, applies font classes,
 * and includes global CSS. This component is rendered on the server.
 *
 * @param props - The component props.
 * @param props.children - The page content to render.
 * @returns The root HTML structure.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
