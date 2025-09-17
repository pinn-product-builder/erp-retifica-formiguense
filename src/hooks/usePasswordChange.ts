import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

export const usePasswordChange = () => {
  const { user } = useAuth();
  const [needsPasswordChange, setNeedsPasswordChange] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkPasswordChangeNeeded = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      // Verificar se o usuário tem a flag needs_password_change nos metadados
      const needsChange = user.user_metadata?.needs_password_change === true;
      setNeedsPasswordChange(needsChange);
      setLoading(false);
    };

    checkPasswordChangeNeeded();
  }, [user]);

  const updatePassword = async (newPassword: string): Promise<{ error: any }> => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
        data: {
          ...user?.user_metadata,
          needs_password_change: false // Remove a flag após alterar a senha
        }
      });

      if (!error) {
        setNeedsPasswordChange(false);
      }

      return { error };
    } catch (error) {
      return { error };
    }
  };

  return {
    needsPasswordChange,
    loading,
    updatePassword
  };
};
