'use client';

import { useState, useRef, useEffect } from 'react';
import type { MealData, MenuItem, Patient } from '../../../lib/types';
import { imagesApi } from '../../../lib/api';
import { NumberBadge } from '../../ui/NumberBadge';
import { formatDate } from '../../../lib/dateUtils';

// =============================================================================
// Type Definitions
// =============================================================================

/** Props for the MealDetail component. */
interface MealDetailProps {
  /** The meal data to display. */
  meal: MealData;
  /** Callback invoked when the delete button is clicked. */
  onDelete: () => void;
  /** Callback invoked when the close button is clicked. */
  onClose: () => void;
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
 * @param props - The component props.
 * @returns The meal detail element.
 */
export function MealDetail({
  meal,
  onDelete,
  onClose,
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
  
  // Refs to measure row heights
  const patientRowRef = useRef<HTMLDivElement>(null);
  const menuItemRowRef = useRef<HTMLDivElement>(null);
  const [patientRowHeight, setPatientRowHeight] = useState<number | null>(null);
  const [menuItemRowHeight, setMenuItemRowHeight] = useState<number | null>(null);
  // Track heights for both view and edit modes separately
  const menuItemViewHeightRef = useRef<number | null>(null);
  const menuItemEditHeightRef = useRef<number | null>(null);
  const currentMenuItemIdRef = useRef<number>(meal.menu_item.id);
  // Keep a ref to the current height to maintain it during transitions
  const currentHeightRef = useRef<number | null>(null);
  
  // Track previous meal props in state to reset editing state when meal changes
  // This is the React-recommended pattern for adjusting state based on props
  const [prevMeal, setPrevMeal] = useState({ id: meal.id, patientId: meal.patient.id, menuItemId: meal.menu_item.id });
  if (
    prevMeal.id !== meal.id ||
    prevMeal.patientId !== meal.patient.id ||
    prevMeal.menuItemId !== meal.menu_item.id
  ) {
    setPrevMeal({ id: meal.id, patientId: meal.patient.id, menuItemId: meal.menu_item.id });
    setIsEditingPatient(false);
    setIsEditingMenuItem(false);
    setSelectedPatientId(meal.patient.id);
    setSelectedMenuItemId(meal.menu_item.id);
    // Reset heights when meal changes
    setPatientRowHeight(null);
    setMenuItemRowHeight(null);
    menuItemViewHeightRef.current = null;
    menuItemEditHeightRef.current = null;
  }

  // Get current menu item details for display
  const currentMenuItem = menuItems.find((mi) => mi.id === meal.menu_item.id) ?? meal.menu_item;

  // Measure and set row heights to prevent height changes when switching modes
  useEffect(() => {
    if (patientRowRef.current) {
      // Use requestAnimationFrame to ensure DOM is updated
      requestAnimationFrame(() => {
        if (patientRowRef.current) {
          const height = patientRowRef.current.scrollHeight;
          setPatientRowHeight((prev) => prev === null ? height : Math.max(prev, height));
        }
      });
    }
  }, [isEditingPatient, meal.patient.id]);

  useEffect(() => {
    // Reset heights when menu item changes
    if (currentMenuItemIdRef.current !== meal.menu_item.id) {
      currentMenuItemIdRef.current = meal.menu_item.id;
      menuItemViewHeightRef.current = null;
      menuItemEditHeightRef.current = null;
      setMenuItemRowHeight(null);
    }
  }, [meal.menu_item.id]);

  // Track content to detect changes - use a more robust comparison
  const menuItemContentKeyRef = useRef<string>('');
  
  const getContentKey = () => {
    const foodIds = currentMenuItem.foods?.map(f => f.id).sort().join(',') || '';
    return `${currentMenuItem.name}|${foodIds}`;
  };

  useEffect(() => {
    // When content changes (ingredients or name), reset both mode heights
    // This allows height to decrease when content shrinks
    const currentContentKey = getContentKey();
    
    if (menuItemContentKeyRef.current !== currentContentKey) {
      const previousKey = menuItemContentKeyRef.current;
      menuItemContentKeyRef.current = currentContentKey;
      
      // Only reset if this is actually a content change (not initial load)
      if (previousKey !== '') {
        menuItemViewHeightRef.current = null;
        menuItemEditHeightRef.current = null;
        // Clear height to allow remeasurement with new content
        setMenuItemRowHeight(null);
      }
    }
  }, [currentMenuItem.foods, currentMenuItem.name]);
  
  // Initialize content key on mount
  useEffect(() => {
    if (menuItemContentKeyRef.current === '') {
      menuItemContentKeyRef.current = getContentKey();
    }
  }, []);

  useEffect(() => {
    if (menuItemRowRef.current) {
      // Preserve current height during measurement to prevent flicker when switching modes
      const preservedHeight = currentHeightRef.current || menuItemRowHeight;
      
      // Immediately set the preserved height to prevent flicker during mode switch
      if (preservedHeight && menuItemRowRef.current) {
        menuItemRowRef.current.style.height = `${preservedHeight}px`;
      }
      
      // Use multiple animation frames and a small delay to ensure DOM is fully updated
      // This is especially important for wrapped content like ingredients
      const measureHeight = () => {
        if (menuItemRowRef.current) {
          // Temporarily set to auto to measure natural height
          menuItemRowRef.current.style.height = 'auto';
          
          // Force a reflow to get accurate measurement
          void menuItemRowRef.current.offsetHeight;
          
          const height = menuItemRowRef.current.scrollHeight;
          
          // Store height for current mode
          if (isEditingMenuItem) {
            menuItemEditHeightRef.current = height;
          } else {
            menuItemViewHeightRef.current = height;
          }
          
          // Use the maximum of both modes for the current menu item
          // This ensures consistent height when switching between view and edit
          // But if one mode hasn't been measured yet, use the current height
          const viewHeight = menuItemViewHeightRef.current;
          const editHeight = menuItemEditHeightRef.current;
          
          let maxHeight: number;
          if (viewHeight !== null && editHeight !== null) {
            // Both modes measured - use the max to prevent height changes when switching
            maxHeight = Math.max(viewHeight, editHeight);
          } else if (viewHeight !== null) {
            // Only view measured - use it (edit will be measured when we switch to edit mode)
            maxHeight = viewHeight;
          } else if (editHeight !== null) {
            // Only edit measured - use it (view will be measured when we switch to view mode)
            maxHeight = editHeight;
          } else {
            // Neither measured (shouldn't happen, but fallback to current)
            maxHeight = height;
          }
          
          // Always set the height, even if it's smaller than before
          // This allows height to decrease when content shrinks
          setMenuItemRowHeight(maxHeight);
          
          // Immediately apply the max height to prevent flicker
          menuItemRowRef.current.style.height = `${maxHeight}px`;
        }
      };
      
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setTimeout(measureHeight, 10);
        });
      });
    }
  }, [isEditingMenuItem, meal.menu_item.id, currentMenuItem.foods, currentMenuItem.name, menuItemRowHeight]);

  const handlePatientSave = async () => {
    if (isUpdating) return;
    
    if (selectedPatientId !== meal.patient.id) {
      await onUpdate(selectedPatientId, undefined);
    }
    setIsEditingPatient(false);
  };

  const handleMenuItemSave = async () => {
    if (isUpdating) return;
    
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
        className="px-6 py-5 border-b rounded-t-2xl"
        style={{ borderColor: 'var(--card-border)', background: 'var(--accent-light)' }}
      >
        <h2 className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>
          Meal Details
        </h2>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          {formatDate(meal.date)} • {meal.start_time} - {meal.end_time}
        </p>
      </div>

      {/* Patient Section */}
      <div
        className="p-6 border-b flex items-center justify-between"
        style={{ borderColor: 'var(--card-border)', height: '88px' }}
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
                  {patient.id}
                </option>
              ))}
            </select>
            <button
              onClick={handlePatientSave}
              disabled={isUpdating}
              className="px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: 'var(--accent-primary)', color: 'white' }}
              onMouseEnter={(e) => {
                if (!isUpdating && !e.currentTarget.disabled) {
                  e.currentTarget.style.background = 'var(--accent-primary-dim)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--accent-primary)';
              }}
            >
              {isUpdating ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={handlePatientCancel}
              disabled={isUpdating}
              className="px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer border disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: 'var(--card-bg)',
                color: 'var(--foreground)',
                borderColor: 'var(--card-border)',
              }}
              onMouseEnter={(e) => {
                if (!isUpdating && !e.currentTarget.disabled) {
                  e.currentTarget.style.background = 'rgba(0, 0, 0, 0.05)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--card-bg)';
              }}
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
        ref={menuItemRowRef}
        className="p-6 border-b flex items-center justify-between"
        style={{ 
          borderColor: 'var(--card-border)',
          height: menuItemRowHeight ? `${menuItemRowHeight}px` : 'auto',
          minHeight: menuItemRowHeight ? `${menuItemRowHeight}px` : undefined,
        }}
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
              className="px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: 'var(--accent-primary)', color: 'white' }}
              onMouseEnter={(e) => {
                if (!isUpdating && !e.currentTarget.disabled) {
                  e.currentTarget.style.background = 'var(--accent-primary-dim)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--accent-primary)';
              }}
            >
              {isUpdating ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={handleMenuItemCancel}
              disabled={isUpdating}
              className="px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer border disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: 'var(--card-bg)',
                color: 'var(--foreground)',
                borderColor: 'var(--card-border)',
              }}
              onMouseEnter={(e) => {
                if (!isUpdating && !e.currentTarget.disabled) {
                  e.currentTarget.style.background = 'rgba(0, 0, 0, 0.05)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--card-bg)';
              }}
            >
              Cancel
            </button>
          </div>
        ) : (
          <>
            <div className="flex-1">
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
              className="px-4 py-2 rounded-xl text-sm font-medium transition-colors hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex-shrink-0"
              style={{ color: 'var(--accent-primary)' }}
            >
              Edit
            </button>
          </>
        )}
      </div>

      {/* Weight Data Section */}
      <div className="p-4 sm:p-6 border-b" style={{ borderColor: 'var(--card-border)' }}>
        <h3 className="font-medium mb-4" style={{ color: 'var(--foreground)' }}>
          Weight
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <WeightCard label="Before" value={meal.before_weight} color="var(--accent-primary)" />
          <WeightCard label="After" value={meal.after_weight} color="var(--accent-primary)" />
          <WeightCard
            label="Consumed"
            value={meal.before_weight - meal.after_weight}
            color="var(--success)"
          />
        </div>
      </div>

      {/* Images Section */}
      <div className="p-4 sm:p-6">
        <h3 className="font-medium mb-4" style={{ color: 'var(--foreground)' }}>
          Meal Images
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
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
            color="var(--accent-primary)"
            rgbPath={meal.after_rgb_path}
            depthPath={meal.after_depth_path}
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="px-8 py-6 border-t flex gap-4" style={{ borderColor: 'var(--card-border)', background: 'var(--card-bg)' }}>
        <button
          onClick={onDelete}
          disabled={isDeleting || isUpdating}
          className="px-8 py-3 rounded-xl font-semibold transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background: '#ef4444',
            color: 'white',
          }}
          onMouseEnter={(e) => {
            if (!isDeleting && !isUpdating && !e.currentTarget.disabled) {
              e.currentTarget.style.background = '#b91c1c';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#ef4444';
          }}
        >
          {isDeleting ? 'Deleting...' : 'Delete Meal'}
        </button>
        <button
          onClick={onClose}
          disabled={isDeleting || isUpdating}
          className="px-8 py-3 rounded-xl font-semibold transition-all duration-200 cursor-pointer border disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background: 'var(--card-bg)',
            color: 'var(--foreground)',
            borderColor: 'var(--card-border)',
          }}
          onMouseEnter={(e) => {
            if (!isDeleting && !isUpdating && !e.currentTarget.disabled) {
              e.currentTarget.style.background = 'rgba(0, 0, 0, 0.05)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'var(--card-bg)';
          }}
        >
          Close Meal
        </button>
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
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imagesApi.getImageUrl(path)}
        alt={`${label} image`}
        className="w-full h-48 object-cover"
      />
    </div>
  );
}
