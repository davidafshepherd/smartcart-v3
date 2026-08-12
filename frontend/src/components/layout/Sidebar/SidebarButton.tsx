import { NavLink } from 'react-router-dom';

import './Sidebar.css';


interface Props {
  to: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
}


export default function SidebarButton({ to, label, icon, onClick }: Props){
  return (
    <NavLink 
      className={({isActive}) => `sidebar-button ${isActive ? "is-active" : "is-inactive"}`}
      to={to} 
      onClick={onClick}
    >
      {icon}
      <span>{label}</span>
    </NavLink>
  );
}
