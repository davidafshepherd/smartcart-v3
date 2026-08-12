import { useState } from "react";

import { MenuItemModal } from "@/features/meals/components";

import type { MenuItem } from "@/types";


interface Props {
  menuItems: MenuItem[];
  selectedId: number | null;
  onSelect: (id: number | null) => void;
  onItemCreated: (item: MenuItem) => void;
}


export default function MenuItemSelector({ menuItems, selectedId, onSelect, onItemCreated }: Props) {
  // Wether the modal is open or not.
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="menu-item-selector">
      {/* Selector label */}
      <label className="menu-item-selector-label">Select Menu Item</label>

      {/* Selector controls */}
      <div className="menu-item-selector-controls">
        <select
          className="menu-item-selector-select"
          value={selectedId ?? ""}
          onChange={(e) => onSelect(e.target.value ? Number(e.target.value) : null)}
        >
          <option value="">Choose a menu item...</option>

          {menuItems.map((item) => (<option key={item.id} value={item.id}>{item.name}</option>))}
        </select>

        <button className="menu-item-selector-new-button" type="button" onClick={() => setIsModalOpen(true)}>
          + New
        </button>
      </div>

      {/* Create Menu Item modal */}
      {isModalOpen && (
        <MenuItemModal
          editingItem={null}
          onSave={item => { if (item) onItemCreated(item); }}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
}
