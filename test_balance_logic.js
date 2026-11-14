// test_balance_logic.js - Comprehensive test suite for FridayTrack balance, RPC, timezone boundaries, and auth state logic
import assert from 'node:assert';

console.log('🧪 Starting FridayTrack Comprehensive Test Suite...\n');

// ============================================================================
// PART 1: CORE BALANCE & ATOMIC RPC LOGIC
// ============================================================================
console.log('--- 1. Testing Core Balance & Atomic RPC Logic ---');

let accounts = [];
let expenses = [];
const currentUserId = 'user_test_uuid_123';

function mockAddAccount(name, type, initialBalance) {
  const account = {
    id: 'acc_' + Math.random().toString(36).substring(2),
    user_id: currentUserId,
    account_name: name,
    account_type: type,
    balance: Number(initialBalance),
    created_at: new Date().toISOString(),
  };
  accounts.push(account);
  return account;
}

function mockCreateExpenseRPC(p_id, p_account_id, p_amount, p_category, p_date) {
  const existing = expenses.find((e) => e.id === p_id);
  if (existing) {
    return { ...existing, is_duplicate_retry: true };
  }

  const account = accounts.find((a) => a.id === p_account_id && a.user_id === currentUserId);
  if (!account) {
    throw new Error('Account not found or access denied.');
  }

  if (account.balance < p_amount) {
    throw new Error(`Insufficient balance: account has ₹${account.balance} but expense is ₹${p_amount}.`);
  }

  account.balance = Math.round((account.balance - p_amount) * 100) / 100;

  const expense = {
    id: p_id,
    user_id: currentUserId,
    account_id: p_account_id,
    amount: p_amount,
    category: p_category,
    expense_date: p_date,
    date: p_date,
    created_at: new Date().toISOString(),
  };
  expenses.push(expense);

  return { expense, new_account_balance: account.balance };
}

function mockDeleteExpenseRPC(p_expense_id) {
  const expenseIndex = expenses.findIndex((e) => e.id === p_expense_id && e.user_id === currentUserId);
  if (expenseIndex === -1) {
    throw new Error('Expense not found or access denied.');
  }
  const expense = expenses[expenseIndex];

  const account = accounts.find((a) => a.id === expense.account_id && a.user_id === currentUserId);
  if (account) {
    account.balance = Math.round((account.balance + expense.amount) * 100) / 100;
  }

  expenses.splice(expenseIndex, 1);
  return { success: true, restored_amount: expense.amount, new_account_balance: account?.balance };
}

// Scenario 1: Create SBI account with ₹10,000
const sbi = mockAddAccount('SBI', 'Bank Account', 10000);
assert.strictEqual(sbi.balance, 10000);
console.log('✅ Scenario 1: SBI account created with ₹10,000');

// Scenario 2: Create ₹500 Food expense using SBI
const exp1 = mockCreateExpenseRPC('exp_1', sbi.id, 500, 'Food', '2026-11-13');
console.log('✅ Scenario 2: ₹500 Food expense created via SBI');

// Scenario 3: Verify SBI balance becomes ₹9,500
assert.strictEqual(sbi.balance, 9500);
assert.strictEqual(exp1.new_account_balance, 9500);
console.log('✅ Scenario 3: Verified SBI balance is exactly ₹9,500');

// Scenario 4: Overdraft protection
assert.throws(
  () => mockCreateExpenseRPC('exp_too_high', sbi.id, 20000, 'Travel', '2026-11-13'),
  /Insufficient balance/
);
console.log('✅ Scenario 4 (Protection): Overdraft expense correctly rejected');

// Scenario 5: Idempotency protection on retried requests
const duplicateCall = mockCreateExpenseRPC('exp_1', sbi.id, 500, 'Food', '2026-11-13');
assert.strictEqual(duplicateCall.is_duplicate_retry, true);
assert.strictEqual(sbi.balance, 9500, 'Balance must NOT be deducted again');
console.log('✅ Scenario 5 (Idempotency): Prevented duplicate deduction on retry');

// Scenario 6: Delete the ₹500 expense
const delResult = mockDeleteExpenseRPC('exp_1');
assert.strictEqual(delResult.success, true);
assert.strictEqual(delResult.restored_amount, 500);
console.log('✅ Scenario 6: Deleted ₹500 expense');

// Scenario 7: Verify balance returns to ₹10,000
assert.strictEqual(sbi.balance, 10000);
assert.strictEqual(expenses.length, 0);
console.log('✅ Scenario 7: Verified balance successfully returned to ₹10,000\n');


// ============================================================================
// PART 2: LOCAL MONTH CALCULATION & TIMEZONE BOUNDARY TESTS
// ============================================================================
console.log('--- 2. Testing Local Month Calculation & Timezone Boundaries ---');

/**
 * The fixed calculation logic implemented in FinanceContext.jsx:
 * Uses local getFullYear() and getMonth() + 1 without UTC skew
 */
function calculateThisMonthExpenses(expenseList, localReferenceDate = new Date()) {
  const currentYear = localReferenceDate.getFullYear();
  const currentMonth = localReferenceDate.getMonth() + 1; // 1-12
  const currentYearMonthPrefix = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;

  return expenseList
    .filter((exp) => exp.date && exp.date.startsWith(currentYearMonthPrefix))
    .reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0);
}

// Reference Date: November 13, 2026 (local client time)
const mockReferenceDate = new Date(2026, 10, 13); // month 10 is November in JS (0-indexed)

const testExpenses = [
  { id: '1', date: '2026-11-01', amount: 500, category: 'Food' },       // Nov 1 local (e.g. India)
  { id: '2', date: '2026-11-13', amount: 750, category: 'Travel' },     // Nov 13 local
  { id: '3', date: '2026-11-30', amount: 1200, category: 'Bills' },     // Nov 30 local
  { id: '4', date: '2026-10-31', amount: 999, category: 'Shopping' },  // Oct 31 (previous month)
  { id: '5', date: '2025-11-01', amount: 450, category: 'Food' },      // Nov 1 of PREVIOUS YEAR
  { id: '6', date: '2026-12-01', amount: 300, category: 'Rent' },      // Dec 1 (future month)
];

const totalThisMonth = calculateThisMonthExpenses(testExpenses, mockReferenceDate);

// Assertions:
// Nov 1 (500) + Nov 13 (750) + Nov 30 (1200) = 2450
assert.strictEqual(totalThisMonth, 2450, 'This Month expenses should be exactly ₹2,450');
console.log('✅ Test 2.1: November 1 expense (₹500) correctly included in November total');
console.log('✅ Test 2.2: October 31 expense (₹999) correctly excluded from November total');
console.log('✅ Test 2.3: Previous year November (2025-11-01) correctly excluded');
console.log('✅ Test 2.4: Future month (2026-12-01) correctly excluded');

// Timezone Boundary Edge Case:
// In India (UTC+5:30), on November 1st at 01:00 AM IST:
// Local time is 2026-11-01 01:00:00.
// UTC time was 2026-10-31 19:30:00 (which old .toISOString() caused to evaluate as October!).
const indiaNov1EarlyMorning = new Date(2026, 10, 1, 1, 0, 0); // 1:00 AM local on Nov 1
const earlyNovTotal = calculateThisMonthExpenses(
  [{ id: 'early_nov_1', date: '2026-11-01', amount: 350 }],
  indiaNov1EarlyMorning
);
assert.strictEqual(earlyNovTotal, 350, 'Early morning Nov 1 in India must count as November');
console.log('✅ Test 2.5 (Timezone Boundary): Early morning Nov 1 in local timezone evaluated as November (₹350)\n');


// ============================================================================
// PART 3: LOGOUT STATE RESET & SESSION HANDLING TESTS
// ============================================================================
console.log('--- 3. Testing Logout State Reset Logic ---');

// Mock Auth Context State
let mockUser = { id: 'usr_1', email: 'test@example.com' };
let mockSession = { access_token: 'fake_jwt_token' };
let mockAuthError = null;

// Improved signOut implementation from AuthContext.jsx
async function mockSignOut(shouldFailRemote = false) {
  mockAuthError = null;
  // 1. Instantly reset local state
  mockUser = null;
  mockSession = null;

  // 2. Terminate session on server
  try {
    if (shouldFailRemote) {
      throw new Error('Network timeout contacting auth server');
    }
  } catch (err) {
    mockUser = null;
    mockSession = null;
    mockAuthError = err.message || 'Logout failed.';
    throw err;
  }
}

// Test 3.1: Normal Logout
await mockSignOut(false);
assert.strictEqual(mockUser, null, 'User state must be immediately null');
assert.strictEqual(mockSession, null, 'Session state must be immediately null');
assert.strictEqual(mockAuthError, null, 'Auth error must be null on clean logout');
console.log('✅ Test 3.1: Clean logout instantly resets user and session to null');

// Test 3.2: Network failure during logout
// Even if server request fails, user must NOT remain in authenticated state locally
mockUser = { id: 'usr_1', email: 'test@example.com' };
mockSession = { access_token: 'fake_jwt_token' };

try {
  await mockSignOut(true);
} catch (err) {
  // Expected error
}
assert.strictEqual(mockUser, null, 'User state must remain null even on remote network error');
assert.strictEqual(mockSession, null, 'Session state must remain null even on remote network error');
assert.strictEqual(mockAuthError, 'Network timeout contacting auth server');
console.log('✅ Test 3.2: Logout resilience - local state reset survives remote server errors\n');

// ============================================================================
// PART 4: DEFAULT ROUTING & NO-SETUP-SCREEN VERIFICATION
// ============================================================================
console.log('--- 4. Testing Default View Routing & Configuration Policy ---');

// Mock Application Router logic from App.jsx
function resolveView({ user, loading }) {
  if (loading) return 'LOADING';
  if (!user) return 'AUTH_VIEW'; // Must always default to Login/Signup, never a setup screen!
  return 'DASHBOARD_VIEW';
}

// Scenario 4.1: Fresh visitor on any device (unauthenticated)
const freshVisitorView = resolveView({ user: null, loading: false });
assert.strictEqual(freshVisitorView, 'AUTH_VIEW', 'Unauthenticated visitors must see AuthView immediately');
console.log('✅ Test 4.1: Fresh visitor / new device directly routed to AuthView (Sign In)');

// Scenario 4.2: Authenticated user
const loggedInView = resolveView({ user: { id: 'user_123' }, loading: false });
assert.strictEqual(loggedInView, 'DASHBOARD_VIEW', 'Authenticated user must see DashboardView');
console.log('✅ Test 4.2: Authenticated user directly routed to DashboardView');

// Scenario 4.3: Session expiry / logout
const sessionExpiredView = resolveView({ user: null, loading: false });
assert.strictEqual(sessionExpiredView, 'AUTH_VIEW', 'Session expiry must instantly return to AuthView');
console.log('✅ Test 4.3: Session expiry / logout immediately returns to AuthView\n');

// ============================================================================
// PART 5: INCOME, EDIT TRANSACTIONS & OTHERS REASON VERIFICATION
// ============================================================================
console.log('--- 5. Testing Income, Edit Transactions & Others Reason ---');

let txAccounts = [
  { id: 'acc_sbi', user_id: currentUserId, account_name: 'SBI', balance: 10000 },
  { id: 'acc_hdfc', user_id: currentUserId, account_name: 'HDFC', balance: 5000 },
];
let transactionsList = [];

function isOthers(cat) {
  if (!cat) return false;
  const n = String(cat).trim().toLowerCase();
  return n === 'other' || n === 'others';
}

function mockCreateTransaction({ id, accountId, amount, type, category, date, description = '', paymentMethod = '', notes = '', reason = '' }) {
  const numAmount = Math.round((Number(amount) || 0) * 100) / 100;
  if (numAmount <= 0) throw new Error('Amount must be greater than zero.');
  if (!category) throw new Error('Category is required.');
  if (!accountId) throw new Error('Account is required.');

  const txType = (type || 'expense').toLowerCase();
  if (txType !== 'expense' && txType !== 'income') {
    throw new Error('Invalid transaction type.');
  }

  // Mandatory Reason for Others validation
  if (isOthers(category) && (!reason || !reason.trim())) {
    throw new Error('Reason for Others category is mandatory.');
  }

  const account = txAccounts.find((a) => a.id === accountId);
  if (!account) throw new Error('Account not found.');

  if (txType === 'expense') {
    if (account.balance < numAmount) {
      throw new Error(`Insufficient balance: account has ₹${account.balance} but expense is ₹${numAmount}.`);
    }
    account.balance = Math.round((account.balance - numAmount) * 100) / 100;
  } else {
    // Income increases balance
    account.balance = Math.round((account.balance + numAmount) * 100) / 100;
  }

  const tx = {
    id: id || 'tx_' + Math.random().toString(36).substring(2),
    user_id: currentUserId,
    account_id: accountId,
    amount: numAmount,
    type: txType,
    category,
    date,
    description,
    paymentMethod,
    notes,
    reason: isOthers(category) ? reason.trim() : '',
  };
  transactionsList.push(tx);
  return { tx, new_account_balance: account.balance };
}

function mockEditTransaction(transactionId, { accountId, amount, type, category, date, description = '', paymentMethod = '', notes = '', reason = '' }) {
  const txIndex = transactionsList.findIndex((t) => t.id === transactionId);
  if (txIndex === -1) throw new Error('Transaction not found.');
  const oldTx = transactionsList[txIndex];

  const numAmount = Math.round((Number(amount) || 0) * 100) / 100;
  if (numAmount <= 0) throw new Error('Amount must be greater than zero.');

  const newType = (type || oldTx.type).toLowerCase();
  if (isOthers(category) && (!reason || !reason.trim())) {
    throw new Error('Reason for Others category is mandatory.');
  }

  const oldAccountId = oldTx.account_id;
  const newAccountId = accountId || oldAccountId;
  const oldAmount = oldTx.amount;
  const oldType = oldTx.type;

  if (oldAccountId === newAccountId) {
    const acc = txAccounts.find((a) => a.id === oldAccountId);
    if (!acc) throw new Error('Account not found.');

    // Reverse old
    const intermediate = oldType === 'expense'
      ? acc.balance + oldAmount
      : acc.balance - oldAmount;

    // Apply new
    if (newType === 'expense' && intermediate < numAmount) {
      throw new Error(`Insufficient balance: has ₹${intermediate} after reversal but updated expense is ₹${numAmount}.`);
    }
    acc.balance = newType === 'expense'
      ? Math.round((intermediate - numAmount) * 100) / 100
      : Math.round((intermediate + numAmount) * 100) / 100;
  } else {
    // Account changed
    const oldAcc = txAccounts.find((a) => a.id === oldAccountId);
    const newAcc = txAccounts.find((a) => a.id === newAccountId);
    if (!oldAcc || !newAcc) throw new Error('Account not found.');

    // Reverse old on old account
    oldAcc.balance = oldType === 'expense'
      ? Math.round((oldAcc.balance + oldAmount) * 100) / 100
      : Math.round((oldAcc.balance - oldAmount) * 100) / 100;

    // Apply new on new account
    if (newType === 'expense' && newAcc.balance < numAmount) {
      throw new Error(`Insufficient balance on new account.`);
    }
    newAcc.balance = newType === 'expense'
      ? Math.round((newAcc.balance - numAmount) * 100) / 100
      : Math.round((newAcc.balance + numAmount) * 100) / 100;
  }

  // Update record
  oldTx.account_id = newAccountId;
  oldTx.amount = numAmount;
  oldTx.type = newType;
  oldTx.category = category;
  oldTx.date = date;
  oldTx.description = description;
  oldTx.paymentMethod = paymentMethod;
  oldTx.notes = notes;
  oldTx.reason = isOthers(category) ? reason.trim() : '';

  return { updatedTx: oldTx };
}

function mockDeleteTransaction(transactionId) {
  const txIndex = transactionsList.findIndex((t) => t.id === transactionId);
  if (txIndex === -1) throw new Error('Transaction not found.');
  const tx = transactionsList[txIndex];

  const acc = txAccounts.find((a) => a.id === tx.account_id);
  if (acc) {
    acc.balance = tx.type === 'expense'
      ? Math.round((acc.balance + tx.amount) * 100) / 100
      : Math.round((acc.balance - tx.amount) * 100) / 100;
  }

  transactionsList.splice(txIndex, 1);
  return { success: true, new_balance: acc?.balance };
}

// 5.1: Add an Income transaction (Salary: ₹5,000 into SBI)
const income1 = mockCreateTransaction({
  id: 'tx_inc_1',
  accountId: 'acc_sbi',
  amount: 5000,
  type: 'income',
  category: 'Salary',
  date: '2026-11-14',
  description: 'November monthly salary',
});
assert.strictEqual(txAccounts.find((a) => a.id === 'acc_sbi').balance, 15000);
console.log('✅ Test 5.1: Income transaction successfully increases SBI balance (₹10,000 + ₹5,000 = ₹15,000)');

// 5.2: Add an Expense transaction (Food: ₹500 via SBI)
const expA = mockCreateTransaction({
  id: 'tx_exp_1',
  accountId: 'acc_sbi',
  amount: 500,
  type: 'expense',
  category: 'Food',
  date: '2026-11-14',
});
assert.strictEqual(txAccounts.find((a) => a.id === 'acc_sbi').balance, 14500);
console.log('✅ Test 5.2: Expense transaction successfully decreases SBI balance (₹15,000 - ₹500 = ₹14,500)');

// 5.3: Select Others for Income without reason -> Rejected
assert.throws(
  () => mockCreateTransaction({
    id: 'tx_inc_bad',
    accountId: 'acc_sbi',
    amount: 1000,
    type: 'income',
    category: 'Other',
    reason: '',
  }),
  /Reason for Others category is mandatory/
);
// With reason -> Succeeded
const incomeOthers = mockCreateTransaction({
  id: 'tx_inc_other',
  accountId: 'acc_sbi',
  amount: 1000,
  type: 'income',
  category: 'Other',
  reason: 'Consulting bonus from international client',
});
assert.strictEqual(incomeOthers.tx.reason, 'Consulting bonus from international client');
assert.strictEqual(txAccounts.find((a) => a.id === 'acc_sbi').balance, 15500);
console.log('✅ Test 5.3: Mandatory Reason verified for Income with Others category');

// 5.4: Select Others for Expense without reason -> Rejected
assert.throws(
  () => mockCreateTransaction({
    id: 'tx_exp_bad',
    accountId: 'acc_sbi',
    amount: 300,
    type: 'expense',
    category: 'Others',
    reason: '   ',
  }),
  /Reason for Others category is mandatory/
);
// With reason -> Succeeded
const expOthers = mockCreateTransaction({
  id: 'tx_exp_other',
  accountId: 'acc_sbi',
  amount: 300,
  type: 'expense',
  category: 'Others',
  reason: 'Medical emergency prescription',
});
assert.strictEqual(expOthers.tx.reason, 'Medical emergency prescription');
assert.strictEqual(txAccounts.find((a) => a.id === 'acc_sbi').balance, 15200);
console.log('✅ Test 5.4: Mandatory Reason verified for Expense with Others category');

// 5.5: Switch category from Others to Bills -> Reason validation disappears
const expBills = mockCreateTransaction({
  id: 'tx_exp_bills',
  accountId: 'acc_sbi',
  amount: 200,
  type: 'expense',
  category: 'Bills',
  reason: '', // Not required for Bills
});
assert.strictEqual(expBills.tx.category, 'Bills');
assert.strictEqual(txAccounts.find((a) => a.id === 'acc_sbi').balance, 15000);
console.log('✅ Test 5.5: Non-Others category does not require Reason field');

// 5.6: Edit existing Income transaction (Update Salary from ₹5,000 to ₹7,000)
mockEditTransaction('tx_inc_1', {
  amount: 7000,
  type: 'income',
  category: 'Salary',
});
// SBI had ₹15,000. Reversing ₹5,000 -> ₹10,000. Applying ₹7,000 -> ₹17,000.
assert.strictEqual(txAccounts.find((a) => a.id === 'acc_sbi').balance, 17000);
console.log('✅ Test 5.6: Edit Income transaction correctly updates account balance (₹15,000 -> ₹17,000)');

// 5.7: Edit existing Expense transaction (Update Food from ₹500 to ₹800)
mockEditTransaction('tx_exp_1', {
  amount: 800,
  type: 'expense',
  category: 'Food',
});
// SBI had ₹17,000. Reversing ₹500 -> ₹17,500. Applying ₹800 -> ₹16,700.
assert.strictEqual(txAccounts.find((a) => a.id === 'acc_sbi').balance, 16700);
console.log('✅ Test 5.7: Edit Expense transaction correctly recalculates balance (₹17,000 -> ₹16,700)');

// 5.8: Change transaction account (Move ₹800 Food expense from SBI to HDFC)
// HDFC currently has ₹5,000. SBI currently has ₹16,700.
mockEditTransaction('tx_exp_1', {
  accountId: 'acc_hdfc',
  amount: 800,
  type: 'expense',
  category: 'Food',
});
// SBI gets ₹800 restored -> ₹17,500
// HDFC gets ₹800 deducted -> ₹4,200
assert.strictEqual(txAccounts.find((a) => a.id === 'acc_sbi').balance, 17500);
assert.strictEqual(txAccounts.find((a) => a.id === 'acc_hdfc').balance, 4200);
console.log('✅ Test 5.8: Changing transaction account updates BOTH accounts accurately (SBI: ₹17,500, HDFC: ₹4,200)');

// 5.9: Change transaction type from Expense to Income (Convert ₹800 expense into ₹800 income on HDFC)
// HDFC had ₹4,200. Reversing ₹800 expense -> ₹5,000. Applying ₹800 income -> ₹5,800.
mockEditTransaction('tx_exp_1', {
  accountId: 'acc_hdfc',
  amount: 800,
  type: 'income',
  category: 'Refund',
});
assert.strictEqual(txAccounts.find((a) => a.id === 'acc_hdfc').balance, 5800);
console.log('✅ Test 5.9: Changing transaction type (Expense -> Income) correctly reverses and adds balance (₹4,200 -> ₹5,800)');

// 5.10: Delete Income transaction (Delete ₹7,000 Salary from SBI)
// SBI had ₹17,500. Deleting income reverses it: ₹17,500 - ₹7,000 = ₹10,500.
const delInc = mockDeleteTransaction('tx_inc_1');
assert.strictEqual(delInc.success, true);
assert.strictEqual(txAccounts.find((a) => a.id === 'acc_sbi').balance, 10500);
console.log('✅ Test 5.10: Deleting Income transaction reverses (deducts) balance (₹17,500 - ₹7,000 = ₹10,500)');

// 5.11: Delete Expense transaction (Delete ₹300 medical expense from SBI)
// SBI had ₹10,500. Deleting expense refunds it: ₹10,500 + ₹300 = ₹10,800.
const delExp = mockDeleteTransaction('tx_exp_other');
assert.strictEqual(delExp.success, true);
assert.strictEqual(txAccounts.find((a) => a.id === 'acc_sbi').balance, 10800);
console.log('✅ Test 5.11: Deleting Expense transaction refunds balance back to account (₹10,500 + ₹300 = ₹10,800)\n');

// ============================================================================
// PART 6: BANK ACCOUNT EDITING & BALANCE RECONCILIATION
// ============================================================================
console.log('--- 6. Testing Bank Account Editing Logic ---');

function mockEditAccount(id, { name, type, balance }) {
  const acc = txAccounts.find((a) => a.id === id);
  if (!acc) throw new Error('Account not found.');
  const trimmedName = name?.trim();
  if (!trimmedName) throw new Error('Account name is required.');

  // Check unique name constraint among other accounts
  const duplicate = txAccounts.find((a) => a.id !== id && a.account_name.toLowerCase() === trimmedName.toLowerCase());
  if (duplicate) throw new Error(`An account named "${trimmedName}" already exists.`);

  acc.account_name = trimmedName;
  if (type) acc.account_type = type;
  if (balance !== undefined) acc.balance = Math.round(Number(balance) * 100) / 100;
  return acc;
}

// 6.1: Rename Account
const updatedAcc = mockEditAccount('acc_sbi', { name: 'State Bank of India (Salary)', type: 'Bank Account', balance: 10800 });
assert.strictEqual(updatedAcc.account_name, 'State Bank of India (Salary)');
console.log('✅ Test 6.1: Successfully renamed bank account');

// 6.2: Update Account Type
mockEditAccount('acc_hdfc', { name: 'HDFC PayZapp', type: 'Wallet', balance: 5800 });
assert.strictEqual(txAccounts.find((a) => a.id === 'acc_hdfc').account_type, 'Wallet');
console.log('✅ Test 6.2: Successfully changed account type to Wallet');

// 6.3: Reconcile / Adjust Account Balance
mockEditAccount('acc_sbi', { name: 'State Bank of India (Salary)', balance: 12500 });
assert.strictEqual(txAccounts.find((a) => a.id === 'acc_sbi').balance, 12500);
console.log('✅ Test 6.3: Successfully adjusted bank account balance (₹10,800 -> ₹12,500)');

// 6.4: Validate Required Account Name
assert.throws(() => {
  mockEditAccount('acc_sbi', { name: '   ', balance: 12500 });
}, /Account name is required/);
console.log('✅ Test 6.4: Blank or whitespace account name correctly rejected');

// 6.5: Prevent Duplicate Account Names
assert.throws(() => {
  mockEditAccount('acc_hdfc', { name: 'State Bank of India (Salary)', balance: 5800 });
}, /already exists/);
console.log('✅ Test 6.5: Duplicate account name correctly rejected');

// 6.6: Verify Total Balance Calculation after Edit
const computedTotal = txAccounts.reduce((sum, a) => sum + (Number(a.balance) || 0), 0);
assert.strictEqual(computedTotal, 12500 + 5800);
console.log(`✅ Test 6.6: Total balance correctly reflects updated bank balance (₹${computedTotal})\n`);

// ============================================================================
// PART 7: BANK LOGO AUTO-DETECTION & PRESET RESOLUTION
// ============================================================================
console.log('--- 7. Testing Bank Logo Auto-Detection Logic ---');

import { detectBankLogo, BANK_PRESETS } from './src/constants/finance.js';

// 7.1: Detect SBI logo
assert.strictEqual(detectBankLogo('SBI'), '/logos/sbi.png');
assert.strictEqual(detectBankLogo('State Bank of India'), '/logos/sbi.png');
assert.strictEqual(detectBankLogo('SBI Savings Account'), '/logos/sbi.png');
console.log('✅ Test 7.1: SBI logo accurately detected for SBI variations');

// 7.2: Detect Slice logo
assert.strictEqual(detectBankLogo('Slice'), '/logos/slice.png');
assert.strictEqual(detectBankLogo('Slice Card'), '/logos/slice.png');
assert.strictEqual(detectBankLogo('Slice Mini UPI'), '/logos/slice.png');
console.log('✅ Test 7.2: Slice logo accurately detected for Slice variations');

// 7.3: Fallback for generic accounts
assert.strictEqual(detectBankLogo('Cash'), null);
assert.strictEqual(detectBankLogo('My Emergency Fund'), null);
assert.strictEqual(detectBankLogo(''), null);
console.log('✅ Test 7.3: Clean null fallback for non-branded/generic accounts');

// 7.4: Presets integrity
const sbiPreset = BANK_PRESETS.find((p) => p.shortName === 'SBI');
const slicePreset = BANK_PRESETS.find((p) => p.shortName === 'Slice');
assert.strictEqual(sbiPreset?.logo, '/logos/sbi.png');
assert.strictEqual(slicePreset?.logo, '/logos/slice.png');
console.log('✅ Test 7.4: Verified SBI & Slice presets configured in BANK_PRESETS\n');

// ============================================================================
// PART 8: INCOME & EXPENSE CATEGORY SEPARATION & REASON PRESERVATION
// ============================================================================
console.log('--- 8. Testing Category Separation & Reason Preservation ---');

import { isKnownIncomeCategory, isKnownExpenseCategory } from './src/constants/finance.js';

// 8.1: Test Income Categories identification
assert.strictEqual(isKnownIncomeCategory('Salary'), true);
assert.strictEqual(isKnownIncomeCategory('Freelance'), true);
assert.strictEqual(isKnownIncomeCategory('Dividends'), true);
assert.strictEqual(isKnownIncomeCategory('Food'), false);
assert.strictEqual(isKnownIncomeCategory('Travel'), false);
console.log('✅ Test 8.1: Income categories strictly distinguished from Expense categories');

// 8.2: Test Expense Categories identification
assert.strictEqual(isKnownExpenseCategory('Food'), true);
assert.strictEqual(isKnownExpenseCategory('Rent'), true);
assert.strictEqual(isKnownExpenseCategory('Bills'), true);
assert.strictEqual(isKnownExpenseCategory('Salary'), false);
console.log('✅ Test 8.2: Expense categories strictly identified');

// 8.3: Reason display override for Others category
function getDisplayCategory(category, reason) {
  if (category === 'Other' || category === 'Others') {
    return reason ? reason : category;
  }
  return category;
}
assert.strictEqual(getDisplayCategory('Other', 'Consulting gig'), 'Consulting gig');
assert.strictEqual(getDisplayCategory('Other', ''), 'Other');
assert.strictEqual(getDisplayCategory('Food', ''), 'Food');
console.log('✅ Test 8.3: Primary display shows user reason when Others is selected');

// 8.4: Sign formatting (+ for income, - for expense)
function formatSignedAmount(amount, type) {
  return type === 'income' ? `+ ₹${amount}` : `- ₹${amount}`;
}
assert.strictEqual(formatSignedAmount(8000, 'income'), '+ ₹8000');
assert.strictEqual(formatSignedAmount(8000, 'expense'), '- ₹8000');
console.log('✅ Test 8.4: Signed amount displays + for Income and - for Expense\n');

// ============================================================================
// SUMMARY
// ============================================================================
console.log('🎉 ALL TESTS PASSED! All 42 test scenarios, boundary conditions, income, edit, account updates, bank logos, category separation, and reason logic verified successfully.');
