import React, { useState } from 'react';
import { motion } from 'motion/react';
import { formatINR } from '../../utils/analyticsUtils';

export default function DonutChart({
  categoryBreakdown = [],
  totalExpenses = 0,
  onSelectCategory,
  selectedCategory,
}) {
  const [hoveredCategory, setHoveredCategory] = useState(null);

  if (!categoryBreakdown || categoryBreakdown.length === 0 || totalExpenses <= 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center text-slate-400 dark:text-slate-500 h-64">
        <div className="w-16 h-16 mb-3 rounded-full border-2 border-dashed border-slate-200 dark:border-slate-800 flex items-center justify-center text-xs">
          0%
        </div>
        <p className="text-sm font-medium">No expenses in this period</p>
        <p className="text-xs mt-1">Add transactions or select a broader date range.</p>
      </div>
    );
  }

  // SVG Geometry
  const size = 260;
  const strokeWidth = 36;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  // Compute stroke offsets for each category slice
  let accumulatedPercent = 0;
  const slices = categoryBreakdown.map((cat) => {
    const strokeDasharray = `${(cat.percentage / 100) * circumference} ${circumference}`;
    const strokeDashoffset = -((accumulatedPercent / 100) * circumference);
    accumulatedPercent += cat.percentage;
    return {
      ...cat,
      strokeDasharray,
      strokeDashoffset,
    };
  });

  const activeItem = hoveredCategory || (selectedCategory ? categoryBreakdown.find((c) => c.category === selectedCategory) : null);

  return (
    <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
      
      {/* SVG Donut */}
      <div className="relative flex items-center justify-center flex-shrink-0 w-[210px] sm:w-[260px] h-[210px] sm:h-[260px]">
        <svg
          viewBox={`0 0 ${size} ${size}`}
          className="w-full h-full transform -rotate-90"
        >
          {/* Background circle track */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-slate-100 dark:text-slate-800/80"
          />

          {/* Slices */}
          {slices.map((slice) => {
            const isHovered = hoveredCategory?.category === slice.category;
            const isSelected = selectedCategory === slice.category;
            const isDimmed = (hoveredCategory && !isHovered) || (selectedCategory && !isSelected && !hoveredCategory);

            return (
              <motion.circle
                key={slice.category}
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke={slice.color}
                strokeWidth={isHovered || isSelected ? strokeWidth + 6 : strokeWidth}
                strokeDasharray={slice.strokeDasharray}
                strokeDashoffset={slice.strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-300 cursor-pointer"
                style={{
                  opacity: isDimmed ? 0.35 : 1,
                  filter: isHovered || isSelected ? `drop-shadow(0 0 8px ${slice.color}66)` : 'none',
                }}
                onMouseEnter={() => setHoveredCategory(slice)}
                onMouseLeave={() => setHoveredCategory(null)}
                onClick={() => {
                  if (onSelectCategory) {
                    onSelectCategory(selectedCategory === slice.category ? null : slice.category);
                  }
                }}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset: slice.strokeDashoffset }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
            );
          })}
        </svg>

        {/* Center Information */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center p-4">
          <span className="text-[11px] font-semibold tracking-wider uppercase text-slate-400 dark:text-slate-500">
            {activeItem ? activeItem.category : 'Total Spent'}
          </span>
          <span className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white mt-0.5 tracking-tight">
            {activeItem ? formatINR(activeItem.amount) : formatINR(totalExpenses)}
          </span>
          <span className="text-xs font-medium text-brand-600 dark:text-brand-400 mt-0.5">
            {activeItem
              ? `${activeItem.percentage}% (${activeItem.count} txns)`
              : `${categoryBreakdown.length} Categories`}
          </span>
        </div>
      </div>

      {/* Category Rankings & Breakdown List */}
      <div className="w-full flex-1 max-h-[300px] overflow-y-auto pr-1 space-y-2.5">
        <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider pb-1 border-b border-slate-100 dark:border-slate-800">
          <span>Category</span>
          <div className="space-x-4">
            <span>Share</span>
            <span>Amount</span>
          </div>
        </div>

        {categoryBreakdown.map((cat, idx) => {
          const isSelected = selectedCategory === cat.category;
          const isHovered = hoveredCategory?.category === cat.category;

          return (
            <div
              key={cat.category}
              onClick={() => onSelectCategory && onSelectCategory(isSelected ? null : cat.category)}
              onMouseEnter={() => setHoveredCategory(cat)}
              onMouseLeave={() => setHoveredCategory(null)}
              className={`p-2 rounded-xl transition-all cursor-pointer flex flex-col space-y-1.5 ${
                isSelected
                  ? 'bg-brand-50 dark:bg-brand-950/40 border border-brand-300 dark:border-brand-800'
                  : isHovered
                  ? 'bg-slate-50 dark:bg-slate-800/60'
                  : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
              }`}
            >
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2.5">
                  <span
                    className="w-3 h-3 rounded-full flex-shrink-0 shadow-sm"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {cat.category}
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500">
                    ({cat.count})
                  </span>
                </div>
                <div className="flex items-center space-x-3 font-medium">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 w-12 text-right">
                    {cat.percentage}%
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white min-w-[70px] text-right">
                    {formatINR(cat.amount)}
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: cat.color }}
                  initial={{ width: 0 }}
                  animate={{ width: `${cat.percentage}%` }}
                  transition={{ duration: 0.6, delay: idx * 0.05 }}
                />
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}

