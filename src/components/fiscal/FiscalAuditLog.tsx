import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { format } from 'date-fns';
import { FileText, Search, Eye } from 'lucide-react';

interface AuditLogEntry {
  id: string;
  table_name: string;
  record_id: string;
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  old_values: unknown;
  new_values: unknown;
  user_id: string;
  timestamp: string;
  ip_address: string;
  user_agent: string;
}

export function FiscalAuditLog() {
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [operationFilter, setOperationFilter] = useState<string>('all');
  const [tableFilter, setTableFilter] = useState<string>('all');
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);
  const { currentOrganization } = useOrganization();

  const loadAuditLogs = async () => {
    if (!currentOrganization) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('fiscal_audit_log')
        .select('*')
        .eq('org_id', currentOrganization.id)
        .order('timestamp', { ascending: false })
        .limit(100);

      if (error) throw error;
      setAuditLogs((data || []) as AuditLogEntry[]);
      setFilteredLogs((data || []) as AuditLogEntry[]);
    } catch (error) {
      console.error('Error loading audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAuditLogs();
  }, [currentOrganization]);

  useEffect(() => {
    let filtered = auditLogs;

    if (searchTerm) {
      filtered = filtered.filter(log => 
        log.table_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.record_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.user_id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (operationFilter !== 'all') {
      filtered = filtered.filter(log => log.operation === operationFilter);
    }

    if (tableFilter !== 'all') {
      filtered = filtered.filter(log => log.table_name === tableFilter);
    }

    setFilteredLogs(filtered);
  }, [auditLogs, searchTerm, operationFilter, tableFilter]);

  const getOperationBadgeVariant = (operation: string) => {
    switch (operation) {
      case 'INSERT': return 'default';
      case 'UPDATE': return 'secondary';
      case 'DELETE': return 'destructive';
      default: return 'outline';
    }
  };

  const uniqueTables = [...new Set(auditLogs.map(log => log.table_name))];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Log de Auditoria Fiscal
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-4 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por tabela, ID ou usuário..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <Select value={operationFilter} onValueChange={setOperationFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Operação" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="INSERT">Criação</SelectItem>
              <SelectItem value="UPDATE">Atualização</SelectItem>
              <SelectItem value="DELETE">Exclusão</SelectItem>
            </SelectContent>
          </Select>

          <Select value={tableFilter} onValueChange={setTableFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Tabela" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {uniqueTables.map(table => (
                <SelectItem key={table} value={table}>{table}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button onClick={loadAuditLogs} disabled={loading}>
            Atualizar
          </Button>
        </div>

        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data/Hora</TableHead>
                <TableHead>Tabela</TableHead>
                <TableHead>Operação</TableHead>
                <TableHead>ID do Registro</TableHead>
                <TableHead>Usuário</TableHead>
                <TableHead>IP</TableHead>
                <TableHead className="w-[100px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    {loading ? 'Carregando...' : 'Nenhum log de auditoria encontrado'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      {format(new Date(log.timestamp), 'dd/MM/yyyy HH:mm:ss')}
                    </TableCell>
                    <TableCell className="font-medium">{log.table_name}</TableCell>
                    <TableCell>
                      <Badge variant={getOperationBadgeVariant(log.operation)}>
                        {log.operation}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {log.record_id.substring(0, 8)}...
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {log.user_id ? log.user_id.substring(0, 8) + '...' : 'Sistema'}
                    </TableCell>
                    <TableCell>{log.ip_address}</TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => setSelectedLog(log)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[600px]">
                          <DialogHeader>
                            <DialogTitle>Detalhes do Log de Auditoria</DialogTitle>
                          </DialogHeader>
                          {selectedLog && (
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <strong>Tabela:</strong> {selectedLog.table_name}
                                </div>
                                <div>
                                  <strong>Operação:</strong> {selectedLog.operation}
                                </div>
                                <div>
                                  <strong>ID do Registro:</strong> {selectedLog.record_id}
                                </div>
                                <div>
                                  <strong>Data/Hora:</strong> {format(new Date(selectedLog.timestamp), 'dd/MM/yyyy HH:mm:ss')}
                                </div>
                                <div>
                                  <strong>Usuário:</strong> {selectedLog.user_id || 'Sistema'}
                                </div>
                                <div>
                                  <strong>IP:</strong> {selectedLog.ip_address}
                                </div>
                              </div>
                              
                              {selectedLog.old_values && (
                                <div>
                                  <strong>Valores Anteriores:</strong>
                                  <pre className="bg-muted p-3 rounded-lg mt-2 text-sm overflow-auto">
                                    {JSON.stringify(selectedLog.old_values, null, 2)}
                                  </pre>
                                </div>
                              )}
                              
                              {selectedLog.new_values && (
                                <div>
                                  <strong>Novos Valores:</strong>
                                  <pre className="bg-muted p-3 rounded-lg mt-2 text-sm overflow-auto">
                                    {JSON.stringify(selectedLog.new_values, null, 2)}
                                  </pre>
                                </div>
                              )}
                              
                              {selectedLog.user_agent && (
                                <div>
                                  <strong>User Agent:</strong>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {selectedLog.user_agent}
                                  </p>
                                </div>
                              )}
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}