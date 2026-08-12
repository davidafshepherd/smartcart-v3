import { useState } from 'react';

import { parseYYYYMMDD } from '@/utils/date';

import type { Meal, MenuItem, Patient } from '@/types';

import { ImageColumn } from './ImageColumn';
import { MenuItemRow } from './MenuItemRow';
import { PatientRow } from './PatientRow';
import { WeightCard } from './WeightCard';

import './MealDetails.css';


interface Props {
  meal: Meal;
  patients: Patient[];
  menuItems: MenuItem[];
  onUpdate: (patientId?: number, menuItemId?: number) => Promise<void>;
  onDelete: () => void;
  onClose: () => void;
  isUpdating?: boolean;
  isDeleting?: boolean;
  updateError?: string | null;
}


export function MealDetails({
  meal,
  patients,
  menuItems,
  onUpdate,
  onDelete,
  onClose,
  isUpdating = false,
  isDeleting = false,
  updateError,
}: Props) {
  // Tracks which row triggered the last update so the error is routed to the correct row.
  const [updateSource, setUpdateSource] = useState<"patient" | "menuItem" | null>(null);


  // Records the update source before delegating up, so updateError is shown on the right row.
  const handleUpdate = async (patientId?: number, menuItemId?: number) => {
    setUpdateSource(patientId !== undefined ? "patient" : "menuItem");
    await onUpdate(patientId, menuItemId);
  };

  
  return (
    <div className="meal-details">
      {/* Header */}
      <div className="meal-details-header">
        <h2>Meal Details</h2>
        <p>{parseYYYYMMDD(meal.date)} • {meal.start_time} - {meal.end_time}</p>
      </div>

      {/* Patient row */}
      <PatientRow
        meal={meal}
        patients={patients}
        isUpdating={isUpdating}
        updateError={updateSource === "patient" ? updateError : null}
        onUpdate={handleUpdate}
      />

      {/* Menu item row */}
      <MenuItemRow
        meal={meal}
        menuItems={menuItems}
        isUpdating={isUpdating}
        updateError={updateSource === "menuItem" ? updateError : null}
        onUpdate={handleUpdate}
      />

      {/* Weight section */}
      <div className="meal-details-section">
        <h3>Weight</h3>
        <div className="meal-details-weights">
          <WeightCard label="Before" value={meal.before_weight} color="var(--accent-primary)" />
          <WeightCard label="After" value={meal.after_weight} color="var(--accent-primary)" />
          <WeightCard label="Consumed" value={meal.before_weight - meal.after_weight} color="var(--success)" />
        </div>
      </div>

      {/* Images section */}
      <div className="meal-details-section" style={{ borderBottom: "none" }}>
        <h3>Meal Images</h3>
        <div className="meal-details-images">
          <ImageColumn
            label="Before (Pre-meal)"
            number={1}
            rgbPath={meal.before_rgb_path}
            depthPath={meal.before_depth_path}
          />
          <ImageColumn
            label="After (Post-meal)"
            number={2}
            rgbPath={meal.after_rgb_path}
            depthPath={meal.after_depth_path}
          />
        </div>
      </div>

      {/* Action buttons */}
      <div className="meal-details-actions">
        <button
          className="meal-details-delete-button"
          onClick={onDelete}
          disabled={isDeleting || isUpdating}
        >
          {isDeleting ? "Deleting..." : "Delete Meal"}
        </button>
        <button
          className="meal-details-close-button"
          onClick={onClose}
          disabled={isDeleting || isUpdating}
        >
          Close Meal
        </button>
      </div>

    </div>
  );
}
