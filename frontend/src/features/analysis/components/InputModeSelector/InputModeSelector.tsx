import { CursorClickIcon, SparklesIcon } from '@/components/common/icons';

import './InputModeSelector.css';


type InputMode = "automated" | "assisted";


interface Props {
  onSelect: (mode: InputMode) => void;
}


export function InputModeSelector({ onSelect }: Props) {
  return (
    <div className="mode-selector">
      {/* Header */}
      <div className="mode-selector-heading">
        <h2 className="mode-selector-title">Select Segmentation Method</h2>
        <p className="mode-selector-subtitle">
          Choose how you want to identify and segment the foods in the images.
        </p>
      </div>

        {/* Analysis modes */}
      <div className="mode-selector-grid">
        {/* Automated mode  */}
        <button className="mode-selector-card" onClick={() => onSelect("automated")}>
          <div className="mode-selector-card-header">
            <div className="mode-selector-icon-wrap">
              <SparklesIcon className="mode-selector-icon" />
            </div>
            <h3 className="mode-selector-card-title">Automated</h3>
          </div>
          <p className="mode-selector-card-desc">
            Let SAM3 automatically segment all foods at once.
            <br />
            Fast and convenient.
          </p>
        </button>

        {/* Assisted mode */}
        <button className="mode-selector-card" onClick={() => onSelect("assisted")}>
          <div className="mode-selector-card-header">
            <div className="mode-selector-icon-wrap">
              <CursorClickIcon className="mode-selector-icon" />
            </div>
            <h3 className="mode-selector-card-title">Assisted</h3>
          </div>
          <p className="mode-selector-card-desc">
            Guide SAM3 with prompts or points for each food.
            <br />
            More control and precision.
          </p>
        </button>
      </div>
    </div>
  );
}
