/**
 * @fileoverview Main application page component.
 *
 * This is the root page of the SmartCart application. It manages the
 * top-level navigation state and renders the appropriate section based
 * on user selection.
 *
 * The page uses a fixed sidebar layout with the main content area
 * offset to account for the sidebar width.
 */

'use client';

import { useState } from 'react';
import Sidebar from './components/Sidebar';
import UploadSection from './components/UploadSection';
import MealsSection from './components/MealsSection';

// =============================================================================
// Type Definitions
// =============================================================================

/** The available application sections. */
type Section = 'upload' | 'meals';

// =============================================================================
// Component
// =============================================================================

/**
 * Renders the main application page.
 *
 * The page structure consists of:
 * - A fixed sidebar on the left for navigation
 * - A main content area that displays either the Upload or Meals section
 *
 * Navigation state is managed locally since it's simple and doesn't
 * need to be shared with other components.
 *
 * @returns The main page element.
 */
export default function Home() {
  const [activeSection, setActiveSection] = useState<Section>('upload');

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      {/* Fixed Sidebar */}
      <Sidebar activeSection={activeSection} onSectionChange={setActiveSection} />
      
      {/* Main Content (offset for sidebar) */}
      <main className="ml-64">
        {activeSection === 'upload' ? <UploadSection /> : <MealsSection />}
      </main>
    </div>
  );
}
