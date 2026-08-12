import { useState } from 'react';

import { PencilIcon, PlusIcon, TrashIcon, UserIcon } from '@/components/common/icons';
import { ApiError } from '@/services/apiError';
import { patientService } from '@/services/patientService';

import type { Patient } from '@/types';

import { PatientModal } from '../PatientModal/PatientModal';

import './PatientsPanel.css';


interface Props {
  patients: Patient[];
  error: string | null;
  onDataChange: (patientIdChange?: { oldId: number; newId: number }) => void;
}


export function PatientsPanel({ patients, error, onDataChange }: Props) {
  // Modal state.
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Delete state.
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteError, setDeleteError] = useState<{ id: number; message: string } | null>(null);


  // Modal handlers.
  const openCreate = () => {
    setEditingId(null);
    setIsModalOpen(true);
  };

  const openEdit = (patient: Patient) => {
    setEditingId(patient.id);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
  };


  // Delete a patient and show an inline error on failure.
  const handleDelete = async (patientId: number) => {
    if (deletingId !== null) return;
    setDeletingId(patientId);

    try {
      await patientService.delete(patientId);
      onDataChange();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Failed to delete patient";
      setDeleteError({ id: patientId, message: message });
      setTimeout(() => setDeleteError(null), 3000);
    } finally {
      setDeletingId(null);
    }
  };


  return (
    <>
      <div className="patients-panel">
        {/* Header */}
        <div className="patients-panel-header">
          <div className="patients-panel-title">
            <UserIcon className="patients-panel-icon" />
            <span>Patients</span>
            <span className="patients-panel-count">{patients.length}</span>
          </div>

          <button className="patients-panel-add-btn" onClick={openCreate} title="Add patient">
            <PlusIcon />
          </button>
        </div>

        {/* Content */}
        <div className="patients-panel-content">
          {/* Data fetch error */}
          {error && (
            <div className="patients-panel-error">{error}</div>
          )}

          {/* Empty state */}
          {!error && patients.length === 0 && (
            <div className="patients-panel-empty">
              <div className="patients-panel-empty-icon">
                <UserIcon />
              </div>
              <p>No patients yet</p>
            </div>
          )}

          {/* Patients list */}
          {!error && patients.map(patient => (
            <div key={patient.id} className="patients-panel-item">
              {deleteError?.id === patient.id ? (
                <p className="patients-panel-item-delete-error">{deleteError.message}</p>
              ) : (
                <>
                  {/* Patient info */}
                  <span className="patients-panel-item-id">#{patient.id}</span>

                  {/* Patient buttons */}
                  <div className="patients-panel-item-actions">
                    <button className="patients-panel-edit-btn" onClick={() => openEdit(patient)} title="Edit">
                      <PencilIcon />
                    </button>
                    
                    <button
                      className="patients-panel-delete-btn"
                      onClick={() => handleDelete(patient.id)}
                      disabled={deletingId === patient.id}
                      title="Delete"
                    >
                      <TrashIcon />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Patient modal */}
      {isModalOpen && (
        <PatientModal editingId={editingId} onSave={change => onDataChange(change)} onClose={closeModal} />
      )}
    </>
  );
}
