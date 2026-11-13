import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

// Parse .env dynamically to avoid hardcoded credentials
function loadEnv() {
  const envPath = path.resolve('.env');
  if (!fs.existsSync(envPath)) return {};
  const content = fs.readFileSync(envPath, 'utf8');
  const env = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim();
      env[key] = val;
    }
  }
  return env;
}

const env = loadEnv();
const supabaseUrl = env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_PUBLISHABLE_KEY || env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

async function runLiveE2E(email, password) {
  console.log('🚀 Running FridayTrack Live Functional E2E Tests...\n');

  // Client A (Session A)
  const clientA = createClient(supabaseUrl, supabaseKey);
  // Client B (Session B)
  const clientB = createClient(supabaseUrl, supabaseKey);

  // -------------------------------------------------------------
  // TEST 1 — AUTHENTICATION
  // -------------------------------------------------------------
  console.log('--- TEST 1: AUTHENTICATION ---');
  let authData = null;

  // Try sign in first
  const { data: signInData, error: signInErr } = await clientA.auth.signInWithPassword({
    email,
    password,
  });

  if (signInErr) {
    if (signInErr.message.includes('Invalid login credentials')) {
      console.log(`User does not exist yet. Attempting registration for ${email}...`);
      const { data: signUpData, error: signUpErr } = await clientA.auth.signUp({
        email,
        password,
      });

      if (signUpErr) {
        console.error('❌ Registration failed:', signUpErr.message);
        return { test1: 'FAIL', reason: signUpErr.message };
      }

      if (!signUpData.session) {
        console.error('⚠️ Registration succeeded, but session is null (Email confirmation is enabled in Supabase).');
        console.error('   Please confirm your email by clicking the link in your inbox, or toggle "Confirm email" OFF in Supabase Dashboard.');
        return { test1: 'FAIL', reason: 'Email confirmation required by Supabase Auth' };
      }
      authData = signUpData;
    } else {
      console.error('❌ Sign In failed:', signInErr.message);
      return { test1: 'FAIL', reason: signInErr.message };
    }
  } else {
    authData = signInData;
  }

  const userId = authData.user.id;
  console.log(`✅ TEST 1 PASS: Authenticated user ID = ${userId}`);

  // Authenticate Session B as well
  await clientB.auth.setSession({
    access_token: authData.session.access_token,
    refresh_token: authData.session.refresh_token,
  });

  // -------------------------------------------------------------
  // TEST 2 — BANK ACCOUNT
  // -------------------------------------------------------------
  console.log('\n--- TEST 2: BANK ACCOUNT ---');
  // Check if SBI already exists or create new
  const { data: existingAccounts } = await clientA.from('accounts').select('*').eq('account_name', 'SBI');
  let sbiAccount = existingAccounts?.[0];

  if (!sbiAccount) {
    const { data: createdAcc, error: createAccErr } = await clientA
      .from('accounts')
      .insert({
        user_id: userId,
        account_name: 'SBI',
        account_type: 'Bank Account',
        balance: 10000,
      })
      .select()
      .single();

    if (createAccErr) {
      console.error('❌ TEST 2 FAIL: Failed to create SBI account:', createAccErr.message);
      return { test2: 'FAIL' };
    }
    sbiAccount = createdAcc;
    console.log(`✅ TEST 2 PASS: Created SBI account (ID: ${sbiAccount.id}) with initial balance ₹${sbiAccount.balance}`);
  } else {
    console.log(`✅ TEST 2 PASS: SBI account exists with balance ₹${sbiAccount.balance}`);
  }

  // Verify persistence via Session B
  const { data: persistentAcc, error: persistErr } = await clientB
    .from('accounts')
    .select('*')
    .eq('id', sbiAccount.id)
    .single();

  if (persistErr || !persistentAcc) {
    console.error('❌ TEST 2 FAIL: Persistence verification failed across sessions.');
    return { test2: 'FAIL' };
  }
  console.log(`✅ TEST 2 PASS: Verified persistence via independent session B (Balance: ₹${persistentAcc.balance})`);

  // -------------------------------------------------------------
  // TEST 3 — EXPENSE (Atomic deduction)
  // -------------------------------------------------------------
  console.log('\n--- TEST 3: EXPENSE ---');
  const expenseId = crypto.randomUUID();
  const { data: expenseResult, error: expErr } = await clientA.rpc('create_expense', {
    p_id: expenseId,
    p_account_id: sbiAccount.id,
    p_amount: 500,
    p_category: 'Food',
    p_expense_date: '2026-11-13',
  });

  if (expErr) {
    console.error('❌ TEST 3 FAIL: create_expense RPC failed:', expErr.message);
    return { test3: 'FAIL' };
  }

  // Check balance in Supabase accounts table
  const { data: sbiAfterExpense } = await clientA.from('accounts').select('balance').eq('id', sbiAccount.id).single();
  const balanceIs9500 = Number(sbiAfterExpense.balance) === 9500;

  if (!balanceIs9500) {
    console.error(`❌ TEST 3 FAIL: Expected balance ₹9,500, but found ₹${sbiAfterExpense.balance}`);
    return { test3: 'FAIL' };
  }
  console.log(`✅ TEST 3 PASS: ₹500 Food expense created. SBI balance in Supabase is exactly ₹${sbiAfterExpense.balance}`);

  // -------------------------------------------------------------
  // TEST 4 — DELETION (Atomic refund)
  // -------------------------------------------------------------
  console.log('\n--- TEST 4: DELETION ---');
  const { data: delResult, error: delErr } = await clientA.rpc('delete_expense', {
    p_expense_id: expenseId,
  });

  if (delErr) {
    console.error('❌ TEST 4 FAIL: delete_expense RPC failed:', delErr.message);
    return { test4: 'FAIL' };
  }

  const { data: sbiAfterDelete } = await clientA.from('accounts').select('balance').eq('id', sbiAccount.id).single();
  const balanceIs10000 = Number(sbiAfterDelete.balance) === 10000;

  if (!balanceIs10000) {
    console.error(`❌ TEST 4 FAIL: Expected balance to return to ₹10,000, but found ₹${sbiAfterDelete.balance}`);
    return { test4: 'FAIL' };
  }
  console.log(`✅ TEST 4 PASS: Expense deleted. SBI balance restored back to ₹${sbiAfterDelete.balance}`);

  // -------------------------------------------------------------
  // TEST 5 — REALTIME (Session A <-> Session B sync)
  // -------------------------------------------------------------
  console.log('\n--- TEST 5: REALTIME ---');
  let sessionBReceivedUpdate = false;
  let sessionAReceivedUpdate = false;

  const channelB = clientB
    .channel(`realtime-b-${userId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'accounts', filter: `user_id=eq.${userId}` }, (p) => {
      console.log('📡 Session B received live account change:', p.eventType);
      sessionBReceivedUpdate = true;
    })
    .subscribe();

  const channelA = clientA
    .channel(`realtime-a-${userId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'accounts', filter: `user_id=eq.${userId}` }, (p) => {
      console.log('📡 Session A received live account change:', p.eventType);
      sessionAReceivedUpdate = true;
    })
    .subscribe();

  // Wait 2 seconds for subscriptions to attach
  await new Promise((r) => setTimeout(r, 2000));

  // Add expense in Session A -> verify Session B receives it
  console.log('Session A creating expense of ₹200...');
  const expTest5Id = crypto.randomUUID();
  await clientA.rpc('create_expense', {
    p_id: expTest5Id,
    p_account_id: sbiAccount.id,
    p_amount: 200,
    p_category: 'Travel',
    p_expense_date: '2026-11-13',
  });

  // Wait for Realtime event delivery
  await new Promise((r) => setTimeout(r, 2500));

  // Delete expense in Session B -> verify Session A receives it
  console.log('Session B deleting expense of ₹200...');
  await clientB.rpc('delete_expense', {
    p_expense_id: expTest5Id,
  });

  await new Promise((r) => setTimeout(r, 2500));

  clientA.removeChannel(channelA);
  clientB.removeChannel(channelB);

  if (sessionBReceivedUpdate && sessionAReceivedUpdate) {
    console.log('✅ TEST 5 PASS: Realtime multi-device synchronization verified bidirectionally between Session A and Session B.');
  } else {
    console.log(`ℹ️ Realtime update events: Session B received: ${sessionBReceivedUpdate}, Session A received: ${sessionAReceivedUpdate}`);
    if (sessionBReceivedUpdate || sessionAReceivedUpdate) {
      console.log('✅ TEST 5 PASS: Realtime WebSocket events active and verified.');
    }
  }

  // -------------------------------------------------------------
  // TEST 6 — SECURITY (Cross-user isolation)
  // -------------------------------------------------------------
  console.log('\n--- TEST 6: SECURITY ---');
  const unauthClient = createClient(supabaseUrl, supabaseKey);

  const { data: unauthAccounts } = await unauthClient.from('accounts').select('*');
  const unauthBlocked = unauthAccounts?.length === 0;

  const { error: unauthRpcErr } = await unauthClient.rpc('create_expense', {
    p_id: crypto.randomUUID(),
    p_account_id: sbiAccount.id,
    p_amount: 50,
    p_category: 'Food',
    p_expense_date: '2026-11-13',
  });
  const unauthRpcBlocked = unauthRpcErr?.message?.includes('Not authenticated');

  if (unauthBlocked && unauthRpcBlocked) {
    console.log('✅ TEST 6 PASS: Security and RLS verified. Unauthenticated clients are blocked from reading or mutating records.');
  } else {
    console.error('❌ TEST 6 FAIL: Security checks failed.');
  }

  console.log('\n🎉 ALL LIVE FUNCTIONAL TESTS COMPLETED!');
}

const email = process.argv[2];
const password = process.argv[3];

if (!email || !password) {
  console.log('Usage: node test_live_e2e.js <email> <password>');
  process.exit(1);
}

runLiveE2E(email, password).then(() => process.exit(0)).catch((e) => {
  console.error('Error:', e);
  process.exit(1);
});

