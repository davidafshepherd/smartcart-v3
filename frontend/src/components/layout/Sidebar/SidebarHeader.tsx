import { ClipboardIcon, XIcon } from '@/components/common/icons';

import './Sidebar.css';


interface Props {
  onClose?: () => void;
}

export default function SidebarHeader({ onClose }: Props){
  return (
    <div className="sidebar-header">
      {/* Branding / Logo */}
      <div className="sidebar-brand">
        <div className="sidebar-logo">
          <ClipboardIcon className="sidebar-icon white" />
        </div>
        <div>
          <h1 className="sidebar-title">SmartCart v3</h1>
          <p className="sidebar-subtitle">Nutrition Dashboard</p>
        </div>
      </div>

      {/* Close button (mobile only) */}
      <button className="sidebar-close-button" onClick={onClose} aria-label="Close menu">
        <XIcon className="sidebar-icon" />
      </button>
    </div>
  );
}
