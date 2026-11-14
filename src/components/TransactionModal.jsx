import React, { useState, useEffect } from 'react';
import { useFinance } from '../context/FinanceContext';
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  PAYMENT_METHODS,
  CATEGORY_META,
  getTodayDateString,
  formatINR,
  isOthersCategory,
} from '../constants/finance';
import DynamicIcon from './DynamicIcon';
import AccountLogo from './AccountLogo';
import { X, AlertCircle, ArrowDownRight, ArrowUpRight, Check, HelpCircle } from 'lucide-react';

export default function TransactionModal({
  isOpen,
  onClose,
  onOpenAddAccount,
  initialData = null, // null for new transaction; transaction object for edit
  defaultType = 'expense', // 'expense' | 'income'
}) {
  const { accounts, addTransaction, editTransaction } = useFinance();

  const isEditMode = Boolean(initialData && initialData.id);

  // Form states
  const [type, setType] = useState(defaultType); // 'expense' | 'income'
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [accountId, setAccountId] = useState('');
  const [date, setDate] = useState(getTodayDateString());
  const [description, setDescription] = useState('');
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHODS[0]);
  const [notes, setNotes] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Initialize or populate form whenever modal opens or initialData changes
  useEffect(() => {
    if (isOpen) {
      setError('');
      setSubmitting(false);

      if (initialData) {
        // Edit Mode: Pre-populate existing transaction data
        const txType = (initialData.type || initialData.transaction_type || 'expense').toLowerCase();
        setType(txType);
        setAmount(String(initialData.amount || ''));
        setCategory(initialData.category || (txType === 'income' ? INCOME_CATEGORIES[0] : EXPENSE_CATEGORIES[0]));
        setAccountId(initialData.accountId || initialData.account_id || (accounts[0]?.id || ''));
        setDate(initialData.date || initialData.expense_date || getTodayDateString());
        setDescription(initialData.description || '');
        setPaymentMethod(initialData.paymentMethod || initialData.payment_method || PAYMENT_METHODS[0]);
        setNotes(initialData.notes || '');
        setReason(initialData.reason || '');
      } else {
        // Add Mode: Reset to defaults
        const txType = (defaultType || 'expense').toLowerCase();
        setType(txType);
        setAmount('');
        setCategory(txType === 'income' ? INCOME_CATEGORIES[0] : EXPENSE_CATEGORIES[0]);
        setAccountId(accounts[0]?.id || '');
        setDate(getTodayDateString());
        setDescription('');
        setPaymentMethod(PAYMENT_METHODS[0]);
        setNotes('');
        setReason('');
      }
    }
  }, [isOpen, initialData, defaultType, accounts]);

  // Keep category in sync when switching between Income and Expense if needed
  const handleTypeChange = (newType) => {
    setType(newType);
    setError('');
    // Switch to first category of new type unless current is Other
    if (!isOthersCategory(category)) {
      setCategory(newType === 'income' ? INCOME_CATEGORIES[0] : EXPENSE_CATEGORIES[0]);
    }
  };

  if (!isOpen) return null;

  const isOthers = isOthersCategory(category);
  const currentCategories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  const selectedAccount = accounts.find((a) => a.id === accountId);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid amount greater than ₹0.');
      return;
    }

    if (!accountId) {
      setError('Please select an account.');
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

    // Mandatory Reason validation for Others category
    if (isOthers && !reason.trim()) {
      setError('Reason for Others category is mandatory. Please explain why this transaction is categorized as Others.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        type,
        amount: parsedAmount,
        category,
        accountId,
        date,
        description: description.trim(),
        paymentMethod,
        notes: notes.trim(),
        reason: isOthers ? reason.trim() : '',
      };

      if (isEditMode) {
        await editTransaction(initialData.id, payload);
      } else {
        await addTransaction(payload);
      }
      onClose();
    } catch (err) {
      setError(err.message || `Failed to ${isEditMode ? 'update' : 'save'} transaction.`);
    } finally {
      setSubmitting(false);
    }
  };

  const isExpense = type === 'expense';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-5 sm:p-7 animate-scale-up max-h-[90vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="transaction-modal-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 id="transaction-modal-title" className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <span>{isEditMode ? 'Edit Transaction' : isExpense ? 'Record Expense' : 'Record Income'}</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {isEditMode
                ? 'Modify transaction details with automatic balance recalculation'
                : isExpense
                ? 'Expense amount will be deducted from your account balance'
                : 'Income amount will be added to your account balance'}
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
              You need at least one bank account or wallet to track transactions.
            </p>
            <button
              type="button"
              onClick={() => {
                onClose();
                if (onOpenAddAccount) onOpenAddAccount();
              }}
              className="inline-flex items-center px-4 py-2 rounded-xl text-sm font-semibold text-white bg-brand-600 hover:bg-brand-500 transition-all shadow-subtle"
            >
              Add an Account Now
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4 sm:space-y-5">
            {error && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 text-xs flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* 1. TRANSACTION TYPE SEGMENTED TOGGLE (Expense vs Income) */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                Transaction Type *
              </label>
              <div className="grid grid-cols-2 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 shadow-inner">
                <button
                  type="button"
                  onClick={() => handleTypeChange('expense')}
                  className={`flex items-center justify-center space-x-2 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                    isExpense
                      ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-sm'
                      : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                  }`}
                >
                  <ArrowDownRight className="w-4 h-4 text-rose-500" />
                  <span>Expense (Deduct)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleTypeChange('income')}
                  className={`flex items-center justify-center space-x-2 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                    !isExpense
                      ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm'
                      : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                  }`}
                >
                  <ArrowUpRight className="w-4 h-4 text-emerald-500" />
                  <span>Income (Add)</span>
                </button>
              </div>
            </div>

            {/* 2. AMOUNT & DATE IN 2 COLUMNS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Amount */}
              <div>
                <label htmlFor="tx-amount" className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                  Amount (₹) *
                </label>
                <div className="relative">
                  <div className={`absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none font-bold text-lg ${
                    isExpense ? 'text-rose-500' : 'text-emerald-500'
                  }`}>
                    ₹
                  </div>
                  <input
                    id="tx-amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                  />
                </div>
              </div>

              {/* Date */}
              <div>
                <label htmlFor="tx-date" className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                  Date *
                </label>
                <input
                  id="tx-date"
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                />
              </div>
            </div>

            {/* 3. ACCOUNT & CATEGORY IN 2 COLUMNS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Account Selection */}
              <div>
                <label htmlFor="tx-account" className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                  {isExpense ? 'Paid From (Account) *' : 'Deposit To (Account) *'}
                </label>
                <select
                  id="tx-account"
                  required
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({formatINR(acc.balance)})
                    </option>
                  ))}
                </select>
                {selectedAccount && (
                  <div className="mt-1.5 flex items-center space-x-2 text-[11px] text-slate-400 dark:text-slate-500">
                    <AccountLogo account={selectedAccount} size="xs" />
                    <span>
                      Balance: <strong className="text-slate-700 dark:text-slate-300">{formatINR(selectedAccount.balance)}</strong>
                    </span>
                  </div>
                )}
              </div>

              {/* Category */}
              <div>
                <label htmlFor="tx-category" className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                  {isExpense ? 'Expense Category *' : 'Income Category *'}
                </label>
                <select
                  id="tx-category"
                  required
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all cursor-pointer"
                >
                  {currentCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>

                {/* Quick Category Chips for 1-tap selection */}
                <div className="mt-2 flex flex-wrap gap-1.5 p-1 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/80">
                  {currentCategories.map((cat) => {
                    const meta = CATEGORY_META[cat] || CATEGORY_META['Other'];
                    const isSelected = category === cat;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setCategory(cat)}
                        className={`inline-flex items-center space-x-1 px-2 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                          isSelected
                            ? isExpense
                              ? 'bg-rose-600 text-white shadow-sm ring-1 ring-rose-500'
                              : 'bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-500'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/80 hover:bg-slate-100 dark:hover:bg-slate-700'
                        }`}
                      >
                        <DynamicIcon name={meta.icon} className="w-3 h-3" />
                        <span>{cat}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 4. DYNAMIC REASON FIELD (MANDATORY WHEN OTHERS IS SELECTED) */}
            {isOthers && (
              <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/50 animate-fade-in space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="tx-reason" className="block text-xs font-bold text-amber-900 dark:text-amber-300">
                    Reason for Others *
                  </label>
                  <span className="text-[10px] uppercase tracking-wider font-bold text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/60 px-2 py-0.5 rounded-md">
                    Required
                  </span>
                </div>
                <input
                  id="tx-reason"
                  type="text"
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Explain why this transaction is categorized as Others (e.g. Medical emergency, Miscellaneous income)"
                  className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 text-slate-900 dark:text-white placeholder-slate-400 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <p className="text-[10px] text-amber-700/80 dark:text-amber-400/80">
                  Examples: Medical emergency, Personal purchase, Unexpected payment, Miscellaneous income.
                </p>
              </div>
            )}

            {/* 5. DESCRIPTION & PAYMENT METHOD */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Description */}
              <div>
                <label htmlFor="tx-description" className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                  Description (Optional)
                </label>
                <input
                  id="tx-description"
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Grocery shopping at DMart, Client project payout"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                />
              </div>

              {/* Payment Method */}
              <div>
                <label htmlFor="tx-method" className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                  Payment Method
                </label>
                <select
                  id="tx-method"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                >
                  {PAYMENT_METHODS.map((pm) => (
                    <option key={pm} value={pm}>
                      {pm}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 6. NOTES */}
            <div>
              <label htmlFor="tx-notes" className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                Notes (Optional)
              </label>
              <textarea
                id="tx-notes"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional remarks or reference ID..."
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all resize-none"
              />
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className={`inline-flex items-center space-x-1.5 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white shadow-subtle hover:shadow-glow transition-all active:scale-[0.98] ${
                  isExpense
                    ? 'bg-rose-600 hover:bg-rose-500 focus:ring-rose-500'
                    : 'bg-emerald-600 hover:bg-emerald-500 focus:ring-emerald-500'
                }`}
              >
                {submitting ? (
                  <span>Saving...</span>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>{isEditMode ? 'Update Transaction' : isExpense ? 'Record Expense' : 'Record Income'}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

