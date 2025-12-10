/**
 * @fileoverview Patient management panel component.
 *
 * Displays a list of patients with functionality to create, edit,
 * and delete patients. Designed to be displayed below the meals tree view.
 */

'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { patientsApi, ApiError } from '../../lib/api';
import type { Patient } from '../../lib/types';

// =============================================================================
// Type Definitions
// =============================================================================

/** Info about a patient ID change. */
interface PatientIdChange {
  oldId: number;
  newId: number;
}

/** Props for the PatientsPanel component. */
interface PatientsPanelProps {
  /** Callback invoked when patient data changes (create, update, delete). */
  onDataChange?: (patientIdChange?: PatientIdChange) => void;
}

// =============================================================================
// Component
// =============================================================================

/**
 * Renders a panel for managing patients.
 *
 * Features:
 * - View all existing patients
 * - Create a new patient with a specified ID
 * - Edit an existing patient's ID
 * - Delete a patient (with confirmation)
 *
 * @param props - The component props.
 * @returns The patients panel element.
 */
export function PatientsPanel({ onDataChange }: PatientsPanelProps) {
  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal state (used for both create and edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPatientId, setEditingPatientId] = useState<number | null>(null); // null = creating
  const [modalPatientId, setModalPatientId] = useState('');
  const [modalError, setModalError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Delete state
  const [deletingPatientId, setDeletingPatientId] = useState<number | null>(null);

  // ---------------------------------------------------------------------------
  // Effects
  // ---------------------------------------------------------------------------

  useEffect(() => {
    fetchPatients();
  }, []);

  // ---------------------------------------------------------------------------
  // Data Fetching
  // ---------------------------------------------------------------------------

  const fetchPatients = async () => {
    try {
      const data = await patientsApi.getAll();
      // Sort patients by ID
      setPatients(data.sort((a, b) => a.id - b.id));
      setError(null);
    } catch (err) {
      console.error('Failed to fetch patients:', err);
      setError('Failed to load patients');
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Event Handlers
  // ---------------------------------------------------------------------------

  const openCreateModal = () => {
    setEditingPatientId(null);
    setModalPatientId('');
    setModalError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (patient: Patient) => {
    setEditingPatientId(patient.id);
    setModalPatientId(String(patient.id));
    setModalError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingPatientId(null);
    setModalPatientId('');
    setModalError(null);
  };

  const handleSaveModal = async () => {
    const id = parseInt(modalPatientId, 10);
    if (isNaN(id) || id < 0) {
      setModalError('Please enter a valid non-negative number');
      return;
    }

    setIsSaving(true);
    try {
      if (editingPatientId !== null) {
        // Editing existing patient
        if (id !== editingPatientId) {
          await patientsApi.update(editingPatientId, id);
          closeModal();
          fetchPatients();
          onDataChange?.({ oldId: editingPatientId, newId: id });
        } else {
          closeModal();
        }
      } else {
        // Creating new patient
        await patientsApi.create(id);
        closeModal();
        fetchPatients();
        onDataChange?.();
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setModalError(err.message);
      } else {
        setModalError(editingPatientId ? 'Failed to update patient' : 'Failed to create patient');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeletePatient = async (patientId: number) => {
    setDeletingPatientId(patientId);
    try {
      await patientsApi.delete(patientId);
      await fetchPatients();
      onDataChange?.();
    } catch (err) {
      console.error('Failed to delete patient:', err);
      if (err instanceof ApiError) {
        setError(err.message);
        setTimeout(() => setError(null), 3000);
      } else {
        setError('Failed to delete patient');
      }
    } finally {
      setDeletingPatientId(null);
    }
  };

  // ---------------------------------------------------------------------------
  // Modal (for both create and edit)
  // ---------------------------------------------------------------------------

  const modal = isModalOpen && typeof document !== 'undefined' && createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={closeModal}
      />

      {/* Modal */}
      <div
        className="relative w-full max-w-sm p-6 rounded-2xl border shadow-xl animate-fade-in"
        style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
      >
        <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--foreground)' }}>
          {editingPatientId !== null ? 'Edit Patient' : 'Create Patient'}
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--foreground)' }}>
              Patient ID
            </label>
            <input
              type="number"
              min="0"
              step="1"
              value={modalPatientId}
              onChange={(e) => {
                const value = e.target.value.replace(/[^\d]/g, '');
                setModalPatientId(value);
                setModalError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === '.' || e.key === '-' || e.key === 'e') {
                  e.preventDefault();
                }
                if (e.key === 'Enter') handleSaveModal();
                if (e.key === 'Escape') closeModal();
              }}
              className="w-full px-4 py-2 rounded-xl border focus:outline-none focus:ring-2"
              style={{
                background: 'var(--background)',
                borderColor: 'var(--card-border)',
                color: 'var(--foreground)',
              }}
              autoFocus
            />
          </div>

          {modalError && (
            <p className="text-sm" style={{ color: 'var(--danger)' }}>
              {modalError}
            </p>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={handleSaveModal}
            disabled={isSaving || !modalPatientId.trim()}
            className="flex-1 px-4 py-2 rounded-xl font-medium transition-colors disabled:opacity-50"
            style={{ background: 'var(--accent-primary)', color: 'white' }}
          >
            {isSaving ? 'Saving...' : (editingPatientId !== null ? 'Save' : 'Create')}
          </button>
          <button
            onClick={closeModal}
            className="px-4 py-2 rounded-xl font-medium border transition-colors hover:bg-gray-50"
            style={{ borderColor: 'var(--card-border)', color: 'var(--text-secondary)' }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>,
    document.body
  );

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <>
      <div
        className="rounded-2xl border overflow-hidden shadow-sm"
        style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
      >
        {/* Header */}
        <div
          className="px-4 py-3 border-b flex items-center justify-between"
          style={{ borderColor: 'var(--card-border)' }}
        >
          <div className="flex items-center gap-2">
            <PatientIcon />
            <span className="font-medium text-sm" style={{ color: 'var(--foreground)' }}>
              Patients
            </span>
            <span
              className="px-2 py-0.5 rounded-full text-xs font-medium"
              style={{ background: 'var(--accent-light)', color: 'var(--accent-primary)' }}
            >
              {patients.length}
            </span>
          </div>
          <button
            onClick={openCreateModal}
            className="p-1 rounded-lg transition-colors hover:bg-blue-50"
            style={{ color: 'var(--accent-primary)' }}
            title="Add patient"
          >
            <PlusIcon />
          </button>
        </div>

        {/* Content */}
        <div className="max-h-64 overflow-y-auto">
          {/* Loading State */}
          {loading && (
            <div className="p-4 text-center">
              <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                Loading...
              </span>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="p-4 text-center">
              <span className="text-sm" style={{ color: 'var(--danger)' }}>
                {error}
              </span>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && patients.length === 0 && (
            <div className="p-8 text-center">
              <div
                className="w-12 h-12 mx-auto mb-3 rounded-xl flex items-center justify-center"
                style={{ background: 'var(--accent-light)' }}
              >
                <svg
                  className="w-6 h-6"
                  style={{ color: 'var(--accent-primary)' }}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>
              <p style={{ color: 'var(--text-muted)' }}>No patients yet</p>
            </div>
          )}

          {/* Patients List */}
          {!loading &&
            !error &&
            patients.map((patient) => (
              <div
                key={patient.id}
                className="px-3 h-9 border-b last:border-b-0 flex items-center justify-between group"
                style={{ borderColor: 'var(--card-border)' }}
              >
                <span className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                  #{patient.id}
                </span>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => openEditModal(patient)}
                    className="p-1 rounded-lg transition-colors hover:bg-blue-50"
                    style={{ color: 'var(--accent-primary)' }}
                    title="Edit"
                  >
                    <EditIcon />
                  </button>
                  <button
                    onClick={() => handleDeletePatient(patient.id)}
                    disabled={deletingPatientId === patient.id}
                    className="p-1 rounded-lg transition-colors hover:bg-red-50 disabled:opacity-50"
                    style={{ color: 'var(--danger)' }}
                    title="Delete"
                  >
                    {deletingPatientId === patient.id ? (
                      <span className="text-xs">...</span>
                    ) : (
                      <TrashIcon />
                    )}
                  </button>
                </div>
              </div>
            ))}
        </div>
      </div>

      {modal}
    </>
  );
}

// =============================================================================
// Icons
// =============================================================================

function PatientIcon() {
  return (
    <svg className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
      />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
      />
    </svg>
  );
}

