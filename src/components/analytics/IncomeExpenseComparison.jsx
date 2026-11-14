import React from 'react';
import { motion } from 'motion/react';
import { formatINR } from '../../utils/analyticsUtils';
import { ArrowDownRight, ArrowUpRight, PiggyBank, Target } from 'lucide-react';

export default function IncomeExpenseComparison({
  totalIncome = 0,
  totalExpenses = 0,
  netSavings = 0,
  savingsRate = 0,
}) {
  const maxVal = Math.max(totalIncome, totalExpenses, 1);
  const incomePercent = (totalIncome / maxVal) * 100;
  const expensePercent = (totalExpenses / maxVal) * 100;

  return (
    <div className="flex flex-col space-y-6">
      
      {/* 2 Comparative Bars: Income vs Expenses */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        
        {/* Income Card */}
        <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-900/50 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
              Total Incoming
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-sm">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
              {formatINR(totalIncome)}
            </span>
            <p className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80 mt-0.5">
              Deposits & Account Funding
            </p>
          </div>
          {/* Visual bar */}
          <div className="w-full h-2 bg-emerald-200/50 dark:bg-emerald-900/40 rounded-full mt-3 overflow-hidden">
            <motion.div
              className="h-full bg-emerald-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${incomePercent}%` }}
              transition={{ duration: 0.7 }}
            />
          </div>
        </div>

        {/* Expenses Card */}
        <div className="p-4 rounded-2xl bg-rose-50/70 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-900/50 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-rose-800 dark:text-rose-300">
              Total Outgoing
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-500 text-white flex items-center justify-center shadow-sm">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
              {formatINR(totalExpenses)}
            </span>
            <p className="text-[11px] text-rose-700/80 dark:text-rose-400/80 mt-0.5">
              Cumulative Period Expenses
            </p>
          </div>
          {/* Visual bar */}
          <div className="w-full h-2 bg-rose-200/50 dark:bg-rose-900/40 rounded-full mt-3 overflow-hidden">
            <motion.div
              className="h-full bg-rose-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${expensePercent}%` }}
              transition={{ duration: 0.7 }}
            />
          </div>
        </div>

      </div>

      {/* Net Savings & Savings Rate Analysis */}
      <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex flex-col sm:flex-row items-center justify-between gap-4">
        
        <div className="flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-brand-600 to-emerald-400 text-white flex items-center justify-center shadow-glow flex-shrink-0">
            <PiggyBank className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Net Capital Surplus
            </span>
            <div className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
              {formatINR(netSavings)}
            </div>
          </div>
        </div>

        {/* Savings Rate Meter */}
        <div className="w-full sm:w-64 flex flex-col space-y-1.5">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-slate-600 dark:text-slate-300 flex items-center">
              <Target className="w-3.5 h-3.5 mr-1 text-brand-500" /> Savings Rate
            </span>
            <span className={`font-bold ${savingsRate >= 20 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
              {savingsRate}%
            </span>
          </div>

          <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden relative">
            <motion.div
              className="h-full bg-gradient-to-r from-brand-500 to-emerald-400 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, Math.max(0, savingsRate))}%` }}
              transition={{ duration: 0.8 }}
            />
            {/* 20% target mark */}
            <div className="absolute top-0 bottom-0 left-[20%] w-0.5 bg-slate-900/40 dark:bg-white/40" title="20% Target" />
          </div>

          <div className="flex justify-between text-[10px] text-slate-400 dark:text-slate-500">
            <span>0%</span>
            <span>20% Benchmark</span>
            <span>100%</span>
          </div>
        </div>

      </div>

    </div>
  );
}

