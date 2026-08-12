import './NutritionWheel.css';


// Macro nutrient colors.
const PROTEIN_COLOR = "#3b82f6";
const CARBS_COLOR   = "#10b981";
const FAT_COLOR     = "#f59e0b";


// SVG donut geometry constants.
const CX = 100;
const CY = 100;
const R = 75;
const SW = 28;


interface Props {
  protein: number | null | undefined;
  carbs: number | null | undefined;
  fat: number | null | undefined;
}


export function NutritionWheel({ protein, carbs, fat }: Props) {
  // Clamp nullish inputs to zero and compute the total.
  const p = Math.max(0, protein ?? 0);
  const c = Math.max(0, carbs ?? 0);
  const f = Math.max(0, fat ?? 0);
  const total = p + c + f;


  // Show an empty state instead of a zero-width donut when there's no data.
  if (total === 0) {
    return (
      <div className="nutrition-wheel-empty">
        <p>No data available.</p>
      </div>
    );
  }


  // Cumulative arc end-angles (degrees, clockwise from top).
  const proteinEnd = total > 0 ? (p / total) * 360 : 0;
  const carbsEnd = proteinEnd + (total > 0 ? (c / total) * 360 : 0);
  const fatEnd = carbsEnd + (total > 0 ? (f / total) * 360 : 0);


  // Converts a clockwise degree offset from the top to an SVG {x, y} point on the arc.
  const polarToXY = (deg: number): { x: number; y: number } => {
    const rad = (deg - 90) * (Math.PI / 180);
    return { 
      x: CX + R * Math.cos(rad), 
      y: CY + R * Math.sin(rad) 
    };
  }


  // Builds an SVG arc path between two degree offsets.
  const arcPath = (startDeg: number, endDeg: number): string => {
    const span = endDeg - startDeg;

    if (span >= 359.99) {
      const p1 = polarToXY(startDeg);
      const p2 = polarToXY(startDeg + 180);
      return `M ${p1.x} ${p1.y} A ${R} ${R} 0 1 1 ${p2.x} ${p2.y} A ${R} ${R} 0 1 1 ${p1.x} ${p1.y}`;
    }

    const start = polarToXY(startDeg);
    const end = polarToXY(endDeg);
    const large = span > 180 ? 1 : 0;
    return `M ${start.x} ${start.y} A ${R} ${R} 0 ${large} 1 ${end.x} ${end.y}`;
  }


  // Macro segments used for both the chart and the legend.
  const macros = [
    { label: "Protein", value: p, color: PROTEIN_COLOR },
    { label: "Carbs",   value: c, color: CARBS_COLOR },
    { label: "Fat",     value: f, color: FAT_COLOR },
  ];

  // Start/end angles for each macro segment.
  const arcAngles = [
    { start: 0,          end: proteinEnd },
    { start: proteinEnd, end: carbsEnd },
    { start: carbsEnd,   end: fatEnd },
  ];


  return (
    <div className="nutrition-wheel">
      {/* Donut chart */}
      <svg viewBox="0 0 200 200" className="nutrition-wheel-svg">
        {/* Arc segments */}
        {macros.map(({ label, value, color }, i) =>
          value > 0 && (
            <path
              key={label}
              d={arcPath(arcAngles[i].start, arcAngles[i].end)}
              fill="none"
              stroke={color}
              strokeWidth={SW}
            />
          )
        )}

        {/* Total grams label */}
        <text x={CX} y={CY - 4} textAnchor="middle" fontSize={24} fontWeight="700" fill="var(--foreground)">
          {total.toFixed(1)}g
        </text>
        <text x={CX} y={CY + 16} textAnchor="middle" fontSize={12} fontWeight="500" fill="var(--text-muted)">
          total
        </text>
      </svg>

      {/* Chart legend */}
      <div className="nutrition-wheel-legend">
        {macros.map(({ label, value, color }) => (
          /* Legend item */
          <div key={label} className="nutrition-wheel-legend-item">
            {/* Nutrient label */}
            <div className="nutrition-wheel-legend-item-left">
              <span className="nutrition-wheel-legend-swatch" style={{ background: color }} />
              <span className="nutrition-wheel-legend-label">{label}</span>
            </div>

            {/* Nutrient value */}
            <div className="nutrition-wheel-legend-item-right">
              <span className="nutrition-wheel-legend-value">{value.toFixed(1)}g</span>
              <span className="nutrition-wheel-legend-pct">
                {total > 0 ? `${((value / total) * 100).toFixed(1)}%` : "0%"}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
