import React, { useState } from 'react';
import { motion } from 'motion/react';
import { formatINR } from '../../utils/analyticsUtils';

export default function DailyBarChart({ dailySeries = [] }) {
  const [activeBar, setActiveBar] = useState(null);

  if (!dailySeries || dailySeries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center text-slate-400 dark:text-slate-500 h-64">
        <p className="text-sm font-medium">No daily spending data available</p>
      </div>
    );
  }

  const maxAmount = Math.max(...dailySeries.map((d) => d.amount), 1);
  const chartHeight = 180;

  return (
    <div className="w-full flex flex-col space-y-4">
      {/* Chart Top Stats / Hover tooltip */}
      <div className="flex items-center justify-between text-xs px-1 min-h-[24px]">
        {activeBar ? (
          <div className="flex items-center space-x-2 animate-fade-in">
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {activeBar.fullLabel || activeBar.date}:
            </span>
            <span className="font-bold text-brand-600 dark:text-brand-400">
              {formatINR(activeBar.amount)}
            </span>
          </div>
        ) : (
          <span className="text-slate-400 dark:text-slate-500 text-[11px]">
            Hover or tap any bar to view exact daily expenditure
          </span>
        )}
        <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
          Peak: {formatINR(maxAmount)}
        </span>
      </div>

      {/* Bars Container */}
      <div className="relative flex items-end justify-between gap-1 sm:gap-2 h-48 w-full pt-6 pb-6 border-b border-slate-100 dark:border-slate-800">
        
        {/* Subtle grid lines */}
        <div className="absolute inset-x-0 top-6 border-b border-dashed border-slate-200/60 dark:border-slate-800/60 pointer-events-none" />
        <div className="absolute inset-x-0 top-1/2 border-b border-dashed border-slate-200/40 dark:border-slate-800/40 pointer-events-none" />

        {dailySeries.map((item, idx) => {
          const heightPercent = maxAmount > 0 ? (item.amount / maxAmount) * 100 : 0;
          const isZero = item.amount === 0;
          const isSelected = activeBar?.date === item.date;
          const isPeak = item.amount === maxAmount && maxAmount > 0;

          return (
            <div
              key={item.date}
              className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer relative"
              onMouseEnter={() => setActiveBar(item)}
              onMouseLeave={() => setActiveBar(null)}
              onClick={() => setActiveBar(item)}
            >
              {/* Tooltip on hover */}
              {isSelected && (
                <div className="absolute -top-7 z-30 px-2 py-0.5 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] font-bold shadow-md pointer-events-none whitespace-nowrap">
                  {formatINR(item.amount)}
                </div>
              )}

              {/* Bar */}
              <div className="w-full max-w-[28px] flex items-end justify-center h-full">
                <motion.div
                  className={`w-full rounded-t-lg transition-colors ${
                    isZero
                      ? 'bg-slate-200/60 dark:bg-slate-800/50 min-h-[3px]'
                      : isSelected
                      ? 'bg-brand-500 shadow-glow'
                      : isPeak
                      ? 'bg-gradient-to-t from-brand-600 to-emerald-400'
                      : 'bg-brand-500/80 hover:bg-brand-500'
                  }`}
                  style={{
                    height: isZero ? '3px' : `${Math.max(6, heightPercent)}%`,
                  }}
                  initial={{ height: 0 }}
                  animate={{ height: isZero ? '3px' : `${Math.max(6, heightPercent)}%` }}
                  transition={{ duration: 0.5, delay: idx * 0.02 }}
                />
              </div>

              {/* X-axis label */}
              <span className="absolute -bottom-6 text-[10px] font-medium text-slate-400 dark:text-slate-500 truncate max-w-full">
                {item.label}
              </span>
            </div>
          );
        })}
      </div>

    </div>
  );
}

