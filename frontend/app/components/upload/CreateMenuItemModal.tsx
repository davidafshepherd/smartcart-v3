'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import type { MenuItem, Food } from '../../lib/types';
import { menuApi, foodsApi, ApiError } from '../../lib/api';
import { FoodSearchInput } from './FoodSearchInput';
import { SelectedFoodsList } from './SelectedFoodsList';

// =============================================================================
// Type Definitions
// =============================================================================

/** Props for the CreateMenuItemModal component. */
interface CreateMenuItemModalProps {
  /** Whether the modal is currently open. */
  isOpen: boolean;
  /** Callback invoked when the modal should close. */
  onClose: () => void;
  /** Callback invoked when a menu item is successfully created. */
  onCreated: (item: MenuItem) => void;
}

// =============================================================================
// Component
// =============================================================================

/**
 * Renders a modal dialog for creating new menu items.
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
    // Focus search input after selection
    setTimeout(() => searchInputRef.current?.focus(), 0);
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
    if (isCreating) return;
    
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
          <SelectedFoodsList
            selectedFoods={selectedFoods}
            onRemoveFood={handleRemoveFood}
            maxHeight="max-h-32"
          />

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
            className="flex-1 px-4 py-3 rounded-xl font-medium transition-all duration-200 disabled:opacity-50 cursor-pointer"
            style={{ background: 'var(--accent-primary)', color: 'white' }}
            onMouseEnter={(e) => {
              if (!isCreating && name.trim() && selectedFoods.length > 0) {
                e.currentTarget.style.background = 'var(--accent-primary-dim)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--accent-primary)';
            }}
          >
            {isCreating ? 'Creating...' : 'Create'}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-3 rounded-xl font-medium border transition-all duration-200 cursor-pointer"
            style={{ 
              borderColor: 'var(--card-border)', 
              color: 'var(--foreground)',
              background: 'var(--card-bg)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(0, 0, 0, 0.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--card-bg)';
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );

  // Use portal to render at document body level for proper centering
  if (typeof document !== 'undefined') {
    return createPortal(modalContent, document.body);
  }

  return modalContent;
}
