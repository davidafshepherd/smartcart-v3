/**
 * @fileoverview Detailed view component for a single meal.
 *
 * Displays comprehensive information about a meal including menu item,
 * weight data, and before/after images. Provides functionality to
 * delete the meal.
 */

'use client';

import type { MealData } from '../../lib/types';
import { uploadApi } from '../../lib/api';
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
  /** Whether a delete operation is in progress. */
  isDeleting?: boolean;
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
 * - Menu item name and ingredients
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
 *   isDeleting={isDeleting}
 * />
 * ```
 */
export function MealDetail({ meal, onDelete, isDeleting = false }: MealDetailProps) {
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
            Patient #{meal.patient.id} • {meal.date} • {meal.start_time} - {meal.end_time}
          </p>
        </div>
        <button
          onClick={onDelete}
          disabled={isDeleting}
          className="px-4 py-2 rounded-xl text-sm font-medium transition-colors hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ color: 'var(--danger)' }}
        >
          {isDeleting ? 'Deleting...' : 'Delete Meal'}
        </button>
      </div>

      {/* Menu Item Section */}
      <div className="p-6 border-b" style={{ borderColor: 'var(--card-border)' }}>
        <h3 className="font-medium mb-2" style={{ color: 'var(--foreground)' }}>
          Menu Item
        </h3>
        <span className="text-lg font-semibold" style={{ color: 'var(--accent-primary)' }}>
          {meal.menu_item.name}
        </span>
        {meal.menu_item.ingredients.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {meal.menu_item.ingredients.map((ingredient, idx) => (
              <span
                key={idx}
                className="px-3 py-1 rounded-full text-sm"
                style={{ background: 'var(--accent-light)', color: 'var(--accent-primary)' }}
              >
                {ingredient}
              </span>
            ))}
          </div>
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
        src={uploadApi.getImageUrl(path)}
        alt={`${label} image`}
        className="w-full h-48 object-cover"
      />
    </div>
  );
}
