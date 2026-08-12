import { HamburgerIcon } from '@/components/common/icons';

import './HamburgerButton.css';


interface Props {
  onClick: () => void;
}


export default function HamburgerButton({ onClick }: Props) {
  return (
    <button className="hamburger-button" onClick={onClick} aria-label="Open menu">
      <HamburgerIcon className="hamburger-button-icon" />
    </button>
  );
}
