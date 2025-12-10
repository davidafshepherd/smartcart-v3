/**
 * @fileoverview Modal component for creating new menu items.
 *
 * Provides a popup dialog for entering menu item details including
 * name and ingredients.
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { MenuItem } from '../../lib/types';
import { menuApi, ApiError } from '../../lib/api';

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
 * - Ingredients input field (comma-separated)
 * - Create and Cancel buttons
 * - Error display for API failures
 *
 * @param props - The component props.
 * @returns The modal element, or null if not open.
 */
export function CreateMenuItemModal({ isOpen, onClose, onCreated }: CreateMenuItemModalProps) {
  const [name, setName] = useState('');
  const [ingredients, setIngredients] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Focus the name input when modal opens
  useEffect(() => {
    if (isOpen) {
      // Small delay to ensure modal is rendered
      setTimeout(() => nameInputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setName('');
      setIngredients('');
      setError(null);
    }
  }, [isOpen]);

  /**
   * Handles the creation of a new menu item.
   */
  const handleCreate = async () => {
    if (!name.trim()) {
      setError('Please enter a name');
      return;
    }

    // Parse comma-separated ingredients into an array
    const ingredientsList = ingredients
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    if (ingredientsList.length === 0) {
      setError('Please enter at least one ingredient');
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      const newItem = await menuApi.create(name.trim(), ingredientsList);
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
        className="relative w-full max-w-md p-6 rounded-2xl border shadow-xl animate-fade-in"
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
            className="p-1 rounded-lg transition-colors hover:bg-gray-100"
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
              onKeyDown={(e) => {
                if (e.key === 'Enter' && name.trim()) {
                  handleCreate();
                }
              }}
              placeholder="e.g. Fish & Chips"
              className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{
                background: 'var(--background)',
                borderColor: 'var(--card-border)',
                color: 'var(--foreground)',
              }}
            />
          </div>

          {/* Ingredients Input */}
          <div>
            <label
              className="block text-sm font-medium mb-1"
              style={{ color: 'var(--foreground)' }}
            >
              Ingredients
              <span className="font-normal ml-1" style={{ color: 'var(--text-muted)' }}>
                (comma-separated)
              </span>
            </label>
            <input
              type="text"
              value={ingredients}
              onChange={(e) => setIngredients(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && name.trim()) {
                  handleCreate();
                }
              }}
              placeholder="e.g. fried fish, french fries, tartar sauce"
              className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{
                background: 'var(--background)',
                borderColor: 'var(--card-border)',
                color: 'var(--foreground)',
              }}
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
            disabled={isCreating || !name.trim() || !ingredients.trim()}
            className="flex-1 px-4 py-3 rounded-xl font-medium transition-colors disabled:opacity-50"
            style={{ background: 'var(--accent-primary)', color: 'white' }}
          >
            {isCreating ? 'Creating...' : 'Create'}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-3 rounded-xl font-medium border transition-colors hover:bg-gray-50"
            style={{ borderColor: 'var(--card-border)', color: 'var(--text-secondary)' }}
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

