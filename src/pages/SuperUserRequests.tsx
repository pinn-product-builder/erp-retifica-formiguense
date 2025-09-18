import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useSuperUser, SuperUserSignupRequest } from "@/hooks/useSuperUser";
import { useToast } from "@/hooks/use-toast";
import { 
  Loader2, 
  ArrowLeft, 
  Shield, 
  Building2, 
  Users, 
  CheckCircle, 
  XCircle,
  Crown,
  Clock,
  Eye,
  UserCheck,
  UserX,
  AlertCircle
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function SuperUserRequests() {
  const {
    signupRequests,
    requestsLoading,
    isPlatformAdmin,
    loading,
    approveSignupRequest,
    rejectSignupRequest,
    refreshSignupRequests
  } = useSuperUser();
  
  const [selectedRequest, setSelectedRequest] = useState<SuperUserSignupRequest | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  
  const { toast } = useToast();

  useEffect(() => {
    refreshSignupRequests();
  }, [refreshSignupRequests]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!isPlatformAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Alert className="max-w-md" variant="destructive">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            Acesso negado. Apenas administradores da plataforma podem acessar esta página.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />Pendente</Badge>;
      case 'approved':
        return <Badge variant="secondary" className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Aprovado</Badge>;
      case 'rejected':
        return <Badge variant="secondary" className="bg-red-100 text-red-800"><XCircle className="h-3 w-3 mr-1" />Rejeitado</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'platform_admin':
        return <Badge variant="secondary" className="bg-purple-100 text-purple-800"><Crown className="h-3 w-3 mr-1" />Admin Plataforma</Badge>;
      case 'organization_creator':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800"><Building2 className="h-3 w-3 mr-1" />Criador Org.</Badge>;
      default:
        return <Badge variant="secondary">{type}</Badge>;
    }
  };

  const filteredRequests = signupRequests.filter(request => {
    if (filter === 'all') return true;
    return request.status === filter;
  });

  const handleApprove = async () => {
    if (!selectedRequest) return;
    
    setActionLoading(true);
    try {
      const success = await approveSignupRequest(selectedRequest.id, reviewNotes);
      if (success) {
        setSelectedRequest(null);
        setReviewNotes('');
        toast({
          title: "Solicitação aprovada",
          description: "O usuário receberá instruções por email para criar sua conta.",
        });
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest) return;
    
    setActionLoading(true);
    try {
      const success = await rejectSignupRequest(selectedRequest.id, reviewNotes);
      if (success) {
        setSelectedRequest(null);
        setReviewNotes('');
        toast({
          title: "Solicitação rejeitada",
          description: "O usuário será notificado sobre a decisão.",
        });
      }
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Link to="/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Solicitações de Super Usuário</h1>
              <p className="text-muted-foreground">
                Gerencie solicitações de acesso como super usuário
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold">{signupRequests.length}</p>
                </div>
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pendentes</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {signupRequests.filter(r => r.status === 'pending').length}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Aprovadas</p>
                  <p className="text-2xl font-bold text-green-600">
                    {signupRequests.filter(r => r.status === 'approved').length}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Rejeitadas</p>
                  <p className="text-2xl font-bold text-red-600">
                    {signupRequests.filter(r => r.status === 'rejected').length}
                  </p>
                </div>
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex space-x-2">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('all')}
              >
                Todas
              </Button>
              <Button
                variant={filter === 'pending' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('pending')}
              >
                Pendentes
              </Button>
              <Button
                variant={filter === 'approved' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('approved')}
              >
                Aprovadas
              </Button>
              <Button
                variant={filter === 'rejected' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('rejected')}
              >
                Rejeitadas
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Requests Table */}
        <Card>
          <CardHeader>
            <CardTitle>Solicitações</CardTitle>
            <CardDescription>
              Lista de todas as solicitações de acesso como super usuário
            </CardDescription>
          </CardHeader>
          <CardContent>
            {requestsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma solicitação encontrada
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Empresa</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell className="font-medium">{request.name}</TableCell>
                      <TableCell>{request.email}</TableCell>
                      <TableCell>{request.company_name}</TableCell>
                      <TableCell>{getTypeBadge(request.requested_type)}</TableCell>
                      <TableCell>{getStatusBadge(request.status)}</TableCell>
                      <TableCell>
                        {format(new Date(request.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedRequest(request);
                                setReviewNotes(request.review_notes || '');
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Detalhes da Solicitação</DialogTitle>
                              <DialogDescription>
                                Revise os detalhes e tome uma decisão sobre a solicitação
                              </DialogDescription>
                            </DialogHeader>
                            
                            {selectedRequest && (
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label className="text-sm font-medium">Nome</Label>
                                    <p className="text-sm">{selectedRequest.name}</p>
                                  </div>
                                  <div>
                                    <Label className="text-sm font-medium">Email</Label>
                                    <p className="text-sm">{selectedRequest.email}</p>
                                  </div>
                                  <div>
                                    <Label className="text-sm font-medium">Empresa</Label>
                                    <p className="text-sm">{selectedRequest.company_name}</p>
                                  </div>
                                  <div>
                                    <Label className="text-sm font-medium">Telefone</Label>
                                    <p className="text-sm">{selectedRequest.phone || 'Não informado'}</p>
                                  </div>
                                  <div>
                                    <Label className="text-sm font-medium">Tipo Solicitado</Label>
                                    <div className="mt-1">{getTypeBadge(selectedRequest.requested_type)}</div>
                                  </div>
                                  <div>
                                    <Label className="text-sm font-medium">Status Atual</Label>
                                    <div className="mt-1">{getStatusBadge(selectedRequest.status)}</div>
                                  </div>
                                </div>
                                
                                {selectedRequest.message && (
                                  <div>
                                    <Label className="text-sm font-medium">Justificativa</Label>
                                    <p className="text-sm mt-1 p-3 bg-muted rounded-md">
                                      {selectedRequest.message}
                                    </p>
                                  </div>
                                )}
                                
                                {selectedRequest.status !== 'pending' && selectedRequest.review_notes && (
                                  <div>
                                    <Label className="text-sm font-medium">Notas da Revisão</Label>
                                    <p className="text-sm mt-1 p-3 bg-muted rounded-md">
                                      {selectedRequest.review_notes}
                                    </p>
                                  </div>
                                )}
                                
                                {selectedRequest.status === 'pending' && (
                                  <div>
                                    <Label htmlFor="review-notes">Notas da Revisão (Opcional)</Label>
                                    <Textarea
                                      id="review-notes"
                                      placeholder="Adicione notas sobre sua decisão..."
                                      value={reviewNotes}
                                      onChange={(e) => setReviewNotes(e.target.value)}
                                      rows={3}
                                    />
                                  </div>
                                )}
                              </div>
                            )}
                            
                            {selectedRequest?.status === 'pending' && (
                              <DialogFooter className="space-x-2">
                                <Button
                                  variant="outline"
                                  onClick={handleReject}
                                  disabled={actionLoading}
                                >
                                  {actionLoading ? (
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                  ) : (
                                    <UserX className="h-4 w-4 mr-2" />
                                  )}
                                  Rejeitar
                                </Button>
                                <Button
                                  onClick={handleApprove}
                                  disabled={actionLoading}
                                >
                                  {actionLoading ? (
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                  ) : (
                                    <UserCheck className="h-4 w-4 mr-2" />
                                  )}
                                  Aprovar
                                </Button>
                              </DialogFooter>
                            )}
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
