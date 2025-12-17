/**
 * Application configuration object.
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
