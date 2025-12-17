/**
 * @fileoverview Food search input component with autocomplete dropdown.
 *
 * Provides a searchable input field for finding foods from the nutrition database
 * with a dropdown showing matching results.
 */

'use client';

import React, { useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { Food } from '../../lib/types';

// =============================================================================
// Types
// =============================================================================

/** Props for the FoodSearchInput component. */
interface FoodSearchInputProps {
  /** Current search query value. */
  searchQuery: string;
  /** Callback when search query changes. */
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  /** Search results to display in dropdown. */
  searchResults: Food[];
  /** Whether search is in progress. */
  isSearching: boolean;
  /** Whether dropdown should be shown. */
  showDropdown: boolean;
  /** Callback when a food is selected from dropdown. */
  onSelectFood: (food: Food) => void;
  /** Callback when dropdown visibility should change. */
  onDropdownVisibilityChange: (show: boolean) => void;
  /** Dropdown position for portal rendering. */
  dropdownPosition: { top: number; left: number; width: number };
  /** Optional ref to the input element (for external focus control). */
  inputRef?: React.RefObject<HTMLInputElement | null>;
}

// =============================================================================
// Component
// =============================================================================

/**
 * Renders a food search input with autocomplete dropdown.
 *
 * The dropdown is rendered via portal to escape modal boundaries and
 * is positioned dynamically based on the input field's location.
 *
 * @param props - The component props.
 * @returns The search input element.
 */
export function FoodSearchInput({
  searchQuery,
  onSearchChange,
  searchResults,
  isSearching,
  showDropdown,
  onSelectFood,
  onDropdownVisibilityChange,
  dropdownPosition,
  inputRef,
}: FoodSearchInputProps) {
  const internalInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = inputRef || internalInputRef;
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target as Node)
      ) {
        onDropdownVisibilityChange(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onDropdownVisibilityChange, searchInputRef]);

  const dropdownPortal =
    showDropdown &&
    searchResults.length > 0 &&
    typeof document !== 'undefined' &&
    createPortal(
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
              onClick={() => onSelectFood(food)}
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

  return (
    <>
      <div className="relative">
        <input
          ref={searchInputRef}
          type="text"
          value={searchQuery}
          onChange={onSearchChange}
          onFocus={() => searchQuery && searchResults.length > 0 && onDropdownVisibilityChange(true)}
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
      {dropdownPortal}
    </>
  );
}

