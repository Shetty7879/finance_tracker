import React from 'react';
import { useFinance } from '../context/FinanceContext';
import { formatINR, ACCOUNT_TYPE_META } from '../constants/finance';
import DynamicIcon from './DynamicIcon';
import { Plus, Trash2, Building2 } from 'lucide-react';

export default function BankAccountsSection({ onOpenAddAccount, onRequestDeleteAccount }) {
  const { accounts } = useFinance();

  return (
    <section className="mb-10 sm:mb-12 animate-fade-in">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-5 gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                Bank Accounts & Wallets
              </h2>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                {accounts.length}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Manage your payment accounts, cash in hand, and digital UPI wallets
            </p>
          </div>
        </div>

        {/* Add Account CTA */}
        <button
          onClick={onOpenAddAccount}
          className="self-start sm:self-auto inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/80 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700/80 shadow-subtle transition-all active:scale-[0.98]"
        >
          <Plus className="w-4 h-4 text-brand-600 dark:text-brand-400" />
          <span>Add Account</span>
        </button>
      </div>

      {/* Account Cards Grid or Empty State */}
      {accounts.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 p-8 sm:p-12 text-center bg-slate-50/50 dark:bg-slate-900/30">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 flex items-center justify-center mb-4 border border-brand-200/60 dark:border-brand-800/40">
            <Building2 className="w-7 h-7" />
          </div>
          <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white mb-1">
            No bank accounts added yet
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-5">
            Add your primary bank accounts (e.g. SBI, HDFC), cash reserves, or UPI IDs to start logging expenses with automated balance deduction.
          </p>
          <button
            onClick={onOpenAddAccount}
            className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-brand-600 hover:bg-brand-500 transition-all shadow-subtle hover:shadow-glow"
          >
            <Plus className="w-4 h-4" />
            <span>Add Your First Account</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {accounts.map((account) => {
            const meta = ACCOUNT_TYPE_META[account.type] || ACCOUNT_TYPE_META['Bank Account'];

            return (
              <div
                key={account.id}
                className="group relative flex flex-col justify-between p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 shadow-subtle hover:shadow-premium transition-all duration-200"
              >
                {/* Header: Name + Account Type Badge */}
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center space-x-2.5">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-tr ${meta.color} text-white shadow-sm flex-shrink-0`}
                      >
                        <DynamicIcon name={meta.icon} className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-semibold text-sm sm:text-base text-slate-900 dark:text-white truncate" title={account.name}>
                          {account.name}
                        </h4>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold border ${meta.badgeClass}`}
                        >
                          {account.type}
                        </span>
                      </div>
                    </div>

                    {/* Delete Account button */}
                    <button
                      type="button"
                      onClick={() => onRequestDeleteAccount(account)}
                      title="Delete account"
                      className="opacity-60 hover:opacity-100 p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span className="sr-only">Delete</span>
                    </button>
                  </div>
                </div>

                {/* Balance Display */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80">
                  <div className="text-[11px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-0.5">
                    Current Balance
                  </div>
                  <div className={`text-xl font-bold tracking-tight ${account.balance < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'}`}>
                    {formatINR(account.balance)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

