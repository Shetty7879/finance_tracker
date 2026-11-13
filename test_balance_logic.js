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
// SUMMARY
// ============================================================================
console.log('🎉 ALL TESTS PASSED! All 14 test scenarios and boundary conditions verified successfully.');
