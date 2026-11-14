import React from 'react';
import { formatINR } from '../constants/finance';
import { AlertTriangle, X } from 'lucide-react';

export default function DeleteConfirmModal({ isOpen, onClose, onConfirm, item, type }) {
  if (!isOpen || !item) return null;

  const isExpense = type === 'expense';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-5 sm:p-6 animate-scale-up"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-start justify-between">
          <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center flex-shrink-0 border border-rose-200 dark:border-rose-900/40">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4">
          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
            {isExpense ? 'Delete Expense?' : 'Delete Account?'}
          </h3>
          <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            {isExpense ? (
              <>
                Are you sure you want to delete this{' '}
                <strong className="text-slate-900 dark:text-white">{item.category}</strong> expense of{' '}
                <strong className="text-rose-600 dark:text-rose-400">{formatINR(item.amount)}</strong>?
                <br />
                <span className="text-emerald-600 dark:text-emerald-400 font-medium inline-block mt-2">
                  ✓ {formatINR(item.amount)} will be automatically refunded back to your {item.accountName || 'account'} balance.
                </span>
              </>
            ) : (
              <>
                Are you sure you want to delete account{' '}
                <strong className="text-slate-900 dark:text-white">{item.name}</strong> (Balance:{' '}
                {formatINR(item.balance)})?
                <br />
                <span className="text-amber-600 dark:text-amber-400 font-medium inline-block mt-2">
                  ⚠ All recorded expenses linked to this account will also be removed.
                </span>
              </>
            )}
          </p>
        </div>

        <div className="mt-6 flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm(item.id);
              onClose();
            }}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-rose-600 hover:bg-rose-500 active:scale-[0.98] transition-all shadow-subtle"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

