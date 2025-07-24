import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Users } from 'lucide-react';

export function SetupDemoUsers() {
  const [isLoading, setIsLoading] = useState(false);

  const handleSetupUsers = async () => {
    setIsLoading(true);
    try {
      console.log('Calling setup-demo-users function...');
      
      const { data, error } = await supabase.functions.invoke('setup-demo-users');
      
      if (error) {
        console.error('Error calling function:', error);
        toast.error('Erro ao configurar usuários de demonstração: ' + error.message);
        return;
      }

      console.log('Function response:', data);
      
      if (data.success) {
        toast.success('Usuários de demonstração criados com sucesso!');
        console.log('Results:', data.results);
      } else {
        toast.error('Erro ao criar usuários: ' + (data.error || 'Erro desconhecido'));
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Erro ao configurar usuários de demonstração');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mt-4 p-4 bg-muted/50 rounded-lg border">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-semibold mb-1">Configurar Dados de Demonstração</h4>
          <p className="text-xs text-muted-foreground">
            Criar usuários admin@retificas.com e funcionario@retificas.com
          </p>
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
    </div>
  );
}