import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { formatDateObject } from '../../lib/dateUtils';

interface LineChartProps {
  xData: string[];
  yData: number[];
  width?: number;
  height?: number;
  marginTop?: number;
  marginRight?: number;
  marginBottom?: number;
  marginLeft?: number;
}

const SingleVarTimePlot: React.FC<LineChartProps> = ({ 
  xData,
  yData,
  width = 800,
  height = 400,
  marginTop = 15,
  marginRight = 20,
  marginBottom = 60,
  marginLeft = 50
}) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!xData || !yData || xData.length === 0 || yData.length === 0 || xData.length !== yData.length) return;
    if (!svgRef.current) return;

    // Clear previous chart
    d3.select(svgRef.current).selectAll('*').remove();

    // Parse dates and combine data
    // Extract just the date portion (first 10 chars) in case keys include meal IDs
    const parseDate = d3.timeParse('%Y-%m-%d');
    const rawData = xData.map((date, i) => ({
      date: parseDate(date.substring(0, 10)),
      value: yData[i]
    })).filter(d => d.date !== null);

    if (rawData.length === 0) return;

    // Aggregate values by date (sum meals on the same day)
    const dateMap = new Map<string, { date: Date; value: number }>();
    for (const d of rawData) {
      const key = d.date!.toISOString();
      if (dateMap.has(key)) {
        dateMap.get(key)!.value += d.value;
      } else {
        dateMap.set(key, { date: d.date!, value: d.value });
      }
    }
    const parsedData = Array.from(dateMap.values()).sort((a, b) => a.date.getTime() - b.date.getTime());

    if (parsedData.length === 0) return;

    // Calculate date range to determine tick interval
    const dateExtent = d3.extent(parsedData, d => d.date) as [Date, Date];
    const daysDiff = Math.ceil((dateExtent[1].getTime() - dateExtent[0].getTime()) / (1000 * 60 * 60 * 24));

    // Determine appropriate tick interval based on date range
    let tickInterval: d3.TimeInterval;
    let dateFormat: string;
    
    if (daysDiff <= 7) {
      // Up to 1 week: show every day
      tickInterval = d3.timeDay.every(1) as d3.TimeInterval;
      dateFormat = '%d/%m/%Y';
    } else if (daysDiff <= 31) {
      // Up to 1 month: show every 3-5 days
      tickInterval = d3.timeDay.every(Math.ceil(daysDiff / 7)) as d3.TimeInterval;
      dateFormat = '%d/%m/%Y';
    } else if (daysDiff <= 90) {
      // Up to 3 months: show weekly
      tickInterval = d3.timeWeek.every(1) as d3.TimeInterval;
      dateFormat = '%d/%m/%Y';
    } else if (daysDiff <= 365) {
      // Up to 1 year: show bi-weekly or monthly
      tickInterval = d3.timeMonth.every(1) as d3.TimeInterval;
      dateFormat = '%b %Y';
    } else {
      // More than 1 year: show quarterly
      tickInterval = d3.timeMonth.every(3) as d3.TimeInterval;
      dateFormat = '%b %Y';
    }

    // Create scales
    const x = d3.scaleTime()
      .domain(dateExtent)
      .range([marginLeft, width - marginRight]);

    const y = d3.scaleLinear()
      .domain([0, d3.max(parsedData, d => d.value) as number])
      .nice()
      .range([height - marginBottom, marginTop]);

    // Create SVG
    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', [0, 0, width, height])
      .attr('style', 'max-width: 100%; display: block;');

    // Add x-axis with adaptive ticks
    const xAxis = d3.axisBottom(x)
      .ticks(tickInterval)
      .tickFormat(d3.timeFormat(dateFormat) as (d: d3.NumberValue) => string);
    
    svg.append('g')
      .attr('transform', `translate(0,${height - marginBottom})`)
      .call(xAxis)
      .style('color', '#6b7280')
      .style("font-size", "12px")
      .style("font-weight", "bold")
      .selectAll('text')
      .attr('transform', 'rotate(-45)')
      .style('text-anchor', 'end')
      .attr('dx', '-0.5em')
      .attr('dy', '0.5em');

    // Add y-axis
    svg.append('g')
      .attr('transform', `translate(${marginLeft},0)`)
      .call(d3.axisLeft(y))
      .style('color', '#6b7280')
      .style("font-size", "12px")
      .style("font-weight", "bold");

    // Create line generator
    const line = d3.line<{date: Date | null, value: number}>()
      .x(d => x(d.date as Date))
      .y(d => y(d.value))
      .curve(d3.curveLinear);

    // Add line path
    const path = svg.append('path')
      .datum(parsedData)
      .attr('fill', 'none')
      .attr('stroke', '#3b82f6')
      .attr('stroke-width', 2.5)
      .attr('d', line);

    // Animate line
    const pathLength = path.node()?.getTotalLength() || 0;
    path
      .attr('stroke-dasharray', `${pathLength} ${pathLength}`)
      .attr('stroke-dashoffset', pathLength)
      .transition()
      .duration(1500)
      .ease(d3.easeLinear)
      .attr('stroke-dashoffset', 0);

    // Add dots
    const dots = svg.selectAll('.dot')
      .data(parsedData)
      .enter()
      .append('circle')
      .attr('class', 'dot')
      .attr('cx', d => x(d.date as Date))
      .attr('cy', d => y(d.value))
      .attr('r', 0)
      .attr('fill', '#3b82f6')
      .attr('stroke', '#fff')
      .attr('stroke-width', 2);

    dots.transition()
      .delay(1500)
      .duration(300)
      .attr('r', 5);

    // Add tooltip (use fixed positioning to avoid affecting document size)
    const tooltip = d3.select('body')
      .append('div')
      .style('position', 'fixed')
      .style('background', '#1f2937')
      .style('color', '#fff')
      .style('padding', '8px 12px')
      .style('border-radius', '6px')
      .style('font-size', '14px')
      .style('pointer-events', 'none')
      .style('opacity', 0)
      .style('z-index', 1000);

    dots
      .on('mouseover', function(event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('r', 7)
          .attr('fill', '#2563eb');

        tooltip
          .style('opacity', 1)
          .html(`<strong>Date:</strong> ${formatDateObject(d.date as Date)}<br/><strong>Value:</strong> ${d.value.toFixed(2)}`)
          .style('left', (event.clientX + 15) + 'px')
          .style('top', (event.clientY - 28) + 'px');
      })
      .on('mouseout', function() {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('r', 5)
          .attr('fill', '#3b82f6');

        tooltip.style('opacity', 0);
      });

    // Cleanup
    return () => {
      tooltip.remove();
    };
  }, [xData, yData, width, height, marginTop, marginRight, marginBottom, marginLeft]);

  return (
    <div className="flex items-center justify-center overflow-hidden">
      <svg ref={svgRef} className="block"></svg>
    </div>
  );
};

export default SingleVarTimePlot;
