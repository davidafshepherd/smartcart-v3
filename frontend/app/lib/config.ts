/**
 * @fileoverview Application configuration constants.
 *
 * Centralizes environment-specific configuration values. Uses environment
 * variables where available, with sensible defaults for local development.
 *
 * Environment Variables:
 * - NEXT_PUBLIC_API_URL: Base URL for the backend API server.
 */

/**
 * Application configuration object.
 *
 * All configuration values are readonly to prevent accidental modification
 * at runtime.
 */
export const config = {
  /**
   * Base URL for the backend API.
   *
   * Defaults to localhost:8000 for local development. In production,
   * set the NEXT_PUBLIC_API_URL environment variable.
   */
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
} as const;
