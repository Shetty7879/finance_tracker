import React, { useState, useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import {
  formatINR,
  formatDate,
  CATEGORY_META,
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  isOthersCategory,
} from '../constants/finance';
import DynamicIcon from './DynamicIcon';
import AccountLogo from './AccountLogo';
import {
  Plus,
  Trash2,
  Edit3,
  Receipt,
  ArrowDownRight,
  ArrowUpRight,
  Search,
  Filter,
  Eye,
  Building2,
  Calendar,
  X,
  HelpCircle,
} from 'lucide-react';

export default function RecentExpensesSection({
  onOpenAddExpense,
  onOpenAddIncome,
  onOpenEditTransaction,
  onViewTransaction,
  onRequestDeleteExpense,
}) {
  const { expenses, accounts } = useFinance();

  // Filters & Search
  const [typeFilter, setTypeFilter] = useState('ALL'); // 'ALL' | 'expense' | 'income'
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [filterAccount, setFilterAccount] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Categories available for current type filter
  const availableCategories = useMemo(() => {
    if (typeFilter === 'expense') return EXPENSE_CATEGORIES;
    if (typeFilter === 'income') return INCOME_CATEGORIES;
    return Array.from(new Set([...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES]));
  }, [typeFilter]);

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return expenses.filter((tx) => {
      const txType = (tx.type || tx.transaction_type || 'expense').toLowerCase();
      // 1. Type filter
      if (typeFilter !== 'ALL' && txType !== typeFilter) return false;

      // 2. Category filter
      if (filterCategory !== 'ALL' && tx.category !== filterCategory) return false;

      // 3. Account filter
      if (filterAccount !== 'ALL' && (tx.accountId !== filterAccount && tx.account_id !== filterAccount)) {
        return false;
      }

      // 4. Search query (matches description, reason, category, accountName, notes)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const cat = (tx.category || '').toLowerCase();
        const desc = (tx.description || '').toLowerCase();
        const rsn = (tx.reason || '').toLowerCase();
        const acc = (tx.accountName || '').toLowerCase();
        const nts = (tx.notes || '').toLowerCase();
        return cat.includes(q) || desc.includes(q) || rsn.includes(q) || acc.includes(q) || nts.includes(q);
      }

      return true;
    });
  }, [expenses, typeFilter, filterCategory, filterAccount, searchQuery]);

  return (
    <section className="mb-12 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-5 gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center">
            <Receipt className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                Recent Transactions
              </h2>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                {expenses.length}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Live transaction ledger across bank accounts, UPI, and wallets
            </p>
          </div>
        </div>

        {/* Quick Add Buttons: Expense & Income */}
        <div className="flex items-center space-x-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={onOpenAddExpense}
            className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-500 active:scale-[0.98] text-white shadow-subtle transition-all cursor-pointer"
          >
            <ArrowDownRight className="w-3.5 h-3.5" />
            <span>Add Expense</span>
          </button>

          <button
            type="button"
            onClick={onOpenAddIncome || onOpenAddExpense}
            className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white shadow-subtle transition-all cursor-pointer"
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Add Income</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar (Type Pills + Search + Category + Account) */}
      <div className="mb-4 bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-subtle space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          
          {/* 1. Transaction Type Toggle Pills */}
          <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 self-start">
            {[
              { id: 'ALL', label: 'All Transactions' },
              { id: 'expense', label: 'Expenses' },
              { id: 'income', label: 'Income' },
            ].map((tab) => {
              const active = typeFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setTypeFilter(tab.id);
                    setFilterCategory('ALL');
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    active
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* 2. Search Input */}
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search description, category, reason, or account..."
              className="w-full pl-8 pr-7 py-1.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-3.5 h-3.5" />
            </div>
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* 3. Category & Account Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
          <span className="text-[11px] font-semibold text-slate-400 flex items-center mr-1">
            <Filter className="w-3 h-3 mr-1" /> Filters:
          </span>

          {/* Category Filter */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="text-xs px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-brand-500 cursor-pointer"
          >
            <option value="ALL">All Categories</option>
            {availableCategories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          {/* Account Filter */}
          <select
            value={filterAccount}
            onChange={(e) => setFilterAccount(e.target.value)}
            className="text-xs px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-brand-500 cursor-pointer"
          >
            <option value="ALL">All Accounts</option>
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.name}
              </option>
            ))}
          </select>

          {(filterCategory !== 'ALL' || filterAccount !== 'ALL' || searchQuery || typeFilter !== 'ALL') && (
            <button
              type="button"
              onClick={() => {
                setTypeFilter('ALL');
                setFilterCategory('ALL');
                setFilterAccount('ALL');
                setSearchQuery('');
              }}
              className="text-[11px] font-semibold text-brand-600 dark:text-brand-400 hover:underline ml-auto"
            >
              Reset filters
            </button>
          )}
        </div>
      </div>

      {/* Transactions Table / Empty States */}
      {expenses.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 p-8 sm:p-12 text-center bg-slate-50/50 dark:bg-slate-900/30">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 flex items-center justify-center mb-4 border border-brand-200/60 dark:border-brand-800/40">
            <Receipt className="w-7 h-7" />
          </div>
          <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white mb-1">
            No transactions recorded yet
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-5">
            {accounts.length === 0
              ? 'Please add a bank account first to record income or expenses.'
              : 'Record your expenses (Food, Bills, etc.) or income (Salary, Freelance, etc.) to keep your account balances synchronized.'}
          </p>
          <div className="flex items-center justify-center space-x-3">
            <button
              onClick={onOpenAddExpense}
              className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white bg-rose-600 hover:bg-rose-500 transition-all shadow-subtle"
            >
              <Plus className="w-4 h-4" />
              <span>Add Expense</span>
            </button>
            <button
              onClick={onOpenAddIncome || onOpenAddExpense}
              className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 transition-all shadow-subtle"
            >
              <Plus className="w-4 h-4" />
              <span>Add Income</span>
            </button>
          </div>
        </div>
      ) : filteredTransactions.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-center bg-white dark:bg-slate-900">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            No transactions match the selected filters or search terms.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 shadow-subtle">
          
          {/* Desktop Table View */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/75 dark:bg-slate-800/40 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <th className="py-3.5 px-4 sm:px-6">Type & Category</th>
                  <th className="py-3.5 px-4">Account</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4 text-right">Amount</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-sm">
                {filteredTransactions.map((tx) => {
                  const isExp = (tx.type || tx.transaction_type) !== 'income';
                  const meta = CATEGORY_META[tx.category] || CATEGORY_META['Other'];
                  const matchedAccount = accounts.find((a) => a.id === (tx.accountId || tx.account_id));
                  const accountDisplayName = matchedAccount ? matchedAccount.name : tx.accountName || 'Unknown Account';
                  const isOthers = isOthersCategory(tx.category);

                  return (
                    <tr
                      key={tx.id}
                      className="group hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Type, Category & Reason */}
                      <td className="py-3.5 px-4 sm:px-6 whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                              isExp ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            } border ${isExp ? 'border-rose-500/20' : 'border-emerald-500/20'}`}
                          >
                            <DynamicIcon name={meta.icon} className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              {/* Distinct Type Badge */}
                              <span
                                className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase ${
                                  isExp
                                    ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200/60 dark:border-rose-900/40'
                                    : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-900/40'
                                }`}
                              >
                                {isExp ? 'Expense' : 'Income'}
                              </span>

                              {/* Category title - displays Reason if Others */}
                              <span className="font-semibold text-slate-900 dark:text-white">
                                {isOthers && tx.reason ? tx.reason : tx.category}
                              </span>

                              {/* Subtle 'Other' badge if reason replaced the title */}
                              {isOthers && tx.reason && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                                  Other
                                </span>
                              )}
                            </div>
                            {tx.description && (
                              <p className="text-xs text-slate-400 dark:text-slate-500 truncate max-w-xs mt-0.5">
                                {tx.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Account */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <AccountLogo name={accountDisplayName} size="xs" />
                          <div>
                            <span className="font-medium text-slate-700 dark:text-slate-300">
                              {accountDisplayName}
                            </span>
                            {tx.paymentMethod && (
                              <span className="text-[10px] text-slate-400 block">
                                via {tx.paymentMethod}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-xs text-slate-500 dark:text-slate-400">
                        {formatDate(tx.date || tx.expense_date)}
                      </td>

                      {/* Amount */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap font-bold">
                        <span className={isExp ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}>
                          {isExp ? `- ${formatINR(tx.amount)}` : `+ ${formatINR(tx.amount)}`}
                        </span>
                      </td>

                      {/* Action buttons: View, Edit, Delete */}
                      <td className="py-3.5 px-4 sm:px-6 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end space-x-1">
                          {/* View details */}
                          {onViewTransaction && (
                            <button
                              type="button"
                              onClick={() => onViewTransaction(tx)}
                              title="View details"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span className="sr-only">Details</span>
                            </button>
                          )}

                          {/* Edit */}
                          {onOpenEditTransaction && (
                            <button
                              type="button"
                              onClick={() => onOpenEditTransaction(tx)}
                              title="Edit transaction"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-950/40 transition-colors"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span className="sr-only">Edit</span>
                            </button>
                          )}

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => onRequestDeleteExpense(tx)}
                            title="Delete transaction"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span className="sr-only">Delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List View */}
          <div className="sm:hidden divide-y divide-slate-100 dark:divide-slate-800">
            {filteredTransactions.map((tx) => {
              const isExp = (tx.type || tx.transaction_type) !== 'income';
              const meta = CATEGORY_META[tx.category] || CATEGORY_META['Other'];
              const matchedAccount = accounts.find((a) => a.id === (tx.accountId || tx.account_id));
              const accountDisplayName = matchedAccount ? matchedAccount.name : tx.accountName || 'Unknown Account';
              const isOthers = isOthersCategory(tx.category);

              return (
                <div
                  key={tx.id}
                  className="p-4 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                >
                  <div className="flex items-center space-x-3 min-w-0 pr-2">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        isExp ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                      }`}
                    >
                      <DynamicIcon name={meta.icon} className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-sm text-slate-900 dark:text-white truncate flex items-center space-x-1.5">
                        <span
                          className={`inline-flex items-center px-1 py-0.2 rounded text-[9px] font-bold uppercase ${
                            isExp
                              ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                              : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                          }`}
                        >
                          {isExp ? 'Exp' : 'Inc'}
                        </span>
                        <span className="truncate">{isOthers && tx.reason ? tx.reason : tx.category}</span>
                        {isOthers && tx.reason && (
                          <span className="text-[9px] px-1 py-0.2 rounded bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                            Other
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-1.5 mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                        <AccountLogo name={accountDisplayName} size="xs" />
                        <span className="font-medium text-slate-700 dark:text-slate-300">
                          {accountDisplayName}
                        </span>
                        <span>•</span>
                        <span>{formatDate(tx.date || tx.expense_date)}</span>
                      </div>
                      {tx.description && (
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                          {tx.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 flex-shrink-0">
                    <div className="text-right">
                      <div
                        className={`font-bold text-sm whitespace-nowrap ${
                          isExp ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
                        }`}
                      >
                        {isExp ? `- ${formatINR(tx.amount)}` : `+ ${formatINR(tx.amount)}`}
                      </div>
                    </div>

                    <div className="flex items-center space-x-1">
                      {onOpenEditTransaction && (
                        <button
                          type="button"
                          onClick={() => onOpenEditTransaction(tx)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="Edit"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => onRequestDeleteExpense(tx)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      )}
    </section>
  );
}
