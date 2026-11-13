import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { formatINR, formatDate, CATEGORY_META } from '../constants/finance';
import DynamicIcon from './DynamicIcon';
import { Plus, Trash2, Receipt, ArrowDownRight, Search, Filter } from 'lucide-react';

export default function RecentExpensesSection({ onOpenAddExpense, onRequestDeleteExpense }) {
  const { expenses, accounts } = useFinance();
  const [filterCategory, setFilterCategory] = useState('ALL');

  // Filtered expenses if user filters by category
  const filteredExpenses = filterCategory === 'ALL'
    ? expenses
    : expenses.filter((exp) => exp.category === filterCategory);

  return (
    <section className="mb-12 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-5 gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
            <Receipt className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                Recent Expenses
              </h2>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                {expenses.length}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Transaction history deducted from your bank accounts and wallets
            </p>
          </div>
        </div>

        {/* Action + Optional Category Filter */}
        <div className="flex items-center space-x-2">
          {expenses.length > 0 && (
            <div className="relative">
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="text-xs sm:text-sm pl-2.5 pr-7 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 appearance-none cursor-pointer"
              >
                <option value="ALL">All Categories</option>
                {Object.keys(CATEGORY_META).map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                <Filter className="w-3.5 h-3.5" />
              </div>
            </div>
          )}

          <button
            onClick={onOpenAddExpense}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-rose-600 hover:bg-rose-500 active:scale-[0.98] text-white shadow-subtle transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Expense</span>
          </button>
        </div>
      </div>

      {/* Expenses Table / Cards */}
      {expenses.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 p-8 sm:p-12 text-center bg-slate-50/50 dark:bg-slate-900/30">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-4 border border-rose-200/60 dark:border-rose-800/40">
            <Receipt className="w-7 h-7" />
          </div>
          <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white mb-1">
            No expenses recorded yet
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-5">
            {accounts.length === 0
              ? 'Please add a bank account first to record expenses.'
              : 'Record your daily spending (Food, Travel, Bills, etc.) to deduct amounts automatically from your accounts.'}
          </p>
          <button
            onClick={onOpenAddExpense}
            className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-rose-600 hover:bg-rose-500 transition-all shadow-subtle"
          >
            <Plus className="w-4 h-4" />
            <span>Record First Expense</span>
          </button>
        </div>
      ) : filteredExpenses.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-center bg-white dark:bg-slate-900">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            No expenses found for category "{filterCategory}".
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 shadow-subtle">
          
          {/* Desktop Table View */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/75 dark:bg-slate-800/40 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <th className="py-3.5 px-4 sm:px-6">Category</th>
                  <th className="py-3.5 px-4">Payment Account</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4 text-right">Amount</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-sm">
                {filteredExpenses.map((expense) => {
                  const meta = CATEGORY_META[expense.category] || CATEGORY_META['Other'];
                  // Match account name if updated or stored
                  const matchedAccount = accounts.find((a) => a.id === expense.accountId);
                  const accountDisplayName = matchedAccount ? matchedAccount.name : expense.accountName || 'Unknown Account';

                  return (
                    <tr
                      key={expense.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group"
                    >
                      {/* Category */}
                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="flex items-center space-x-3">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center ${meta.bgLight} ${meta.textLight} border ${meta.borderLight} flex-shrink-0`}
                          >
                            <DynamicIcon name={meta.icon} className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-medium text-slate-900 dark:text-white">
                              {expense.category}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Payment Account */}
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border border-slate-200/60 dark:border-slate-700/60">
                          {accountDisplayName}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                        {formatDate(expense.date)}
                      </td>

                      {/* Amount */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap font-semibold text-rose-600 dark:text-rose-400">
                        <span className="inline-flex items-center">
                          <ArrowDownRight className="w-3.5 h-3.5 mr-0.5 opacity-70" />
                          {formatINR(expense.amount)}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 sm:px-6 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => onRequestDeleteExpense(expense)}
                          title="Delete expense"
                          className="opacity-70 group-hover:opacity-100 p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span className="sr-only">Delete</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List View */}
          <div className="sm:hidden divide-y divide-slate-100 dark:divide-slate-800">
            {filteredExpenses.map((expense) => {
              const meta = CATEGORY_META[expense.category] || CATEGORY_META['Other'];
              const matchedAccount = accounts.find((a) => a.id === expense.accountId);
              const accountDisplayName = matchedAccount ? matchedAccount.name : expense.accountName || 'Unknown Account';

              return (
                <div
                  key={expense.id}
                  className="p-4 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                >
                  <div className="flex items-center space-x-3 min-w-0 pr-2">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center ${meta.bgLight} ${meta.textLight} border ${meta.borderLight} flex-shrink-0`}
                    >
                      <DynamicIcon name={meta.icon} className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-sm text-slate-900 dark:text-white truncate">
                        {expense.category}
                      </div>
                      <div className="flex items-center space-x-2 mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                        <span className="font-medium text-slate-700 dark:text-slate-300">
                          {accountDisplayName}
                        </span>
                        <span>•</span>
                        <span>{formatDate(expense.date)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 flex-shrink-0">
                    <div className="text-right">
                      <div className="font-bold text-sm text-rose-600 dark:text-rose-400 whitespace-nowrap">
                        - {formatINR(expense.amount)}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onRequestDeleteExpense(expense)}
                      className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="sr-only">Delete</span>
                    </button>
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

