'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { menuApi, foodsApi, ApiError } from '../../lib/api';
import type { MenuItem, Food } from '../../lib/types';
import { formatFoodName } from '../../lib/utils';
import { FoodSearchInput } from '../upload/FoodSearchInput';
import { SelectedFoodsList } from '../upload/SelectedFoodsList';

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
 * @param props - The component props.
 * @returns The menu panel element.
 */
export function MenuPanel({ onDataChange }: MenuPanelProps) {
  // ===========================================================================
  // State
  // ===========================================================================
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal state (used for both create and edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState<number | null>(null); // null = creating
  const [modalName, setModalName] = useState('');
  const [selectedFoods, setSelectedFoods] = useState<Food[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Food[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Refs
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Dropdown position for portal
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });

  // Delete state
  const [deletingItemId, setDeletingItemId] = useState<number | null>(null);

  // ===========================================================================
  // Effects
  // ===========================================================================

  useEffect(() => {
    fetchMenuItems();
  }, []);

  // Disable body scrolling when modal is open
  useEffect(() => {
    if (isModalOpen) {
      // Save the current overflow style
      const originalOverflow = document.body.style.overflow;
      // Disable scrolling
      document.body.style.overflow = 'hidden';
      // Restore on cleanup
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isModalOpen]);

  // Update dropdown position when showing
  useEffect(() => {
    if (showDropdown && searchInputRef.current) {
      const rect = searchInputRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
      });
    }
  }, [showDropdown, searchResults]);


  // ===========================================================================
  // Data Fetching
  // ===========================================================================

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

  // ===========================================================================
  // Food Search
  // ===========================================================================

  const searchFoods = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    setIsSearching(true);
    try {
      const results = await foodsApi.search(query, 20);
      // Filter out already selected foods
      const selectedIds = new Set(selectedFoods.map((f) => f.id));
      const filtered = results.filter((f) => !selectedIds.has(f.id));
      setSearchResults(filtered);
      setShowDropdown(filtered.length > 0);
    } catch (err) {
      console.error('Food search failed:', err);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [selectedFoods]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      searchFoods(query);
    }, 300);
  };

  const handleSelectFood = (food: Food) => {
    setSelectedFoods((prev) => [...prev, food]);
    setSearchQuery('');
    setSearchResults([]);
    setShowDropdown(false);
    // Focus search input after selection
    setTimeout(() => searchInputRef.current?.focus(), 0);
  };

  const handleRemoveFood = (foodId: number) => {
    setSelectedFoods((prev) => prev.filter((f) => f.id !== foodId));
  };

  // ===========================================================================
  // Event Handlers
  // ===========================================================================

  const openCreateModal = () => {
    setEditingItemId(null);
    setModalName('');
    setSelectedFoods([]);
    setSearchQuery('');
    setSearchResults([]);
    setModalError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (item: MenuItem) => {
    setEditingItemId(item.id);
    setModalName(item.name);
    setSelectedFoods(item.foods || []);
    setSearchQuery('');
    setSearchResults([]);
    setModalError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingItemId(null);
    setModalName('');
    setSelectedFoods([]);
    setSearchQuery('');
    setSearchResults([]);
    setModalError(null);
    setShowDropdown(false);
  };

  const handleSaveModal = async () => {
    if (!modalName.trim()) {
      setModalError('Please enter a name');
      return;
    }

    if (selectedFoods.length === 0) {
      setModalError('Please select at least one food');
      return;
    }

    setIsSaving(true);
    try {
      const foodIds = selectedFoods.map((f) => f.id);
      if (editingItemId !== null) {
        await menuApi.update(editingItemId, modalName.trim(), foodIds);
      } else {
        await menuApi.create(modalName.trim(), foodIds);
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
        setTimeout(() => setError(null), 3000);
      } else {
        console.error('Failed to delete menu item:', err);
        setError('Failed to delete menu item');
      }
    } finally {
      setDeletingItemId(null);
    }
  };

  // ===========================================================================
  // Modal (for both create and edit)
  // ===========================================================================

  const modal = isModalOpen && typeof document !== 'undefined' && createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={closeModal}
      />

      {/* Modal */}
      <div
        className="relative w-full max-w-lg p-6 rounded-2xl border shadow-xl animate-fade-in max-h-[90vh] overflow-y-auto"
        style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
      >
        <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--foreground)' }}>
          {editingItemId !== null ? 'Edit Menu Item' : 'Create Menu Item'}
        </h2>

        <div className="space-y-4">
          {/* Name Input */}
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--foreground)' }}>
              Name
            </label>
            <input
              type="text"
              value={modalName}
              onChange={(e) => setModalName(e.target.value)}
              placeholder="e.g. Fish & Chips"
              className="w-full px-4 py-2 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{
                background: 'var(--background)',
                borderColor: 'var(--card-border)',
                color: 'var(--foreground)',
              }}
              autoFocus
            />
          </div>

          {/* Selected Foods - shown first so search dropdown has room below */}
          <SelectedFoodsList
            selectedFoods={selectedFoods}
            onRemoveFood={handleRemoveFood}
            maxHeight="max-h-28"
          />

          {/* Food Search - at bottom so dropdown opens downward */}
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--foreground)' }}>
              Ingredients
              <span className="font-normal ml-1" style={{ color: 'var(--text-muted)' }}>
                (search from nutrition database)
              </span>
            </label>
            <FoodSearchInput
              searchQuery={searchQuery}
              onSearchChange={handleSearchChange}
              searchResults={searchResults}
              isSearching={isSearching}
              showDropdown={showDropdown}
              onSelectFood={handleSelectFood}
              onDropdownVisibilityChange={setShowDropdown}
              dropdownPosition={dropdownPosition}
              inputRef={searchInputRef}
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
            disabled={isSaving || !modalName.trim() || selectedFoods.length === 0}
            className="flex-1 px-4 py-2 rounded-xl font-medium transition-colors disabled:opacity-50 cursor-pointer"
            style={{ background: 'var(--accent-primary)', color: 'white' }}
          >
            {isSaving ? 'Saving...' : (editingItemId !== null ? 'Save' : 'Create')}
          </button>
          <button
            onClick={closeModal}
            className="px-4 py-2 rounded-xl font-medium border transition-colors hover:bg-gray-50 cursor-pointer"
            style={{ borderColor: 'var(--card-border)', color: 'var(--text-secondary)' }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>,
    document.body
  );

  // ===========================================================================
  // Render
  // ===========================================================================

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
            className="p-1 rounded-lg transition-colors hover:bg-blue-50 cursor-pointer"
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
                    {item.foods?.map((f) => formatFoodName(f.short_name)).join(', ') || 'No ingredients'}
                  </p>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                  <button
                    onClick={() => openEditModal(item)}
                    className="p-1 rounded-lg transition-colors hover:bg-blue-50 cursor-pointer"
                    style={{ color: 'var(--accent-primary)' }}
                    title="Edit"
                  >
                    <EditIcon />
                  </button>
                  <button
                    onClick={() => handleDeleteMenuItem(item.id)}
                    disabled={deletingItemId === item.id}
                    className="p-1 rounded-lg transition-colors hover:bg-red-50 disabled:opacity-50 cursor-pointer"
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
