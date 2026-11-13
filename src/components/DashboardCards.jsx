import React from 'react';
import { useFinance } from '../context/FinanceContext';
import { formatINR } from '../constants/finance';
import { Wallet, TrendingDown, Calendar, ArrowUpRight, ShieldCheck } from 'lucide-react';

export default function DashboardCards({ onOpenAddAccount, onOpenAddExpense }) {
  const { totalBalance, totalExpenses, thisMonthExpenses, accounts, expenses } = useFinance();

  // Current month name for subtitle
  const currentMonthName = new Intl.DateTimeFormat('en-IN', {
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  return (
    <section className="mb-8 sm:mb-10 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-5 gap-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Dashboard Overview
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Real-time financial summary across all your bank accounts and expenses
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        
        {/* 1. TOTAL BALANCE CARD */}
        <div className="relative overflow-hidden rounded-2xl p-5 sm:p-6 bg-gradient-to-br from-emerald-500/10 via-slate-50 to-white dark:from-emerald-950/40 dark:via-slate-900/90 dark:to-slate-900 border border-emerald-500/20 dark:border-emerald-500/30 shadow-subtle hover:shadow-premium transition-all duration-300 group">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-500/10 dark:bg-emerald-500/15 rounded-full blur-2xl pointer-events-none group-hover:scale-110 transition-transform"></div>
          
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              Total Balance
            </span>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <Wallet className="w-5 h-5" />
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white truncate">
              {formatINR(totalBalance)}
            </div>
            <div className="flex items-center space-x-2 pt-1 text-xs text-slate-500 dark:text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
              <span>
                {accounts.length === 0
                  ? 'No accounts connected'
                  : `Across ${accounts.length} ${accounts.length === 1 ? 'account' : 'accounts'}`}
              </span>
            </div>
          </div>
        </div>

        {/* 2. TOTAL EXPENSES CARD */}
        <div className="relative overflow-hidden rounded-2xl p-5 sm:p-6 bg-gradient-to-br from-rose-500/10 via-slate-50 to-white dark:from-rose-950/40 dark:via-slate-900/90 dark:to-slate-900 border border-rose-500/20 dark:border-rose-500/30 shadow-subtle hover:shadow-premium transition-all duration-300 group">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-rose-500/10 dark:bg-rose-500/15 rounded-full blur-2xl pointer-events-none group-hover:scale-110 transition-transform"></div>
          
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-rose-700 dark:text-rose-400">
              Total Expenses
            </span>
            <div className="w-10 h-10 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-500/20">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-rose-600 dark:text-rose-400 truncate">
              {formatINR(totalExpenses)}
            </div>
            <div className="flex items-center space-x-2 pt-1 text-xs text-slate-500 dark:text-slate-400">
              <span>
                {expenses.length === 0
                  ? 'No recorded expenses'
                  : `All-time (${expenses.length} ${expenses.length === 1 ? 'transaction' : 'transactions'})`}
              </span>
            </div>
          </div>
        </div>

        {/* 3. THIS MONTH EXPENSES CARD */}
        <div className="relative overflow-hidden rounded-2xl p-5 sm:p-6 bg-gradient-to-br from-amber-500/10 via-slate-50 to-white dark:from-amber-950/40 dark:via-slate-900/90 dark:to-slate-900 border border-amber-500/20 dark:border-amber-500/30 shadow-subtle hover:shadow-premium transition-all duration-300 group">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-500/10 dark:bg-amber-500/15 rounded-full blur-2xl pointer-events-none group-hover:scale-110 transition-transform"></div>
          
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">
              This Month Expenses
            </span>
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/20">
              <Calendar className="w-5 h-5" />
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-amber-600 dark:text-amber-400 truncate">
              {formatINR(thisMonthExpenses)}
            </div>
            <div className="flex items-center space-x-2 pt-1 text-xs text-slate-500 dark:text-slate-400">
              <span>{currentMonthName}</span>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}

