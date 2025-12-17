'use client';

import { useState } from 'react';
import type { MenuItem } from '../../lib/types';
import { CreateMenuItemModal } from './CreateMenuItemModal';

// =============================================================================
// Type Definitions
// =============================================================================

/** Props for the MenuItemSelector component. */
interface MenuItemSelectorProps {
  /** List of available menu items. */
  menuItems: MenuItem[];
  /** Currently selected menu item ID, or null. */
  selectedId: number | null;
  /** Callback invoked when a menu item is selected. */
  onSelect: (id: number | null) => void;
  /** Callback invoked when a new menu item is successfully created. */
  onItemCreated: (item: MenuItem) => void;
  /** Optional additional CSS classes. */
  className?: string;
}

// =============================================================================
// Component
// =============================================================================

/**
 * Renders a menu item selector with modal creation capability.
 *
 * @param props - The component props.
 * @returns The menu item selector element.
 */
export function MenuItemSelector({
  menuItems,
  selectedId,
  onSelect,
  onItemCreated,
  className = '',
}: MenuItemSelectorProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

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

      <div className="flex gap-3">
        <select
          value={selectedId || ''}
          onChange={(e) => onSelect(e.target.value ? Number(e.target.value) : null)}
          className="flex-1 pl-4 pr-12 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
          style={{
            ...inputStyles,
            background: `var(--background) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E") no-repeat right 1rem center`,
            backgroundSize: '1.25rem',
          }}
        >
          <option value="">Choose a menu item...</option>
          {menuItems.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-3 rounded-xl border transition-all duration-200 cursor-pointer"
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
          + New
        </button>
      </div>

      {/* Create Menu Item Modal */}
      <CreateMenuItemModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreated={onItemCreated}
      />
    </div>
  );
}
