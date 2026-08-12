import { createPortal } from 'react-dom';
import { useCallback, useEffect, useRef, useState } from 'react';

import { XIcon } from '@/components/common/icons';
import { ApiError } from '@/services/apiError';
import { foodService } from '@/services/foodService';
import { menuItemService } from '@/services/menuItemService';

import type { Food, MenuItem } from '@/types';

import FoodSearchDropdown from './FoodSearchDropdown';
import SelectedFoodsList from './SelectedFoodsList';

import './MenuItemModal.css';


interface Props {
  editingItem: MenuItem | null;
  onSave: (item?: MenuItem) => void;
  onClose: () => void;
}


export function MenuItemModal({ editingItem, onSave, onClose }: Props) {
  // Form state.
  const [name, setName] = useState(editingItem?.name ?? "");
  const [selectedFoods, setSelectedFoods] = useState<Food[]>(editingItem?.foods ?? []);

  // Food search state.
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Food[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);

  // Modal state.
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dropdown position.
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });

  // Element references.
  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);


  // Disable body scrolling while mounted.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);


  // Update dropdown position when showing.
  useEffect(() => {
    if (!showDropdown || !searchInputRef.current) return;
    const rect = searchInputRef.current.getBoundingClientRect();
    setDropdownPosition({ top: rect.bottom + 4, left: rect.left, width: rect.width });
  }, [showDropdown, searchResults]);


  // Close dropdown when clicking outside.
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);


  // Search for foods based on the query.
  const searchFoods = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    setIsSearching(true);
    setShowDropdown(false);
    setSearchError(null);

    try {
      const results = await foodService.search(query, 20);
      const selectedIds = new Set(selectedFoods.map(f => f.id));
      const filtered = results.filter(f => !selectedIds.has(f.id));

      setSearchResults(filtered);
      setShowDropdown(filtered.length > 0);
    } catch {
      setSearchResults([]);
      setSearchError("Failed to reach server.");
    } finally {
      setIsSearching(false);
    }
  }, [selectedFoods]);


  // Handle search input changes with debouncing.
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => searchFoods(query), 300);
  };


  // Add a food to the selected list.
  const handleSelectFood = (food: Food) => {
    setSelectedFoods(previous => [...previous, food]);
    setSearchQuery("");
    setSearchResults([]);
    setShowDropdown(false);
    setTimeout(() => searchInputRef.current?.focus(), 0);
  };


  // Remove a food from the selected list.
  const handleRemoveFood = (foodId: number) => {
    setSelectedFoods(foods => foods.filter(food => food.id !== foodId));
  };


  // Handle saving (create or update) a menu item.
  const handleSave = async () => {
    if (isSaving) return;

    if (!name.trim()) {
      setError("Please enter a name");
      return;
    }

    if (selectedFoods.length === 0) {
      setError("Please select at least one food");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const foodIds = selectedFoods.map(food => food.id);
      if (editingItem !== null) {
        await menuItemService.update(editingItem.id, name.trim(), foodIds);
        onSave();
      } else {
        const newItem = await menuItemService.create(name.trim(), foodIds);
        onSave(newItem);
      }
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save menu item");
    } finally {
      setIsSaving(false);
    }
  };


  // Handle keyboard events for the modal.
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") onClose();
  };


  // Modal.
  const modal = (
    <div className="menu-modal-overlay" onKeyDown={handleKeyDown}>
      {/* Backdrop */}
      <div className="menu-modal-backdrop" onClick={onClose} />
      {/* Modal */}
      <div className="menu-modal">
        {/* Header */}
        <div className="modal-header">
          <h2>{editingItem !== null ? "Edit Menu Item" : "Create Menu Item"}</h2>
          <button className="modal-close-button" onClick={onClose}>
            <XIcon className="modal-close-button-icon" />
          </button>
        </div>

        {/* Form */}
        <div className="modal-form">
          {/* Name input */}
          <div className="modal-field">
            <label>Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Fish & Chips"
              autoFocus
            />
          </div>

          {/* List of selected foods */}
          <SelectedFoodsList selectedFoods={selectedFoods} onRemoveFood={handleRemoveFood} />

          {/* Food search */}
          <div className="modal-field">
            {/* Food search input */}
            <label>Ingredients<span>{" "}(search from nutrition database)</span></label>
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={() => searchQuery && searchResults.length > 0 && setShowDropdown(true)}
              placeholder="Search for foods..."
            />

            {/* Food search error */}
            {isSearching && <p className="modal-searching-text">Searching...</p>}
            {searchError && <p className="modal-error-message">{searchError}</p>}

            {/* Food search dropdown */}
            {showDropdown && !isSearching && searchResults.length > 0 && createPortal(
              <div
                className="food-search-dropdown-container"
                style={{ top: dropdownPosition.top, left: dropdownPosition.left, width: dropdownPosition.width }}
                ref={dropdownRef}
              >
                <FoodSearchDropdown searchResults={searchResults} onSelectFood={handleSelectFood} />
              </div>,
              document.body
            )}
          </div>

          {/* Form error */}
          {error && <p className="modal-error-message">{error}</p>}
        </div>

        {/* Modal buttons */}
        <div className="modal-actions">
          <button
            className="modal-save-button"
            onClick={handleSave}
            disabled={isSaving || !name.trim() || selectedFoods.length === 0}
          >
            {isSaving ? (editingItem !== null ? "Saving..." : "Creating...") : (editingItem !== null ? "Save" : "Create")}
          </button>
          <button className="modal-cancel-button" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );


  return createPortal(modal, document.body);
}
