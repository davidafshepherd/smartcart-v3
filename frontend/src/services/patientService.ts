import { appConfig } from '@/config/appConfig';
import { handleApiCall } from './apiClient';
import type { Patient } from '@/types';

/**
 * API client for patient operations.
 */
export const patientService = {
  /**
   * Retrieves all patients from the database.
   * @returns A promise resolving to an array of all patients.
   * @throws {ApiError} If the request fails.
   */
  async getAll(): Promise<Patient[]> {
    return handleApiCall<Patient[]>(
      fetch(`${appConfig.apiUrl}/patients`)
    );
  },


  /**
   * Creates a new patient.
   * @param id - The ID for the new patient.
   * @returns A promise resolving to the newly created patient.
   * @throws {ApiError} If creation fails (e.g., ID already exists).
   */
  async create(id: number): Promise<Patient> {
    return handleApiCall<Patient>(
      fetch(`${appConfig.apiUrl}/patients`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
    );
  },


  /**
   * Updates a patient's ID.
   * @param patientId - The current ID of the patient to update.
   * @param newId - The new ID for the patient.
   * @returns A promise resolving to the updated patient.
   * @throws {ApiError} If the patient doesn't exist or new ID is taken.
   */
  async update(patientId: number, newId: number): Promise<Patient> {
    return handleApiCall<Patient>(
      fetch(`${appConfig.apiUrl}/patients/${patientId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: newId }),
      })
    );
  },


  /**
   * Deletes a patient and all their associated meals.
   * @param patientId - The ID of the patient to delete.
   * @returns A promise that resolves when the patient is deleted.
   * @throws {ApiError} If the patient doesn't exist or deletion fails.
   */
  async delete(patientId: number): Promise<void> {
    return handleApiCall<void>(
      fetch(`${appConfig.apiUrl}/patients/${patientId}`, { method: 'DELETE' })
		);
  },
};
