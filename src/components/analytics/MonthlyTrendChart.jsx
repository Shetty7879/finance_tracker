import React, { useState } from 'react';
import { motion } from 'motion/react';
import { formatINR } from '../../utils/analyticsUtils';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function MonthlyTrendChart({ monthlyTrends = [] }) {
  const [activePoint, setActivePoint] = useState(null);

  if (!monthlyTrends || monthlyTrends.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center text-slate-400 dark:text-slate-500 h-64">
        <p className="text-sm font-medium">No historical monthly data recorded yet</p>
      </div>
    );
  }

  const width = 600;
  const height = 220;
  const paddingX = 40;
  const paddingY = 30;

  const innerWidth = width - paddingX * 2;
  const innerHeight = height - paddingY * 2;

  const maxVal = Math.max(...monthlyTrends.map((m) => m.amount), 1);
  const n = monthlyTrends.length;

  // Compute point coordinates
  const points = monthlyTrends.map((item, idx) => {
    const x = n === 1 ? width / 2 : paddingX + (idx / (n - 1)) * innerWidth;
    const y = paddingY + innerHeight - (item.amount / maxVal) * innerHeight;
    return { ...item, x, y };
  });

  // Construct smooth SVG path (catmull-rom / bezier)
  const linePath = points.reduce((acc, p, i, a) => {
    if (i === 0) return `M ${p.x} ${p.y}`;
    const prev = a[i - 1];
    const cpX1 = prev.x + (p.x - prev.x) / 2;
    const cpY1 = prev.y;
    const cpX2 = prev.x + (p.x - prev.x) / 2;
    const cpY2 = p.y;
    return `${acc} C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${p.x} ${p.y}`;
  }, '');

  const areaPath = n > 1
    ? `${linePath} L ${points[points.length - 1].x} ${height - paddingY} L ${points[0].x} ${height - paddingY} Z`
    : '';

  const active = activePoint || points[points.length - 1];

  return (
    <div className="w-full flex flex-col space-y-4">
      {/* Top Details & MoM */}
      <div className="flex items-center justify-between text-xs px-1">
        <div className="flex items-center space-x-2">
          <span className="text-slate-500 dark:text-slate-400 font-medium">
            {active ? `${active.label}:` : 'Latest:'}
          </span>
          <span className="text-sm font-bold text-slate-900 dark:text-white">
            {active ? formatINR(active.amount) : '₹0'}
          </span>
          {active && active.momChange !== 0 && (
            <span
              className={`inline-flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                active.momChange > 0
                  ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400'
                  : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400'
              }`}
            >
              {active.momChange > 0 ? (
                <TrendingUp className="w-3 h-3 mr-0.5" />
              ) : (
                <TrendingDown className="w-3 h-3 mr-0.5" />
              )}
              {active.momChange > 0 ? `+${active.momChange}%` : `${active.momChange}%`} vs prior
            </span>
          )}
        </div>

        <span className="text-[11px] text-slate-400 dark:text-slate-500">
          Peak: {formatINR(maxVal)}
        </span>
      </div>

      {/* SVG Chart with responsive horizontal scroll on mobile */}
      <div className="w-full overflow-x-auto pb-2 -mx-1 px-1">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-44 sm:h-56 min-w-[320px] sm:min-w-0 select-none"
        >
          <defs>
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line
            x1={paddingX}
            y1={paddingY}
            x2={width - paddingX}
            y2={paddingY}
            stroke="currentColor"
            strokeDasharray="4 4"
            className="text-slate-200 dark:text-slate-800"
          />
          <line
            x1={paddingX}
            y1={paddingY + innerHeight / 2}
            x2={width - paddingX}
            y2={paddingY + innerHeight / 2}
            stroke="currentColor"
            strokeDasharray="4 4"
            className="text-slate-200 dark:text-slate-800"
          />
          <line
            x1={paddingX}
            y1={height - paddingY}
            x2={width - paddingX}
            y2={height - paddingY}
            stroke="currentColor"
            className="text-slate-200 dark:text-slate-800"
          />

          {/* Area Fill */}
          {areaPath && (
            <motion.path
              d={areaPath}
              fill="url(#areaGradient)"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
            />
          )}

          {/* Curve Line */}
          <motion.path
            d={linePath}
            fill="none"
            stroke="#10b981"
            strokeWidth={3.5}
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />

          {/* Data Points */}
          {points.map((p) => {
            const isHovered = activePoint?.monthKey === p.monthKey;
            return (
              <g
                key={p.monthKey}
                className="cursor-pointer"
                onMouseEnter={() => setActivePoint(p)}
                onMouseLeave={() => setActivePoint(null)}
              >
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={isHovered ? 7 : 4.5}
                  fill="#ffffff"
                  stroke="#10b981"
                  strokeWidth={isHovered ? 3.5 : 2.5}
                  className="transition-all duration-200"
                />
                <text
                  x={p.x}
                  y={height - 10}
                  textAnchor="middle"
                  className="text-[10px] fill-slate-400 dark:fill-slate-500 font-medium"
                >
                  {p.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

