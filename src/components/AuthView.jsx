import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useFinance } from '../context/FinanceContext';
import {
  WalletCards,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import SwitchMode from './switch-mode';

export default function AuthView() {
  const { signIn, resetPassword, authError, setAuthError, isConfigured } = useAuth();
  const { theme, setTheme } = useFinance();

  const [mode, setMode] = useState('login'); // 'login' | 'forgot'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [localMessage, setLocalMessage] = useState(null);

  const errorRef = useRef(null);

  // Automatically ensure error is visible when one occurs
  useEffect(() => {
    if (authError && errorRef.current) {
      try {
        errorRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      } catch {
        // Fallback for browsers without smooth scroll support
      }
    }
  }, [authError]);

  const handleSubmit = async (e) => {
    if (e) {
      if (typeof e.preventDefault === 'function') e.preventDefault();
      if (typeof e.stopPropagation === 'function') e.stopPropagation();
    }

    // Dismiss mobile soft keyboard so full UI and feedback are immediately visible
    if (document.activeElement && typeof document.activeElement.blur === 'function') {
      document.activeElement.blur();
    }

    // Prevent duplicate submissions while in progress
    if (submitting) return;

    setAuthError(null);
    setLocalMessage(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setAuthError('Please enter your email address.');
      return;
    }

    if (mode === 'forgot') {
      setSubmitting(true);
      try {
        await resetPassword(cleanEmail);
        setLocalMessage({
          type: 'success',
          text: `A password reset link has been sent to ${cleanEmail}. Please check your inbox.`,
        });
      } catch (err) {
        console.error('Password reset error:', err);
        setAuthError(err.message || 'Failed to send password reset email.');
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
      await signIn(cleanEmail, password);
    } catch (err) {
      console.error('Sign in error:', err);
      // Guarantee error state is visible to user
      setAuthError(err.message || 'Authentication failed. Please check your credentials and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-slate-950 transition-colors relative">
      
      {/* Top Bar Theme Switcher */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20">
        <SwitchMode height={32} />
      </div>

      <div className="w-full max-w-md my-auto">
        
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
          
          {/* Missing Backend Configuration Warning Banner */}
          {!isConfigured && (
            <div className="mb-5 p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 text-amber-800 dark:text-amber-200 text-xs flex items-start space-x-2.5 animate-fade-in">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
              <div>
                <p className="font-semibold text-slate-900 dark:text-white">Hosting Configuration Notice</p>
                <p className="mt-1 text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
                  Supabase environment variables are missing in this deployment. Please add <code className="bg-amber-100 dark:bg-amber-900/60 px-1 py-0.5 rounded font-mono font-semibold">VITE_SUPABASE_URL</code> and <code className="bg-amber-100 dark:bg-amber-900/60 px-1 py-0.5 rounded font-mono font-semibold">VITE_SUPABASE_PUBLISHABLE_KEY</code> in your Vercel Project Settings &gt; Environment Variables.
                </p>
              </div>
            </div>
          )}

          {/* Card Subheader (Login / Forgot Password) */}
          {mode === 'forgot' ? (
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  Reset Password
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
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
                className="inline-flex items-center text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                Back to Sign In
              </button>
            </div>
          ) : (
            <div className="mb-6 text-center">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Sign In
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Enter your email and password to access your dashboard
              </p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            
            {/* Email Field */}
            <div>
              <label htmlFor="auth-email" className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="auth-email"
                  name="email"
                  type="email"
                  required
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck="false"
                  inputMode="email"
                  enterKeyHint={mode === 'forgot' ? 'go' : 'next'}
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white dark:focus:bg-slate-900 transition-all"
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password Field (only for Login) */}
            {mode === 'login' && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="auth-password" className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot');
                      setAuthError(null);
                      setLocalMessage(null);
                    }}
                    className="text-xs font-medium text-brand-600 hover:text-brand-500 dark:text-brand-400 hover:underline cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="auth-password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck="false"
                    enterKeyHint="go"
                    placeholder="At least 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-11 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white dark:focus:bg-slate-900 transition-all"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={(e) => {
                      e.preventDefault();
                      setShowPassword(!showPassword);
                    }}
                    className="absolute inset-y-0 right-0 pr-3.5 pl-2 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer z-10"
                    title={showPassword ? 'Hide password' : 'Show password'}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {/* Error Banner (placed directly adjacent to action button so it is never off-screen on mobile) */}
            {authError && (
              <div
                ref={errorRef}
                className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 text-xs flex items-start space-x-2.5 animate-fade-in"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span className="font-medium">{authError}</span>
              </div>
            )}

            {/* Success / Info Message */}
            {localMessage && (
              <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-xs flex items-start space-x-2.5 animate-fade-in">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-500" />
                <span>{localMessage.text}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              id="auth-submit-btn"
              type="submit"
              disabled={submitting}
              style={{ touchAction: 'manipulation' }}
              className="w-full mt-3 flex items-center justify-center space-x-2 min-h-[48px] py-3 px-4 rounded-xl text-sm font-semibold text-white bg-brand-600 hover:bg-brand-500 active:bg-brand-700 transition-colors shadow-subtle hover:shadow-glow disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer select-none"
            >
              {submitting ? (
                <div className="flex items-center space-x-2">
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>
                    {mode === 'login'
                      ? 'Signing In...'
                      : 'Sending Link...'}
                  </span>
                </div>
              ) : (
                <>
                  <span>
                    {mode === 'login'
                      ? 'Sign In to FridayTrack'
                      : 'Send Reset Link'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
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
