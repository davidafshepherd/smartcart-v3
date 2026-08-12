import { useEffect, useRef, useState } from 'react';

import type { Meal, Patient } from '@/types';


interface Props {
  meal: Meal;
  patients: Patient[];
  isUpdating: boolean;
  updateError?: string | null;
  onUpdate: (patientId?: number, menuItemId?: number) => Promise<void>;
}


export function PatientRow({ meal, patients, isUpdating, updateError, onUpdate }: Props) {
  // Row state.
  const [isEditing, setIsEditing] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState(meal.patient.id);
  const [rowHeight, setRowHeight] = useState<number | null>(null);

  // Refs for tracking measured view/edit heights to lock row size during transitions.
  const rowRef = useRef<HTMLDivElement>(null);
  const viewHeightRef = useRef<number | null>(null);
  const editHeightRef = useRef<number | null>(null);
  const currentHeightRef = useRef<number | null>(null);


  // Reset to view mode when the selected meal changes.
  const [prevMealId, setPrevMealId] = useState(meal.id);
  if (prevMealId !== meal.id) {
    setPrevMealId(meal.id);
    setIsEditing(false);
    setSelectedPatientId(meal.patient.id);
    setRowHeight(null);
  }


  // Clear cached heights when the selected meal's ID changes so they are re-measured from scratch.
  useEffect(() => {
    viewHeightRef.current = null;
    editHeightRef.current = null;
  }, [meal.id]);


  // Measure and lock the row to the max of its view and edit heights to prevent layout shift.
  useEffect(() => {
    if (!rowRef.current || updateError) return;

    const preserved = currentHeightRef.current ?? rowHeight;
    if (preserved) rowRef.current.style.height = `${preserved}px`;

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setTimeout(() => {
          if (!rowRef.current) return;
          rowRef.current.style.height = "auto";
          void rowRef.current.offsetHeight;
          const height = rowRef.current.scrollHeight;

          if (isEditing) {
            editHeightRef.current = height;
          } else {
            viewHeightRef.current = height;
          }

          const viewH = viewHeightRef.current;
          const editH = editHeightRef.current;
          const maxH = viewH !== null && editH !== null ? Math.max(viewH, editH) : (viewH ?? editH ?? height);

          setRowHeight(maxH);
          currentHeightRef.current = maxH;
          rowRef.current.style.height = `${maxH}px`;
        }, 10);
      });
    });
  }, [isEditing, meal.patient.id, rowHeight, updateError]);


  // Save the selected patient if it changed, then return to view mode.
  const handleSave = async () => {
    if (isUpdating) return;
    if (selectedPatientId !== meal.patient.id) await onUpdate(selectedPatientId, undefined);
    setIsEditing(false);
  };


  return (
    <div
      ref={rowRef}
      className="meal-details-row"
      style={{ minHeight: "auto", height: (!updateError && rowHeight) ? `${rowHeight}px` : "auto" }}
    >
      {/* Error/edit/view states */}
      {updateError ? (
        /* Error state */
        <p className="meal-details-row-error">{updateError}</p>
      ) : isEditing ? (
        /* Edit state */
        <div className="meal-details-edit-form">
          <select
            className="meal-details-select"
            value={selectedPatientId}
            onChange={e => setSelectedPatientId(Number(e.target.value))}
            disabled={isUpdating}
          >
            {patients.map(p => <option key={p.id} value={p.id}>{p.id}</option>)}
          </select>

          <button className="meal-details-save-button" onClick={handleSave} disabled={isUpdating}>
            {isUpdating ? "Saving..." : "Save"}
          </button>

          <button
            className="meal-details-cancel-button"
            onClick={() => { setSelectedPatientId(meal.patient.id); setIsEditing(false); }}
            disabled={isUpdating}
          >
            Cancel
          </button>
        </div>
      ) : (
        /* View state */
        <>
          <div className="meal-details-row-info">
            <h3>Patient</h3>
            <span className="meal-details-row-value">Patient #{meal.patient.id}</span>
          </div>

          <button
            className="meal-details-edit-button"
            onClick={() => { setSelectedPatientId(meal.patient.id); setIsEditing(true); }}
            disabled={isUpdating}
          >
            Edit
          </button>
        </>
      )}
    </div>
  );
}
