'use client';

import { useState } from 'react';
import Sidebar from './components/Sidebar';
import UploadSection from './components/UploadSection';
import MealsSection from './components/MealsSection';

export default function Home() {
  const [activeSection, setActiveSection] = useState<'upload' | 'meals'>('upload');

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <Sidebar activeSection={activeSection} onSectionChange={setActiveSection} />
      
      <main className="ml-64">
        {activeSection === 'upload' ? <UploadSection /> : <MealsSection />}
      </main>
    </div>
  );
}
