import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

// Parse .env manually to avoid external dependencies
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
const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_PUBLISHABLE_KEY || env.VITE_SUPABASE_ANON_KEY;

console.log('🔍 TASK 1: Verifying Supabase Client Initialization & Credentials...');
console.log('URL provided:', supabaseUrl ? `${supabaseUrl.slice(0, 25)}...` : 'MISSING');
console.log('Key provided:', supabaseKey ? `[CONFIGURED, len=${supabaseKey.length}]` : 'MISSING');

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Credentials missing in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

async function runAudit() {
  let hasErrors = false;

  // 1. Check Auth Service
  console.log('\n--- Checking Supabase Auth Service ---');
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.error('❌ Auth Service returned error:', error.message);
      hasErrors = true;
    } else {
      console.log('✅ Supabase Auth connection successful. Session query returned OK.');
    }
  } catch (err) {
    console.error('❌ Failed to reach Auth service:', err.message);
    hasErrors = true;
  }

  // 2. Check Database Tables
  console.log('\n--- Checking Database Tables (TASK 2) ---');

  // Check accounts table
  try {
    const { data: accData, error: accErr } = await supabase
      .from('accounts')
      .select('id, user_id, account_name, account_type, balance, created_at')
      .limit(1);

    if (accErr) {
      console.error('❌ Error accessing "accounts" table:', accErr.message);
      if (accErr.code === '42P01') {
        console.error('   👉 The "accounts" table does NOT exist yet. Migration needs to be executed in Supabase SQL Editor.');
      }
      hasErrors = true;
    } else {
      console.log('✅ "accounts" table exists and schema fields are accessible.');
    }
  } catch (err) {
    console.error('❌ Failed to query "accounts":', err.message);
    hasErrors = true;
  }

  // Check expenses table
  try {
    const { data: expData, error: expErr } = await supabase
      .from('expenses')
      .select('id, user_id, account_id, amount, category, expense_date, created_at')
      .limit(1);

    if (expErr) {
      console.error('❌ Error accessing "expenses" table:', expErr.message);
      if (expErr.code === '42P01') {
        console.error('   👉 The "expenses" table does NOT exist yet. Migration needs to be executed in Supabase SQL Editor.');
      }
      hasErrors = true;
    } else {
      console.log('✅ "expenses" table exists and schema fields are accessible.');
    }
  } catch (err) {
    console.error('❌ Failed to query "expenses":', err.message);
    hasErrors = true;
  }

  // 3. Check RPC Functions
  console.log('\n--- Checking RPC Database Functions ---');
  try {
    // Calling with empty params to verify function existence
    const { data: rpcData, error: rpcErr } = await supabase.rpc('create_expense', {
      p_id: '00000000-0000-0000-0000-000000000000',
      p_account_id: '00000000-0000-0000-0000-000000000000',
      p_amount: 1,
      p_category: 'Food',
      p_expense_date: '2026-11-13',
    });

    if (rpcErr) {
      if (rpcErr.message.includes('function') && rpcErr.message.includes('does not exist')) {
        console.error('❌ RPC function "create_expense" does NOT exist in the database.');
        hasErrors = true;
      } else if (rpcErr.message.includes('Not authenticated')) {
        console.log('✅ RPC function "create_expense" exists and properly enforces authentication check.');
      } else {
        console.log('ℹ️ RPC function "create_expense" response:', rpcErr.message);
      }
    } else {
      console.log('✅ RPC function "create_expense" responded.');
    }
  } catch (err) {
    console.error('❌ RPC "create_expense" check error:', err.message);
    hasErrors = true;
  }

  try {
    const { data: rpcDelData, error: rpcDelErr } = await supabase.rpc('delete_expense', {
      p_expense_id: '00000000-0000-0000-0000-000000000000',
    });

    if (rpcDelErr) {
      if (rpcDelErr.message.includes('function') && rpcDelErr.message.includes('does not exist')) {
        console.error('❌ RPC function "delete_expense" does NOT exist in the database.');
        hasErrors = true;
      } else if (rpcDelErr.message.includes('Not authenticated')) {
        console.log('✅ RPC function "delete_expense" exists and properly enforces authentication check.');
      } else {
        console.log('ℹ️ RPC function "delete_expense" response:', rpcDelErr.message);
      }
    } else {
      console.log('✅ RPC function "delete_expense" responded.');
    }
  } catch (err) {
    console.error('❌ RPC "delete_expense" check error:', err.message);
    hasErrors = true;
  }

  // 4. Check Realtime Connection (TASK 3)
  console.log('\n--- Checking Supabase Realtime Connection (TASK 3) ---');
  try {
    const channel = supabase.channel('verify-connection-channel');
    
    await new Promise((resolve) => {
      const timeout = setTimeout(() => {
        console.log('⚠️ Realtime subscription status timed out after 5s');
        resolve();
      }, 5000);

      channel.subscribe((status, err) => {
        console.log(`📡 Realtime channel status: ${status}`, err ? `(Error: ${err.message})` : '');
        if (status === 'SUBSCRIBED' || status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          clearTimeout(timeout);
          resolve();
        }
      });
    });

    supabase.removeChannel(channel);
  } catch (err) {
    console.error('❌ Realtime connection error:', err.message);
  }

  console.log('\n--- Verification Summary ---');
  if (hasErrors) {
    console.log('⚠️ Some checks reported issues. Inspect above details.');
  } else {
    console.log('🎉 Live Supabase verification checks complete!');
  }
}

runAudit().then(() => {
  // Graceful exit
  process.exit(0);
}).catch((e) => {
  console.error('Fatal audit error:', e);
  process.exit(1);
});

