import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Lock, AlertTriangle } from 'lucide-react';
import { usePasswordChange } from '@/hooks/usePasswordChange';
import { toast } from '@/hooks/use-toast';

interface ForcePasswordChangeProps {
  open: boolean;
}

export const ForcePasswordChange: React.FC<ForcePasswordChangeProps> = ({ open }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  
  const { updatePassword } = usePasswordChange();

  const validatePassword = (password: string): string[] => {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('A senha deve ter pelo menos 8 caracteres');
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('A senha deve conter pelo menos uma letra maiúscula');
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('A senha deve conter pelo menos uma letra minúscula');
    }
    
    if (!/[0-9]/.test(password)) {
      errors.push('A senha deve conter pelo menos um número');
    }
    
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('A senha deve conter pelo menos um caractere especial');
    }
    
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar senhas
    const passwordErrors = validatePassword(newPassword);
    
    if (passwordErrors.length > 0) {
      setErrors(passwordErrors);
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setErrors(['As senhas não coincidem']);
      return;
    }
    
    if (newPassword === 'RetificaTemp2024!') {
      setErrors(['A nova senha não pode ser igual à senha temporária']);
      return;
    }
    
    setErrors([]);
    setLoading(true);
    
    try {
      const { error } = await updatePassword(newPassword);
      
      if (error) {
        throw error;
      }
      
      toast({
        title: 'Senha atualizada com sucesso',
        description: 'Sua senha foi alterada. Você pode continuar usando o sistema.',
      });
      
      // Limpar campos
      setNewPassword('');
      setConfirmPassword('');
      
    } catch (error: any) {
      console.error('Error updating password:', error);
      setErrors([error.message || 'Erro ao atualizar senha']);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}} modal>
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Lock className="h-4 w-4 text-amber-600" />
            </div>
            <div>
              <DialogTitle>Alterar Senha Obrigatória</DialogTitle>
              <DialogDescription className="mt-1">
                Você está usando uma senha temporária. Por segurança, é necessário criar uma nova senha.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {errors.length > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <ul className="list-disc list-inside space-y-1">
                  {errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="new-password">Nova Senha</Label>
            <Input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Digite sua nova senha"
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirmar Nova Senha</Label>
            <Input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirme sua nova senha"
              required
              disabled={loading}
            />
          </div>

          <div className="bg-muted p-3 rounded-lg">
            <h4 className="text-sm font-medium mb-2">Requisitos da senha:</h4>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Pelo menos 8 caracteres</li>
              <li>• Uma letra maiúscula</li>
              <li>• Uma letra minúscula</li>
              <li>• Um número</li>
              <li>• Um caractere especial (!@#$%^&*)</li>
            </ul>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={loading || !newPassword || !confirmPassword}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Atualizando...
                </>
              ) : (
                'Atualizar Senha'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
