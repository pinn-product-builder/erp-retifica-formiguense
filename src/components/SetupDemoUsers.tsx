import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Users, CheckCircle, AlertCircle } from 'lucide-react';

export function SetupDemoUsers() {
  const [isLoading, setIsLoading] = useState(false);
  const [setupStatus, setSetupStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSetupUsers = async () => {
    setIsLoading(true);
    setSetupStatus('idle');
    
    try {
      console.log('🚀 Calling setup-demo-users function...');
      
      const { data, error } = await supabase.functions.invoke('setup-demo-users');
      
      if (error) {
        console.error('❌ Error calling function:', error);
        toast.error('Erro ao configurar usuários de demonstração: ' + error.message);
        setSetupStatus('error');
        return;
      }

      console.log('✅ Function response:', data);
      
      if (data?.success) {
        toast.success('Usuários de demonstração criados com sucesso!');
        setSetupStatus('success');
        console.log('Results:', data.results);
        
        // Show detailed results
        if (data.results) {
          const successCount = data.results.filter((r: any) => 
            r.status === 'created' || r.status === 'already_exists_profile_updated'
          ).length;
          toast.info(`${successCount} usuários configurados com sucesso`);
        }
      } else {
        toast.error('Erro ao criar usuários: ' + (data?.error || 'Erro desconhecido'));
        setSetupStatus('error');
      }
    } catch (error) {
      console.error('💥 Error:', error);
      toast.error('Erro ao configurar usuários de demonstração');
      setSetupStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mt-4 p-4 bg-muted/50 rounded-lg border">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-semibold">Configurar Dados de Demonstração</h4>
          {setupStatus === 'success' && <CheckCircle className="h-4 w-4 text-green-500" />}
          {setupStatus === 'error' && <AlertCircle className="h-4 w-4 text-red-500" />}
        </div>
        <Button 
          onClick={handleSetupUsers}
          disabled={isLoading}
          size="sm"
          variant="outline"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Users className="h-4 w-4" />
          )}
          {isLoading ? 'Criando...' : 'Criar Usuários'}
        </Button>
      </div>
      
      <div className="text-xs text-muted-foreground space-y-1">
        <p>Usuários que serão criados:</p>
        <div className="grid grid-cols-2 gap-2 mt-2">
          <div className="bg-background p-2 rounded border">
            <div className="font-medium">Admin</div>
            <div className="text-xs">admin@retificas.com</div>
            <div className="text-xs font-mono">admin123</div>
          </div>
          <div className="bg-background p-2 rounded border">
            <div className="font-medium">Funcionário</div>
            <div className="text-xs">funcionario@retificas.com</div>
            <div className="text-xs font-mono">func123</div>
          </div>
        </div>
      </div>
      
      {setupStatus === 'success' && (
        <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded text-xs text-green-700">
          ✅ Usuários configurados! Agora você pode fazer login com as credenciais acima.
        </div>
      )}
    </div>
  );
}