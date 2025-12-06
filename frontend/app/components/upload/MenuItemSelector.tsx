'use client';

import { useState } from 'react';
import type { MenuItem } from '../../lib/types';
import { menuApi } from '../../lib/api';

interface MenuItemSelectorProps {
  menuItems: MenuItem[];
  selectedId: number | null;
  onSelect: (id: number | null) => void;
  onItemCreated: (item: MenuItem) => void;
  className?: string;
}

export function MenuItemSelector({
  menuItems,
  selectedId,
  onSelect,
  onItemCreated,
  className = '',
}: MenuItemSelectorProps) {
  const [showNewForm, setShowNewForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newIngredients, setNewIngredients] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    if (!newName.trim()) return;

    setIsCreating(true);
    try {
      const ingredients = newIngredients
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      const newItem = await menuApi.create(newName, ingredients);
      onItemCreated(newItem);
      setShowNewForm(false);
      setNewName('');
      setNewIngredients('');
    } catch (err) {
      console.error('Failed to create menu item:', err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleCancel = () => {
    setShowNewForm(false);
    setNewName('');
    setNewIngredients('');
  };

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
              onClick={handleCancel}
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
