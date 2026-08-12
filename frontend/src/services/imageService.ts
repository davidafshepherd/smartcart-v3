import { appConfig } from '@/config/appConfig';


/**
 * API client for image operations.
 */
export const imageService = {
  /**
   * Generates the full URL for an image.
   * @param path - The relative path to the image.
   * @returns The complete URL to fetch the image.
   */
  getImageUrl(path: string): string {
    return `${appConfig.apiUrl}/images/${path}`;
  },
};
