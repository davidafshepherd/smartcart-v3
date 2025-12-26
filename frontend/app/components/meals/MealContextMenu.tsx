'use client';

import { useEffect, useRef } from 'react';
import type { MealData } from '../../lib/types';

// =============================================================================
// Type Definitions
// =============================================================================

/** Props for the MealContextMenu component. */
interface MealContextMenuProps {
  /** The meal for which the context menu is shown. */
  meal: MealData;
  /** X position of the context menu. */
  x: number;
  /** Y position of the context menu. */
  y: number;
  /** Callback invoked when "View Meal" is selected. */
  onViewMeal: (meal: MealData) => void;
  /** Callback invoked when "Analyse Meal" is selected. */
  onAnalyseMeal: (meal: MealData) => void;
  /** Callback invoked when "View Nutrition Report" is selected. */
  onViewNutritionReport: (meal: MealData) => void;
  /** Callback invoked when the menu should be closed. */
  onClose: () => void;
}

// =============================================================================
// Component
// =============================================================================

/**
 * Renders a context menu for meal actions (View, Analyse, or View Nutrition Report).
 *
 * @param props - The component props.
 * @returns The context menu element.
 */
export function MealContextMenu({
  meal,
  x,
  y,
  onViewMeal,
  onAnalyseMeal,
  onViewNutritionReport,
  onClose,
}: MealContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    // Close menu on escape key
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  // Adjust position to keep menu within viewport (only if needed)
  useEffect(() => {
    if (!menuRef.current) return;
    
    // Use double requestAnimationFrame to ensure the menu is fully rendered
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (!menuRef.current) return;
        
        const menuRect = menuRef.current.getBoundingClientRect();
        const menuWidth = menuRect.width || 180;
        const menuHeight = menuRect.height || 100;
        
        let adjustedX = x;
        let adjustedY = y;
        
        // Adjust horizontally if menu would go off-screen
        if (x + menuWidth > window.innerWidth) {
          adjustedX = window.innerWidth - menuWidth - 8;
        }
        if (adjustedX < 8) {
          adjustedX = 8;
        }
        
        // Adjust vertically if menu would go off-screen
        if (y + menuHeight > window.innerHeight) {
          adjustedY = y - menuHeight - 4; // Show above instead
        }
        if (adjustedY < 8) {
          adjustedY = 8;
        }
        
        // Update position if adjustment is needed
        const currentLeft = parseFloat(menuRef.current.style.left) || x;
        const currentTop = parseFloat(menuRef.current.style.top) || y;
        
        if (Math.abs(currentLeft - adjustedX) > 1 || Math.abs(currentTop - adjustedY) > 1) {
          menuRef.current.style.left = `${adjustedX}px`;
          menuRef.current.style.top = `${adjustedY}px`;
        }
      });
    });
  }, [x, y]);

  return (
    <div
      ref={menuRef}
      className="fixed z-[9999] rounded-lg border shadow-lg min-w-[180px] overflow-hidden"
      style={{
        background: 'var(--card-bg)',
        borderColor: 'var(--card-border)',
        left: `${x}px`,
        top: `${y}px`,
        transform: 'none', // Ensure no transforms affect positioning
      }}
    >
      <button
        onClick={() => {
          onViewMeal(meal);
          onClose();
        }}
        className="w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center gap-2 block cursor-pointer"
        style={{ 
          color: 'var(--foreground)',
          background: 'transparent',
          margin: 0,
          border: 'none',
          borderRadius: 0,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'var(--accent-light)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent';
        }}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
          />
        </svg>
        View Meal
      </button>
      {meal.is_analysed ? (
        <button
          onClick={() => {
            onViewNutritionReport(meal);
            onClose();
          }}
          className="w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center gap-2 block cursor-pointer"
          style={{ 
            color: 'var(--foreground)',
            background: 'transparent',
            margin: 0,
            border: 'none',
            borderRadius: 0,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--accent-light)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
          }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
          View Nutrition Report
        </button>
      ) : (
        <button
          onClick={() => {
            onAnalyseMeal(meal);
            onClose();
          }}
          className="w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center gap-2 block cursor-pointer"
          style={{ 
            color: 'var(--foreground)',
            background: 'transparent',
            margin: 0,
            border: 'none',
            borderRadius: 0,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--accent-light)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
          }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          Analyse Meal
        </button>
      )}
    </div>
  );
}
