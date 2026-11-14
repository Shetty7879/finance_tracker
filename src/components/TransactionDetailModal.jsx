import React from 'react';
import { formatINR, formatDate, CATEGORY_META, isOthersCategory } from '../constants/finance';
import DynamicIcon from './DynamicIcon';
import AccountLogo from './AccountLogo';
import { X, ArrowDownRight, ArrowUpRight, Calendar, Building2, CreditCard, FileText, AlertTriangle, Edit3, Trash2 } from 'lucide-react';

export default function TransactionDetailModal({
  isOpen,
  onClose,
  transaction,
  onEdit,
  onDelete,
}) {
  if (!isOpen || !transaction) return null;

  const isExpense = (transaction.type || transaction.transaction_type) !== 'income';
  const meta = CATEGORY_META[transaction.category] || CATEGORY_META['Other'];
  const isOthers = isOthersCategory(transaction.category);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-5 sm:p-6 animate-scale-up max-h-[90vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tx-detail-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center space-x-2">
            <span
              className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-bold ${
                isExpense
                  ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800/40'
                  : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40'
              }`}
            >
              {isExpense ? <ArrowDownRight className="w-3.5 h-3.5" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
              <span>{isExpense ? 'Expense' : 'Income'}</span>
            </span>
            <span className="text-xs text-slate-400 font-medium">{formatDate(transaction.date || transaction.expense_date)}</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Amount & Category Hero */}
        <div className="my-5 text-center">
          <div
            className={`w-14 h-14 mx-auto rounded-2xl flex items-center justify-center mb-3 ${
              isExpense
                ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
            }`}
          >
            <DynamicIcon name={meta.icon} className="w-7 h-7" />
          </div>
          <div
            className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
              isExpense ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
            }`}
          >
            {isExpense ? `- ${formatINR(transaction.amount)}` : `+ ${formatINR(transaction.amount)}`}
          </div>
          <div className="flex items-center justify-center space-x-1.5 mt-1">
            <span
              className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${
                isExpense
                  ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                  : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
              }`}
            >
              {isExpense ? 'Expense' : 'Income'}
            </span>
            <span className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white">
              {isOthers && transaction.reason ? transaction.reason : transaction.category}
            </span>
            {isOthers && transaction.reason && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 font-medium">
                Other
              </span>
            )}
          </div>
          {transaction.description && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 max-w-xs mx-auto">
              "{transaction.description}"
            </p>
          )}
        </div>

        {/* Details Grid */}
        <div className="space-y-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs">
          {/* Account */}
          <div className="flex items-center justify-between">
            <span className="text-slate-400 dark:text-slate-500 flex items-center">
              <Building2 className="w-3.5 h-3.5 mr-1.5" />
              Payment Account
            </span>
            <span className="font-semibold text-slate-900 dark:text-white flex items-center space-x-1.5">
              <AccountLogo name={transaction.accountName} size="xs" />
              <span>{transaction.accountName || 'Bank Account'}</span>
            </span>
          </div>

          {/* Date */}
          <div className="flex items-center justify-between">
            <span className="text-slate-400 dark:text-slate-500 flex items-center">
              <Calendar className="w-3.5 h-3.5 mr-1.5" />
              Recorded Date
            </span>
            <span className="font-semibold text-slate-900 dark:text-white">
              {transaction.date || transaction.expense_date}
            </span>
          </div>

          {/* Payment Method */}
          {transaction.paymentMethod && (
            <div className="flex items-center justify-between">
              <span className="text-slate-400 dark:text-slate-500 flex items-center">
                <CreditCard className="w-3.5 h-3.5 mr-1.5" />
                Payment Method
              </span>
              <span className="font-semibold text-slate-900 dark:text-white">
                {transaction.paymentMethod}
              </span>
            </div>
          )}

          {/* Reason for Others (MANDATORY REQUIREMENT 3) */}
          {transaction.reason && (
            <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
              <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 block mb-0.5">
                Reason for Others:
              </span>
              <p className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/40 text-amber-900 dark:text-amber-200 font-medium">
                {transaction.reason}
              </p>
            </div>
          )}

          {/* Notes */}
          {transaction.notes && (
            <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
              <span className="text-slate-400 dark:text-slate-500 flex items-center mb-0.5">
                <FileText className="w-3.5 h-3.5 mr-1.5" />
                Notes
              </span>
              <p className="text-slate-700 dark:text-slate-300 italic">
                {transaction.notes}
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons: Edit & Delete */}
        <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end space-x-2.5">
          {onEdit && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onEdit(transaction);
              }}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-subtle cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
              <span>Edit</span>
            </button>
          )}

          {onDelete && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onDelete(transaction);
              }}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 text-rose-600 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

