interface Props {
  label: string;
  value: number;
  color: string;
}


export function WeightCard({ label, value, color }: Props) {
  return (
    <div className="meal-details-weight-card">
      <p className="meal-details-weight-label">{label}</p>
      <p className="meal-details-weight-value" style={{ color }}>{value.toFixed(1)}g</p>
    </div>
  );
}
