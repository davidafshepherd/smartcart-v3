'use client';

interface SidebarProps {
  activeSection: 'upload' | 'meals';
  onSectionChange: (section: 'upload' | 'meals') => void;
}

export default function Sidebar({ activeSection, onSectionChange }: SidebarProps) {
  return (
    <aside
      className="fixed left-0 top-0 h-screen w-64 flex flex-col border-r"
      style={{ background: 'var(--sidebar-bg)', borderColor: 'var(--card-border)' }}
    >
      {/* Logo */}
      <div className="p-6 border-b" style={{ borderColor: 'var(--card-border)' }}>
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
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        <button
          onClick={() => onSectionChange('upload')}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200"
          style={{
            background: activeSection === 'upload' ? 'var(--accent-primary)' : 'transparent',
            color: activeSection === 'upload' ? 'white' : 'var(--text-secondary)',
          }}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
            />
          </svg>
          <span className="font-medium">Upload Snapshots</span>
        </button>

        <button
          onClick={() => onSectionChange('meals')}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200"
          style={{
            background: activeSection === 'meals' ? 'var(--accent-primary)' : 'transparent',
            color: activeSection === 'meals' ? 'white' : 'var(--text-secondary)',
          }}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
          <span className="font-medium">View Meals</span>
        </button>
      </nav>
    </aside>
  );
}
