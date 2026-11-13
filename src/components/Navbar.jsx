import React from 'react';
import { useFinance } from '../context/FinanceContext';
import { useAuth } from '../context/AuthContext';
import { Sun, Moon, Monitor, WalletCards, LogOut, Radio } from 'lucide-react';

export default function Navbar({ onOpenAddAccount, onOpenAddExpense }) {
  const { theme, setTheme, syncStatus } = useFinance();
  const { user, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-30 w-full backdrop-blur-md bg-white/80 dark:bg-slate-900/80 border-b border-slate-200/80 dark:border-slate-800/80 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-tr from-brand-600 to-emerald-400 flex items-center justify-center text-white shadow-glow">
              <WalletCards className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-xl sm:text-2xl tracking-tight bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 dark:from-white dark:via-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
                  Friday<span className="text-brand-500">Track</span>
                </span>
                
                {/* Realtime Live Sync Badge */}
                {syncStatus === 'live' && (
                  <span className="hidden sm:inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/50">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>Live Sync</span>
                  </span>
                )}
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 hidden xs:block">
                Personal finance & bank accounts
              </p>
            </div>
          </div>

          {/* Right Action bar: User Session + Theme Switcher + Add Expense */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            
            {/* Theme Toggle Pill */}
            <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 shadow-inner">
              <button
                type="button"
                onClick={() => setTheme('light')}
                title="Light mode"
                className={`p-1.5 rounded-lg transition-all ${
                  theme === 'light'
                    ? 'bg-white dark:bg-slate-700 text-amber-500 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                <Sun className="w-4 h-4" />
                <span className="sr-only">Light</span>
              </button>

              <button
                type="button"
                onClick={() => setTheme('dark')}
                title="Dark mode"
                className={`p-1.5 rounded-lg transition-all ${
                  theme === 'dark'
                    ? 'bg-slate-700 text-sky-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                <Moon className="w-4 h-4" />
                <span className="sr-only">Dark</span>
              </button>

              <button
                type="button"
                onClick={() => setTheme('system')}
                title="System theme"
                className={`p-1.5 rounded-lg transition-all ${
                  theme === 'system'
                    ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                <Monitor className="w-4 h-4" />
                <span className="sr-only">System</span>
              </button>
            </div>

            {/* Quick Add Expense button */}
            <button
              onClick={onOpenAddExpense}
              className="inline-flex items-center justify-center px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white bg-brand-600 hover:bg-brand-500 active:scale-[0.98] transition-all shadow-subtle hover:shadow-glow focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
            >
              <span className="text-base font-bold mr-1 leading-none">+</span> Add Expense
            </button>

            {/* User Session & Logout */}
            {user && (
              <div className="flex items-center pl-1 sm:pl-2 border-l border-slate-200 dark:border-slate-800">
                <div className="hidden lg:block mr-2 text-right">
                  <div className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate max-w-[130px]" title={user.email}>
                    {user.email}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={signOut}
                  title="Sign out"
                  className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="sr-only">Sign out</span>
                </button>
              </div>
            )}

          </div>

        </div>
      </div>
    </header>
  );
}
