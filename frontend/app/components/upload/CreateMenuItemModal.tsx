/**
 * @fileoverview Modal component for creating new menu items.
 *
 * Provides a popup dialog for entering menu item details including
 * name and selecting foods/ingredients from the nutrition dataset.
 */

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import type { MenuItem, Food } from '../../lib/types';
import { menuApi, foodsApi, ApiError } from '../../lib/api';

// =============================================================================
// Type Definitions
// =============================================================================

/** Props for the CreateMenuItemModal component. */
interface CreateMenuItemModalProps {
  /** Whether the modal is currently open. */
  isOpen: boolean;
  /** Callback invoked when the modal should close. */
  onClose: () => void;
  /**
   * Callback invoked when a menu item is successfully created.
   *
   * @param item - The newly created menu item.
   */
  onCreated: (item: MenuItem) => void;
}

// =============================================================================
// Component
// =============================================================================

/**
 * Renders a modal dialog for creating new menu items.
 *
 * The modal includes:
 * - Name input field
 * - Food search with autocomplete dropdown
 * - Selected foods display with remove buttons
 * - Create and Cancel buttons
 * - Error display for API failures
 *
 * @param props - The component props.
 * @returns The modal element, or null if not open.
 */
export function CreateMenuItemModal({ isOpen, onClose, onCreated }: CreateMenuItemModalProps) {
  const [name, setName] = useState('');
  const [selectedFoods, setSelectedFoods] = useState<Food[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Food[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const nameInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Disable body scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      // Save the current overflow style
      const originalOverflow = document.body.style.overflow;
      // Disable scrolling
      document.body.style.overflow = 'hidden';
      // Restore on cleanup
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  // Focus the name input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => nameInputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setName('');
      setSelectedFoods([]);
      setSearchQuery('');
      setSearchResults([]);
      setError(null);
      setShowDropdown(false);
    }
  }, [isOpen]);

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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  /**
   * Searches for foods based on the query.
   */
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

  /**
   * Handles search input changes with debouncing.
   */
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);

    // Clear existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Debounce search by 300ms
    searchTimeoutRef.current = setTimeout(() => {
      searchFoods(query);
    }, 300);
  };

  /**
   * Adds a food to the selected list.
   */
  const handleSelectFood = (food: Food) => {
    setSelectedFoods((prev) => [...prev, food]);
    setSearchQuery('');
    setSearchResults([]);
    setShowDropdown(false);
    searchInputRef.current?.focus();
  };

  /**
   * Removes a food from the selected list.
   */
  const handleRemoveFood = (foodId: number) => {
    setSelectedFoods((prev) => prev.filter((f) => f.id !== foodId));
  };

  /**
   * Handles the creation of a new menu item.
   */
  const handleCreate = async () => {
    if (!name.trim()) {
      setError('Please enter a name');
      return;
    }

    if (selectedFoods.length === 0) {
      setError('Please select at least one food');
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      const foodIds = selectedFoods.map((f) => f.id);
      const newItem = await menuApi.create(name.trim(), foodIds);
      onCreated(newItem);
      onClose();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to create menu item');
      }
    } finally {
      setIsCreating(false);
    }
  };

  /**
   * Handles keyboard events for the modal.
   */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      onKeyDown={handleKeyDown}
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="relative w-full max-w-lg p-6 rounded-2xl border shadow-xl animate-fade-in max-h-[90vh] overflow-y-auto"
        style={{
          background: 'var(--card-bg)',
          borderColor: 'var(--card-border)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>
            Create Menu Item
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg transition-colors hover:bg-gray-100 cursor-pointer"
            style={{ color: 'var(--text-muted)' }}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <div className="space-y-4">
          {/* Name Input */}
          <div>
            <label
              className="block text-sm font-medium mb-1"
              style={{ color: 'var(--foreground)' }}
            >
              Name
            </label>
            <input
              ref={nameInputRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Fish & Chips"
              className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{
                background: 'var(--background)',
                borderColor: 'var(--card-border)',
                color: 'var(--foreground)',
              }}
            />
          </div>

          {/* Selected Foods - shown first so search dropdown has room below */}
          {selectedFoods.length > 0 && (
            <div>
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: 'var(--foreground)' }}
              >
                Selected Foods ({selectedFoods.length})
              </label>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {selectedFoods.map((food) => (
                  <div
                    key={food.id}
                    className="flex items-center justify-between px-3 py-2 rounded-lg border"
                    style={{
                      background: 'var(--accent-light)',
                      borderColor: 'var(--card-border)',
                    }}
                  >
                    <div className="flex-1 min-w-0">
                      <div
                        className="text-sm font-medium truncate"
                        style={{ color: 'var(--foreground)' }}
                      >
                        {food.food_name}
                      </div>
                      <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {food.kcal != null ? `${food.kcal} kcal/100g` : ''}
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveFood(food.id)}
                      className="ml-2 p-1 rounded-lg transition-colors hover:bg-red-100 cursor-pointer"
                      style={{ color: 'var(--danger)' }}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Food Search - at bottom so dropdown opens downward */}
          <div>
            <label
              className="block text-sm font-medium mb-1"
              style={{ color: 'var(--foreground)' }}
            >
              Ingredients
              <span className="font-normal ml-1" style={{ color: 'var(--text-muted)' }}>
                (search from nutrition database)
              </span>
            </label>
            <div className="relative">
            <input
                ref={searchInputRef}
              type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                onFocus={() => searchQuery && searchResults.length > 0 && setShowDropdown(true)}
                placeholder="Search for foods..."
              className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{
                background: 'var(--background)',
                borderColor: 'var(--card-border)',
                color: 'var(--foreground)',
              }}
            />
              {isSearching && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                </div>
              )}

            </div>
          </div>

          {/* Error Message */}
          {error && (
            <p className="text-sm" style={{ color: 'var(--danger)' }}>
              {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={handleCreate}
            disabled={isCreating || !name.trim() || selectedFoods.length === 0}
            className="flex-1 px-4 py-3 rounded-xl font-medium transition-colors disabled:opacity-50 cursor-pointer"
            style={{ background: 'var(--accent-primary)', color: 'white' }}
          >
            {isCreating ? 'Creating...' : 'Create'}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-3 rounded-xl font-medium border transition-colors hover:bg-gray-50 cursor-pointer"
            style={{ borderColor: 'var(--card-border)', color: 'var(--text-secondary)' }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );

  // Dropdown rendered via portal to escape modal boundaries
  const dropdownPortal = showDropdown && searchResults.length > 0 && typeof document !== 'undefined' && createPortal(
    <div
      ref={dropdownRef}
      className="fixed z-[10000] rounded-xl border shadow-lg max-h-60 overflow-hidden"
      style={{
        top: dropdownPosition.top,
        left: dropdownPosition.left,
        width: dropdownPosition.width,
        background: 'var(--card-bg)',
        borderColor: 'var(--card-border)',
      }}
    >
      <div className="max-h-60 overflow-y-auto">
      {searchResults.map((food) => (
        <button
          key={food.id}
          onClick={() => handleSelectFood(food)}
          className="w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors border-b last:border-b-0 cursor-pointer"
          style={{ borderColor: 'var(--card-border)' }}
        >
          <div className="font-medium" style={{ color: 'var(--foreground)' }}>
            {food.food_name}
          </div>
          <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {food.kcal != null ? `${food.kcal} kcal` : 'N/A'}
            {food.protein != null && ` • ${food.protein}g protein`}
            {food.carbohydrate != null && ` • ${food.carbohydrate}g carbs`}
            {food.fat != null && ` • ${food.fat}g fat`}
          </div>
        </button>
      ))}
      </div>
    </div>,
    document.body
  );

  // Use portal to render at document body level for proper centering
  if (typeof document !== 'undefined') {
    return (
      <>
        {createPortal(modalContent, document.body)}
        {dropdownPortal}
      </>
    );
  }
  
  return modalContent;
}
