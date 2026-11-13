import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { FinanceProvider, useFinance } from './context/FinanceContext';
import Navbar from './components/Navbar';
import DashboardCards from './components/DashboardCards';
import BankAccountsSection from './components/BankAccountsSection';
import RecentExpensesSection from './components/RecentExpensesSection';
import AddAccountModal from './components/AddAccountModal';
import AddExpenseModal from './components/AddExpenseModal';
import DeleteConfirmModal from './components/DeleteConfirmModal';
import AuthView from './components/AuthView';
import SupabaseSetupBanner from './components/SupabaseSetupBanner';
import { Plus, WalletCards, Loader2, AlertTriangle } from 'lucide-react';

function DashboardView() {
  const { deleteAccount, deleteExpense, error: financeError } = useFinance();

  // Modals visibility state
  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState(null); // { item, type: 'expense' | 'account' }

  const handleRequestDeleteExpense = (expense) => {
    setDeleteTarget({ item: expense, type: 'expense' });
  };

  const handleRequestDeleteAccount = (account) => {
    setDeleteTarget({ item: account, type: 'account' });
  };

  const handleConfirmDelete = async (id) => {
    if (!deleteTarget) return;
    try {
      if (deleteTarget.type === 'expense') {
        await deleteExpense(id);
      } else if (deleteTarget.type === 'account') {
        await deleteAccount(id);
      }
    } catch (err) {
      alert(err.message || 'Operation failed.');
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* Top Navbar */}
      <Navbar
        onOpenAddAccount={() => setIsAddAccountOpen(true)}
        onOpenAddExpense={() => setIsAddExpenseOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        
        {/* Useful error banner if database migration or connection issues occur */}
        {financeError && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 text-amber-800 dark:text-amber-200 text-xs sm:text-sm flex items-start space-x-3 animate-fade-in">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
            <div>
              <p className="font-semibold text-slate-900 dark:text-white">
                {financeError.includes('schema cache') || financeError.includes('accounts')
                  ? 'Supabase Database Setup Required'
                  : 'Database Connection Notice'}
              </p>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                {financeError.includes('schema cache') || financeError.includes('accounts')
                  ? 'The "accounts" and "expenses" tables have not been created yet in your Supabase project. Please copy and run the SQL migration from supabase_schema.sql (or supabase/migrations/20261113_init.sql) in your Supabase Dashboard SQL Editor.'
                  : financeError}
              </p>
            </div>
          </div>
        )}

        {/* 1. Dashboard Overview Cards */}
        <DashboardCards
          onOpenAddAccount={() => setIsAddAccountOpen(true)}
          onOpenAddExpense={() => setIsAddExpenseOpen(true)}
        />

        {/* 2. Bank Accounts Section */}
        <BankAccountsSection
          onOpenAddAccount={() => setIsAddAccountOpen(true)}
          onRequestDeleteAccount={handleRequestDeleteAccount}
        />

        {/* 3. Recent Expenses Section */}
        <RecentExpensesSection
          onOpenAddExpense={() => setIsAddExpenseOpen(true)}
          onRequestDeleteExpense={handleRequestDeleteExpense}
        />

      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-200/80 dark:border-slate-800/80 py-6 text-center text-xs text-slate-400 dark:text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-slate-700 dark:text-slate-300">FridayTrack</span>
            <span>•</span>
            <span>Cloud Sync via Supabase</span>
          </div>
          <div>
            Built with React, Vite & Tailwind CSS
          </div>
        </div>
      </footer>

      {/* Mobile Floating Action Button (FAB) */}
      <div className="fixed bottom-5 right-5 sm:hidden z-40">
        <button
          onClick={() => setIsAddExpenseOpen(true)}
          className="flex items-center justify-center w-14 h-14 rounded-full bg-brand-600 active:bg-brand-700 text-white shadow-xl shadow-brand-600/30 active:scale-95 transition-transform"
          aria-label="Add Expense"
        >
          <Plus className="w-7 h-7" />
        </button>
      </div>

      {/* Modals */}
      <AddAccountModal
        isOpen={isAddAccountOpen}
        onClose={() => setIsAddAccountOpen(false)}
      />

      <AddExpenseModal
        isOpen={isAddExpenseOpen}
        onClose={() => setIsAddExpenseOpen(false)}
        onOpenAddAccount={() => setIsAddAccountOpen(true)}
      />

      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        item={deleteTarget?.item}
        type={deleteTarget?.type}
      />
    </div>
  );
}

function MainContent() {
  const { user, loading, isConfigured } = useAuth();

  // If Supabase credentials are missing or unconfigured
  if (!isConfigured) {
    return <SupabaseSetupBanner />;
  }

  // Loading initial auth state
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-emerald-400 flex items-center justify-center text-white shadow-glow mb-4 animate-pulse">
          <WalletCards className="w-6 h-6" />
        </div>
        <div className="flex items-center space-x-2 text-sm text-slate-500 dark:text-slate-400">
          <Loader2 className="w-4 h-4 animate-spin text-brand-500" />
          <span>Connecting to FridayTrack...</span>
        </div>
      </div>
    );
  }

  // User is not signed in -> show AuthView
  if (!user) {
    return <AuthView />;
  }

  // User is signed in -> show Full Dashboard
  return <DashboardView />;
}

export default function App() {
  return (
    <AuthProvider>
      <FinanceProvider>
        <MainContent />
      </FinanceProvider>
    </AuthProvider>
  );
}
