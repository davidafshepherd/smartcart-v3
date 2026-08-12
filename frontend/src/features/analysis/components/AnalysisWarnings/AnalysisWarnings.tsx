import { WarningIcon, XIcon } from '@/components/common/icons';

import type { SAM3Warning } from '@/types';

import './AnalysisWarnings.css';


interface Props {
  warnings: SAM3Warning[];
  dismissedWarnings: Set<number>;
  onDismiss: (index: number) => void;
}


export function AnalysisWarnings({ warnings, dismissedWarnings, onDismiss }: Props) {
  return (
    <div className="analysis-warnings">
      {/* Warnings */}
      {warnings.map((warning, index) => {
        if (dismissedWarnings.has(index)) return null;
        return (
          /* Warning */
          <div key={index} className="analysis-warning">
            <WarningIcon className="analysis-warning-icon" />
            <p className="analysis-warning-text">{warning.message}</p>

            <button
              className="analysis-warning-dismiss"
              onClick={() => onDismiss(index)}
              aria-label="Dismiss"
            >
              <XIcon className="analysis-warning-dismiss-icon" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
