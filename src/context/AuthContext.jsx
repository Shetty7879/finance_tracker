import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    if (!isSupabaseConfigured() || !supabase) {
      setLoading(false);
      return;
    }

    // 1. Get initial active session
    supabase.auth
      .getSession()
      .then(({ data: { session }, error }) => {
        if (error) {
          console.error('Error fetching session:', error);
        }
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Session retrieval error:', err);
        setLoading(false);
      });

    // 2. Listen to auth state changes (login, logout, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // Sign Up with email & password
  const signUp = async (email, password) => {
    setAuthError(null);
    if (!supabase) {
      const msg = 'Supabase client is not configured. Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY are set.';
      setAuthError(msg);
      throw new Error(msg);
    }

    const cleanEmail = email.trim().toLowerCase();

    try {
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
      });

      if (error) {
        let userMessage = error.message;
        if (error.message.includes('User already registered')) {
          userMessage = 'An account with this email already exists. Please sign in instead.';
        }
        setAuthError(userMessage);
        const enhancedError = new Error(userMessage);
        enhancedError.originalError = error;
        throw enhancedError;
      }

      setAuthError(null);
      return data;
    } catch (err) {
      const msg = err.message?.includes('Failed to fetch')
        ? 'Network error: Unable to connect to Supabase. Please check your internet connection.'
        : err.message || 'Account registration failed. Please try again.';
      setAuthError(msg);
      throw err;
    }
  };

  // Sign In with email & password
  const signIn = async (email, password) => {
    setAuthError(null);
    if (!supabase) {
      const msg = 'Supabase client is not configured. Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY are set.';
      setAuthError(msg);
      throw new Error(msg);
    }

    const cleanEmail = email.trim().toLowerCase();

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (error) {
        let userMessage = error.message;
        if (error.message.includes('Invalid login credentials')) {
          userMessage = 'Incorrect email or password. Please check your credentials and try again.';
        } else if (error.message.includes('Email not confirmed')) {
          userMessage = 'Please verify your email address before signing in.';
        }
        setAuthError(userMessage);
        const enhancedError = new Error(userMessage);
        enhancedError.originalError = error;
        throw enhancedError;
      }

      setAuthError(null);
      return data;
    } catch (err) {
      const msg = err.message?.includes('Failed to fetch')
        ? 'Network error: Unable to connect to Supabase. Please check your internet connection.'
        : err.message || 'Authentication failed. Please try again.';
      setAuthError(msg);
      throw err;
    }
  };

  // Sign Out
  // Immediately resets local auth state so authenticated UI does not remain visible
  const signOut = async () => {
    setAuthError(null);

    // 1. Instantly reset local state
    setUser(null);
    setSession(null);

    // 2. Terminate session on Supabase server
    try {
      if (supabase) {
        const { error } = await supabase.auth.signOut();
        if (error) {
          console.error('Supabase signOut error:', error);
          setAuthError(error.message);
          throw error;
        }
      }
    } catch (err) {
      // Ensure user and session remain null even if network request fails
      setUser(null);
      setSession(null);
      setAuthError(err.message || 'Failed to sign out completely from server.');
      throw err;
    }
  };

  // Password Reset Request
  const resetPassword = async (email) => {
    setAuthError(null);
    if (!supabase) {
      const msg = 'Supabase client is not configured. Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY are set.';
      setAuthError(msg);
      throw new Error(msg);
    }

    const cleanEmail = email.trim().toLowerCase();

    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
      });

      if (error) {
        setAuthError(error.message);
        throw error;
      }

      setAuthError(null);
      return data;
    } catch (err) {
      const msg = err.message?.includes('Failed to fetch')
        ? 'Network error: Unable to connect to Supabase. Please check your internet connection.'
        : err.message || 'Failed to send reset link. Please try again.';
      setAuthError(msg);
      throw err;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        authError,
        setAuthError,
        signUp,
        signIn,
        signOut,
        resetPassword,
        isConfigured: isSupabaseConfigured(),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

