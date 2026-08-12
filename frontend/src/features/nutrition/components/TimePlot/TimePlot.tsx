import { useEffect, useLayoutEffect, useRef, useState } from 'react';

import { formatDateObject, formatMonthYear, parseDateKey } from '@/utils/date';

import './TimePlot.css';


interface Point {
  date: Date;
  value: number;
}


// SVG canvas size and chart margins.
const W = 560, H = 360;
const M = { top: 15, right: 20, bottom: 60, left: 50 };

// Plot area dimensions, inside the margins.
const IW = W - M.left - M.right;
const IH = H - M.top - M.bottom;

// Chart colours.
const AXIS_COLOR = "#6b7280";
const LINE_COLOR = "#3b82f6";
const LINE_HOVER_COLOR = "#2563eb";


// Sums values that fall on the same calendar day.
function aggregateByDay(xLabels: string[], yValues: number[]): Point[] {
  const byDay = new Map<string, Point>();
  for (let i = 0; i < xLabels.length; i++) {
    const date = parseDateKey(xLabels[i]);
    if (!date) continue;
    const key = date.toISOString();
    const existing = byDay.get(key);
    if (existing) existing.value += yValues[i];
    else byDay.set(key, { date, value: yValues[i] });
  }
  return Array.from(byDay.values()).sort((a, b) => a.date.getTime() - b.date.getTime());
}


// Rounds up to a "nice" axis maximum (1/2/5/10 x 10^n).
function niceCeil(value: number): number {
  if (value <= 0) return 1;
  const exp = Math.floor(Math.log10(value));
  const base = 10 ** exp;
  const frac = value / base;
  const niceFrac = frac <= 1 ? 1 : frac <= 2 ? 2 : frac <= 5 ? 5 : 10;
  return niceFrac * base;
}


// Generates adaptive x-axis ticks that widen as the date range grows.
function generateXTicks(min: Date, max: Date): { date: Date; label: string }[] {
  const daysDiff = Math.ceil((max.getTime() - min.getTime()) / 86_400_000);
  const dates: Date[] = [];

  if (daysDiff <= 7) {
    for (let d = new Date(min); d <= max; d.setDate(d.getDate() + 1)) dates.push(new Date(d));
    return dates.map(d => ({ date: d, label: formatDateObject(d) }));
  }
  if (daysDiff <= 31) {
    const step = Math.max(1, Math.ceil(daysDiff / 7));
    for (let d = new Date(min); d <= max; d.setDate(d.getDate() + step)) dates.push(new Date(d));
    if (dates[dates.length - 1]?.getTime() !== max.getTime()) dates.push(new Date(max));
    return dates.map(d => ({ date: d, label: formatDateObject(d) }));
  }
  if (daysDiff <= 90) {
    for (let d = new Date(min); d <= max; d.setDate(d.getDate() + 7)) dates.push(new Date(d));
    return dates.map(d => ({ date: d, label: formatDateObject(d) }));
  }
  if (daysDiff <= 365) {
    for (let d = new Date(min.getFullYear(), min.getMonth(), 1); d <= max; d.setMonth(d.getMonth() + 1)) dates.push(new Date(d));
    return dates.map(d => ({ date: d, label: formatMonthYear(d) }));
  }
  for (let d = new Date(min.getFullYear(), min.getMonth(), 1); d <= max; d.setMonth(d.getMonth() + 3)) dates.push(new Date(d));
  return dates.map(d => ({ date: d, label: formatMonthYear(d) }));
}


interface Props {
  xLabels: string[];
  yValues: number[];
  label: string;
}


export function TimePlot({ xLabels, yValues, label }: Props) {
  // Hover state.
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

  // Line-draw animation state.
  const [pathLength, setPathLength] = useState(0);
  const [drawn, setDrawn] = useState(false);
  const [dotsVisible, setDotsVisible] = useState(false);

  // Reference used to measure the polyline's length for the draw animation.
  const polylineRef = useRef<SVGPolylineElement>(null);


  // Measure the polyline's length once it's rendered.
  useLayoutEffect(() => {
    if (polylineRef.current) setPathLength(polylineRef.current.getTotalLength());
  }, []);


  // Animate the line draw-in, then reveal the dots once it's mostly drawn.
  useEffect(() => {
    const raf = requestAnimationFrame(() => setDrawn(true));
    const dotsTimer = setTimeout(() => setDotsVisible(true), 1500);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(dotsTimer);
    };
  }, [pathLength]);


  // Aggregate the raw series into daily points.
  const points = aggregateByDay(xLabels, yValues);
  if (points.length === 0) return <p className="time-plot-empty">No data to display.</p>;


  // Date domain.
  const minDate = points[0].date;
  const maxDate = points[points.length - 1].date;

  // Value domain.
  const maxValue = Math.max(...points.map(p => p.value));
  const yHigh = niceCeil(maxValue || 1);


  // Scale functions mapping a date/value to SVG coordinates.
  const xOf = (d: Date) => {
    const span = maxDate.getTime() - minDate.getTime();
    return span === 0 ? M.left + IW / 2 : M.left + ((d.getTime() - minDate.getTime()) / span) * IW;
  };
  const yOf = (v: number) => M.top + (1 - v / yHigh) * IH;


  // Axis ticks.
  const yTicks = Array.from({ length: 5 }, (_, i) => (yHigh / 4) * i);
  const xTicks = generateXTicks(minDate, maxDate);

  // SVG points attribute for the line.
  const polylinePoints = points.map(p => `${xOf(p.date)},${yOf(p.value)}`).join(' ');


  return (
    <div className="time-plot">
      <svg viewBox={`0 0 ${W} ${H}`} className="time-plot-svg" aria-label={`${label} over time`}>
        {/* Y axis */}
        <line x1={M.left} y1={M.top} x2={M.left} y2={M.top + IH} stroke={AXIS_COLOR} strokeWidth={1} />
        {yTicks.map((v, i) => (
          <g key={i}>
            <line x1={M.left - 5} y1={yOf(v)} x2={M.left} y2={yOf(v)} stroke={AXIS_COLOR} />
            <text 
              x={M.left - 9} 
              y={yOf(v)} 
              textAnchor="end" 
              dominantBaseline="middle" 
              fontSize={12} 
              fontWeight={700} 
              fill={AXIS_COLOR}
            >
              {v.toFixed(v < 1 ? 2 : 0)}
            </text>
          </g>
        ))}

        {/* X axis */}
        <line x1={M.left} y1={M.top + IH} x2={M.left + IW} y2={M.top + IH} stroke={AXIS_COLOR} strokeWidth={1} />
        {xTicks.map(({ date, label: tickLabel }, i) => (
          <g key={i}>
            <line x1={xOf(date)} y1={M.top + IH} x2={xOf(date)} y2={M.top + IH + 5} stroke={AXIS_COLOR} />
            <text
              x={xOf(date)}
              y={M.top + IH + 8}
              dx="-0.5em"
              dy="0.5em"
              textAnchor="end"
              fontSize={12}
              fontWeight={700}
              fill={AXIS_COLOR}
              transform={`rotate(-45, ${xOf(date)}, ${M.top + IH + 8})`}
            >
              {tickLabel}
            </text>
          </g>
        ))}

        {/* Line */}
        {points.length > 1 && (
          <polyline
            ref={polylineRef}
            points={polylinePoints}
            fill="none"
            stroke={LINE_COLOR}
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              strokeDasharray: pathLength,
              strokeDashoffset: drawn ? 0 : pathLength,
              transition: "stroke-dashoffset 1500ms linear",
            }}
          />
        )}

        {/* Data points */}
        {points.map((p, i) => (
          <circle
            key={i}
            cx={xOf(p.date)}
            cy={yOf(p.value)}
            r={!dotsVisible ? 0 : hoveredIdx === i ? 7 : 5}
            fill={hoveredIdx === i ? LINE_HOVER_COLOR : LINE_COLOR}
            stroke="var(--card-bg)"
            strokeWidth={2}
            className="time-plot-dot"
            onMouseEnter={e => { setHoveredIdx(i); setTooltipPos({ x: e.clientX, y: e.clientY }); }}
            onMouseLeave={() => setHoveredIdx(null)}
          />
        ))}
      </svg>

      {/* Tooltip */}
      {hoveredIdx !== null && tooltipPos && (
        <div className="time-plot-tooltip" style={{ left: tooltipPos.x + 15, top: tooltipPos.y - 28 }}>
          <strong>Date:</strong> {formatDateObject(points[hoveredIdx].date)}
          <br />
          <strong>Value:</strong> {points[hoveredIdx].value.toFixed(2)}
        </div>
      )}
    </div>
  );
}
