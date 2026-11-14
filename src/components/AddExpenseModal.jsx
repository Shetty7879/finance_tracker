import React, { useState, useEffect } from 'react';
import { useFinance } from '../context/FinanceContext';
import { EXPENSE_CATEGORIES, CATEGORY_META, getTodayDateString, formatINR } from '../constants/finance';
import DynamicIcon from './DynamicIcon';
import { X, AlertCircle } from 'lucide-react';

export default function AddExpenseModal({ isOpen, onClose, onOpenAddAccount }) {
  const { accounts, addExpense } = useFinance();

  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [accountId, setAccountId] = useState('');
  const [date, setDate] = useState(getTodayDateString());
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Default to first account when accounts load or modal opens
  useEffect(() => {
    if (isOpen) {
      setError('');
      setAmount('');
      setCategory(EXPENSE_CATEGORIES[0]);
      setDate(getTodayDateString());
      setSubmitting(false);
      if (accounts.length > 0 && !accountId) {
        setAccountId(accounts[0].id);
      }
    }
  }, [isOpen, accounts]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid amount greater than ₹0.');
      return;
    }

    if (!accountId) {
      setError('Please select a payment account.');
      return;
    }

    if (!category) {
      setError('Please select a category.');
      return;
    }

    if (!date) {
      setError('Please select a date.');
      return;
    }

    setSubmitting(true);
    try {
      await addExpense({
        amount: parsedAmount,
        category,
        accountId,
        date,
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to add expense.');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedAccount = accounts.find((a) => a.id === accountId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-5 sm:p-7 animate-scale-up max-h-[90vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-expense-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 id="add-expense-title" className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
              Add Expense
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Record a new expense deducted directly from your account
            </p>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* If no accounts exist */}
        {accounts.length === 0 ? (
          <div className="py-6 text-center">
            <div className="w-12 h-12 mx-auto rounded-full bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-3">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h4 className="font-semibold text-slate-900 dark:text-white mb-1">
              No Payment Accounts Found
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto mb-5">
              You need at least one bank account, cash, or wallet to record expenses and track deductions.
            </p>
            <button
              onClick={() => {
                onClose();
                onOpenAddAccount();
              }}
              className="inline-flex items-center px-4 py-2 rounded-xl text-sm font-semibold text-white bg-brand-600 hover:bg-brand-500 transition-all shadow-subtle"
            >
              Add an Account Now
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-5 space-y-5">
            {error && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* 1. AMOUNT */}
            <div>
              <label htmlFor="expense-amount" className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                Amount (₹) *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-bold text-lg">
                  ₹
                </div>
                <input
                  id="expense-amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-9 pr-4 py-3 rounded-xl text-lg font-bold bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white dark:focus:bg-slate-900 transition-all"
                  autoFocus
                />
              </div>
            </div>

            {/* 2. CATEGORY */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-2">
                Category *
              </label>
              <div className="grid grid-cols-3 gap-2">
                {EXPENSE_CATEGORIES.map((cat) => {
                  const meta = CATEGORY_META[cat];
                  const isSelected = category === cat;

                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      className={`flex items-center space-x-2 p-2.5 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'border-brand-500 bg-brand-50/70 dark:bg-brand-950/50 text-brand-700 dark:text-brand-300 shadow-sm ring-1 ring-brand-500'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${meta.bgLight} ${meta.textLight}`}
                      >
                        <DynamicIcon name={meta.icon} className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-semibold truncate">{cat}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. PAYMENT ACCOUNT */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="expense-account" className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                  Payment Account *
                </label>
                {selectedAccount && (
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    Available: <strong className="text-slate-800 dark:text-slate-200">{formatINR(selectedAccount.balance)}</strong>
                  </span>
                )}
              </div>
              <select
                id="expense-account"
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white dark:focus:bg-slate-900 transition-all cursor-pointer"
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} ({acc.type}) — Balance: {formatINR(acc.balance)}
                  </option>
                ))}
              </select>
            </div>

            {/* 4. DATE */}
            <div>
              <label htmlFor="expense-date" className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                Date *
              </label>
              <input
                id="expense-date"
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white dark:focus:bg-slate-900 transition-all"
              />
            </div>

            {/* Action buttons */}
            <div className="pt-3 flex items-center justify-end space-x-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-brand-600 hover:bg-brand-500 active:scale-[0.98] transition-all shadow-subtle hover:shadow-glow disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting ? 'Recording...' : 'Add Expense'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

