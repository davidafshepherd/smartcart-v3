import { appConfig } from '@/config/appConfig';
import { handleApiCall } from '@/services/apiClient';
import type { UploadResponse } from '@/types';

/**
 * API client for upload-related operations.
 */
export const uploadService = {
  /**
   * Uploads a ZIP file containing meal snapshot folders.
   * @param file - The ZIP file to upload.
   * @returns A promise resolving to the upload response with snapshots.
   * @throws {ApiError} If the upload fails.
   */
  async uploadZip(file: File): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    return handleApiCall<UploadResponse>(
      fetch(`${appConfig.apiUrl}/uploads`, { method: 'POST', body: formData })
    );
  },

  
  /**
   * Discards a specific snapshot from the staging area.
   * @param snapshotId - The ID of the snapshot to discard.
   * @returns A promise that resolves when the snapshot is deleted.
   * @throws {ApiError} If the snapshot doesn't exist or deletion fails.
   */
  async discardSnapshot(snapshotId: number): Promise<void> {
    return handleApiCall<void>(
      fetch(`${appConfig.apiUrl}/uploads/snapshots/${snapshotId}`, { method: 'DELETE' })
    );
  },
};
