import React, { useState, useEffect } from 'react';
import { useFinance } from '../context/FinanceContext';
import { ACCOUNT_TYPES, ACCOUNT_TYPE_META, BANK_PRESETS } from '../constants/finance';
import DynamicIcon from './DynamicIcon';
import AccountLogo from './AccountLogo';
import { X, AlertCircle } from 'lucide-react';

export default function AddAccountModal({ isOpen, onClose, accountToEdit = null, initialData = null }) {
  const { addAccount, editAccount } = useFinance();

  const account = accountToEdit || initialData;
  const isEditing = Boolean(account && account.id);

  const [name, setName] = useState('');
  const [type, setType] = useState(ACCOUNT_TYPES[0]);
  const [balance, setBalance] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (account) {
        setName(account.name || account.account_name || '');
        setType(account.type || account.account_type || ACCOUNT_TYPES[0]);
        setBalance(
          account.balance !== undefined && account.balance !== null
            ? String(account.balance)
            : ''
        );
      } else {
        setName('');
        setType(ACCOUNT_TYPES[0]);
        setBalance('');
      }
      setError('');
      setSubmitting(false);
    }
  }, [isOpen, account]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Please provide an account name.');
      return;
    }

    const parsedBalance = balance === '' ? 0 : parseFloat(balance);
    if (isNaN(parsedBalance)) {
      setError('Please enter a valid balance.');
      return;
    }

    setSubmitting(true);
    try {
      if (isEditing) {
        await editAccount({
          id: account.id,
          name: trimmedName,
          type,
          balance: parsedBalance,
        });
      } else {
        await addAccount({
          name: trimmedName,
          type,
          balance: parsedBalance,
        });
      }
      onClose();
    } catch (err) {
      setError(err.message || `Failed to ${isEditing ? 'update' : 'add'} account.`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-5 sm:p-7 animate-scale-up max-h-[90vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="account-modal-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 id="account-modal-title" className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
              {isEditing ? 'Edit Bank Account' : 'Add Bank Account'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isEditing
                ? 'Update account name, type, or adjust your balance'
                : 'Create a new account or wallet to track balances & expenses'}
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

        <form onSubmit={handleSubmit} className="mt-5 space-y-5">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Quick Select Bank / Wallet Presets */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Popular Banks & Wallets
            </label>
            <div className="flex flex-wrap gap-1.5">
              {BANK_PRESETS.map((preset) => {
                const isMatch = name.trim().toLowerCase() === preset.shortName.toLowerCase();
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      setName(preset.shortName);
                      setType(preset.type);
                    }}
                    className={`inline-flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      isMatch
                        ? 'bg-brand-50 text-brand-700 border-brand-500 dark:bg-brand-950/60 dark:text-brand-300 ring-1 ring-brand-500'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                    }`}
                  >
                    <AccountLogo name={preset.shortName} type={preset.type} size="xs" />
                    <span>{preset.shortName}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Account Name with Live Logo Preview */}
          <div>
            <label htmlFor="account-name" className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
              Account Name *
            </label>
            <div className="flex items-center space-x-2.5">
              <AccountLogo name={name} type={type} size="md" />
              <div className="flex-1">
                <input
                  id="account-name"
                  type="text"
                  required
                  placeholder="e.g. SBI, Slice, HDFC, Paytm, Cash"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white dark:focus:bg-slate-900 transition-all"
                  autoFocus
                />
              </div>
            </div>
          </div>

          {/* Account Type */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-2">
              Account Type *
            </label>
            <div className="grid grid-cols-2 gap-2">
              {ACCOUNT_TYPES.map((accType) => {
                const meta = ACCOUNT_TYPE_META[accType] || ACCOUNT_TYPE_META['Bank Account'];
                const isSelected = type === accType;

                return (
                  <button
                    key={accType}
                    type="button"
                    onClick={() => setType(accType)}
                    className={`flex items-center space-x-2.5 p-3 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'border-brand-500 bg-brand-50/70 dark:bg-brand-950/50 text-brand-700 dark:text-brand-300 ring-1 ring-brand-500'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 bg-gradient-to-tr ${meta.color} text-white shadow-sm`}
                    >
                      <DynamicIcon name={meta.icon} className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-semibold">{accType}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Current Balance */}
          <div>
            <label htmlFor="account-balance" className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
              Current Balance (₹) *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-bold text-base">
                ₹
              </div>
              <input
                id="account-balance"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm font-semibold bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white dark:focus:bg-slate-900 transition-all"
              />
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
              {isEditing
                ? 'Adjust your balance to match your actual bank or wallet balance.'
                : 'Enter your current opening balance.'}
            </p>
          </div>

          {/* Footer buttons */}
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
              {submitting
                ? isEditing
                  ? 'Saving...'
                  : 'Creating...'
                : isEditing
                ? 'Save Changes'
                : 'Create Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

