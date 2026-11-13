# FridayTrack 🚀
### Cloud-Synced Personal Expense Tracker with Bank Accounts (Supabase Backend)

FridayTrack is a modern, high-performance personal finance & expense tracker built with React, Vite, Tailwind CSS, and Supabase. It provides multi-account balance management, atomic database-level expense deductions, Row Level Security (RLS), and real-time multi-device synchronization.

---

## 🌟 Key Features

### 1. 🔐 Secure Supabase Authentication
- Email & password authentication (Sign Up, Sign In, Sign Out).
- Persistent sessions stored securely in the browser.
- **Row Level Security (RLS)** strictly isolates each user's accounts and expenses.

### 2. 🏦 Bank Accounts & Wallets
- Support for `Bank Account`, `Cash`, `UPI`, and `Wallet`.
- Real-time balances synchronized from PostgreSQL `accounts` table.
- Total Balance = $\sum \text{Account Balances}$ across all accounts belonging to the authenticated user.

### 3. 💸 Strict 4-Field Expense Tracking
- Form contains **ONLY**:
  1. **Amount** (₹)
  2. **Category** (*Food, Travel, Shopping, Rent, Bills, Entertainment, Health, Education, Other*)
  3. **Payment Account**
  4. **Date**
- Zero clutter: No income, investments, merchants, or descriptions.

### 4. ⚡ Atomic PostgreSQL Balance Logic (RPC)
- **Adding an Expense (`create_expense`)**:
  - Verifies ownership and checks for sufficient balance.
  - Atomically deducts: $\text{Balance}_{\text{new}} = \text{Balance}_{\text{old}} - \text{Amount}$.
  - Idempotency protection prevents duplicate deductions if requests are retried.
- **Deleting an Expense (`delete_expense`)**:
  - Automatically refunds the amount: $\text{Balance}_{\text{new}} = \text{Balance}_{\text{old}} + \text{Amount}$.
  - Deletes the transaction atomically.

### 5. 🔄 Supabase Realtime Synchronization
- Subscribed to PostgreSQL changes (`supabase_realtime` publication).
- Any balance change, added expense, or deleted transaction instantly syncs across all open browser tabs and devices without page refresh.

### 6. 📊 Real-Time Dashboard
- **Total Balance**: Real-time sum of balances across all accounts.
- **Total Expenses**: Real-time sum of all recorded expenses.
- **This Month Expenses**: Real-time sum of expenses recorded for the current calendar month.

---

## 🛠️ Supabase Setup Instructions

### 1. Execute SQL Migration in Supabase
- **Canonical Migration File**: `supabase/migrations/20261113_init.sql` (use with Supabase CLI: `supabase db push` or `supabase migration up`).
- **Web Dashboard SQL Editor**: You can also copy and execute `supabase_schema.sql` (or `supabase/migrations/20261113_init.sql`) directly in the [Supabase SQL Editor](https://supabase.com/dashboard).
  - *Note: Execute only once to avoid duplicate publication notices.*
  - This sets up `accounts`, `expenses`, RLS policies, the atomic RPC functions (`create_expense`, `delete_expense`), and Realtime publications.

### 2. Configure Environment Variables
Copy `.env.example` to `.env` and fill in your Supabase credentials:

```bash
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-or-anon-key
```

*Note: You can find these under **Project Settings** > **API** in the Supabase Dashboard.*

---

## 🚀 Running the Application

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Run tests** (verifies atomic RPC logic, math & scenarios):
   ```bash
   npm test
   ```

3. **Start development server**:
   ```bash
   npm run dev
   ```

4. **Build for production**:
   ```bash
   npm run build
   ```

---

## ✅ Verified Test Scenarios

| # | Test Scenario | Verified Result |
|---|---------------|-----------------|
| 1 | Create SBI account with ₹10,000 | Account created in DB with ₹10,000 balance |
| 2 | Create ₹500 Food expense via SBI | `create_expense` RPC called atomically |
| 3 | Verify balance update | SBI balance becomes exactly ₹9,500 |
| 4 | Overdraft protection test | Expense exceeding balance is rejected by DB |
| 5 | Idempotency retry protection | Retrying same request does not double-deduct |
| 6 | Realtime multi-tab test | Live updates broadcast via `supabase_realtime` |
| 7 | Delete ₹500 expense | `delete_expense` RPC restores ₹500 to SBI |
| 8 | Post-deletion balance check | SBI balance returns to ₹10,000 |
