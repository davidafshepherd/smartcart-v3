import { useState } from 'react';

import { BookOpenIcon, PencilIcon, PlusIcon, TrashIcon } from '@/components/common/icons';
import { ApiError } from '@/services/apiError';
import { menuItemService } from '@/services/menuItemService';

import type { MenuItem } from '@/types';

import { MenuItemModal } from '../MenuItemModal/MenuItemModal';

import './MenuPanel.css';


interface Props {
  menuItems: MenuItem[];
  error: string | null;
  onDataChange: () => void;
}


export function MenuPanel({ menuItems, error, onDataChange }: Props) {
  // Modal state.
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  // Delete state.
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteError, setDeleteError] = useState<{ id: number; message: string } | null>(null);


  // Modal handlers.
  const openCreateModal = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const openEditModal = (item: MenuItem) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
  };


  // Delete a menu item and show an inline error on failure.
  const handleDelete = async (itemId: number) => {
    if (deletingId !== null) return;
    setDeletingId(itemId);

    try {
      await menuItemService.delete(itemId);
      onDataChange();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Failed to delete menu item";
      setDeleteError({ id: itemId, message: message });
      setTimeout(() => setDeleteError(null), 3000);
    } finally {
      setDeletingId(null);
    }
  };


  return (
    <>
      <div className="menu-panel">
        {/* Header */}
        <div className="menu-panel-header">
          <div className="menu-panel-title">
            <BookOpenIcon className="menu-panel-icon" />
            <span>Menu</span>
            <span className="menu-panel-count">{menuItems.length}</span>
          </div>

          <button className="menu-panel-add-btn" onClick={openCreateModal} title="Add menu item">
            <PlusIcon />
          </button>
        </div>

        {/* Content */}
        <div className="menu-panel-content">
          {/* Data fetch error */}
          {error && (
            <div className="menu-panel-error">{error}</div>
          )}

          {/* Empty state */}
          {!error && menuItems.length === 0 && (
            <div className="menu-panel-empty">
              <div className="menu-panel-empty-icon">
                <BookOpenIcon />
              </div>
              <p>No menu items yet</p>
            </div>
          )}

          {/* Menu items list */}
          {!error && menuItems.map(item => (
            <div key={item.id} className="menu-panel-item">
              {deleteError?.id === item.id ? (
                <p className="menu-panel-item-delete-error">{deleteError.message}</p>
              ) : (
                <>
                  {/* Menu item info */}
                  <div className="menu-panel-item-info">
                    <span className="menu-panel-item-name">{item.name}</span>
                    <p className="menu-panel-item-foods">
                      {item.foods.map(f => f.short_name).join(", ") || "No ingredients"}
                    </p>
                  </div>

                  {/* Menu item buttons */}
                  <div className="menu-panel-item-actions">
                    <button className="menu-panel-edit-btn" onClick={() => openEditModal(item)} title="Edit">
                      <PencilIcon />
                    </button>
                    
                    <button
                      className="menu-panel-delete-btn"
                      onClick={() => handleDelete(item.id)}
                      disabled={deletingId === item.id}
                      title="Delete"
                    >
                      <TrashIcon />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Menu Item modal */}
      {isModalOpen && (
        <MenuItemModal editingItem={editingItem} onSave={() => onDataChange()} onClose={closeModal} />
      )}
    </>
  );
}
