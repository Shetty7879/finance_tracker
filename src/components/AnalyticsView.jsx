import React, { useState, useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import {
  getDateRangeBounds,
  filterExpensesByDate,
  calculateFinancialSummary,
  getCategoryBreakdown,
  getDailySpendingSeries,
  getMonthlyTrends,
  getAccountAnalytics,
  generateSmartInsights,
  formatINR,
  formatLocalDate,
} from '../utils/analyticsUtils';
import { exportToCSV, exportToPDF } from '../utils/reportExport';
import DonutChart from './analytics/DonutChart';
import DailyBarChart from './analytics/DailyBarChart';
import MonthlyTrendChart from './analytics/MonthlyTrendChart';
import IncomeExpenseComparison from './analytics/IncomeExpenseComparison';

import {
  Calendar,
  Filter,
  Download,
  FileSpreadsheet,
  FileText,
  TrendingDown,
  TrendingUp,
  PieChart as PieIcon,
  BarChart3,
  LineChart as LineIcon,
  Layers,
  ArrowUpDown,
  Sparkles,
  Wallet,
  Building2,
  Check,
  RefreshCw,
  X,
  ChevronDown,
} from 'lucide-react';

export default function AnalyticsView() {
  const { accounts, expenses, syncStatus, refreshData } = useFinance();

  // Date Filter State
  const [dateFilter, setDateFilter] = useState('this_month');
  const [customStart, setCustomStart] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return formatLocalDate(d);
  });
  const [customEnd, setCustomEnd] = useState(() => formatLocalDate(new Date()));
  const [showCustomPickers, setShowCustomPickers] = useState(false);

  // Active Chart View Tab: 'donut' | 'daily' | 'monthly' | 'comparison'
  const [activeChartTab, setActiveChartTab] = useState('donut');

  // Category Drill-Down filter (selected category from donut slice)
  const [selectedCategory, setSelectedCategory] = useState(null);

  // 1. Compute Date Range Bounds
  const rangeInfo = useMemo(() => {
    return getDateRangeBounds(dateFilter, customStart, customEnd);
  }, [dateFilter, customStart, customEnd]);

  // 2. Filter Expenses by Date
  const filteredExpenses = useMemo(() => {
    return filterExpensesByDate(expenses, rangeInfo.startDate, rangeInfo.endDate);
  }, [expenses, rangeInfo.startDate, rangeInfo.endDate]);

  // 3. Compute Financial KPI Summary
  const summary = useMemo(() => {
    return calculateFinancialSummary(accounts, expenses, filteredExpenses, rangeInfo);
  }, [accounts, expenses, filteredExpenses, rangeInfo]);

  // 4. Compute Category Breakdown
  const categoryBreakdown = useMemo(() => {
    return getCategoryBreakdown(filteredExpenses);
  }, [filteredExpenses]);

  // 5. Compute Daily Spending Series
  const dailySeries = useMemo(() => {
    return getDailySpendingSeries(filteredExpenses, rangeInfo.startDate, rangeInfo.endDate);
  }, [filteredExpenses, rangeInfo.startDate, rangeInfo.endDate]);

  // 6. Compute Monthly Trends
  const monthlyTrends = useMemo(() => {
    return getMonthlyTrends(expenses);
  }, [expenses]);

  // 7. Compute Account-wise Analytics
  const accountAnalytics = useMemo(() => {
    return getAccountAnalytics(accounts, expenses, filteredExpenses);
  }, [accounts, expenses, filteredExpenses]);

  // 8. Generate Smart Insights
  const insights = useMemo(() => {
    return generateSmartInsights(summary, categoryBreakdown, dailySeries, monthlyTrends);
  }, [summary, categoryBreakdown, dailySeries, monthlyTrends]);

  // 9. Drill-Down Transactions (filtered by date AND optionally category)
  const drillDownTransactions = useMemo(() => {
    if (!selectedCategory) return filteredExpenses;
    return filteredExpenses.filter((e) => e.category === selectedCategory);
  }, [filteredExpenses, selectedCategory]);

  // Export Handlers
  const handleExportCSV = (reportType = 'Comprehensive Financial Report') => {
    exportToCSV({
      title: reportType,
      dateRangeLabel: rangeInfo.label,
      summary,
      categoryBreakdown,
      accountAnalytics,
      transactions: drillDownTransactions,
    });
  };

  const handleExportPDF = (reportType = 'Comprehensive Financial Statement') => {
    exportToPDF({
      title: reportType,
      dateRangeLabel: rangeInfo.label,
      summary,
      categoryBreakdown,
      accountAnalytics,
      transactions: drillDownTransactions,
    });
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      
      {/* ==================================================================== */}
      {/* 1. TOP HEADER & DATE RANGE FILTER CONTROLS */}
      {/* ==================================================================== */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-4 sm:p-6 shadow-subtle flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        
        {/* Title and date info */}
        <div>
          <div className="flex items-center space-x-2.5">
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Analytics & Reports
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800/60">
              Live Data
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex flex-wrap items-center gap-1">
            <span className="flex items-center">
              <Calendar className="w-3.5 h-3.5 mr-1 text-slate-400" />
              Active Period:
            </span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">{rangeInfo.label}</span>
            <span className="text-slate-400 dark:text-slate-500">•</span>
            <span>{filteredExpenses.length} transactions</span>
          </p>
        </div>

        {/* Date Filter Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {[
            { id: 'today', label: 'Today' },
            { id: 'this_week', label: 'This Week' },
            { id: 'this_month', label: 'This Month' },
            { id: 'last_month', label: 'Last Month' },
            { id: 'last_3_months', label: '3M' },
            { id: 'last_6_months', label: '6M' },
            { id: 'this_year', label: 'This Year' },
            { id: 'custom', label: 'Custom' },
          ].map((tab) => {
            const isActive = dateFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setDateFilter(tab.id);
                  if (tab.id === 'custom') {
                    setShowCustomPickers(true);
                  } else {
                    setShowCustomPickers(false);
                  }
                }}
                className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-brand-600 text-white shadow-subtle'
                    : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {tab.label}
              </button>
            );
          })}

          {/* Export Quick Trigger Dropdown */}
          <div className="flex items-center space-x-1.5 pl-2 border-l border-slate-200 dark:border-slate-800 ml-1">
            <button
              onClick={() => handleExportCSV()}
              title="Export report to CSV (Excel)"
              className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/80 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-300 transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">CSV</span>
            </button>

            <button
              onClick={() => handleExportPDF()}
              title="Export report to PDF"
              className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 transition-colors shadow-subtle cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">PDF</span>
            </button>
          </div>
        </div>

      </div>

      {/* Custom Date Range Pickers (shown when Custom is selected) */}
      {showCustomPickers && (
        <div className="bg-slate-100/80 dark:bg-slate-900/60 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-3 animate-fade-in text-xs">
          <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center">
            <Filter className="w-3.5 h-3.5 mr-1 text-brand-500" />
            Custom Range:
          </span>
          <div className="flex items-center space-x-2">
            <label className="text-slate-500 dark:text-slate-400">From:</label>
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
            />
          </div>
          <div className="flex items-center space-x-2">
            <label className="text-slate-500 dark:text-slate-400">To:</label>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
            />
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 2. FINANCIAL SUMMARY CARDS (6 KPIS) */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-4">
        
        {/* Card 1: Total Incoming */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-subtle flex flex-col justify-between">
          <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">
            Total Incoming
          </span>
          <div className="mt-2">
            <span className="text-base sm:text-lg lg:text-xl font-extrabold text-slate-900 dark:text-white truncate block">
              {formatINR(summary.totalIncome)}
            </span>
            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5 truncate">
              Deposits & Balance
            </p>
          </div>
        </div>

        {/* Card 2: Total Expenses */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-subtle flex flex-col justify-between">
          <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">
            Total Expenses
          </span>
          <div className="mt-2">
            <span className="text-base sm:text-lg lg:text-xl font-extrabold text-rose-600 dark:text-rose-400 truncate block">
              {formatINR(summary.totalExpenses)}
            </span>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-0.5 truncate">
              {filteredExpenses.length} transactions
            </p>
          </div>
        </div>

        {/* Card 3: Net Capital Savings */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-subtle flex flex-col justify-between">
          <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">
            Net Savings
          </span>
          <div className="mt-2">
            <span className="text-base sm:text-lg lg:text-xl font-extrabold text-brand-600 dark:text-brand-400 truncate block">
              {formatINR(summary.netSavings)}
            </span>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-0.5 truncate">
              Surplus capital
            </p>
          </div>
        </div>

        {/* Card 4: Savings Rate (%) */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-subtle flex flex-col justify-between">
          <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">
            Savings Rate
          </span>
          <div className="mt-2">
            <span className="text-base sm:text-lg lg:text-xl font-extrabold text-sky-600 dark:text-sky-400 truncate block">
              {summary.savingsRate}%
            </span>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-0.5 truncate">
              Target: 20%+
            </p>
          </div>
        </div>

        {/* Card 5: Average Daily Spending */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-subtle flex flex-col justify-between">
          <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">
            Daily Run-Rate
          </span>
          <div className="mt-2">
            <span className="text-base sm:text-lg lg:text-xl font-extrabold text-slate-900 dark:text-white truncate block">
              {formatINR(summary.avgDailySpending)}
            </span>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-0.5 truncate">
              /day ({summary.daysInPeriod}d)
            </p>
          </div>
        </div>

        {/* Card 6: Highest Spending Category */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-subtle flex flex-col justify-between">
          <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">
            Top Category
          </span>
          <div className="mt-2">
            <span className="text-sm sm:text-base lg:text-lg font-extrabold text-slate-900 dark:text-white truncate block">
              {summary.highestCategory ? summary.highestCategory.category : 'N/A'}
            </span>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-0.5 truncate">
              {summary.highestCategory ? `${summary.highestCategory.percentage}% of spend` : 'No expenses'}
            </p>
          </div>
        </div>

      </div>

      {/* ==================================================================== */}
      {/* 3. INTERACTIVE CHART MODULE WITH VIEW SWITCHER */}
      {/* ==================================================================== */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-4 sm:p-7 shadow-premium">
        
        {/* Chart Header & View Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 mb-6 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              {activeChartTab === 'donut' && 'Expense Distribution by Category'}
              {activeChartTab === 'daily' && 'Daily Spending Breakdown'}
              {activeChartTab === 'monthly' && 'Historical Monthly Expense Trends'}
              {activeChartTab === 'comparison' && 'Income vs Expense Comparative Analysis'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {activeChartTab === 'donut' && 'Interactive breakdown showing category share and transaction volume'}
              {activeChartTab === 'daily' && 'Daily expenditure volume across the selected timeframe'}
              {activeChartTab === 'monthly' && 'Month-over-month trajectory with comparative changes'}
              {activeChartTab === 'comparison' && 'Incoming funds vs cumulative expenses and savings health'}
            </p>
          </div>

          {/* Chart View Switcher Tabs (Horizontally scrollable on narrow phones) */}
          <div className="flex items-center overflow-x-auto no-scrollbar max-w-full p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 self-start sm:self-auto flex-shrink-0">
            <button
              onClick={() => setActiveChartTab('donut')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeChartTab === 'donut'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <PieIcon className="w-3.5 h-3.5" />
              <span>Category</span>
            </button>

            <button
              onClick={() => setActiveChartTab('daily')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeChartTab === 'daily'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Daily</span>
            </button>

            <button
              onClick={() => setActiveChartTab('monthly')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeChartTab === 'monthly'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <LineIcon className="w-3.5 h-3.5" />
              <span>Trends</span>
            </button>

            <button
              onClick={() => setActiveChartTab('comparison')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeChartTab === 'comparison'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span>Comparison</span>
            </button>
          </div>
        </div>

        {/* Render Selected Chart */}
        <div>
          {activeChartTab === 'donut' && (
            <DonutChart
              categoryBreakdown={categoryBreakdown}
              totalExpenses={summary.totalExpenses}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
            />
          )}

          {activeChartTab === 'daily' && (
            <DailyBarChart dailySeries={dailySeries} />
          )}

          {activeChartTab === 'monthly' && (
            <MonthlyTrendChart monthlyTrends={monthlyTrends} />
          )}

          {activeChartTab === 'comparison' && (
            <IncomeExpenseComparison
              totalIncome={summary.totalIncome}
              totalExpenses={summary.totalExpenses}
              netSavings={summary.netSavings}
              savingsRate={summary.savingsRate}
            />
          )}
        </div>

      </div>

      {/* ==================================================================== */}
      {/* 4. ACCOUNT-WISE ANALYTICS & FINANCIAL ACTIVITY */}
      {/* ==================================================================== */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-6 sm:p-7 shadow-subtle">
        
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center">
              <Building2 className="w-5 h-5 mr-2 text-brand-500" />
              Account-Wise Financial Activity
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Breakdown of incoming capital, current balance, and outgoing spending per account
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-400">
            {accountAnalytics.length} Accounts
          </span>
        </div>

        {accountAnalytics.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            No bank accounts configured yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {accountAnalytics.map((acc) => (
              <div
                key={acc.id}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex flex-col justify-between space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-xl bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-400 flex items-center justify-center font-bold text-xs shadow-sm">
                      <Wallet className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        {acc.name}
                      </h4>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                        {acc.type}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {formatINR(acc.currentBalance)}
                    </span>
                    <span className="text-[10px] block text-slate-400">Available</span>
                  </div>
                </div>

                {/* Spending Share & Outgoing */}
                <div className="space-y-1.5 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 text-xs">
                  <div className="flex justify-between text-slate-500 dark:text-slate-400 text-[11px]">
                    <span>Period Expenses ({acc.transactionCount} txns):</span>
                    <span className="font-bold text-rose-600 dark:text-rose-400">
                      {formatINR(acc.outgoing)}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-500 dark:text-slate-400 text-[11px]">
                    <span>Share of Total Spending:</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {acc.spendingShare}%
                    </span>
                  </div>

                  {/* Visual Share Bar */}
                  <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-brand-500 rounded-full"
                      style={{ width: `${acc.spendingShare}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* ==================================================================== */}
      {/* 5. SMART FINANCIAL INSIGHTS */}
      {/* ==================================================================== */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-3xl p-6 sm:p-7 shadow-premium border border-slate-800">
        
        <div className="flex items-center space-x-2.5 mb-5">
          <div className="w-8 h-8 rounded-xl bg-brand-500/20 text-brand-400 flex items-center justify-center border border-brand-500/30">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold tracking-tight">
              Smart Financial Insights
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Automated pattern detection from your real spending records
            </p>
          </div>
        </div>

        {insights.length === 0 ? (
          <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/60 text-xs text-slate-400 text-center">
            Insufficient transaction history in this date range to formulate comparative insights.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {insights.map((insight, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex flex-col justify-between space-y-2 hover:border-slate-600 transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      insight.type === 'positive'
                        ? 'bg-emerald-400'
                        : insight.type === 'warning'
                        ? 'bg-amber-400'
                        : 'bg-sky-400'
                    }`}
                  />
                  <h4 className="text-xs font-bold text-slate-200">
                    {insight.title}
                  </h4>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {insight.description}
                </p>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* ==================================================================== */}
      {/* 6. DRILL-DOWN TRANSACTIONS LIST */}
      {/* ==================================================================== */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-6 sm:p-7 shadow-subtle">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center">
              Period Transactions
              {selectedCategory && (
                <span className="ml-2 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300 border border-brand-200 dark:border-brand-800/50">
                  Filtered: {selectedCategory}
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Showing {drillDownTransactions.length} recorded items for {rangeInfo.label}
            </p>
          </div>

          {selectedCategory && (
            <button
              onClick={() => setSelectedCategory(null)}
              className="inline-flex items-center space-x-1 text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>Clear category filter</span>
            </button>
          )}
        </div>

        {drillDownTransactions.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400 dark:text-slate-500">
            No transactions match the selected criteria.
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    <th className="pb-3 font-semibold">Date</th>
                    <th className="pb-3 font-semibold">Category</th>
                    <th className="pb-3 font-semibold">Account</th>
                    <th className="pb-3 font-semibold text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {drillDownTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 text-slate-600 dark:text-slate-300 font-medium">
                        {tx.expense_date || (tx.created_at ? tx.created_at.slice(0, 10) : '')}
                      </td>
                      <td className="py-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {tx.category}
                        </span>
                      </td>
                      <td className="py-3 text-slate-500 dark:text-slate-400 font-medium">
                        {tx.account_name || tx.accounts?.account_name || 'Bank Account'}
                      </td>
                      <td className="py-3 text-right font-bold text-slate-900 dark:text-white">
                        {formatINR(tx.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List View */}
            <div className="sm:hidden divide-y divide-slate-100 dark:divide-slate-800">
              {drillDownTransactions.map((tx) => (
                <div key={tx.id} className="py-3 flex items-center justify-between">
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center space-x-2">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {tx.category}
                      </span>
                      <span className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                        {tx.account_name || tx.accounts?.account_name || 'Bank Account'}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400 dark:text-slate-500 block mt-0.5">
                      {tx.expense_date || (tx.created_at ? tx.created_at.slice(0, 10) : '')}
                    </span>
                  </div>
                  <div className="font-bold text-sm text-slate-900 dark:text-white whitespace-nowrap">
                    {formatINR(tx.amount)}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

      </div>

      {/* ==================================================================== */}
      {/* 7. FINANCIAL REPORTS CATALOG & EXPORT CENTER */}
      {/* ==================================================================== */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-6 sm:p-7 shadow-subtle">
        
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center">
              <Download className="w-5 h-5 mr-2 text-brand-500" />
              Financial Reports Center
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Export professional accounting and tax statements in CSV and PDF formats
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            {
              title: 'Monthly Summary Statement',
              desc: 'Overall income, expenses, and net savings for the period.',
              action: () => handleExportPDF('Monthly Summary Statement'),
              csvAction: () => handleExportCSV('Monthly Summary Statement'),
            },
            {
              title: 'Category-Wise Expense Audit',
              desc: 'Ranked distribution and transaction breakdown by category.',
              action: () => handleExportPDF('Category-Wise Expense Audit'),
              csvAction: () => handleExportCSV('Category-Wise Expense Audit'),
            },
            {
              title: 'Account Activity Report',
              desc: 'Deposit balances and outgoing expense debit statement.',
              action: () => handleExportPDF('Account Activity Report'),
              csvAction: () => handleExportCSV('Account Activity Report'),
            },
            {
              title: 'Complete Transaction History',
              desc: 'Every itemized transaction line with timestamp and account.',
              action: () => handleExportPDF('Complete Transaction History'),
              csvAction: () => handleExportCSV('Complete Transaction History'),
            },
            {
              title: 'Custom Range Audit',
              desc: 'Customized financial statement for the selected date range.',
              action: () => handleExportPDF(`Custom Audit (${rangeInfo.label})`),
              csvAction: () => handleExportCSV(`Custom Audit (${rangeInfo.label})`),
            },
          ].map((rep, idx) => (
            <div
              key={idx}
              className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex flex-col justify-between space-y-3"
            >
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                  {rep.title}
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  {rep.desc}
                </p>
              </div>

              <div className="flex items-center space-x-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                <button
                  onClick={rep.action}
                  className="flex-1 py-1.5 px-3 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 text-white transition-colors flex items-center justify-center space-x-1 cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 mr-1" />
                  <span>PDF</span>
                </button>
                <button
                  onClick={rep.csvAction}
                  className="flex-1 py-1.5 px-3 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 transition-colors flex items-center justify-center space-x-1 cursor-pointer"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                  <span>CSV</span>
                </button>
              </div>
            </div>
          ))}
        </div>

      </div>

    </div>
  );
}

