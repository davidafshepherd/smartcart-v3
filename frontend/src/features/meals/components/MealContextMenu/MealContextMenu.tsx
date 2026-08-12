import { useEffect, useRef } from 'react';

import { BarChartIcon, EyeIcon, SearchIcon } from '@/components/common/icons';

import type { Meal } from '@/types';

import './MealContextMenu.css';


interface Props {
  meal: Meal;
  x: number;
  y: number;
  onViewMeal: (meal: Meal) => void;
  onAnalyseMeal: (meal: Meal) => void;
  onViewNutritionReport: (meal: Meal) => void;
  onClose: () => void;
}


export function MealContextMenu({ meal, x, y, onViewMeal, onAnalyseMeal, onViewNutritionReport, onClose }: Props) {
  // Reference to the menu element for click-outside and position calculations.
  const menuRef = useRef<HTMLDivElement>(null);


  // Close on outside click or ESC key.
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) onClose();
    };
    const handleEscape = (e: KeyboardEvent) => { 
      if (e.key === 'Escape') onClose(); 
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);


  // Adjust position to keep menu inside viewport.
  useEffect(() => {
    if (!menuRef.current) return;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (!menuRef.current) return;
        const { width, height } = menuRef.current.getBoundingClientRect();

        let left = x;
        let top = y;
        if (left + width > window.innerWidth - 8) left = window.innerWidth - width - 8;
        if (left < 8) left = 8;
        if (top + height > window.innerHeight - 8) top = y - height - 4;
        if (top < 8) top = 8;

        menuRef.current.style.left = `${left}px`;
        menuRef.current.style.top = `${top}px`;
      });
    });
  }, [x, y]);


  return (
    <div className="context-menu" ref={menuRef} style={{ left: x, top: y }}>
      {/* View Meal button */}
      <button className="context-menu-item" onClick={() => { onViewMeal(meal); onClose(); }}>
        <EyeIcon className="context-menu-item-icon" />
        View Meal
      </button>

      {meal.is_analysed ? (
        /* View Nutrition Report button */
        <button className="context-menu-item" onClick={() => { onViewNutritionReport(meal); onClose(); }}>
          <BarChartIcon className="context-menu-item-icon" />
          View Nutrition Report
        </button>
      ) : (
        /* Analyse Meal button */
        <button className="context-menu-item" onClick={() => { onAnalyseMeal(meal); onClose(); }}>
          <SearchIcon className="context-menu-item-icon" />
          Analyse Meal
        </button>
      )}
    </div>
  );
}
