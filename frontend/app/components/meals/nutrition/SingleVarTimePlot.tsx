import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { formatDateObject } from '../../../lib/dateUtils';

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
  marginTop = 20,
  marginRight = 30,
  marginBottom = 40,
  marginLeft = 50
}) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!xData || !yData || xData.length === 0 || yData.length === 0 || xData.length !== yData.length) return;
    if (!svgRef.current) return;

    // Clear previous chart
    d3.select(svgRef.current).selectAll('*').remove();

    // Parse dates and combine data
    const parseDate = d3.timeParse('%Y-%m-%d');
    const parsedData = xData.map((date, i) => ({
      date: parseDate(date),
      value: yData[i]
    })).filter(d => d.date !== null);

    if (parsedData.length === 0) return;

    // Create scales
    const x = d3.scaleTime()
      .domain(d3.extent(parsedData, d => d.date) as [Date, Date])
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
      .attr('style', 'max-width: 100%; height: auto;');

    // Add x-axis
    svg.append('g')
      .attr('transform', `translate(0,${height - marginBottom})`)
      .call(d3.axisBottom(x).ticks(d3.timeDay.every(1)))
      .style('color', '#6b7280')
      .style("font-size", "14px")
      .style("font-weight", "bold");

    // Add y-axis
    svg.append('g')
      .attr('transform', `translate(${marginLeft},0)`)
      .call(d3.axisLeft(y))
      .style('color', '#6b7280')
      .style("font-size", "14px")
      .style("font-weight", "bold");

    // Create line generator
    const line = d3.line<{date: Date | null, value: number}>()
      .x(d => x(d.date as Date))
      .y(d => y(d.value))
      .curve(d3.curveMonotoneX);

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

    // Add tooltip
    const tooltip = d3.select('body')
      .append('div')
      .style('position', 'absolute')
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
          .html(`<strong>Date:</strong> ${formatDateObject(d.date as Date)}<br/><strong>Value:</strong> ${d.value}`)
          .style('left', (event.pageX + 15) + 'px')
          .style('top', (event.pageY - 28) + 'px');
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
    <div className="w-full p-6">
      <svg ref={svgRef}></svg>
    </div>
  );
};

export default SingleVarTimePlot;