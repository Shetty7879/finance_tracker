// test_balance_logic.js - Unit tests for FridayTrack balance and RPC math logic
import assert from 'node:assert';

console.log('🧪 Running FridayTrack Balance & Expense Logic Tests...');

// Mock Database State representing Supabase tables
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

// Simulates PostgreSQL create_expense RPC function
function mockCreateExpenseRPC(p_id, p_account_id, p_amount, p_category, p_date) {
  // Idempotency check
  const existing = expenses.find((e) => e.id === p_id);
  if (existing) {
    return { ...existing, is_duplicate_retry: true };
  }

  // Account check & row lock
  const account = accounts.find((a) => a.id === p_account_id && a.user_id === currentUserId);
  if (!account) {
    throw new Error('Account not found or access denied.');
  }

  // Sufficient balance verification
  if (account.balance < p_amount) {
    throw new Error(`Insufficient balance: account has ₹${account.balance} but expense is ₹${p_amount}.`);
  }

  // Deduct balance atomically
  account.balance = Math.round((account.balance - p_amount) * 100) / 100;

  // Insert expense
  const expense = {
    id: p_id,
    user_id: currentUserId,
    account_id: p_account_id,
    amount: p_amount,
    category: p_category,
    expense_date: p_date,
    created_at: new Date().toISOString(),
  };
  expenses.push(expense);

  return { expense, new_account_balance: account.balance };
}

// Simulates PostgreSQL delete_expense RPC function
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

// TEST 1: Create an SBI account with ₹10,000
const sbi = mockAddAccount('SBI', 'Bank Account', 10000);
assert.strictEqual(sbi.balance, 10000, 'SBI initial balance should be ₹10,000');
console.log('✅ Scenario 1: SBI account created with ₹10,000');

// TEST 2: Create a ₹500 Food expense using SBI
const exp1 = mockCreateExpenseRPC('exp_1', sbi.id, 500, 'Food', '2026-11-13');
console.log('✅ Scenario 2: ₹500 Food expense created via SBI');

// TEST 3: Verify SBI balance becomes ₹9,500
assert.strictEqual(sbi.balance, 9500, 'SBI balance should become ₹9,500');
assert.strictEqual(exp1.new_account_balance, 9500, 'RPC returned balance should be ₹9,500');
console.log('✅ Scenario 3: Verified SBI balance is exactly ₹9,500');

// TEST 4: Sufficient Balance Check (Edge Case)
assert.throws(
  () => mockCreateExpenseRPC('exp_too_high', sbi.id, 20000, 'Travel', '2026-11-13'),
  /Insufficient balance/,
  'Overdraft should be rejected by atomic RPC'
);
console.log('✅ Scenario 4 (Protection): Overdraft expense correctly rejected');

// TEST 5: Idempotency Protection (Retry)
const duplicateCall = mockCreateExpenseRPC('exp_1', sbi.id, 500, 'Food', '2026-11-13');
assert.strictEqual(duplicateCall.is_duplicate_retry, true, 'Duplicate request should return existing record');
assert.strictEqual(sbi.balance, 9500, 'Balance must NOT be deducted a second time on retry');
console.log('✅ Scenario 5 (Idempotency): Prevented duplicate deduction on retry');

// TEST 6: Delete the ₹500 expense
const delResult = mockDeleteExpenseRPC('exp_1');
assert.strictEqual(delResult.success, true);
assert.strictEqual(delResult.restored_amount, 500);
console.log('✅ Scenario 6: Deleted ₹500 expense');

// TEST 7: Verify balance returns to ₹10,000
assert.strictEqual(sbi.balance, 10000, 'SBI balance must return to ₹10,000');
assert.strictEqual(expenses.length, 0, 'Expenses list must be empty after deletion');
console.log('✅ Scenario 7: Verified balance successfully returned to ₹10,000');

// TEST 8: Dashboard Calculations Verification
const cash = mockAddAccount('Cash', 'Cash', 2500);
const upi = mockAddAccount('GPay UPI', 'UPI', 1500);
mockCreateExpenseRPC('exp_nov_1', sbi.id, 300, 'Food', '2026-11-01');
mockCreateExpenseRPC('exp_nov_2', cash.id, 200, 'Bills', '2026-11-10');
mockCreateExpenseRPC('exp_oct_1', upi.id, 400, 'Travel', '2026-10-25'); // Previous month

const totalBalanceCalc = accounts.reduce((sum, a) => sum + a.balance, 0);
// sbi: 10000 - 300 = 9700; cash: 2500 - 200 = 2300; upi: 1500 - 400 = 1100 => 9700+2300+1100 = 13100
assert.strictEqual(totalBalanceCalc, 13100, 'Total Balance calculation is exact');

const totalExpensesCalc = expenses.reduce((sum, e) => sum + e.amount, 0);
assert.strictEqual(totalExpensesCalc, 900, 'Total Expenses should be 300 + 200 + 400 = 900');

const currentMonth = '2026-11';
const thisMonthCalc = expenses
  .filter((e) => e.expense_date.startsWith(currentMonth))
  .reduce((sum, e) => sum + e.amount, 0);
assert.strictEqual(thisMonthCalc, 500, 'Current Month Expenses should be 300 + 200 = 500');

console.log('✅ Scenario 8: Dashboard Calculations verified (Total Balance, Total Expenses, Monthly Expenses)');

console.log('\n🎉 ALL TESTS PASSED SUCCESSFULLY! 100% of scenarios validated.\n');

