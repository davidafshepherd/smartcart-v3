import { XIcon } from '@/components/common/icons';

import './AlertMessage.css';


type AlertType = 'error' | 'success' | 'warning';


interface Props {
  type: AlertType;
  message: string;
  onDismiss?: () => void;
}


const ALERT_STYLES: Record<AlertType, {
  background: string;
  borderColor: string;
  color: string;
  hoverBg: string;
}> = {
  error: {
    background: '#fef2f2',
    borderColor: '#f87171',
    color: '#dc2626',
    hoverBg: '#fee2e2',
  },
  success: {
    background: '#ecfdf5',
    borderColor: '#34d399',
    color: '#059669',
    hoverBg: '#d1fae5',
  },
  warning: {
    background: '#fffbeb',
    borderColor: '#fbbf24',
    color: '#d97706',
    hoverBg: '#fef3c7',
  },
};


export function AlertMessage({ type, message, onDismiss }: Props) {
  // Message's style.
  const style = ALERT_STYLES[type];

  return (
    <div className="alert-message" style={{ background: style.background, borderColor: style.borderColor }}>
      {/* Message text */}
      <p className={onDismiss ? "alert-message-dismiss-text" : ""} style={{ color: style.color }}>{message}</p>

      {/* Dismiss button */}
      {onDismiss && (
        <button 
          className="alert-message-dismiss-button" 
          style={{ color: style.color }}
          onClick={onDismiss} 
          onMouseEnter={(e) => (e.currentTarget.style.background = style.hoverBg)}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          aria-label="Dismiss"
        >
          <XIcon className="alert-message-dismiss-button-icon" />
        </button>
      )}
    </div>
  );
}
