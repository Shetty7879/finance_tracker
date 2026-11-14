import React from 'react';
import { useFinance } from '../context/FinanceContext';
import { formatINR } from '../constants/finance';
import { Wallet, TrendingDown, ArrowDownRight, ArrowUpRight, ShieldCheck, PiggyBank } from 'lucide-react';

export default function DashboardCards({ onOpenAddAccount, onOpenAddExpense, onOpenAddIncome }) {
  const { totalBalance, totalIncome, totalExpenses, netSavings, accounts, expenses } = useFinance();

  const incomeTxCount = expenses.filter((e) => e.type === 'income').length;
  const expenseTxCount = expenses.filter((e) => e.type !== 'income').length;

  return (
    <section className="mb-8 sm:mb-10 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-5 gap-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Dashboard Overview
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Real-time financial summary across all your bank accounts, income, and expenses
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-5">
        
        {/* 1. TOTAL BALANCE CARD */}
        <div className="relative overflow-hidden rounded-2xl p-4 sm:p-5 bg-gradient-to-br from-blue-500/10 via-slate-50 to-white dark:from-blue-950/40 dark:via-slate-900/90 dark:to-slate-900 border border-blue-500/20 dark:border-blue-500/30 shadow-subtle hover:shadow-premium transition-all duration-300 group">
          <div className="absolute -top-10 -right-10 w-28 h-28 bg-blue-500/10 dark:bg-blue-500/15 rounded-full blur-2xl pointer-events-none group-hover:scale-110 transition-transform"></div>
          
          <div className="flex items-center justify-between mb-2.5 sm:mb-3">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-400">
              Total Balance
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-500/20">
              <Wallet className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white truncate">
              {formatINR(totalBalance)}
            </div>
            <div className="flex items-center space-x-1.5 pt-1 text-[11px] text-slate-500 dark:text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
              <span className="truncate">
                {accounts.length === 0
                  ? 'No accounts connected'
                  : `Across ${accounts.length} ${accounts.length === 1 ? 'account' : 'accounts'}`}
              </span>
            </div>
          </div>
        </div>

        {/* 2. TOTAL INCOME CARD */}
        <div className="relative overflow-hidden rounded-2xl p-4 sm:p-5 bg-gradient-to-br from-emerald-500/10 via-slate-50 to-white dark:from-emerald-950/40 dark:via-slate-900/90 dark:to-slate-900 border border-emerald-500/20 dark:border-emerald-500/30 shadow-subtle hover:shadow-premium transition-all duration-300 group">
          <div className="absolute -top-10 -right-10 w-28 h-28 bg-emerald-500/10 dark:bg-emerald-500/15 rounded-full blur-2xl pointer-events-none group-hover:scale-110 transition-transform"></div>
          
          <div className="flex items-center justify-between mb-2.5 sm:mb-3">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              Total Income
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <ArrowUpRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-emerald-600 dark:text-emerald-400 truncate">
              {formatINR(totalIncome)}
            </div>
            <div className="flex items-center space-x-1.5 pt-1 text-[11px] text-slate-500 dark:text-slate-400">
              <span className="truncate">
                {incomeTxCount === 0 ? 'No income logged' : `${incomeTxCount} income ${incomeTxCount === 1 ? 'entry' : 'entries'}`}
              </span>
            </div>
          </div>
        </div>

        {/* 3. TOTAL EXPENSES CARD */}
        <div className="relative overflow-hidden rounded-2xl p-4 sm:p-5 bg-gradient-to-br from-rose-500/10 via-slate-50 to-white dark:from-rose-950/40 dark:via-slate-900/90 dark:to-slate-900 border border-rose-500/20 dark:border-rose-500/30 shadow-subtle hover:shadow-premium transition-all duration-300 group">
          <div className="absolute -top-10 -right-10 w-28 h-28 bg-rose-500/10 dark:bg-rose-500/15 rounded-full blur-2xl pointer-events-none group-hover:scale-110 transition-transform"></div>
          
          <div className="flex items-center justify-between mb-2.5 sm:mb-3">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-rose-700 dark:text-rose-400">
              Total Expenses
            </span>
            <div className="w-9 h-9 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-500/20">
              <TrendingDown className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-rose-600 dark:text-rose-400 truncate">
              {formatINR(totalExpenses)}
            </div>
            <div className="flex items-center space-x-1.5 pt-1 text-[11px] text-slate-500 dark:text-slate-400">
              <span className="truncate">
                {expenseTxCount === 0 ? 'No recorded expenses' : `${expenseTxCount} ${expenseTxCount === 1 ? 'expense' : 'expenses'}`}
              </span>
            </div>
          </div>
        </div>

        {/* 4. NET SAVINGS CARD */}
        <div className="relative overflow-hidden rounded-2xl p-4 sm:p-5 bg-gradient-to-br from-brand-500/10 via-slate-50 to-white dark:from-brand-950/40 dark:via-slate-900/90 dark:to-slate-900 border border-brand-500/20 dark:border-brand-500/30 shadow-subtle hover:shadow-premium transition-all duration-300 group">
          <div className="absolute -top-10 -right-10 w-28 h-28 bg-brand-500/10 dark:bg-brand-500/15 rounded-full blur-2xl pointer-events-none group-hover:scale-110 transition-transform"></div>
          
          <div className="flex items-center justify-between mb-2.5 sm:mb-3">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-brand-700 dark:text-brand-400">
              Net Savings
            </span>
            <div className="w-9 h-9 rounded-xl bg-brand-500/15 text-brand-600 dark:text-brand-400 flex items-center justify-center border border-brand-500/20">
              <PiggyBank className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>

          <div className="space-y-1">
            <div className={`text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight truncate ${
              netSavings >= 0 ? 'text-brand-600 dark:text-brand-400' : 'text-rose-600 dark:text-rose-400'
            }`}>
              {formatINR(netSavings)}
            </div>
            <div className="flex items-center space-x-1.5 pt-1 text-[11px] text-slate-500 dark:text-slate-400">
              <span className="truncate">
                {netSavings >= 0 ? 'Surplus capital retained' : 'Deficit across period'}
              </span>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
