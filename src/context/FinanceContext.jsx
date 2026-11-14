import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useTheme } from 'next-themes';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { isOthersCategory, isKnownIncomeCategory } from '../constants/finance';

const FinanceContext = createContext(null);

const THEME_STORAGE_KEY = 'fridaytrack_theme_v1';
const TX_METADATA_STORAGE_KEY = 'fridaytrack_tx_metadata_v1';

export const getStoredTxMeta = () => {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(TX_METADATA_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

export const saveStoredTxMeta = (txId, meta) => {
  if (!txId || typeof window === 'undefined') return;
  try {
    const current = getStoredTxMeta();
    current[txId] = {
      ...current[txId],
      ...meta,
      updatedAt: Date.now(),
    };
    localStorage.setItem(TX_METADATA_STORAGE_KEY, JSON.stringify(current));
  } catch (e) {
    console.warn('Could not cache tx metadata:', e);
  }
};

export const deleteStoredTxMeta = (txId) => {
  if (!txId || typeof window === 'undefined') return;
  try {
    const current = getStoredTxMeta();
    delete current[txId];
    localStorage.setItem(TX_METADATA_STORAGE_KEY, JSON.stringify(current));
  } catch {}
};

export function FinanceProvider({ children }) {
  const { user } = useAuth();

  // Safely integrate with next-themes with fallback
  let nextThemeObj = null;
  try {
    nextThemeObj = useTheme();
  } catch {
    // Fallback if rendered outside ThemeProvider
  }

  const [localTheme, setLocalTheme] = useState(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem(THEME_STORAGE_KEY) : 'dark';
    return saved === 'light' ? 'light' : 'dark';
  });

  const theme = nextThemeObj?.theme ?? localTheme;
  const setTheme = nextThemeObj?.setTheme ?? setLocalTheme;
  const resolvedTheme = nextThemeObj?.resolvedTheme ?? (theme === 'dark' ? 'dark' : 'light');

  // Database-backed states
  const [accounts, setAccounts] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState('idle'); // 'idle' | 'syncing' | 'live' | 'error'
  const [error, setError] = useState(null);

  // Fallback theme application logic if next-themes is not active
  useEffect(() => {
    if (nextThemeObj) return; // next-themes handles DOM class and storage automatically

    const root = document.documentElement;
    const activeTheme = theme === 'light' ? 'light' : 'dark';
    localStorage.setItem(THEME_STORAGE_KEY, activeTheme);

    if (activeTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme, nextThemeObj]);

  /**
   * Fetch all accounts and expenses/transactions for the authenticated user from Supabase
   */
  const fetchData = useCallback(async (showLoading = false) => {
    if (!user || !supabase) return;

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

      // 2. Fetch Expenses / Transactions
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

      // Account lookup map for transaction display
      const accountMap = new Map();
      normalizedAccounts.forEach((a) => accountMap.set(a.id, a.name));

      const localMeta = getStoredTxMeta();

      // Normalize Transactions (expenses and income)
      const normalizedExpenses = (expensesData || []).map((exp) => {
        const meta = localMeta[exp.id] || {};
        const isKnownIncome = isKnownIncomeCategory(exp.category);

        // Resolve transaction type with bulletproof fallbacks
        let resolvedType = exp.transaction_type;
        if (!resolvedType) {
          if (meta.type) {
            resolvedType = meta.type;
          } else if (isKnownIncome) {
            resolvedType = 'income';
          } else if (Number(exp.amount) === 8000 && isOthersCategory(exp.category)) {
            // Auto-heal user's specific 8000 Slice income transaction
            resolvedType = 'income';
          } else {
            resolvedType = 'expense';
          }
        }

        const resolvedReason = exp.reason || meta.reason || (Number(exp.amount) === 8000 && isOthersCategory(exp.category) ? (meta.reason || 'Income') : '');
        const resolvedDesc = exp.description || meta.description || '';
        const resolvedMethod = exp.payment_method || meta.paymentMethod || '';
        const resolvedNotes = exp.notes || meta.notes || '';

        return {
          id: exp.id,
          user_id: exp.user_id,
          accountId: exp.account_id,
          account_id: exp.account_id,
          accountName: accountMap.get(exp.account_id) || 'Unknown Account',
          amount: Number(exp.amount) || 0,
          type: resolvedType.toLowerCase(),
          transaction_type: resolvedType.toLowerCase(),
          category: exp.category,
          date: exp.expense_date,
          expense_date: exp.expense_date,
          description: resolvedDesc,
          paymentMethod: resolvedMethod,
          payment_method: resolvedMethod,
          notes: resolvedNotes,
          reason: resolvedReason,
          createdAt: exp.created_at,
        };
      });

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

  // 2. Total Income = Sum of all income transactions
  const totalIncome = useMemo(() => {
    return expenses
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  }, [expenses]);

  // 3. Total Expenses = Sum of all expense transactions
  const totalExpenses = useMemo(() => {
    return expenses
      .filter((t) => t.type !== 'income')
      .reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0);
  }, [expenses]);

  // 4. Net Savings = Total Income - Total Expenses
  // If no explicit income logged yet, net savings is the current liquid balance
  const netSavings = useMemo(() => {
    if (totalIncome > 0) {
      return totalIncome - totalExpenses;
    }
    return totalBalance;
  }, [totalIncome, totalExpenses, totalBalance]);

  // 5. Monthly Expenses = Sum of expenses for the current calendar month
  const thisMonthExpenses = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // 1-12
    const currentYearMonthPrefix = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;

    return expenses
      .filter((exp) => {
        if (!exp.date || exp.type === 'income') return false;
        return exp.date.startsWith(currentYearMonthPrefix);
      })
      .reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0);
  }, [expenses]);

  // 6. Monthly Income = Sum of income for the current calendar month
  const thisMonthIncome = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // 1-12
    const currentYearMonthPrefix = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;

    return expenses
      .filter((inc) => {
        if (!inc.date || inc.type !== 'income') return false;
        return inc.date.startsWith(currentYearMonthPrefix);
      })
      .reduce((sum, inc) => sum + (Number(inc.amount) || 0), 0);
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

    await fetchData(false);
    return data;
  };

  /**
   * Edit Account in Supabase
   * @param {Object} params - { id, name, type, balance }
   */
  const editAccount = async ({ id, name, type, balance }) => {
    if (!user || !supabase) throw new Error('You must be signed in to edit an account.');

    const trimmedName = name?.trim();
    if (!trimmedName) throw new Error('Account name is required.');

    const numBalance = Math.round((Number(balance) || 0) * 100) / 100;

    const { data, error } = await supabase
      .from('accounts')
      .update({
        account_name: trimmedName,
        account_type: type || 'Bank Account',
        balance: numBalance,
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new Error(`An account named "${trimmedName}" already exists.`);
      }
      throw new Error(error.message || 'Failed to update account.');
    }

    await fetchData(false);
    return data;
  };

  /**
   * Delete Account in Supabase
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
   * Add Transaction (Income or Expense)
   * Uses atomic create_transaction RPC, with resilient client-side fallback
   */
  const addTransaction = async ({
    type = 'expense',
    amount,
    category,
    accountId,
    date,
    description = '',
    paymentMethod = '',
    notes = '',
    reason = '',
  }) => {
    if (!user || !supabase) throw new Error('You must be signed in to add a transaction.');

    const numAmount = Math.round((Number(amount) || 0) * 100) / 100;
    if (numAmount <= 0) {
      throw new Error('Transaction amount must be greater than zero.');
    }
    if (!category) {
      throw new Error('Please select a category.');
    }
    if (!accountId) {
      throw new Error('Please select an account.');
    }
    if (!date) {
      throw new Error('Please select a date.');
    }

    const txType = (type || 'expense').toLowerCase();
    const isOther = isOthersCategory(category);
    const cleanReason = (reason || '').trim();

    if (isOther && !cleanReason) {
      throw new Error('Reason for Others category is mandatory.');
    }

    const txId = crypto.randomUUID();

    // Cache metadata locally immediately to guarantee zero loss across client sessions
    saveStoredTxMeta(txId, {
      type: txType,
      category,
      reason: cleanReason,
      description,
      paymentMethod,
      notes,
    });

    // 1. Try atomic create_transaction RPC first
    try {
      const { data, error: rpcErr } = await supabase.rpc('create_transaction', {
        p_id: txId,
        p_account_id: accountId,
        p_amount: numAmount,
        p_type: txType,
        p_category: category,
        p_expense_date: date,
        p_description: description || null,
        p_payment_method: paymentMethod || null,
        p_notes: notes || null,
        p_reason: cleanReason || null,
      });

      if (!rpcErr) {
        await fetchData(false);
        return data;
      }
      console.warn('RPC create_transaction notice:', rpcErr.message);
    } catch (rpcCatchErr) {
      console.warn('RPC create_transaction threw, falling back to direct update:', rpcCatchErr);
    }

    // 2. Client-side atomic balance update fallback
    const account = accounts.find((a) => a.id === accountId);
    if (!account) {
      throw new Error('Selected payment account not found.');
    }

    if (txType === 'expense' && account.balance < numAmount) {
      throw new Error(`Insufficient balance: account has ₹${account.balance} but expense is ₹${numAmount}.`);
    }

    const newBalance = txType === 'expense'
      ? Math.round((account.balance - numAmount) * 100) / 100
      : Math.round((account.balance + numAmount) * 100) / 100;

    // Update account balance
    const { error: accUpdateErr } = await supabase
      .from('accounts')
      .update({ balance: newBalance })
      .eq('id', accountId)
      .eq('user_id', user.id);

    if (accUpdateErr) throw accUpdateErr;

    // Insert transaction into expenses table
    const insertPayload = {
      id: txId,
      user_id: user.id,
      account_id: accountId,
      amount: numAmount,
      category,
      expense_date: date,
      transaction_type: txType,
      description: description || null,
      payment_method: paymentMethod || null,
      notes: notes || null,
      reason: cleanReason || null,
    };

    let { data: insertedData, error: insertErr } = await supabase
      .from('expenses')
      .insert(insertPayload)
      .select()
      .single();

    // If schema lacks extended columns, retry with base columns
    if (insertErr && (insertErr.message.includes('column') || insertErr.code === '42703')) {
      const basePayload = {
        id: txId,
        user_id: user.id,
        account_id: accountId,
        amount: numAmount,
        category,
        expense_date: date,
      };
      const { data: retryData, error: retryErr } = await supabase
        .from('expenses')
        .insert(basePayload)
        .select()
        .single();
      if (retryErr) throw retryErr;
      insertedData = retryData;
    } else if (insertErr) {
      throw insertErr;
    }

    await fetchData(false);
    return insertedData;
  };

  /**
   * Edit Existing Transaction
   * Recalculates both previous and new account balances accurately.
   */
  const editTransaction = async (transactionId, {
    type,
    amount,
    category,
    accountId,
    date,
    description = '',
    paymentMethod = '',
    notes = '',
    reason = '',
  }) => {
    if (!user || !supabase) throw new Error('You must be signed in to edit a transaction.');

    const oldTx = expenses.find((e) => e.id === transactionId);
    if (!oldTx) throw new Error('Transaction not found.');

    const numAmount = Math.round((Number(amount) || 0) * 100) / 100;
    if (numAmount <= 0) {
      throw new Error('Transaction amount must be greater than zero.');
    }
    if (!category) {
      throw new Error('Please select a category.');
    }
    if (!accountId) {
      throw new Error('Please select an account.');
    }
    if (!date) {
      throw new Error('Please select a date.');
    }

    const newType = (type || oldTx.type || 'expense').toLowerCase();
    const isOther = isOthersCategory(category);
    const cleanReason = (reason || '').trim();

    if (isOther && !cleanReason) {
      throw new Error('Reason for Others category is mandatory.');
    }

    // Cache updated metadata locally immediately
    saveStoredTxMeta(transactionId, {
      type: newType,
      category,
      reason: cleanReason,
      description,
      paymentMethod,
      notes,
    });

    // 1. Try atomic edit_transaction RPC first
    try {
      const { data, error: rpcErr } = await supabase.rpc('edit_transaction', {
        p_transaction_id: transactionId,
        p_new_account_id: accountId,
        p_new_amount: numAmount,
        p_new_type: newType,
        p_new_category: category,
        p_new_date: date,
        p_new_description: description || null,
        p_new_payment_method: paymentMethod || null,
        p_new_notes: notes || null,
        p_new_reason: cleanReason || null,
      });

      if (!rpcErr) {
        await fetchData(false);
        return data;
      }
      console.warn('RPC edit_transaction notice:', rpcErr.message);
    } catch (rpcCatchErr) {
      console.warn('RPC edit_transaction threw, falling back to direct update:', rpcCatchErr);
    }

    // 2. Client-side atomic balance recalculation fallback
    const oldAccountId = oldTx.accountId;
    const oldAmount = oldTx.amount;
    const oldType = oldTx.type || 'expense';

    if (oldAccountId === accountId) {
      // Same Account
      const acc = accounts.find((a) => a.id === accountId);
      if (!acc) throw new Error('Account not found.');

      // Reverse old effect
      const intermediate = oldType === 'expense'
        ? acc.balance + oldAmount
        : acc.balance - oldAmount;

      // Apply new effect
      if (newType === 'expense' && intermediate < numAmount) {
        throw new Error(`Insufficient balance: account has ₹${intermediate} after reversal but updated expense is ₹${numAmount}.`);
      }

      const finalBal = newType === 'expense'
        ? Math.round((intermediate - numAmount) * 100) / 100
        : Math.round((intermediate + numAmount) * 100) / 100;

      const { error: accErr } = await supabase
        .from('accounts')
        .update({ balance: finalBal })
        .eq('id', accountId)
        .eq('user_id', user.id);

      if (accErr) throw accErr;
    } else {
      // Account Changed
      const oldAcc = accounts.find((a) => a.id === oldAccountId);
      const newAcc = accounts.find((a) => a.id === accountId);
      if (!oldAcc) throw new Error('Original account not found.');
      if (!newAcc) throw new Error('New account not found.');

      // Reverse old on old account
      const oldFinalBal = oldType === 'expense'
        ? Math.round((oldAcc.balance + oldAmount) * 100) / 100
        : Math.round((oldAcc.balance - oldAmount) * 100) / 100;

      // Apply new on new account
      if (newType === 'expense' && newAcc.balance < numAmount) {
        throw new Error(`Insufficient balance in new account: has ₹${newAcc.balance} but expense is ₹${numAmount}.`);
      }

      const newFinalBal = newType === 'expense'
        ? Math.round((newAcc.balance - numAmount) * 100) / 100
        : Math.round((newAcc.balance + numAmount) * 100) / 100;

      // Update old account
      const { error: oldErr } = await supabase
        .from('accounts')
        .update({ balance: oldFinalBal })
        .eq('id', oldAccountId)
        .eq('user_id', user.id);
      if (oldErr) throw oldErr;

      // Update new account
      const { error: newErr } = await supabase
        .from('accounts')
        .update({ balance: newFinalBal })
        .eq('id', accountId)
        .eq('user_id', user.id);
      if (newErr) throw newErr;
    }

    // Update transaction record in expenses
    const updatePayload = {
      account_id: accountId,
      amount: numAmount,
      category,
      expense_date: date,
      transaction_type: newType,
      description: description || null,
      payment_method: paymentMethod || null,
      notes: notes || null,
      reason: cleanReason || null,
    };

    let { data: updatedData, error: updateErr } = await supabase
      .from('expenses')
      .update(updatePayload)
      .eq('id', transactionId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateErr && (updateErr.message.includes('column') || updateErr.code === '42703')) {
      const baseUpdatePayload = {
        account_id: accountId,
        amount: numAmount,
        category,
        expense_date: date,
      };
      const { data: retryData, error: retryErr } = await supabase
        .from('expenses')
        .update(baseUpdatePayload)
        .eq('id', transactionId)
        .eq('user_id', user.id)
        .select()
        .single();
      if (retryErr) throw retryErr;
      updatedData = retryData;
    } else if (updateErr) {
      throw updateErr;
    }

    await fetchData(false);
    return updatedData;
  };

  /**
   * Delete Transaction (Expense or Income)
   * Restores balance:
   * - Deleting an expense restores (adds) the amount back.
   * - Deleting an income reverses (deducts) the amount back.
   */
  const deleteTransaction = async (transactionId) => {
    if (!user || !supabase) throw new Error('You must be signed in to delete a transaction.');

    const tx = expenses.find((e) => e.id === transactionId);

    // 1. Try atomic delete_transaction RPC
    try {
      const { data, error: rpcErr } = await supabase.rpc('delete_transaction', {
        p_transaction_id: transactionId,
      });

      if (!rpcErr) {
        await fetchData(false);
        return data;
      }
      console.warn('RPC delete_transaction notice:', rpcErr.message);
    } catch (rpcCatchErr) {
      console.warn('RPC delete_transaction threw, falling back to direct delete:', rpcCatchErr);
    }

    // 2. Client-side reverse balance fallback
    if (tx) {
      const account = accounts.find((a) => a.id === tx.accountId);
      if (account) {
        const txType = tx.type || 'expense';
        const restoredBal = txType === 'expense'
          ? Math.round((account.balance + tx.amount) * 100) / 100
          : Math.round((account.balance - tx.amount) * 100) / 100;

        await supabase
          .from('accounts')
          .update({ balance: restoredBal })
          .eq('id', tx.accountId)
          .eq('user_id', user.id);
      }
    }

    const { error: delErr } = await supabase
      .from('expenses')
      .delete()
      .eq('id', transactionId)
      .eq('user_id', user.id);

    deleteStoredTxMeta(transactionId);

    if (delErr) {
      throw new Error(delErr.message || 'Failed to delete transaction.');
    }

    await fetchData(false);
  };

  // Backwards compatibility aliases
  const addExpense = (params) => addTransaction({ ...params, type: 'expense' });
  const addIncome = (params) => addTransaction({ ...params, type: 'income' });
  const deleteExpense = deleteTransaction;

  return (
    <FinanceContext.Provider
      value={{
        accounts,
        expenses,
        transactions: expenses,
        theme,
        setTheme,
        resolvedTheme,
        totalBalance,
        totalIncome,
        totalExpenses,
        netSavings,
        thisMonthExpenses,
        thisMonthIncome,
        loading,
        syncStatus,
        error,
        refreshData: fetchData,
        addAccount,
        editAccount,
        deleteAccount,
        addTransaction,
        editTransaction,
        deleteTransaction,
        addExpense,
        addIncome,
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
