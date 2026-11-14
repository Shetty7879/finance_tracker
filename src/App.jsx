import React, { useState } from 'react';
import { ThemeProvider } from 'next-themes';
import { AuthProvider, useAuth } from './context/AuthContext';
import { FinanceProvider, useFinance } from './context/FinanceContext';
import Navbar from './components/Navbar';
import DashboardCards from './components/DashboardCards';
import BankAccountsSection from './components/BankAccountsSection';
import RecentExpensesSection from './components/RecentExpensesSection';
import AnalyticsView from './components/AnalyticsView';
import AddAccountModal from './components/AddAccountModal';
import TransactionModal from './components/TransactionModal';
import TransactionDetailModal from './components/TransactionDetailModal';
import DeleteConfirmModal from './components/DeleteConfirmModal';
import AuthView from './components/AuthView';
import { Plus, WalletCards, Loader2, AlertTriangle, LayoutDashboard, BarChart3 } from 'lucide-react';

function DashboardView() {
  const { deleteAccount, deleteTransaction, error: financeError } = useFinance();

  // Navigation View: 'dashboard' | 'analytics'
  const [currentView, setCurrentView] = useState('dashboard');

  // Modals visibility state
  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);
  const [accountModalData, setAccountModalData] = useState(null); // null for new, account object for edit
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [transactionModalData, setTransactionModalData] = useState(null); // null for new, tx object for edit
  const [transactionDefaultType, setTransactionDefaultType] = useState('expense'); // 'expense' | 'income'

  // View details modal state
  const [viewingTransaction, setViewingTransaction] = useState(null);

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState(null); // { item, type: 'expense' | 'account' }

  // Handlers for Add/Edit Account
  const handleOpenAddAccount = () => {
    setAccountModalData(null);
    setIsAddAccountOpen(true);
  };

  const handleOpenEditAccount = (account) => {
    setAccountModalData(account);
    setIsAddAccountOpen(true);
  };

  // Handlers for Add/Edit Transaction
  const handleOpenAddExpense = () => {
    setTransactionModalData(null);
    setTransactionDefaultType('expense');
    setIsTransactionModalOpen(true);
  };

  const handleOpenAddIncome = () => {
    setTransactionModalData(null);
    setTransactionDefaultType('income');
    setIsTransactionModalOpen(true);
  };

  const handleOpenEditTransaction = (tx) => {
    setTransactionModalData(tx);
    setIsTransactionModalOpen(true);
  };

  const handleViewTransaction = (tx) => {
    setViewingTransaction(tx);
  };

  const handleRequestDeleteExpense = (transaction) => {
    setDeleteTarget({ item: transaction, type: 'expense' });
  };

  const handleRequestDeleteAccount = (account) => {
    setDeleteTarget({ item: account, type: 'account' });
  };

  const handleConfirmDelete = async (id) => {
    if (!deleteTarget) return;
    try {
      if (deleteTarget.type === 'expense') {
        await deleteTransaction(id);
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
        onOpenAddAccount={handleOpenAddAccount}
        onOpenAddExpense={handleOpenAddExpense}
        currentView={currentView}
        onViewChange={setCurrentView}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        
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

        {/* View Switcher: Dashboard View vs Analytics & Reports View */}
        {currentView === 'dashboard' ? (
          <>
            {/* 1. Dashboard Overview Cards (Total Balance, Total Income, Total Expenses, Net Savings) */}
            <DashboardCards
              onOpenAddAccount={handleOpenAddAccount}
              onOpenAddExpense={handleOpenAddExpense}
              onOpenAddIncome={handleOpenAddIncome}
            />

            {/* 2. Bank Accounts Section */}
            <BankAccountsSection
              onOpenAddAccount={handleOpenAddAccount}
              onOpenEditAccount={handleOpenEditAccount}
              onRequestDeleteAccount={handleRequestDeleteAccount}
            />

            {/* 3. Recent Transactions Section (Expenses & Income with Filters, Search, Edit, View, Delete) */}
            <RecentExpensesSection
              onOpenAddExpense={handleOpenAddExpense}
              onOpenAddIncome={handleOpenAddIncome}
              onOpenEditTransaction={handleOpenEditTransaction}
              onViewTransaction={handleViewTransaction}
              onRequestDeleteExpense={handleRequestDeleteExpense}
            />
          </>
        ) : (
          <AnalyticsView />
        )}

      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-200/80 dark:border-slate-800/80 py-6 text-center text-xs text-slate-400 dark:text-slate-500 pb-24 sm:pb-6">
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

      {/* Mobile Bottom Navigation Bar (Thumb-friendly with iOS/Android Safe Area Support) */}
      <div className="fixed bottom-0 inset-x-0 sm:hidden z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800/80 px-6 sm:px-8 pt-2 pb-[max(0.6rem,env(safe-area-inset-bottom))] flex items-center justify-between shadow-premium">
        <button
          type="button"
          onClick={() => setCurrentView('dashboard')}
          className={`flex flex-col items-center space-y-1 transition-colors min-w-[56px] py-1 cursor-pointer ${
            currentView === 'dashboard'
              ? 'text-brand-600 dark:text-brand-400 font-bold'
              : 'text-slate-400 dark:text-slate-500'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px]">Dashboard</span>
        </button>

        {/* Center Quick Add Transaction Button */}
        <button
          type="button"
          onClick={handleOpenAddExpense}
          className="flex items-center justify-center w-12 h-12 -mt-5 rounded-full bg-brand-600 active:bg-brand-700 text-white shadow-lg shadow-brand-600/30 active:scale-95 transition-transform cursor-pointer"
          aria-label="Add Transaction"
          title="Add Transaction"
        >
          <Plus className="w-6 h-6" />
        </button>

        <button
          type="button"
          onClick={() => setCurrentView('analytics')}
          className={`flex flex-col items-center space-y-1 transition-colors min-w-[56px] py-1 cursor-pointer ${
            currentView === 'analytics'
              ? 'text-brand-600 dark:text-brand-400 font-bold'
              : 'text-slate-400 dark:text-slate-500'
          }`}
        >
          <BarChart3 className="w-5 h-5" />
          <span className="text-[10px]">Analytics</span>
        </button>
      </div>

      {/* Modals */}
      <AddAccountModal
        isOpen={isAddAccountOpen}
        onClose={() => {
          setIsAddAccountOpen(false);
          setAccountModalData(null);
        }}
        accountToEdit={accountModalData}
      />

      {/* Unified Transaction Modal (Add Expense / Add Income / Edit Transaction with Others reason) */}
      <TransactionModal
        isOpen={isTransactionModalOpen}
        onClose={() => {
          setIsTransactionModalOpen(false);
          setTransactionModalData(null);
        }}
        onOpenAddAccount={handleOpenAddAccount}
        initialData={transactionModalData}
        defaultType={transactionDefaultType}
      />

      {/* Transaction Details Modal */}
      <TransactionDetailModal
        isOpen={!!viewingTransaction}
        transaction={viewingTransaction}
        onClose={() => setViewingTransaction(null)}
        onEdit={(tx) => {
          setViewingTransaction(null);
          handleOpenEditTransaction(tx);
        }}
        onDelete={(tx) => {
          setViewingTransaction(null);
          handleRequestDeleteExpense(tx);
        }}
      />

      {/* Delete Confirmation Modal */}
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
  const { user, loading } = useAuth();

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

  // Not authenticated -> show Sign In View immediately
  if (!user) {
    return <AuthView />;
  }

  // User is signed in -> show Full Dashboard
  return <DashboardView />;
}

export default function App() {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      storageKey="fridaytrack_theme_v1"
    >
      <AuthProvider>
        <FinanceProvider>
          <MainContent />
        </FinanceProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
