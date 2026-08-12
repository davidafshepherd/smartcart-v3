import { useState, useRef, useEffect, useCallback } from 'react';

import type { Meal, MenuItem } from '@/types';


interface Props {
  meal: Meal;
  menuItems: MenuItem[];
  isUpdating: boolean;
  updateError?: string | null;
  onUpdate: (patientId?: number, menuItemId?: number) => Promise<void>;
}


export function MenuItemRow({ meal, menuItems, isUpdating, updateError, onUpdate }: Props) {
  // Row state.
  const [isEditing, setIsEditing] = useState(false);
  const [selectedMenuItemId, setSelectedMenuItemId] = useState(meal.menu_item.id);
  const [rowHeight, setRowHeight] = useState<number | null>(null);

  // Refs for height-locking (prevents resize when toggling between view and edit).
  const rowRef = useRef<HTMLDivElement>(null);
  const viewHeightRef = useRef<number | null>(null);
  const editHeightRef = useRef<number | null>(null);
  const currentHeightRef = useRef<number | null>(null);

  // Refs for detecting menu item ID and content changes independently of meal switching.
  const currentMenuItemIdRef = useRef<number>(meal.menu_item.id);
  const contentKeyRef = useRef<string>("");


  // Reset to view mode when the selected meal changes.
  const [prevMealId, setPrevMealId] = useState(meal.id);
  if (prevMealId !== meal.id) {
    setPrevMealId(meal.id);
    setIsEditing(false);
    setSelectedMenuItemId(meal.menu_item.id);
    setRowHeight(null);
  }


  // Clear cached heights when the selected meal's ID changes so they are re-measured from scratch.
  useEffect(() => {
    viewHeightRef.current = null;
    editHeightRef.current = null;
  }, [meal.id]);


  // Clear cached heights when the selected meal's menu item's ID changes so they are re-measured from scratch.
  useEffect(() => {
    if (currentMenuItemIdRef.current !== meal.menu_item.id) {
      currentMenuItemIdRef.current = meal.menu_item.id;
      viewHeightRef.current = null;
      editHeightRef.current = null;
      setRowHeight(null);
    }
  }, [meal.menu_item.id]);


  // Resolve the current menu item from the full list so edits are reflected immediately.
  const currentMenuItem = menuItems.find(mi => mi.id === meal.menu_item.id) ?? meal.menu_item;


  // Stable key representing the menu item's content.
  const getContentKey = useCallback(() => {
    const foodIds = currentMenuItem.foods?.map(f => f.id).sort().join(',') ?? '';
    return `${currentMenuItem.name}|${foodIds}`;
  }, [currentMenuItem.foods, currentMenuItem.name]);


  // Clear cached heights when the selected meal's menu item's content changes so they are re-measured from scratch.
  useEffect(() => {
    const key = getContentKey();

    if (contentKeyRef.current !== key) {
      const prev = contentKeyRef.current;
      contentKeyRef.current = key;

      if (prev !== '') {
        viewHeightRef.current = null;
        editHeightRef.current = null;
        setRowHeight(null);
      }
    }
  }, [getContentKey]);


  // Measure and lock the row to the max of its view and edit heights to prevent layout shift.
  useEffect(() => {
    if (!rowRef.current || updateError) return;

    const preserved = currentHeightRef.current ?? rowHeight;
    if (preserved) rowRef.current.style.height = `${preserved}px`;

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setTimeout(() => {
          if (!rowRef.current) return;
          rowRef.current.style.height = 'auto';
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
  }, [isEditing, meal.menu_item.id, currentMenuItem.foods, currentMenuItem.name, rowHeight, updateError]);


  // Save the selected menu item if it changed, then return to view mode.
  const handleSave = async () => {
    if (isUpdating) return;
    if (selectedMenuItemId !== meal.menu_item.id) await onUpdate(undefined, selectedMenuItemId);
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
            value={selectedMenuItemId}
            onChange={e => setSelectedMenuItemId(Number(e.target.value))}
            disabled={isUpdating}
          >
            {menuItems.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>

          <button className="meal-details-save-button" onClick={handleSave} disabled={isUpdating}>
            {isUpdating ? "Saving..." : "Save"}
          </button>

          <button
            className="meal-details-cancel-button"
            onClick={() => { setSelectedMenuItemId(meal.menu_item.id); setIsEditing(false); }}
            disabled={isUpdating}
          >
            Cancel
          </button>
        </div>
      ) : (
        /* View state */
        <>
          <div className="meal-details-row-info" style={{ flex: 1 }}>
            <h3>Menu Item</h3>
            <span className="meal-details-row-value">{currentMenuItem.name}</span>
            {currentMenuItem.foods.length > 0 && (
              <div className="meal-details-foods">
                {currentMenuItem.foods.map(food => (
                  <span key={food.id} className="meal-details-food-tag">{food.short_name}</span>
                ))}
              </div>
            )}
          </div>

          <button
            className="meal-details-edit-button"
            onClick={() => { setSelectedMenuItemId(meal.menu_item.id); setIsEditing(true); }}
            disabled={isUpdating}
          >
            Edit
          </button>
        </>
      )}
    </div>
  );
}
