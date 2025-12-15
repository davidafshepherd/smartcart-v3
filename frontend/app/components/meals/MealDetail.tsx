/**
 * @fileoverview Detailed view component for a single meal.
 *
 * Displays comprehensive information about a meal including menu item,
 * weight data, and before/after images. Provides functionality to
 * edit and delete the meal.
 */

'use client';

import { useState, useEffect } from 'react';
import type { MealData, MenuItem, Patient } from '../../lib/types';
import { imagesApi } from '../../lib/api';
import { NumberBadge } from '../ui/NumberBadge';

// =============================================================================
// Type Definitions
// =============================================================================

/** Props for the MealDetail component. */
interface MealDetailProps {
  /** The meal data to display. */
  meal: MealData;
  /** Callback invoked when the delete button is clicked. */
  onDelete: () => void;
  /** Callback invoked when the meal is updated. */
  onUpdate: (patientId?: number, menuItemId?: number) => Promise<void>;
  /** Whether a delete operation is in progress. */
  isDeleting?: boolean;
  /** Whether an update operation is in progress. */
  isUpdating?: boolean;
  /** Error message from a failed update. */
  updateError?: string | null;
  /** All available patients for the dropdown. */
  patients: Patient[];
  /** All available menu items for the dropdown. */
  menuItems: MenuItem[];
}

/** Props for the WeightCard sub-component. */
interface WeightCardProps {
  /** Label text (e.g., "Before", "After", "Consumed"). */
  label: string;
  /** Weight value in grams. */
  value: number;
  /** Color for the value text. */
  color: string;
}

/** Props for the ImageColumn sub-component. */
interface ImageColumnProps {
  /** Column label (e.g., "Before (Pre-meal)"). */
  label: string;
  /** Order number (1 or 2). */
  number: number;
  /** Accent color for the number badge. */
  color: string;
  /** Path to the RGB image. */
  rgbPath: string;
  /** Path to the depth image. */
  depthPath: string;
}

/** Props for the ImageCard sub-component. */
interface ImageCardProps {
  /** Image type label ("RGB" or "Depth"). */
  label: string;
  /** Path to the image file. */
  path: string;
}

// =============================================================================
// Main Component
// =============================================================================

/**
 * Renders a detailed view of a meal.
 *
 * The detail view includes:
 * - Header with patient ID, date, time range, and delete button
 * - Editable patient and menu item selection
 * - Weight comparison (before, after, consumed)
 * - Before and after images (RGB and depth)
 *
 * @param props - The component props.
 * @returns The meal detail element.
 *
 * @example
 * ```tsx
 * <MealDetail
 *   meal={selectedMeal}
 *   onDelete={() => handleDeleteMeal(selectedMeal.id)}
 *   onUpdate={(patientId, menuItemId) => handleUpdateMeal(selectedMeal.id, patientId, menuItemId)}
 *   isDeleting={isDeleting}
 *   isUpdating={isUpdating}
 *   patients={patients}
 *   menuItems={menuItems}
 * />
 * ```
 */
export function MealDetail({
  meal,
  onDelete,
  onUpdate,
  isDeleting = false,
  isUpdating = false,
  updateError,
  patients,
  menuItems,
}: MealDetailProps) {
  const [isEditingPatient, setIsEditingPatient] = useState(false);
  const [isEditingMenuItem, setIsEditingMenuItem] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState(meal.patient.id);
  const [selectedMenuItemId, setSelectedMenuItemId] = useState(meal.menu_item.id);

  // Reset editing state when the meal changes
  useEffect(() => {
    setIsEditingPatient(false);
    setIsEditingMenuItem(false);
    setSelectedPatientId(meal.patient.id);
    setSelectedMenuItemId(meal.menu_item.id);
  }, [meal.id, meal.patient.id, meal.menu_item.id]);

  // Get current menu item details for display
  const currentMenuItem = menuItems.find((mi) => mi.id === meal.menu_item.id) ?? meal.menu_item;

  const handlePatientSave = async () => {
    if (selectedPatientId !== meal.patient.id) {
      await onUpdate(selectedPatientId, undefined);
    }
    setIsEditingPatient(false);
  };

  const handleMenuItemSave = async () => {
    if (selectedMenuItemId !== meal.menu_item.id) {
      await onUpdate(undefined, selectedMenuItemId);
    }
    setIsEditingMenuItem(false);
  };

  const handlePatientCancel = () => {
    setSelectedPatientId(meal.patient.id);
    setIsEditingPatient(false);
  };

  const handleMenuItemCancel = () => {
    setSelectedMenuItemId(meal.menu_item.id);
    setIsEditingMenuItem(false);
  };

  const startEditingPatient = () => {
    setSelectedPatientId(meal.patient.id);
    setIsEditingPatient(true);
  };

  const startEditingMenuItem = () => {
    setSelectedMenuItemId(meal.menu_item.id);
    setIsEditingMenuItem(true);
  };

  return (
    <div
      className="rounded-2xl border overflow-hidden shadow-sm"
      style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
    >
      {/* Header Section */}
      <div
        className="p-6 border-b flex items-center justify-between"
        style={{ borderColor: 'var(--card-border)' }}
      >
        <div>
          <h2 className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>
            Meal Details
          </h2>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            {meal.date} • {meal.start_time} - {meal.end_time}
          </p>
        </div>
        <button
          onClick={onDelete}
          disabled={isDeleting || isUpdating}
          className="px-4 py-2 rounded-xl text-sm font-medium transition-colors hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          style={{ color: 'var(--danger)' }}
        >
          {isDeleting ? 'Deleting...' : 'Delete Meal'}
        </button>
      </div>

      {/* Patient Section */}
      <div
        className="p-6 border-b flex items-center justify-between"
        style={{ borderColor: 'var(--card-border)' }}
      >
        {isEditingPatient ? (
          <div className="flex items-center gap-3 flex-1">
            <select
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(Number(e.target.value))}
              disabled={isUpdating}
              className="flex-1 pl-3 pr-10 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 disabled:opacity-50 appearance-none cursor-pointer"
              style={{
                background: `var(--background) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E") no-repeat right 0.75rem center`,
                backgroundSize: '1rem',
                borderColor: 'var(--card-border)',
                color: 'var(--foreground)',
              }}
            >
              {patients.map((patient) => (
                <option key={patient.id} value={patient.id}>
                  Patient #{patient.id}
                </option>
              ))}
            </select>
            <button
              onClick={handlePatientSave}
              disabled={isUpdating}
              className="px-3 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 cursor-pointer"
              style={{ background: 'var(--accent-primary)', color: 'white' }}
            >
              {isUpdating ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={handlePatientCancel}
              disabled={isUpdating}
              className="px-3 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 cursor-pointer"
              style={{ color: 'var(--text-muted)' }}
            >
              Cancel
            </button>
          </div>
        ) : updateError ? (
          <div className="flex-1 text-center">
            <span className="text-sm" style={{ color: 'var(--danger)' }}>
              {updateError}
            </span>
          </div>
        ) : (
          <>
            <div>
              <h3 className="font-medium" style={{ color: 'var(--foreground)' }}>
                Patient
              </h3>
              <span className="text-lg font-semibold" style={{ color: 'var(--accent-primary)' }}>
                Patient #{meal.patient.id}
              </span>
            </div>
            <button
              onClick={startEditingPatient}
              disabled={isUpdating}
              className="px-4 py-2 rounded-xl text-sm font-medium transition-colors hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              style={{ color: 'var(--accent-primary)' }}
            >
              Edit
            </button>
          </>
        )}
      </div>

      {/* Menu Item Section */}
      <div
        className="p-6 border-b flex items-center justify-between"
        style={{ borderColor: 'var(--card-border)' }}
      >
        {isEditingMenuItem ? (
          <div className="flex items-center gap-3 flex-1">
            <select
              value={selectedMenuItemId}
              onChange={(e) => setSelectedMenuItemId(Number(e.target.value))}
              disabled={isUpdating}
              className="flex-1 pl-3 pr-10 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 disabled:opacity-50 appearance-none cursor-pointer"
              style={{
                background: `var(--background) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E") no-repeat right 0.75rem center`,
                backgroundSize: '1rem',
                borderColor: 'var(--card-border)',
                color: 'var(--foreground)',
              }}
            >
              {menuItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
            <button
              onClick={handleMenuItemSave}
              disabled={isUpdating}
              className="px-3 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 cursor-pointer"
              style={{ background: 'var(--accent-primary)', color: 'white' }}
            >
              {isUpdating ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={handleMenuItemCancel}
              disabled={isUpdating}
              className="px-3 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 cursor-pointer"
              style={{ color: 'var(--text-muted)' }}
            >
              Cancel
            </button>
          </div>
        ) : (
          <>
            <div>
              <h3 className="font-medium" style={{ color: 'var(--foreground)' }}>
                Menu Item
              </h3>
              <span className="text-lg font-semibold" style={{ color: 'var(--accent-primary)' }}>
                {currentMenuItem.name}
              </span>
              {currentMenuItem.foods && currentMenuItem.foods.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {currentMenuItem.foods.map((food) => (
                    <span
                      key={food.id}
                      className="px-3 py-1 rounded-full text-sm"
                      style={{ background: 'var(--accent-light)', color: 'var(--accent-primary)' }}
                    >
                      {food.short_name}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={startEditingMenuItem}
              disabled={isUpdating}
              className="px-4 py-2 rounded-xl text-sm font-medium transition-colors hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              style={{ color: 'var(--accent-primary)' }}
            >
              Edit
            </button>
          </>
        )}
      </div>

      {/* Weight Data Section */}
      <div className="p-6 border-b" style={{ borderColor: 'var(--card-border)' }}>
        <h3 className="font-medium mb-4" style={{ color: 'var(--foreground)' }}>
          Weight Data
        </h3>
        <div className="grid grid-cols-3 gap-4">
          <WeightCard label="Before" value={meal.before_weight} color="var(--accent-primary)" />
          <WeightCard label="After" value={meal.after_weight} color="var(--accent-secondary)" />
          <WeightCard
            label="Consumed"
            value={meal.before_weight - meal.after_weight}
            color="var(--success)"
          />
        </div>
      </div>

      {/* Images Section */}
      <div className="p-6">
        <h3 className="font-medium mb-4" style={{ color: 'var(--foreground)' }}>
          Meal Images
        </h3>
        <div className="grid grid-cols-2 gap-6">
          <ImageColumn
            label="Before (Pre-meal)"
            number={1}
            color="var(--accent-primary)"
            rgbPath={meal.before_rgb_path}
            depthPath={meal.before_depth_path}
          />
          <ImageColumn
            label="After (Post-meal)"
            number={2}
            color="var(--accent-secondary)"
            rgbPath={meal.after_rgb_path}
            depthPath={meal.after_depth_path}
          />
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Sub-Components
// =============================================================================

/**
 * Renders a card displaying a weight value.
 *
 * @param props - The component props.
 * @returns A weight display card.
 */
function WeightCard({ label, value, color }: WeightCardProps) {
  return (
    <div className="p-4 rounded-xl" style={{ background: 'var(--background)' }}>
      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
        {label}
      </p>
      <p className="text-2xl font-bold" style={{ color }}>
        {value.toFixed(1)}g
      </p>
    </div>
  );
}

/**
 * Renders a column of images (RGB and depth) for before or after.
 *
 * @param props - The component props.
 * @returns An image column with header and two image cards.
 */
function ImageColumn({ label, number, color, rgbPath, depthPath }: ImageColumnProps) {
  return (
    <div>
      {/* Column Header */}
      <div className="flex items-center gap-2 mb-3">
        <NumberBadge number={number} color={color} size="sm" />
        <span className="font-medium" style={{ color: 'var(--foreground)' }}>
          {label}
        </span>
      </div>
      {/* Image Cards */}
      <div className="space-y-3">
        <ImageCard label="RGB" path={rgbPath} />
        <ImageCard label="Depth" path={depthPath} />
      </div>
    </div>
  );
}

/**
 * Renders a single image with a label.
 *
 * @param props - The component props.
 * @returns An image card with label and image.
 */
function ImageCard({ label, path }: ImageCardProps) {
  return (
    <div
      className="rounded-xl overflow-hidden border"
      style={{ borderColor: 'var(--card-border)' }}
    >
      <p
        className="px-3 py-1 text-xs font-medium"
        style={{ background: 'var(--background)', color: 'var(--text-muted)' }}
      >
        {label}
      </p>
      <img
        src={imagesApi.getImageUrl(path)}
        alt={`${label} image`}
        className="w-full h-48 object-cover"
      />
    </div>
  );
}
