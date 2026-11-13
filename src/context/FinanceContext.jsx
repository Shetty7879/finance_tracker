import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from './AuthContext';

const FinanceContext = createContext(null);

const THEME_STORAGE_KEY = 'fridaytrack_theme_v1';

export function FinanceProvider({ children }) {
  const { user } = useAuth();

  // Theme state: 'light' | 'dark' | 'system'
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem(THEME_STORAGE_KEY) || 'system';
  });

  // Database-backed states
  const [accounts, setAccounts] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState('idle'); // 'idle' | 'syncing' | 'live' | 'error'
  const [error, setError] = useState(null);

  // Theme application logic
  useEffect(() => {
    const root = document.documentElement;
    localStorage.setItem(THEME_STORAGE_KEY, theme);

    const applyTheme = () => {
      if (theme === 'dark') {
        root.classList.add('dark');
      } else if (theme === 'light') {
        root.classList.remove('dark');
      } else {
        const isSystemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (isSystemDark) {
          root.classList.add('dark');
        } else {
          root.classList.remove('dark');
        }
      }
    };

    applyTheme();

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = (e) => {
        if (e.matches) {
          root.classList.add('dark');
        } else {
          root.classList.remove('dark');
        }
      };
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }
  }, [theme]);

  /**
   * Fetch all accounts and expenses for the authenticated user from Supabase
   */
  const fetchData = useCallback(async (showLoading = false) => {
    if (!user || !supabase) {
      setAccounts([]);
      setExpenses([]);
      return;
    }

    if (showLoading) setLoading(true);
    setSyncStatus('syncing');

    try {
      // 1. Fetch Accounts
      const { data: accountsData, error: accountsErr } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (accountsErr) throw accountsErr;

      // 2. Fetch Expenses
      const { data: expensesData, error: expensesErr } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', user.id)
        .order('expense_date', { ascending: false })
        .order('created_at', { ascending: false });

      if (expensesErr) throw expensesErr;

      // Normalize Accounts
      const normalizedAccounts = (accountsData || []).map((acc) => ({
        id: acc.id,
        user_id: acc.user_id,
        name: acc.account_name,
        account_name: acc.account_name,
        type: acc.account_type,
        account_type: acc.account_type,
        balance: Number(acc.balance) || 0,
        createdAt: acc.created_at,
      }));

      // Account lookup map for expense display
      const accountMap = new Map();
      normalizedAccounts.forEach((a) => accountMap.set(a.id, a.name));

      // Normalize Expenses
      const normalizedExpenses = (expensesData || []).map((exp) => ({
        id: exp.id,
        user_id: exp.user_id,
        accountId: exp.account_id,
        account_id: exp.account_id,
        accountName: accountMap.get(exp.account_id) || 'Unknown Account',
        amount: Number(exp.amount) || 0,
        category: exp.category,
        date: exp.expense_date,
        expense_date: exp.expense_date,
        createdAt: exp.created_at,
      }));

      setAccounts(normalizedAccounts);
      setExpenses(normalizedExpenses);
      setSyncStatus('live');
      setError(null);
    } catch (err) {
      console.error('Error fetching Supabase data:', err);
      setError(err.message);
      setSyncStatus('error');
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [user]);

  // Initial fetch when user logs in
  useEffect(() => {
    if (user && isSupabaseConfigured()) {
      fetchData(true);
    } else {
      setAccounts([]);
      setExpenses([]);
      setSyncStatus('idle');
    }
  }, [user, fetchData]);

  // Supabase Realtime synchronization across all tabs and devices
  useEffect(() => {
    if (!user || !supabase) return;

    const channelName = `realtime-user-${user.id}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'accounts',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchData(false);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'expenses',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchData(false);
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setSyncStatus('live');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchData]);

  // 1. Total Balance = Sum of all account balances
  const totalBalance = useMemo(() => {
    return accounts.reduce((sum, acc) => sum + (Number(acc.balance) || 0), 0);
  }, [accounts]);

  // 2. Total Expenses = Sum of all expenses
  const totalExpenses = useMemo(() => {
    return expenses.reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0);
  }, [expenses]);

  // 3. Monthly Expenses = Sum of expenses for the current calendar month
  // Uses local client calendar year and month to avoid UTC boundary shifts
  const thisMonthExpenses = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // 1-12
    const currentYearMonthPrefix = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;

    return expenses
      .filter((exp) => {
        if (!exp.date) return false;
        // Parse date directly without UTC conversion
        // Works for both 'YYYY-MM-DD' and 'YYYY-MM-DDTHH:mm:ss'
        return exp.date.startsWith(currentYearMonthPrefix);
      })
      .reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0);
  }, [expenses]);

  /**
   * Add Account in Supabase
   * @param {Object} account - { name, type, balance }
   */
  const addAccount = async ({ name, type, balance }) => {
    if (!user || !supabase) throw new Error('You must be signed in to add an account.');

    const trimmedName = name.trim();
    if (!trimmedName) throw new Error('Account name is required.');

    const numBalance = Math.round((Number(balance) || 0) * 100) / 100;

    const { data, error } = await supabase
      .from('accounts')
      .insert({
        user_id: user.id,
        account_name: trimmedName,
        account_type: type || 'Bank Account',
        balance: numBalance,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new Error(`An account named "${trimmedName}" already exists.`);
      }
      throw new Error(error.message || 'Failed to create account.');
    }

    // Refresh data
    await fetchData(false);
    return data;
  };

  /**
   * Delete Account in Supabase
   * Cascades and deletes associated expenses per DB foreign key
   */
  const deleteAccount = async (accountId) => {
    if (!user || !supabase) throw new Error('You must be signed in to delete an account.');

    const { error } = await supabase
      .from('accounts')
      .delete()
      .eq('id', accountId)
      .eq('user_id', user.id);

    if (error) {
      throw new Error(error.message || 'Failed to delete account.');
    }

    await fetchData(false);
  };

  /**
   * Add Expense using Atomic PostgreSQL Function (create_expense)
   * Handles:
   * - Verification of user ownership
   * - Verification of sufficient balance
   * - Atomic deduction of expense amount from account balance
   * - Creation of expense record
   * - Idempotency protection against duplicate requests
   * @param {Object} expense - { amount, category, accountId, date }
   */
  const addExpense = async ({ amount, category, accountId, date }) => {
    if (!user || !supabase) throw new Error('You must be signed in to add an expense.');

    const numAmount = Math.round((Number(amount) || 0) * 100) / 100;
    if (numAmount <= 0) {
      throw new Error('Expense amount must be greater than zero.');
    }
    if (!category) {
      throw new Error('Please select an expense category.');
    }
    if (!accountId) {
      throw new Error('Please select a payment account.');
    }
    if (!date) {
      throw new Error('Please select an expense date.');
    }

    // Generate client-side UUID for idempotency
    const expenseId = crypto.randomUUID();

    // Call atomic RPC function
    const { data, error } = await supabase.rpc('create_expense', {
      p_id: expenseId,
      p_account_id: accountId,
      p_amount: numAmount,
      p_category: category,
      p_expense_date: date,
    });

    if (error) {
      throw new Error(error.message || 'Failed to record expense.');
    }

    // Refresh immediately to sync
    await fetchData(false);
    return data;
  };

  /**
   * Delete Expense using Atomic PostgreSQL Function (delete_expense)
   * Handles:
   * - Verification of ownership
   * - Atomic restoration of amount back to the original account balance
   * - Deletion of the expense record
   */
  const deleteExpense = async (expenseId) => {
    if (!user || !supabase) throw new Error('You must be signed in to delete an expense.');

    // Call atomic RPC function
    const { data, error } = await supabase.rpc('delete_expense', {
      p_expense_id: expenseId,
    });

    if (error) {
      throw new Error(error.message || 'Failed to delete expense and restore balance.');
    }

    // Refresh immediately
    await fetchData(false);
    return data;
  };

  return (
    <FinanceContext.Provider
      value={{
        accounts,
        expenses,
        theme,
        setTheme,
        totalBalance,
        totalExpenses,
        thisMonthExpenses,
        loading,
        syncStatus,
        error,
        refreshData: fetchData,
        addAccount,
        deleteAccount,
        addExpense,
        deleteExpense,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
}

export function useFinance() {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
}
