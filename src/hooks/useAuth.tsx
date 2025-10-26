// @ts-nocheck
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: unknown }>;
  signUp: (email: string, password: string, name?: string, utmData?: unknown) => Promise<{ error: unknown }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: unknown }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Simple audit logging without organization dependency
  const logAuthAction = async (action: string, metadata?: Record<string, unknown>) => {
    if (!user) return;
    
    try {
      const userAgent = navigator.userAgent;
      
      await supabase.from('fiscal_audit_log').insert([{
        table_name: 'auth_actions',
        operation: 'INSERT',
        record_id: crypto.randomUUID(),
        new_values: {
          action,
          metadata,
          timestamp: new Date().toISOString()
        },
        user_id: user.id,
        user_agent: userAgent,
        timestamp: new Date().toISOString()
      }] as unknown as unknown);
    } catch (error) {
      // Silently handle logging errors
    }
  };

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      toast.error('Erro ao fazer login: ' + error.message);
      setTimeout(() => {
        logAuthAction('sign_in_failed', { email, error: error.message });
      }, 0);
    } else {
      toast.success('Login realizado com sucesso!');
      setTimeout(() => {
        logAuthAction('sign_in_success', { email });
      }, 0);
    }
    
    return { error };
  };

  const signUp = async (email: string, password: string, name?: string, utmData?: Record<string, string>) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          name: name,
          utm_source: utmData?.utm_source,
          utm_medium: utmData?.utm_medium,
          utm_campaign: utmData?.utm_campaign
        }
      }
    });
    
    if (error) {
      toast.error('Erro ao criar conta: ' + error.message);
      setTimeout(() => {
        logAuthAction('sign_up_failed', { email, name, error: error.message });
      }, 0);
    } else {
      toast.success('Conta criada com sucesso! Verifique seu email.');
      setTimeout(() => {
        logAuthAction('sign_up_success', { email, name });
      }, 0);
    }
    
    return { error };
  };

  const resetPassword = async (email: string) => {
    const redirectUrl = `${window.location.origin}/reset-password`;
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl
    });
    
    if (error) {
      toast.error('Erro ao enviar email de recuperação: ' + error.message);
      setTimeout(() => {
        logAuthAction('password_reset_failed', { email, error: error.message });
      }, 0);
    } else {
      toast.success('Email de recuperação enviado! Verifique sua caixa de entrada.');
      setTimeout(() => {
        logAuthAction('password_reset_success', { email });
      }, 0);
    }
    
    return { error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error('Erro ao sair: ' + error.message);
    } else {
      toast.success('Logout realizado com sucesso!');
      setTimeout(() => {
        logAuthAction('sign_out', {});
      }, 0);
    }
  };

  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}