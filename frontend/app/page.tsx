/**
 * @fileoverview Main application page component.
 *
 * This is the root page of the SmartCart application. It manages the
 * top-level navigation state and renders the appropriate section based
 * on user selection.
 *
 * The page uses a responsive sidebar layout:
 * - Desktop (lg+): Fixed sidebar with main content offset
 * - Mobile/Tablet: Collapsible sidebar with overlay
 */

'use client';

import { useState } from 'react';
import Sidebar from './components/Sidebar';
import UploadSection from './components/UploadSection';
import MealsSection from './components/MealsSection';
import AnalysisSection from './components/AnalysisSection';
import NutritionSection from './components/NutritionSection';

// =============================================================================
// Type Definitions
// =============================================================================

/** The available application sections. */
type Section = 'upload' | 'meals' | 'analysis' | 'nutrition';

// =============================================================================
// Component
// =============================================================================

/**
 * Renders the main application page.
 *
 * The page structure consists of:
 * - A fixed sidebar on the left for navigation (collapsible on mobile)
 * - A main content area that displays the active section
 *
 * Navigation state is managed locally since it's simple and doesn't
 * need to be shared with other components.
 *
 * @returns The main page element.
 */
export default function Home() {
  const [activeSection, setActiveSection] = useState<Section>('upload');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: 'var(--background)' }}>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsSidebarOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-40 p-2 rounded-xl border shadow-sm"
        style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
        aria-label="Open menu"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Sidebar */}
      <Sidebar
        activeSection={activeSection}
        onSectionChange={(section) => {
          setActiveSection(section);
          setIsSidebarOpen(false);
        }}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Content (offset for sidebar on desktop) */}
      <main className="lg:ml-64 min-h-screen">
        {activeSection === 'upload' && <UploadSection />}
        {activeSection === 'meals' && <MealsSection />}
        {activeSection === 'analysis' && <AnalysisSection />}
        {activeSection === 'nutrition' && <NutritionSection />}
      </main>
    </div>
  );
}
