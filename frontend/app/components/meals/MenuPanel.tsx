/**
 * @fileoverview Menu item management panel component.
 *
 * Displays a list of menu items with functionality to create, edit,
 * and delete menu items. Designed to be displayed below the patients panel.
 */

'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { menuApi, ApiError } from '../../lib/api';
import type { MenuItem } from '../../lib/types';

// =============================================================================
// Type Definitions
// =============================================================================

/** Props for the MenuPanel component. */
interface MenuPanelProps {
  /** Callback invoked when menu data changes (create, update, delete). */
  onDataChange?: () => void;
}

// =============================================================================
// Component
// =============================================================================

/**
 * Renders a panel for managing menu items.
 *
 * Features:
 * - View all existing menu items
 * - Create a new menu item with name and ingredients
 * - Edit an existing menu item
 * - Delete a menu item (if not in use)
 *
 * @param props - The component props.
 * @returns The menu panel element.
 */
export function MenuPanel({ onDataChange }: MenuPanelProps) {
  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal state (used for both create and edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState<number | null>(null); // null = creating
  const [modalName, setModalName] = useState('');
  const [modalIngredients, setModalIngredients] = useState('');
  const [modalError, setModalError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Delete state
  const [deletingItemId, setDeletingItemId] = useState<number | null>(null);

  // ---------------------------------------------------------------------------
  // Effects
  // ---------------------------------------------------------------------------

  useEffect(() => {
    fetchMenuItems();
  }, []);

  // ---------------------------------------------------------------------------
  // Data Fetching
  // ---------------------------------------------------------------------------

  const fetchMenuItems = async () => {
    try {
      const data = await menuApi.getAll();
      setMenuItems(data.sort((a, b) => a.name.localeCompare(b.name)));
      setError(null);
    } catch (err) {
      console.error('Failed to fetch menu items:', err);
      setError('Failed to load menu items');
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Event Handlers
  // ---------------------------------------------------------------------------

  const openCreateModal = () => {
    setEditingItemId(null);
    setModalName('');
    setModalIngredients('');
    setModalError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (item: MenuItem) => {
    setEditingItemId(item.id);
    setModalName(item.name);
    setModalIngredients(item.ingredients.join(', '));
    setModalError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingItemId(null);
    setModalName('');
    setModalIngredients('');
    setModalError(null);
  };

  const handleSaveModal = async () => {
    if (!modalName.trim()) {
      setModalError('Please enter a name');
      return;
    }

    const ingredientsList = modalIngredients
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    if (ingredientsList.length === 0) {
      setModalError('Please enter at least one ingredient');
      return;
    }

    setIsSaving(true);
    try {
      if (editingItemId !== null) {
        // Editing existing item
        await menuApi.update(editingItemId, modalName.trim(), ingredientsList);
      } else {
        // Creating new item
        await menuApi.create(modalName.trim(), ingredientsList);
      }
      closeModal();
      fetchMenuItems();
      onDataChange?.();
    } catch (err) {
      if (err instanceof ApiError) {
        setModalError(err.message);
      } else {
        setModalError(editingItemId ? 'Failed to update menu item' : 'Failed to create menu item');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteMenuItem = async (itemId: number) => {
    setDeletingItemId(itemId);
    try {
      await menuApi.delete(itemId);
      await fetchMenuItems();
      onDataChange?.();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
        // Clear error after 3 seconds
        setTimeout(() => setError(null), 3000);
      } else {
        console.error('Failed to delete menu item:', err);
        setError('Failed to delete menu item');
      }
    } finally {
      setDeletingItemId(null);
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
        className="relative w-full max-w-md p-6 rounded-2xl border shadow-xl animate-fade-in"
        style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
      >
        <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--foreground)' }}>
          {editingItemId !== null ? 'Edit Menu Item' : 'Create Menu Item'}
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--foreground)' }}>
              Name
            </label>
            <input
              type="text"
              value={modalName}
              onChange={(e) => setModalName(e.target.value)}
              className="w-full px-4 py-2 rounded-xl border focus:outline-none focus:ring-2"
              style={{
                background: 'var(--background)',
                borderColor: 'var(--card-border)',
                color: 'var(--foreground)',
              }}
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--foreground)' }}>
              Ingredients
              <span className="font-normal ml-1" style={{ color: 'var(--text-muted)' }}>
                (comma-separated)
              </span>
            </label>
            <input
              type="text"
              value={modalIngredients}
              onChange={(e) => setModalIngredients(e.target.value)}
              className="w-full px-4 py-2 rounded-xl border focus:outline-none focus:ring-2"
              style={{
                background: 'var(--background)',
                borderColor: 'var(--card-border)',
                color: 'var(--foreground)',
              }}
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
            disabled={isSaving || !modalName.trim() || !modalIngredients.trim()}
            className="flex-1 px-4 py-2 rounded-xl font-medium transition-colors disabled:opacity-50"
            style={{ background: 'var(--accent-primary)', color: 'white' }}
          >
            {isSaving ? 'Saving...' : (editingItemId !== null ? 'Save' : 'Create')}
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
            <MenuIcon />
            <span className="font-medium text-sm" style={{ color: 'var(--foreground)' }}>
              Menu Items
            </span>
            <span
              className="px-2 py-0.5 rounded-full text-xs font-medium"
              style={{ background: 'var(--accent-light)', color: 'var(--accent-primary)' }}
            >
              {menuItems.length}
            </span>
          </div>
          <button
            onClick={openCreateModal}
            className="p-1 rounded-lg transition-colors hover:bg-blue-50"
            style={{ color: 'var(--accent-primary)' }}
            title="Add menu item"
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
          {!loading && !error && menuItems.length === 0 && (
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
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
              </div>
              <p style={{ color: 'var(--text-muted)' }}>No menu items yet</p>
            </div>
          )}

          {/* Menu Items List */}
          {!loading &&
            !error &&
            menuItems.map((item) => (
              <div
                key={item.id}
                className="px-3 py-2 border-b last:border-b-0 flex items-center justify-between group"
                style={{ borderColor: 'var(--card-border)' }}
              >
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium block" style={{ color: 'var(--foreground)' }}>
                    {item.name}
                  </span>
                  <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>
                    {item.ingredients.join(', ')}
                  </p>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                  <button
                    onClick={() => openEditModal(item)}
                    className="p-1 rounded-lg transition-colors hover:bg-blue-50"
                    style={{ color: 'var(--accent-primary)' }}
                    title="Edit"
                  >
                    <EditIcon />
                  </button>
                  <button
                    onClick={() => handleDeleteMenuItem(item.id)}
                    disabled={deletingItemId === item.id}
                    className="p-1 rounded-lg transition-colors hover:bg-red-50 disabled:opacity-50"
                    style={{ color: 'var(--danger)' }}
                    title="Delete"
                  >
                    {deletingItemId === item.id ? (
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

function MenuIcon() {
  return (
    <svg className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
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

