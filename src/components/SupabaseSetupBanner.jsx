import React, { useState } from 'react';
import { saveCustomSupabaseConfig } from '../lib/supabase';
import { Database, Key, Copy, Check, ExternalLink, ShieldCheck } from 'lucide-react';

export default function SupabaseSetupBanner() {
  const [url, setUrl] = useState('');
  const [key, setKey] = useState('');
  const [copiedSql, setCopiedSql] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    if (url && key) {
      saveCustomSupabaseConfig(url, key);
    }
  };

  const handleCopySql = () => {
    fetch('/supabase_schema.sql')
      .then((res) => res.text())
      .then((sql) => {
        navigator.clipboard.writeText(sql);
        setCopiedSql(true);
        setTimeout(() => setCopiedSql(false), 2500);
      })
      .catch(() => {
        setCopiedSql(true);
        setTimeout(() => setCopiedSql(false), 2500);
      });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950 transition-colors">
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 animate-fade-in">
        
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center border border-brand-500/20">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Connect Supabase Backend
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              FridayTrack Step 2 requires a Supabase cloud project for auth, database & realtime sync
            </p>
          </div>
        </div>

        <div className="space-y-4 my-6">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-300 space-y-2">
            <p className="font-semibold text-slate-900 dark:text-white flex items-center space-x-1.5">
              <ShieldCheck className="w-4 h-4 text-brand-500" />
              <span>Quick 2-Minute Setup:</span>
            </p>
            <ol className="list-decimal pl-5 space-y-1 text-slate-500 dark:text-slate-400">
              <li>Open your project at <strong>supabase.com</strong> (or create a free project).</li>
              <li>Go to <strong>SQL Editor</strong> & execute the provided SQL migration (includes tables, RLS & atomic RPC functions).</li>
              <li>Copy your <strong>Project URL</strong> and <strong>Anon / Publishable Key</strong> from Project Settings &gt; API.</li>
              <li>Add them to your <code className="px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200">.env</code> file or paste below.</li>
            </ol>
          </div>

          <form onSubmit={handleSave} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                Supabase Project URL (VITE_SUPABASE_URL)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Database className="w-4 h-4" />
                </div>
                <input
                  type="url"
                  required
                  placeholder="https://xyzcompany.supabase.co"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                Supabase Publishable / Anon Key (VITE_SUPABASE_PUBLISHABLE_KEY)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Key className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs font-mono rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            <div className="flex items-center space-x-3 pt-2">
              <button
                type="submit"
                className="flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-brand-600 hover:bg-brand-500 transition-all shadow-subtle hover:shadow-glow text-center"
              >
                Connect & Launch FridayTrack
              </button>
            </div>
          </form>
        </div>

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>SQL Schema ready in <code className="text-slate-600 dark:text-slate-300">supabase_schema.sql</code></span>
          <a
            href="https://supabase.com/dashboard"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-1 text-brand-600 dark:text-brand-400 hover:underline"
          >
            <span>Supabase Dashboard</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

      </div>
    </div>
  );
}

