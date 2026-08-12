import { EyeIcon } from '@/components/common/icons';

import './EmptySelection.css';


export function EmptySelection() {
  return (
    <div className="empty-selection">
      <div className="empty-selection-icon">
        <EyeIcon />
      </div>
      
      <p className="empty-selection-title">Select a meal to get started</p>
      <p className="empty-selection-subtitle">Click on a time range in the tree view to view or analyse a meal</p>
    </div>
  );
}
