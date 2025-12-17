'use client';

// =============================================================================
// Type Definitions
// =============================================================================

/** The available navigation sections. */
type Section = 'upload' | 'meals' | 'analysis' | 'nutrition';

/** Props for the Sidebar component. */
interface SidebarProps {
  /** The currently active section. */
  activeSection: Section;
  /** Callback invoked when a section is selected. */
  onSectionChange: (section: Section) => void;
  /** Whether the sidebar is open (mobile only). */
  isOpen?: boolean;
  /** Callback to close the sidebar (mobile only). */
  onClose?: () => void;
}

// =============================================================================
// Component
// =============================================================================

/**
 * Renders the application sidebar.
 *
 * @param props - The component props.
 * @returns The sidebar element.
 */
export default function Sidebar({
  activeSection,
  onSectionChange,
  isOpen = false,
  onClose,
}: SidebarProps) {
  return (
    <>
      {/* Backdrop (mobile only) */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed left-0 top-0 h-screen w-64 flex flex-col border-r z-50
          transition-transform duration-300 ease-in-out
          lg:translate-x-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
        style={{ background: 'var(--sidebar-bg)', borderColor: 'var(--card-border)' }}
      >
        {/* Logo Section */}
        <div className="p-6 border-b" style={{ borderColor: 'var(--card-border)' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'var(--accent-primary)' }}
              >
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              </div>
              <div>
                <h1 className="font-bold text-lg" style={{ color: 'var(--foreground)' }}>
                  SmartCart v3
                </h1>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Nutrition Dashboard
                </p>
              </div>
            </div>
            {/* Close button (mobile only) */}
            <button
              onClick={onClose}
              className="lg:hidden p-1 rounded-lg transition-colors hover:bg-gray-100"
              style={{ color: 'var(--text-muted)' }}
              aria-label="Close menu"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Navigation Section */}
        <nav className="flex-1 p-4 space-y-2">
          <NavButton
            label="Upload Snapshots"
            icon={<UploadIcon />}
            isActive={activeSection === 'upload'}
            onClick={() => onSectionChange('upload')}
          />
          <NavButton
            label="View Meals"
            icon={<MealsIcon />}
            isActive={activeSection === 'meals'}
            onClick={() => onSectionChange('meals')}
          />
          <NavButton
            label="Analyse Meals"
            icon={<AnalysisIcon />}
            isActive={activeSection === 'analysis'}
            onClick={() => onSectionChange('analysis')}
          />
          <NavButton
            label="View Nutrition"
            icon={<NutritionIcon />}
            isActive={activeSection === 'nutrition'}
            onClick={() => onSectionChange('nutrition')}
          />
        </nav>
      </aside>
    </>
  );
}

// =============================================================================
// Sub-Components
// =============================================================================

/** Props for the NavButton sub-component. */
interface NavButtonProps {
  /** Button label text. */
  label: string;
  /** Icon element to display. */
  icon: React.ReactNode;
  /** Whether this button represents the active section. */
  isActive: boolean;
  /** Click handler. */
  onClick: () => void;
}

/**
 * Renders a navigation button in the sidebar.
 *
 * @param props - The component props.
 * @returns A styled navigation button.
 */
function NavButton({ label, icon, isActive, onClick }: NavButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`nav-button w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer ${
        isActive ? 'nav-button-active' : 'nav-button-inactive'
      }`}
      style={{
        ['--nav-bg' as string]: isActive ? 'var(--accent-primary)' : 'transparent',
        ['--nav-bg-hover' as string]: isActive ? 'var(--accent-primary)' : 'rgba(0, 0, 0, 0.05)',
        ['--nav-color' as string]: isActive ? 'white' : 'var(--text-secondary)',
        background: 'var(--nav-bg)',
        color: 'var(--nav-color)',
      }}
      onMouseEnter={(e) => {
        if (!isActive) {
          e.currentTarget.style.background = 'var(--nav-bg-hover)';
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'var(--nav-bg)';
      }}
    >
      {icon}
      <span className="font-medium">{label}</span>
    </button>
  );
}

// =============================================================================
// Icons
// =============================================================================

/**
 * Upload icon component.
 */
function UploadIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
      />
    </svg>
  );
}

/**
 * Meals icon component.
 */
function MealsIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z"
      />
    </svg>
  );
}

/**
 * Analysis icon component.
 */
function AnalysisIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
      />
    </svg>
  );
}

/**
 * Nutrition icon component.
 */
function NutritionIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
      />
    </svg>
  );
}
