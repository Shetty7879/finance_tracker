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
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('Error fetching session:', error);
      }
      setSession(session);
      setUser(session?.user ?? null);
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
    if (!supabase) throw new Error('Supabase client is not configured.');

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setAuthError(error.message);
      throw error;
    }

    return data;
  };

  // Sign In with email & password
  const signIn = async (email, password) => {
    setAuthError(null);
    if (!supabase) throw new Error('Supabase client is not configured.');

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setAuthError(error.message);
      throw error;
    }

    return data;
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
    if (!supabase) throw new Error('Supabase client is not configured.');

    const { data, error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
    });

    if (error) {
      setAuthError(error.message);
      throw error;
    }

    return data;
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

