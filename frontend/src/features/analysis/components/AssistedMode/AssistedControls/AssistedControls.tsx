import './AssistedControls.css';


type InputType = "points" | "text";

interface Props {
  inputType: InputType;
  onInputTypeChange: (type: InputType) => void;
  confidenceThreshold: number;
  onConfidenceThresholdChange: (value: number) => void;
  pointLabel: 0 | 1;
  onPointLabelChange: (label: 0 | 1) => void;
  textPrompt: string;
  onTextPromptChange: (value: string) => void;
  beforePointsCount: number;
  afterPointsCount: number;
  onClearPoints: () => void;
  isRunning: boolean;
  isComputingNutrition: boolean;
}


export function AssistedControls({
  inputType,
  onInputTypeChange,
  confidenceThreshold,
  onConfidenceThresholdChange,
  pointLabel,
  onPointLabelChange,
  textPrompt,
  onTextPromptChange,
  beforePointsCount,
  afterPointsCount,
  onClearPoints,
  isRunning,
  isComputingNutrition,
}: Props) {
  const isLocked = isRunning || isComputingNutrition;
  return (
    <div className="assisted-controls">
      {/* Input type toggle */}
      <div className="assisted-controls-group">
        <label className="assisted-controls-label">Input Type</label>
        <div className="assisted-controls-toggle">
          <button
            className={`toggle-button ${inputType === "text" ? "toggle-button-active" : ""}`}
            onClick={() => !isLocked && onInputTypeChange("text")}
            disabled={isLocked && inputType !== "text"}
          >
            Text Prompt
          </button>
          <button
            className={`toggle-button ${inputType === "points" ? "toggle-button-active" : ""}`}
            onClick={() => !isLocked && onInputTypeChange("points")}
            disabled={isLocked && inputType !== "points"}
          >
            Points
          </button>
        </div>
      </div>

      {/* Text prompt (text mode only) */}
      {inputType === "text" && (
        <div className="assisted-controls-group assisted-controls-group-flex">
          <label className="assisted-controls-label">Text Prompt</label>
          <input
            className="assisted-controls-input"
            type="text"
            value={textPrompt}
            onChange={(e) => onTextPromptChange(e.target.value)}
            placeholder="e.g. chicken drumstick"
          />
        </div>
      )}

      {/* Point controls (points mode only) */}
      {inputType === "points" && (
        <div className="assisted-controls-group assisted-controls-group-auto">
          <label className="assisted-controls-label">Point Type</label>
          <div className="assisted-controls-toggle">
            <button
              className={`toggle-button toggle-button-green ${pointLabel === 1 ? "toggle-button-green-active" : ""}`}
              onClick={() => onPointLabelChange(1)}
            >
              Foreground
            </button>
            <button
              className={`toggle-button toggle-button-red ${pointLabel === 0 ? "toggle-button-red-active" : ""}`}
              onClick={() => onPointLabelChange(0)}
            >
              Background
            </button>

            {(beforePointsCount > 0 || afterPointsCount > 0) && (
              <button className="clear-button" onClick={onClearPoints} disabled={isLocked}>
                Clear Points
              </button>
            )}
          </div>
        </div>
      )}

      {/* Confidence threshold (text mode only) */}
      {inputType === "text" && (
        <div className="assisted-controls-group assisted-controls-threshold">
          <label className="assisted-controls-label">Confidence Threshold</label>
          <div className="assisted-controls-slider-row">
            <input
              className="assisted-controls-slider"
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={confidenceThreshold}
              onChange={(e) => onConfidenceThresholdChange(parseFloat(e.target.value))}
            />
            <span className="assisted-controls-slider-value">{confidenceThreshold.toFixed(2)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
