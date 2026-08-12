import './NumberBadge.css';

interface Props {
  number: number;
  color: string;
  size?: 'sm' | 'md';
}

export function NumberBadge({ number, color, size = 'md' }: Props) {
  return (
    <div className={`number-badge ${size}`} style={{ background: color }}>
      {number}
    </div>
  );
}
