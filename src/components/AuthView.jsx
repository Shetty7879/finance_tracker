import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useFinance } from '../context/FinanceContext';
import { WalletCards, Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle2, ArrowRight, Sun, Moon, Monitor, ArrowLeft } from 'lucide-react';

export default function AuthView() {
  const { signIn, signUp, resetPassword, authError, setAuthError } = useAuth();
  const { theme, setTheme } = useFinance();
  
  const [mode, setMode] = useState('login'); // 'login' | 'signup' | 'forgot'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [localMessage, setLocalMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAuthError(null);
    setLocalMessage(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setAuthError('Please enter your email address.');
      return;
    }

    if (mode === 'forgot') {
      setSubmitting(true);
      try {
        await resetPassword(trimmedEmail);
        setLocalMessage({
          type: 'success',
          text: `A password reset link has been sent to ${trimmedEmail}. Please check your inbox.`,
        });
      } catch (err) {
        console.error('Password reset error:', err);
      } finally {
        setSubmitting(false);
      }
      return;
    }

    if (!password) {
      setAuthError('Please enter your password.');
      return;
    }

    if (password.length < 6) {
      setAuthError('Password must be at least 6 characters long.');
      return;
    }

    setSubmitting(true);
    try {
      if (mode === 'signup') {
        const data = await signUp(trimmedEmail, password);
        if (data?.user && !data.session) {
          setLocalMessage({
            type: 'info',
            text: 'Account created! Please check your email to confirm your account, then sign in.',
          });
        }
      } else {
        await signIn(trimmedEmail, password);
      }
    } catch (err) {
      console.error('Auth error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-slate-950 transition-colors relative">
      
      {/* Top Bar Theme Switcher */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
        <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 shadow-inner">
          <button
            type="button"
            onClick={() => setTheme('light')}
            title="Light mode"
            className={`p-1.5 rounded-lg transition-all ${
              theme === 'light'
                ? 'bg-white dark:bg-slate-700 text-amber-500 shadow-sm'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Sun className="w-3.5 h-3.5" />
            <span className="sr-only">Light</span>
          </button>
          <button
            type="button"
            onClick={() => setTheme('dark')}
            title="Dark mode"
            className={`p-1.5 rounded-lg transition-all ${
              theme === 'dark'
                ? 'bg-slate-700 text-sky-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Moon className="w-3.5 h-3.5" />
            <span className="sr-only">Dark</span>
          </button>
          <button
            type="button"
            onClick={() => setTheme('system')}
            title="System theme"
            className={`p-1.5 rounded-lg transition-all ${
              theme === 'system'
                ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span className="sr-only">System</span>
          </button>
        </div>
      </div>

      <div className="w-full max-w-md">
        
        {/* Brand Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-brand-600 to-emerald-400 flex items-center justify-center text-white shadow-glow mb-4">
            <WalletCards className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Friday<span className="text-brand-500">Track</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Personal expense tracker with multi-bank account management
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-premium p-6 sm:p-8 animate-fade-in">
          
          {/* Mode Switcher (Login / Signup) */}
          {mode !== 'forgot' ? (
            <div className="grid grid-cols-2 p-1 mb-6 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setAuthError(null);
                  setLocalMessage(null);
                }}
                className={`py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all ${
                  mode === 'login'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setAuthError(null);
                  setLocalMessage(null);
                }}
                className={`py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all ${
                  mode === 'signup'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                Create Account
              </button>
            </div>
          ) : (
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  Reset Password
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Enter your email to receive a password reset link
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setAuthError(null);
                  setLocalMessage(null);
                }}
                className="inline-flex items-center text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline"
              >
                <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                Back to Sign In
              </button>
            </div>
          )}

          {/* Error Banner */}
          {authError && (
            <div className="mb-4 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 text-xs flex items-start space-x-2.5 animate-fade-in">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{authError}</span>
            </div>
          )}

          {/* Success / Info Message */}
          {localMessage && (
            <div className="mb-4 p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-xs flex items-start space-x-2.5 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-500" />
              <span>{localMessage.text}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Email Field */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white dark:focus:bg-slate-900 transition-all"
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password Field (only for Login and Signup) */}
            {mode !== 'forgot' && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    Password
                  </label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => {
                        setMode('forgot');
                        setAuthError(null);
                        setLocalMessage(null);
                      }}
                      className="text-xs font-medium text-brand-600 hover:text-brand-500 dark:text-brand-400 hover:underline"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="At least 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white dark:focus:bg-slate-900 transition-all"
                    autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-2 flex items-center justify-center space-x-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-brand-600 hover:bg-brand-500 active:scale-[0.98] transition-all shadow-subtle hover:shadow-glow disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <span>
                {submitting
                  ? 'Please wait...'
                  : mode === 'login'
                  ? 'Sign In to FridayTrack'
                  : mode === 'signup'
                  ? 'Create Free Account'
                  : 'Send Reset Link'}
              </span>
              {!submitting && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          {/* Privacy & RLS note */}
          <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 text-center">
            <p className="text-[11px] text-slate-400 dark:text-slate-500">
              🔒 Protected with Supabase Row Level Security (RLS). Each user can access only their own accounts and expenses.
            </p>
          </div>

        </div>

      </div>
    </div>
  );
}
