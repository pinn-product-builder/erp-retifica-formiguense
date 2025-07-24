import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Users, CheckCircle, AlertCircle, Loader2, Database, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface SetupResult {
  email: string;
  status: string;
  error?: string;
  userId?: string;
  profile?: any;
}

export function SetupDemoUsers() {
  const [isLoading, setIsLoading] = useState(false);
  const [setupStatus, setSetupStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [setupResults, setSetupResults] = useState<SetupResult[]>([]);
  const [showLogs, setShowLogs] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [databaseStatus, setDatabaseStatus] = useState<{
    users: number;
    profiles: number;
    loading: boolean;
  }>({ users: 0, profiles: 0, loading: true });

  // Check database status on mount
  useEffect(() => {
    checkDatabaseStatus();
  }, []);

  const checkDatabaseStatus = async () => {
    setDatabaseStatus(prev => ({ ...prev, loading: true }));
    
    try {
      // Check profiles count (we can't directly access auth.users from client)
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*');
      
      if (profilesError) {
        console.error('Error checking profiles:', profilesError);
        setDatabaseStatus({ users: 0, profiles: 0, loading: false });
        return;
      }

      setDatabaseStatus({
        users: profiles?.length || 0, // Approximation since we can't access auth.users directly
        profiles: profiles?.length || 0,
        loading: false
      });
    } catch (error) {
      console.error('Error checking database status:', error);
      setDatabaseStatus({ users: 0, profiles: 0, loading: false });
    }
  };

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  const handleSetupUsers = async () => {
    setIsLoading(true);
    setSetupStatus('idle');
    setSetupResults([]);
    setLogs([]);
    
    addLog('🚀 Iniciando criação de usuários de demonstração...');
    
    try {
      addLog('📡 Chamando função setup-demo-users...');
      
      const { data, error } = await supabase.functions.invoke('setup-demo-users', {
        body: {}
      });
      
      addLog(`📊 Resposta da função: ${JSON.stringify({ data, error }, null, 2)}`);
      
      if (error) {
        addLog(`❌ Erro na chamada da função: ${error.message}`);
        throw error;
      }
      
      if (data.success) {
        addLog('✅ Função executada com sucesso');
        setSetupStatus('success');
        setSetupResults(data.results || []);
        toast.success('Usuários de demonstração processados com sucesso!');
        
        // Refresh database status
        setTimeout(() => {
          checkDatabaseStatus();
        }, 1000);
      } else {
        addLog(`❌ Função retornou erro: ${data.error || data.message}`);
        setSetupStatus('error');
        setSetupResults(data.results || []);
        toast.error(data.error || 'Erro ao processar usuários de demonstração');
      }
    } catch (error: any) {
      addLog(`❌ Erro inesperado: ${error.message || 'Falha ao criar usuários'}`);
      setSetupStatus('error');
      toast.error(`Erro: ${error.message || 'Falha ao criar usuários'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'created':
      case 'already_exists_profile_updated':
        return 'bg-green-100 text-green-800';
      case 'error':
      case 'create_error':
      case 'profile_update_error':
      case 'unexpected_error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Database Status */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Status do Banco de Dados</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">
                {databaseStatus.loading ? '...' : databaseStatus.users}
              </div>
              <div className="text-sm text-muted-foreground">Usuários</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {databaseStatus.loading ? '...' : databaseStatus.profiles}
              </div>
              <div className="text-sm text-muted-foreground">Perfis</div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={checkDatabaseStatus}
              disabled={databaseStatus.loading}
            >
              {databaseStatus.loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Atualizar'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Setup Demo Users */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Users className="h-6 w-6 text-primary" />
              <div>
                <CardTitle>Configurar Usuários de Demonstração</CardTitle>
                <CardDescription>
                  Crie ou atualize os usuários de teste para o sistema
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {setupStatus === 'success' && <CheckCircle className="h-5 w-5 text-green-500" />}
              {setupStatus === 'error' && <AlertCircle className="h-5 w-5 text-red-500" />}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={handleSetupUsers} 
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processando usuários...
              </>
            ) : (
              <>
                <Users className="mr-2 h-4 w-4" />
                Criar/Atualizar Usuários de Demonstração
              </>
            )}
          </Button>

          {/* Credentials */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
            <div className="space-y-2">
              <h4 className="font-medium text-sm">👨‍💼 Administrador</h4>
              <p className="text-sm text-muted-foreground">
                <strong>Email:</strong> admin@retificas.com<br />
                <strong>Senha:</strong> admin123
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium text-sm">👷‍♂️ Funcionário</h4>
              <p className="text-sm text-muted-foreground">
                <strong>Email:</strong> funcionario@retificas.com<br />
                <strong>Senha:</strong> func123
              </p>
            </div>
          </div>

          {/* Results */}
          {setupResults.length > 0 && (
            <div className="space-y-3 pt-4 border-t">
              <h4 className="font-medium text-sm">Resultados do Setup:</h4>
              {setupResults.map((result, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <div className="font-medium text-sm">{result.email}</div>
                    {result.error && (
                      <div className="text-xs text-red-600 mt-1">{result.error}</div>
                    )}
                    {result.userId && (
                      <div className="text-xs text-muted-foreground mt-1">
                        ID: {result.userId}
                      </div>
                    )}
                  </div>
                  <Badge className={getStatusColor(result.status)}>
                    {result.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}

          {/* Logs */}
          {logs.length > 0 && (
            <div className="space-y-2 pt-4 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowLogs(!showLogs)}
                className="w-full"
              >
                {showLogs ? (
                  <>
                    <EyeOff className="mr-2 h-4 w-4" />
                    Ocultar Logs de Debug
                  </>
                ) : (
                  <>
                    <Eye className="mr-2 h-4 w-4" />
                    Mostrar Logs de Debug ({logs.length})
                  </>
                )}
              </Button>
              
              {showLogs && (
                <div className="bg-black text-green-400 p-3 rounded font-mono text-xs max-h-60 overflow-y-auto">
                  {logs.map((log, index) => (
                    <div key={index}>{log}</div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Success Message */}
          {setupStatus === 'success' && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm font-medium">
                  Processamento concluído! Verifique os resultados acima e tente fazer login.
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}