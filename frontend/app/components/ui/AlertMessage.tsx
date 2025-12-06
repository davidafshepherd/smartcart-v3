'use client';

interface AlertMessageProps {
  type: 'error' | 'success' | 'warning';
  message: string;
  className?: string;
}

const styles = {
  error: {
    background: '#fef2f2',
    borderColor: 'var(--danger)',
    color: 'var(--danger)',
  },
  success: {
    background: '#f0fdf4',
    borderColor: 'var(--success)',
    color: 'var(--success)',
  },
  warning: {
    background: '#fefce8',
    borderColor: 'var(--warning)',
    color: 'var(--warning)',
  },
};

export function AlertMessage({ type, message, className = '' }: AlertMessageProps) {
  const style = styles[type];

  return (
    <div
      className={`p-4 rounded-xl border ${className}`}
      style={{ background: style.background, borderColor: style.borderColor }}
    >
      <p style={{ color: style.color }}>{message}</p>
    </div>
  );
}
