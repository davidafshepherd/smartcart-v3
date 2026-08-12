import { useState } from 'react';
import { Outlet } from 'react-router-dom';

import HamburgerButton from './HamburgerButton/HamburgerButton';
import Sidebar from './Sidebar/Sidebar';

import './MainLayout.css';


export default function MainLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [navNonce, setNavNonce] = useState(0);

  return (
    <div className="main-layout">
      <HamburgerButton onClick={() => setIsSidebarOpen(true)} />

      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onNavigate={() => setNavNonce(n => n + 1)}
      />

      <main className="main-content">
        <Outlet key={navNonce} />
      </main>
    </div>
  );
}
