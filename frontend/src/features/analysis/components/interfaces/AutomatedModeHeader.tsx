import { ArrowLeftIcon } from '@/components/common/icons';


interface Props {
  onBack: () => void;
}


export function AutomatedModeHeader({ onBack }: Props) {
  return (
    <div className="analysis-header">
      {/* Title row */}
      <div className="analysis-header-row">
        {/* Row content */}
        <div className="analysis-header-content">
          <h2 className="analysis-header-title">Automated Segmentation</h2>
          <p className="analysis-header-subtitle">Automatically segment all foods in the images.</p>
        </div>

        {/* Row back button */}
        <button className="analysis-back-button" onClick={onBack}>
          <ArrowLeftIcon className="analysis-back-button-icon" />
          <span>Back</span>
        </button>
      </div>
    </div>
  );
}
