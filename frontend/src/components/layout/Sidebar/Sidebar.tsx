import { BarChartIcon, SearchIcon, UploadArrowIcon } from '@/components/common/icons';

import SidebarButton from './SidebarButton';
import SidebarHeader from './SidebarHeader';

import './Sidebar.css';


interface Props {
  isOpen?: boolean;
  onClose?: () => void;
  onNavigate: () => void;
}


export default function Sidebar({ isOpen, onClose, onNavigate }: Props){
  // Forces the target page to reload.
  const handleNavClick = () => {
    onNavigate();
    onClose?.();
  };

  return (
    <>
      {isOpen && (<div className="sidebar-backdrop" onClick={onClose} aria-hidden="true"/>)}

      <aside className={`sidebar ${isOpen ? "is-open" : "is-closed"}`}>
        <SidebarHeader onClose={onClose} />

        <nav className="sidebar-navigation">
          <SidebarButton
            label="Upload Snapshots"
            icon={<UploadArrowIcon className="sidebar-icon" />}
            to="/"
            onClick={handleNavClick}
          />
          <SidebarButton
            label="Analyse Meals"
            icon={<SearchIcon className="sidebar-icon" />}
            to="/meals"
            onClick={handleNavClick}
          />
          <SidebarButton
            label="View Nutrition"
            icon={<BarChartIcon className="sidebar-icon" />}
            to="/nutrition"
            onClick={handleNavClick}
          />
        </nav>
      </aside>
    </>
  );
}
