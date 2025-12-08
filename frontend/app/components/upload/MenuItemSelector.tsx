/**
 * @fileoverview Menu item selector component with inline creation.
 *
 * Provides a dropdown for selecting existing menu items and a form
 * for creating new ones without leaving the current workflow.
 */

'use client';

import { useState } from 'react';
import type { MenuItem } from '../../lib/types';
import { menuApi } from '../../lib/api';

// =============================================================================
// Type Definitions
// =============================================================================

/** Props for the MenuItemSelector component. */
interface MenuItemSelectorProps {
  /** List of available menu items. */
  menuItems: MenuItem[];
  /** Currently selected menu item ID, or null. */
  selectedId: number | null;
  /**
   * Callback invoked when a menu item is selected.
   *
   * @param id - The selected menu item ID, or null to clear.
   */
  onSelect: (id: number | null) => void;
  /**
   * Callback invoked when a new menu item is successfully created.
   *
   * @param item - The newly created menu item.
   */
  onItemCreated: (item: MenuItem) => void;
  /** Optional additional CSS classes. */
  className?: string;
}

// =============================================================================
// Component
// =============================================================================

/**
 * Renders a menu item selector with inline creation capability.
 *
 * The component has two modes:
 * - **Select mode**: Dropdown list of existing menu items with a "New" button
 * - **Create mode**: Form with name and ingredients inputs
 *
 * When a new item is created, it is automatically selected and the
 * parent component is notified via the onItemCreated callback.
 *
 * @param props - The component props.
 * @returns The menu item selector element.
 *
 * @example
 * ```tsx
 * <MenuItemSelector
 *   menuItems={menuItems}
 *   selectedId={selectedMenuItemId}
 *   onSelect={setSelectedMenuItemId}
 *   onItemCreated={handleMenuItemCreated}
 * />
 * ```
 */
export function MenuItemSelector({
  menuItems,
  selectedId,
  onSelect,
  onItemCreated,
  className = '',
}: MenuItemSelectorProps) {
  // Form state for creating new menu items.
  const [showNewForm, setShowNewForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newIngredients, setNewIngredients] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  /**
   * Handles the creation of a new menu item.
   *
   * Parses the comma-separated ingredients string, calls the API,
   * and notifies the parent on success.
   */
  const handleCreate = async () => {
    if (!newName.trim()) return;

    setIsCreating(true);
    try {
      // Parse comma-separated ingredients into an array.
      const ingredients = newIngredients
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      const newItem = await menuApi.create(newName, ingredients);
      onItemCreated(newItem);
      resetForm();
    } catch (err) {
      console.error('Failed to create menu item:', err);
    } finally {
      setIsCreating(false);
    }
  };

  /**
   * Resets the creation form to its initial state.
   */
  const resetForm = () => {
    setShowNewForm(false);
    setNewName('');
    setNewIngredients('');
  };

  /** Shared input styling for consistent appearance. */
  const inputStyles = {
    background: 'var(--background)',
    borderColor: 'var(--card-border)',
    color: 'var(--foreground)',
  };

  return (
    <div className={className}>
      <label className="block font-medium mb-2" style={{ color: 'var(--foreground)' }}>
        Select Menu Item
      </label>

      {!showNewForm ? (
        // Select Mode: Dropdown with "New" button
        <div className="flex gap-3">
          <select
            value={selectedId || ''}
            onChange={(e) => onSelect(e.target.value ? Number(e.target.value) : null)}
            className="flex-1 px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500"
            style={inputStyles}
          >
            <option value="">Choose a menu item...</option>
            {menuItems.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
          <button
            onClick={() => setShowNewForm(true)}
            className="px-4 py-3 rounded-xl border transition-colors hover:bg-blue-50"
            style={{ borderColor: 'var(--card-border)', color: 'var(--accent-primary)' }}
          >
            + New
          </button>
        </div>
      ) : (
        // Create Mode: Name and ingredients form
        <div className="space-y-3">
          <input
            type="text"
            placeholder="Menu item name (e.g., Chicken & Vegetables)"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500"
            style={inputStyles}
          />
          <input
            type="text"
            placeholder="Ingredients (comma-separated)"
            value={newIngredients}
            onChange={(e) => setNewIngredients(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500"
            style={inputStyles}
          />
          <div className="flex gap-3">
            <button
              onClick={handleCreate}
              disabled={isCreating || !newName.trim()}
              className="px-4 py-2 rounded-xl font-medium transition-colors disabled:opacity-50"
              style={{ background: 'var(--accent-primary)', color: 'white' }}
            >
              {isCreating ? 'Creating...' : 'Create Menu Item'}
            </button>
            <button
              onClick={resetForm}
              className="px-4 py-2 rounded-xl border transition-colors hover:bg-gray-50"
              style={{ borderColor: 'var(--card-border)', color: 'var(--text-secondary)' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
