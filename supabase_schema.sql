-- ============================================================================
-- FRIDAYTRACK: SUPABASE DATABASE INITIALIZATION SCHEMA
-- ============================================================================
-- NOTE ON CANONICAL MIGRATIONS:
-- The canonical migration directory is: supabase/migrations/
-- Canonical migration file: supabase/migrations/20261113_init.sql
--
-- This root file (supabase_schema.sql) is maintained as an authoritative reference
-- for copy-pasting directly into the Supabase Dashboard SQL Editor.
-- Running EITHER supabase/migrations/20261113_init.sql OR this file once initializes
-- the entire FridayTrack backend. Do not run both simultaneously.
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

-- 3. EXPENSES TABLE
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL CHECK (amount > 0),
    category TEXT NOT NULL CHECK (category IN (
        'Food', 'Travel', 'Shopping', 'Rent', 'Bills', 
        'Entertainment', 'Health', 'Education', 'Other'
    )),
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes for speedy lookups
CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON public.expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_account_id ON public.expenses(account_id);
CREATE INDEX IF NOT EXISTS idx_expenses_expense_date ON public.expenses(expense_date DESC);

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

DROP POLICY IF EXISTS "Users can delete own expenses" ON public.expenses;
CREATE POLICY "Users can delete own expenses"
    ON public.expenses FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- 5. ATOMIC RPC FUNCTION: CREATE EXPENSE WITH BALANCE DEDUCTION
-- Features:
-- - Atomic transaction
-- - Ownership check
-- - Sufficient balance verification
-- - Balance deduction (SBI Balance = SBI Balance - Amount)
-- - Idempotency protection against duplicate retries using p_id
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
DECLARE
    v_user_id UUID;
    v_current_balance NUMERIC;
    v_new_balance NUMERIC;
    v_expense RECORD;
    v_existing_expense RECORD;
BEGIN
    -- Authenticate caller
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated.';
    END IF;

    -- Validate input amount
    IF p_amount IS NULL OR p_amount <= 0 THEN
        RAISE EXCEPTION 'Expense amount must be greater than zero.';
    END IF;

    -- Idempotency check: if an expense with p_id already exists for this user, return it directly
    IF p_id IS NOT NULL THEN
        SELECT * INTO v_existing_expense
        FROM public.expenses
        WHERE id = p_id AND user_id = v_user_id;

        IF FOUND THEN
            RETURN jsonb_build_object(
                'id', v_existing_expense.id,
                'user_id', v_existing_expense.user_id,
                'account_id', v_existing_expense.account_id,
                'amount', v_existing_expense.amount,
                'category', v_existing_expense.category,
                'expense_date', v_existing_expense.expense_date,
                'created_at', v_existing_expense.created_at,
                'is_duplicate_retry', true
            );
        END IF;
    END IF;

    -- Lock and verify account ownership and current balance
    SELECT balance INTO v_current_balance
    FROM public.accounts
    WHERE id = p_account_id AND user_id = v_user_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Account not found or access denied.';
    END IF;

    -- Verify sufficient balance
    IF v_current_balance < p_amount THEN
        RAISE EXCEPTION 'Insufficient balance: account has ₹% but expense is ₹%.', v_current_balance, p_amount;
    END IF;

    -- Deduct balance atomically
    v_new_balance := v_current_balance - p_amount;
    UPDATE public.accounts
    SET balance = v_new_balance
    WHERE id = p_account_id AND user_id = v_user_id;

    -- Insert expense record
    INSERT INTO public.expenses (
        id,
        user_id,
        account_id,
        amount,
        category,
        expense_date,
        created_at
    )
    VALUES (
        COALESCE(p_id, gen_random_uuid()),
        v_user_id,
        p_account_id,
        p_amount,
        p_category,
        p_expense_date,
        now()
    )
    RETURNING * INTO v_expense;

    RETURN jsonb_build_object(
        'id', v_expense.id,
        'user_id', v_expense.user_id,
        'account_id', v_expense.account_id,
        'amount', v_expense.amount,
        'category', v_expense.category,
        'expense_date', v_expense.expense_date,
        'created_at', v_expense.created_at,
        'new_account_balance', v_new_balance
    );
END;
$$;

-- Grant execution to authenticated users
GRANT EXECUTE ON FUNCTION public.create_expense(UUID, UUID, NUMERIC, TEXT, DATE) TO authenticated;

-- 6. ATOMIC RPC FUNCTION: DELETE EXPENSE WITH BALANCE RESTORATION
-- Features:
-- - Atomic transaction
-- - Ownership check
-- - Restores expense amount back to original account (balance = balance + amount)
-- - Deletes the expense record
CREATE OR REPLACE FUNCTION public.delete_expense(
    p_expense_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_user_id UUID;
    v_account_id UUID;
    v_amount NUMERIC;
    v_new_balance NUMERIC;
BEGIN
    -- Authenticate caller
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated.';
    END IF;

    -- Lock and retrieve expense
    SELECT account_id, amount INTO v_account_id, v_amount
    FROM public.expenses
    WHERE id = p_expense_id AND user_id = v_user_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Expense not found or access denied.';
    END IF;

    -- Lock and restore balance on original account
    UPDATE public.accounts
    SET balance = balance + v_amount
    WHERE id = v_account_id AND user_id = v_user_id
    RETURNING balance INTO v_new_balance;

    -- Delete the expense
    DELETE FROM public.expenses
    WHERE id = p_expense_id AND user_id = v_user_id;

    RETURN jsonb_build_object(
        'deleted_expense_id', p_expense_id,
        'account_id', v_account_id,
        'restored_amount', v_amount,
        'new_account_balance', v_new_balance,
        'success', true
    );
END;
$$;

-- Grant execution to authenticated users
GRANT EXECUTE ON FUNCTION public.delete_expense(UUID) TO authenticated;

-- 7. ENABLE SUPABASE REALTIME
-- Replica identity full enables complete change payloads
ALTER TABLE public.accounts REPLICA IDENTITY FULL;
ALTER TABLE public.expenses REPLICA IDENTITY FULL;

-- Add tables to supabase_realtime publication
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

