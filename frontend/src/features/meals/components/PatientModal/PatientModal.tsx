import { createPortal } from 'react-dom';
import { useEffect, useState } from 'react';

import { XIcon } from '@/components/common/icons';
import { ApiError } from '@/services/apiError';
import { patientService } from '@/services/patientService';

import './PatientModal.css';


interface Props {
  editingId: number | null;
  onSave: (patientIdChange?: { oldId: number; newId: number }) => void;
  onClose: () => void;
}


export function PatientModal({ editingId, onSave, onClose }: Props) {
  // Form state.
  const [value, setValue] = useState(editingId !== null ? String(editingId) : "");

  // Modal state.
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);


  // Disable body scrolling while mounted.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);


  // Save the patient (create or update) then notify the parent.
  const handleSave = async () => {
    if (isSaving) return;

    const id = parseInt(value, 10);
    if (isNaN(id) || id < 0) {
      setError("Please enter a valid non-negative number");
      return;
    }
    if (editingId !== null && id === editingId) {
      onClose();
      return;
    }

    setIsSaving(true);

    try {
      if (editingId !== null) {
        await patientService.update(editingId, id);
        onSave({ oldId: editingId, newId: id });
      } else {
        await patientService.create(id);
        onSave();
      }
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save patient");
    } finally {
      setIsSaving(false);
    }
  };

  
  // Sanitise and update the patient ID input value.
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^\d]/g, "");
    if (val.length <= 10) { 
      setValue(val); 
      setError(null); 
    }
  };


  // Handle keyboard events for the modal's input.
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key >= "0" && e.key <= "9" && value.length >= 10) e.preventDefault();
    if ([".", "-", "e"].includes(e.key)) e.preventDefault();
    if (e.key === "Enter") handleSave();
  };


  // Handle keyboard events for the modal's overlay.
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") onClose();
  };


  // Modal.
  const modal = (
    <div className="patients-modal-overlay" onKeyDown={handleKeyDown}>
      {/* Backdrop */}
      <div className="patients-modal-backdrop" onClick={onClose} />
      {/* Modal */}
      <div className="patients-modal">
        {/* Header */}
        <div className="modal-header">
          <h2>{editingId !== null ? "Edit Patient" : "Create Patient"}</h2>
          <button className="modal-close-button" onClick={onClose}>
            <XIcon className="modal-close-button-icon" />
          </button>
        </div>

        {/* Form */}
        <div className="modal-form">
          {/* Name input */}
          <div className="modal-field">
            <label>Patient ID</label>
            <input
              type="number"
              min="0"
              step="1"
              value={value}
              onChange={handleChange}
              onKeyDown={handleInputKeyDown}
              placeholder="e.g. 12345"
              autoFocus
            />
          </div>

          {/* Form-level error */}
          {error && <p className="modal-error-message">{error}</p>}
        </div>

        {/* Modal buttons */}
        <div className="modal-actions">
          <button
            className="modal-save-button"
            onClick={handleSave}
            disabled={isSaving || !value.trim()}
          >
            {isSaving ? (editingId !== null ? "Saving..." : "Creating...") : (editingId !== null ? "Save" : "Create")}
          </button>

          <button className="modal-cancel-button" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );


  // Use portal to render modal at document body level for proper centering.
  return createPortal(modal, document.body);
}
