-- ============================================================================
-- FRIDAYTRACK: SUPABASE DATABASE INITIALIZATION SCHEMA
-- ============================================================================
-- NOTE ON CANONICAL MIGRATIONS:
-- The canonical migration directory is: supabase/migrations/
-- 1. supabase/migrations/20261113_init.sql
-- 2. supabase/migrations/20261114_add_income_and_edit.sql
--
-- This root file (supabase_schema.sql) is maintained as an authoritative reference
-- for copy-pasting directly into the Supabase Dashboard SQL Editor.
-- Running this file initializes the entire FridayTrack backend including Income,
-- Expenses, Editing, Realtime, and Row Level Security.
-- ============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ACCOUNTS TABLE
CREATE TABLE IF NOT EXISTS public.accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    account_name TEXT NOT NULL,
    account_type TEXT NOT NULL CHECK (account_type IN ('Bank Account', 'Cash', 'UPI', 'Wallet')),
    balance NUMERIC NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    CONSTRAINT unique_user_account_name UNIQUE (user_id, account_name)
);

-- Index for speedy lookups by user
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON public.accounts(user_id);

-- 3. EXPENSES / TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL CHECK (amount > 0),
    transaction_type TEXT NOT NULL DEFAULT 'expense' CHECK (transaction_type IN ('expense', 'income')),
    category TEXT NOT NULL CHECK (category IN (
        -- Expense categories
        'Food', 'Travel', 'Shopping', 'Rent', 'Bills', 
        'Entertainment', 'Health', 'Education', 'Other', 'Others',
        -- Income categories
        'Salary', 'Freelance', 'Business Income', 'Investment Returns', 
        'Dividends', 'Interest', 'Refund', 'Gift'
    )),
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
    description TEXT,
    payment_method TEXT,
    notes TEXT,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Ensure columns exist if table was created in an earlier migration
ALTER TABLE public.expenses 
    ADD COLUMN IF NOT EXISTS transaction_type TEXT NOT NULL DEFAULT 'expense',
    ADD COLUMN IF NOT EXISTS description TEXT,
    ADD COLUMN IF NOT EXISTS payment_method TEXT,
    ADD COLUMN IF NOT EXISTS notes TEXT,
    ADD COLUMN IF NOT EXISTS reason TEXT;

-- Drop and re-add constraint to support income categories and Others
ALTER TABLE public.expenses DROP CONSTRAINT IF EXISTS expenses_category_check;
ALTER TABLE public.expenses ADD CONSTRAINT expenses_category_check CHECK (
    category IN (
        'Food', 'Travel', 'Shopping', 'Rent', 'Bills', 
        'Entertainment', 'Health', 'Education', 'Other', 'Others',
        'Salary', 'Freelance', 'Business Income', 'Investment Returns', 
        'Dividends', 'Interest', 'Refund', 'Gift'
    )
);

-- Indexes for speedy lookups
CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON public.expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_account_id ON public.expenses(account_id);
CREATE INDEX IF NOT EXISTS idx_expenses_expense_date ON public.expenses(expense_date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_tx_type ON public.expenses(transaction_type);

-- 4. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- Accounts RLS Policies
DROP POLICY IF EXISTS "Users can read own accounts" ON public.accounts;
CREATE POLICY "Users can read own accounts"
    ON public.accounts FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own accounts" ON public.accounts;
CREATE POLICY "Users can create own accounts"
    ON public.accounts FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own accounts" ON public.accounts;
CREATE POLICY "Users can update own accounts"
    ON public.accounts FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own accounts" ON public.accounts;
CREATE POLICY "Users can delete own accounts"
    ON public.accounts FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- Expenses RLS Policies
DROP POLICY IF EXISTS "Users can read own expenses" ON public.expenses;
CREATE POLICY "Users can read own expenses"
    ON public.expenses FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own expenses" ON public.expenses;
CREATE POLICY "Users can create own expenses"
    ON public.expenses FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own expenses" ON public.expenses;
CREATE POLICY "Users can update own expenses"
    ON public.expenses FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own expenses" ON public.expenses;
CREATE POLICY "Users can delete own expenses"
    ON public.expenses FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- 5. ATOMIC RPC FUNCTION: CREATE TRANSACTION (EXPENSE OR INCOME)
CREATE OR REPLACE FUNCTION public.create_transaction(
    p_id UUID,
    p_account_id UUID,
    p_amount NUMERIC,
    p_type TEXT,
    p_category TEXT,
    p_date DATE,
    p_description TEXT DEFAULT NULL,
    p_payment_method TEXT DEFAULT NULL,
    p_notes TEXT DEFAULT NULL,
    p_reason TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_user_id UUID;
    v_current_balance NUMERIC;
    v_new_balance NUMERIC;
    v_tx_type TEXT;
    v_transaction RECORD;
    v_existing RECORD;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated.';
    END IF;

    IF p_amount IS NULL OR p_amount <= 0 THEN
        RAISE EXCEPTION 'Transaction amount must be greater than zero.';
    END IF;

    v_tx_type := LOWER(COALESCE(p_type, 'expense'));
    IF v_tx_type NOT IN ('expense', 'income') THEN
        RAISE EXCEPTION 'Invalid transaction type: must be expense or income.';
    END IF;

    -- Validate Others reason
    IF p_category IN ('Other', 'Others') AND (p_reason IS NULL OR TRIM(p_reason) = '') THEN
        RAISE EXCEPTION 'Reason is mandatory when Others category is selected.';
    END IF;

    -- Idempotency check: if already exists, return cleanly
    IF p_id IS NOT NULL THEN
        SELECT * INTO v_existing
        FROM public.expenses
        WHERE id = p_id AND user_id = v_user_id;

        IF FOUND THEN
            RETURN jsonb_build_object(
                'id', v_existing.id,
                'user_id', v_existing.user_id,
                'account_id', v_existing.account_id,
                'amount', v_existing.amount,
                'category', v_existing.category,
                'transaction_type', v_existing.transaction_type,
                'is_duplicate_retry', true
            );
        END IF;
    END IF;

    -- Lock and verify account
    SELECT balance INTO v_current_balance
    FROM public.accounts
    WHERE id = p_account_id AND user_id = v_user_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Account not found or access denied.';
    END IF;

    -- Balance check
    IF v_tx_type = 'expense' THEN
        IF v_current_balance < p_amount THEN
            RAISE EXCEPTION 'Insufficient balance: account has ₹% but expense is ₹%.', v_current_balance, p_amount;
        END IF;
        v_new_balance := v_current_balance - p_amount;
    ELSE
        -- Income increases balance
        v_new_balance := v_current_balance + p_amount;
    END IF;

    -- Update account balance
    UPDATE public.accounts
    SET balance = v_new_balance
    WHERE id = p_account_id AND user_id = v_user_id;

    -- Insert transaction
    INSERT INTO public.expenses (
        id,
        user_id,
        account_id,
        amount,
        category,
        expense_date,
        transaction_type,
        description,
        payment_method,
        notes,
        reason,
        created_at
    )
    VALUES (
        COALESCE(p_id, gen_random_uuid()),
        v_user_id,
        p_account_id,
        p_amount,
        p_category,
        p_date,
        v_tx_type,
        p_description,
        p_payment_method,
        p_notes,
        p_reason,
        now()
    )
    RETURNING * INTO v_transaction;

    RETURN jsonb_build_object(
        'id', v_transaction.id,
        'user_id', v_transaction.user_id,
        'account_id', v_transaction.account_id,
        'amount', v_transaction.amount,
        'category', v_transaction.category,
        'transaction_type', v_transaction.transaction_type,
        'expense_date', v_transaction.expense_date,
        'description', v_transaction.description,
        'payment_method', v_transaction.payment_method,
        'notes', v_transaction.notes,
        'reason', v_transaction.reason,
        'created_at', v_transaction.created_at,
        'new_account_balance', v_new_balance
    );
END;
$$;
GRANT EXECUTE ON FUNCTION public.create_transaction TO authenticated;

-- Backwards-compatible create_expense
CREATE OR REPLACE FUNCTION public.create_expense(
    p_id UUID,
    p_account_id UUID,
    p_amount NUMERIC,
    p_category TEXT,
    p_expense_date DATE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    RETURN public.create_transaction(
        p_id,
        p_account_id,
        p_amount,
        'expense',
        p_category,
        p_expense_date,
        NULL,
        NULL,
        NULL,
        NULL
    );
END;
$$;
GRANT EXECUTE ON FUNCTION public.create_expense TO authenticated;

-- 6. ATOMIC RPC FUNCTION: EDIT TRANSACTION WITH BALANCE RECALCULATION
CREATE OR REPLACE FUNCTION public.edit_transaction(
    p_transaction_id UUID,
    p_new_account_id UUID,
    p_new_amount NUMERIC,
    p_new_type TEXT,
    p_new_category TEXT,
    p_new_date DATE,
    p_new_description TEXT DEFAULT NULL,
    p_new_payment_method TEXT DEFAULT NULL,
    p_new_notes TEXT DEFAULT NULL,
    p_new_reason TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_user_id UUID;
    v_old_tx RECORD;
    v_old_account RECORD;
    v_new_account RECORD;
    v_old_type TEXT;
    v_new_type TEXT;
    v_old_amount NUMERIC;
    v_old_account_id UUID;
    v_intermediate_balance NUMERIC;
    v_updated_tx RECORD;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated.';
    END IF;

    IF p_new_amount IS NULL OR p_new_amount <= 0 THEN
        RAISE EXCEPTION 'Transaction amount must be greater than zero.';
    END IF;

    v_new_type := LOWER(COALESCE(p_new_type, 'expense'));
    IF v_new_type NOT IN ('expense', 'income') THEN
        RAISE EXCEPTION 'Invalid transaction type: must be expense or income.';
    END IF;

    -- Validate Others reason
    IF p_new_category IN ('Other', 'Others') AND (p_new_reason IS NULL OR TRIM(p_new_reason) = '') THEN
        RAISE EXCEPTION 'Reason is mandatory when Others category is selected.';
    END IF;

    -- Lock and retrieve old transaction
    SELECT * INTO v_old_tx
    FROM public.expenses
    WHERE id = p_transaction_id AND user_id = v_user_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Transaction not found or access denied.';
    END IF;

    v_old_type := LOWER(COALESCE(v_old_tx.transaction_type, 'expense'));
    v_old_amount := v_old_tx.amount;
    v_old_account_id := v_old_tx.account_id;

    -- Case 1: Same Account
    IF v_old_account_id = p_new_account_id THEN
        SELECT * INTO v_old_account
        FROM public.accounts
        WHERE id = v_old_account_id AND user_id = v_user_id
        FOR UPDATE;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Account not found.';
        END IF;

        -- Step A: Reverse previous transaction effect
        IF v_old_type = 'expense' THEN
            v_intermediate_balance := v_old_account.balance + v_old_amount;
        ELSE
            v_intermediate_balance := v_old_account.balance - v_old_amount;
        END IF;

        -- Step B: Apply new transaction effect
        IF v_new_type = 'expense' THEN
            IF v_intermediate_balance < p_new_amount THEN
                RAISE EXCEPTION 'Insufficient balance: account has ₹% after reversal but updated expense is ₹%.', v_intermediate_balance, p_new_amount;
            END IF;
            UPDATE public.accounts
            SET balance = v_intermediate_balance - p_new_amount
            WHERE id = v_old_account_id AND user_id = v_user_id;
        ELSE
            UPDATE public.accounts
            SET balance = v_intermediate_balance + p_new_amount
            WHERE id = v_old_account_id AND user_id = v_user_id;
        END IF;

    -- Case 2: Account Changed
    ELSE
        -- Lock old account and reverse old effect
        SELECT * INTO v_old_account
        FROM public.accounts
        WHERE id = v_old_account_id AND user_id = v_user_id
        FOR UPDATE;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Previous account not found.';
        END IF;

        IF v_old_type = 'expense' THEN
            UPDATE public.accounts
            SET balance = balance + v_old_amount
            WHERE id = v_old_account_id AND user_id = v_user_id;
        ELSE
            UPDATE public.accounts
            SET balance = balance - v_old_amount
            WHERE id = v_old_account_id AND user_id = v_user_id;
        END IF;

        -- Lock new account and apply new effect
        SELECT * INTO v_new_account
        FROM public.accounts
        WHERE id = p_new_account_id AND user_id = v_user_id
        FOR UPDATE;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'New payment account not found.';
        END IF;

        IF v_new_type = 'expense' THEN
            IF v_new_account.balance < p_new_amount THEN
                RAISE EXCEPTION 'Insufficient balance in new account: has ₹% but expense is ₹%.', v_new_account.balance, p_new_amount;
            END IF;
            UPDATE public.accounts
            SET balance = balance - p_new_amount
            WHERE id = p_new_account_id AND user_id = v_user_id;
        ELSE
            UPDATE public.accounts
            SET balance = balance + p_new_amount
            WHERE id = p_new_account_id AND user_id = v_user_id;
        END IF;
    END IF;

    -- Update transaction record
    UPDATE public.expenses
    SET
        account_id = p_new_account_id,
        amount = p_new_amount,
        transaction_type = v_new_type,
        category = p_new_category,
        expense_date = p_new_date,
        description = p_new_description,
        payment_method = p_new_payment_method,
        notes = p_new_notes,
        reason = p_new_reason
    WHERE id = p_transaction_id AND user_id = v_user_id
    RETURNING * INTO v_updated_tx;

    RETURN jsonb_build_object(
        'id', v_updated_tx.id,
        'user_id', v_updated_tx.user_id,
        'account_id', v_updated_tx.account_id,
        'amount', v_updated_tx.amount,
        'transaction_type', v_updated_tx.transaction_type,
        'category', v_updated_tx.category,
        'expense_date', v_updated_tx.expense_date,
        'description', v_updated_tx.description,
        'payment_method', v_updated_tx.payment_method,
        'notes', v_updated_tx.notes,
        'reason', v_updated_tx.reason,
        'success', true
    );
END;
$$;
GRANT EXECUTE ON FUNCTION public.edit_transaction TO authenticated;

-- 7. ATOMIC RPC FUNCTION: DELETE TRANSACTION (EXPENSE OR INCOME)
CREATE OR REPLACE FUNCTION public.delete_transaction(
    p_transaction_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_user_id UUID;
    v_tx RECORD;
    v_account_id UUID;
    v_amount NUMERIC;
    v_type TEXT;
    v_new_balance NUMERIC;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated.';
    END IF;

    SELECT * INTO v_tx
    FROM public.expenses
    WHERE id = p_transaction_id AND user_id = v_user_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Transaction not found or access denied.';
    END IF;

    v_account_id := v_tx.account_id;
    v_amount := v_tx.amount;
    v_type := LOWER(COALESCE(v_tx.transaction_type, 'expense'));

    -- Reversal:
    -- If expense -> refund back (balance + amount)
    -- If income -> deduct back (balance - amount)
    IF v_type = 'expense' THEN
        UPDATE public.accounts
        SET balance = balance + v_amount
        WHERE id = v_account_id AND user_id = v_user_id
        RETURNING balance INTO v_new_balance;
    ELSE
        UPDATE public.accounts
        SET balance = balance - v_amount
        WHERE id = v_account_id AND user_id = v_user_id
        RETURNING balance INTO v_new_balance;
    END IF;

    -- Delete transaction record
    DELETE FROM public.expenses
    WHERE id = p_transaction_id AND user_id = v_user_id;

    RETURN jsonb_build_object(
        'deleted_id', p_transaction_id,
        'account_id', v_account_id,
        'transaction_type', v_type,
        'amount', v_amount,
        'new_account_balance', v_new_balance,
        'success', true
    );
END;
$$;
GRANT EXECUTE ON FUNCTION public.delete_transaction TO authenticated;

-- Backwards compatibility for delete_expense
CREATE OR REPLACE FUNCTION public.delete_expense(p_expense_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    RETURN public.delete_transaction(p_expense_id);
END;
$$;
GRANT EXECUTE ON FUNCTION public.delete_expense TO authenticated;

-- 8. ENABLE SUPABASE REALTIME
ALTER TABLE public.accounts REPLICA IDENTITY FULL;
ALTER TABLE public.expenses REPLICA IDENTITY FULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'accounts'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.accounts;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'expenses'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.expenses;
    END IF;
END $$;
