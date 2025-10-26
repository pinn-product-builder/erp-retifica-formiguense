import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/ui/form-field";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  Star,
  StarOff,
  Plus,
  Eye,
  Edit,
  Heart,
  HeartOff,
  Phone,
  Mail,
  MessageCircle,
  Globe,
  MapPin,
  Calendar,
  TrendingUp,
  TrendingDown,
  Award,
  AlertCircle,
  CheckCircle,
  Clock,
  Package
} from "lucide-react";
import { useSupplierEvaluation, type EvaluationFormData, type EnhancedSupplier } from "@/hooks/useSupplierEvaluation";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface SupplierEvaluationProps {
  supplierId?: string;
  purchaseOrderId?: string;
  onEvaluationComplete?: () => void;
}

const SupplierEvaluation: React.FC<SupplierEvaluationProps> = ({
  supplierId,
  purchaseOrderId,
  onEvaluationComplete
}) => {
  const {
    evaluations,
    suppliers,
    loading,
    createEvaluation,
    addSupplierContact,
    updateSupplier,
    getSupplierStats,
    getSupplierPurchaseHistory,
    togglePreferredSupplier,
    fetchEvaluations,
    fetchEnhancedSuppliers
  } = useSupplierEvaluation();

  const [selectedSupplier, setSelectedSupplier] = useState<EnhancedSupplier | null>(null);
  const [isEvaluationDialogOpen, setIsEvaluationDialogOpen] = useState(false);
  const [isContactDialogOpen, setIsContactDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [supplierStats, setSupplierStats] = useState<unknown>(null);
  const [purchaseHistory, setPurchaseHistory] = useState<Array<Record<string, unknown>>>([]);

  // Form states
  const [evaluationForm, setEvaluationForm] = useState<EvaluationFormData>({
    delivery_rating: 5,
    quality_rating: 5,
    price_rating: 5,
    service_rating: 5,
    delivered_on_time: true,
    had_quality_issues: false,
    comments: ''
  });

  const [contactForm, setContactForm] = useState({
    name: '',
    role: '',
    email: '',
    phone: '',
    whatsapp: '',
    is_primary: false
  });

  const [editForm, setEditForm] = useState<Partial<EnhancedSupplier>>({});

  // Filtrar fornecedores se um ID específico foi fornecido
  const displaySuppliers = supplierId 
    ? suppliers.filter(s => s.id === supplierId)
    : suppliers;

  // Filtrar avaliações se um fornecedor específico foi fornecido
  const displayEvaluations = supplierId
    ? evaluations.filter(e => e.supplier_id === supplierId)
    : evaluations;

  // Carregar estatísticas quando um fornecedor é selecionado
  useEffect(() => {
    if (selectedSupplier) {
      loadSupplierDetails(selectedSupplier.id);
    }
  }, [selectedSupplier]);

  const loadSupplierDetails = async (id: string) => {
    const [stats, history] = await Promise.all([
      getSupplierStats(id),
      getSupplierPurchaseHistory(id)
    ]);
    
    setSupplierStats(stats);
    setPurchaseHistory(history);
  };

  // Renderizar estrelas de rating
  const renderStars = (rating: number, size: 'sm' | 'md' = 'sm') => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    const iconSize = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4';

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <Star key={i} className={`${iconSize} fill-yellow-400 text-yellow-400`} />
        );
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <Star key={i} className={`${iconSize} fill-yellow-200 text-yellow-400`} />
        );
      } else {
        stars.push(
          <StarOff key={i} className={`${iconSize} text-gray-300`} />
        );
      }
    }

    return <div className="flex items-center gap-1">{stars}</div>;
  };

  // Renderizar input de rating
  const renderRatingInput = (
    value: number,
    onChange: (value: number) => void,
    label: string
  ) => (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex items-center gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="focus:outline-none"
          >
            <Star
              className={`w-6 h-6 ${
                star <= value
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-300 hover:text-yellow-200'
              }`}
            />
          </button>
        ))}
        <span className="ml-2 text-sm text-muted-foreground">
          {value}/5
        </span>
      </div>
    </div>
  );

  // Submeter avaliação
  const handleSubmitEvaluation = async () => {
    if (!selectedSupplier || !purchaseOrderId) return;
    
    const success = await createEvaluation(
      selectedSupplier.id,
      purchaseOrderId,
      evaluationForm
    );
    
    if (success) {
      setIsEvaluationDialogOpen(false);
      setEvaluationForm({
        delivery_rating: 5,
        quality_rating: 5,
        price_rating: 5,
        service_rating: 5,
        delivered_on_time: true,
        had_quality_issues: false,
        comments: ''
      });
      onEvaluationComplete?.();
    }
  };

  // Adicionar contato
  const handleAddContact = async () => {
    if (!selectedSupplier) return;
    
    const success = await addSupplierContact(selectedSupplier.id, {
      ...contactForm,
      is_active: true
    });
    
    if (success) {
      setIsContactDialogOpen(false);
      setContactForm({
        name: '',
        role: '',
        email: '',
        phone: '',
        whatsapp: '',
        is_primary: false
      });
    }
  };

  // Atualizar fornecedor
  const handleUpdateSupplier = async () => {
    if (!selectedSupplier) return;
    
    const success = await updateSupplier(selectedSupplier.id, editForm);
    
    if (success) {
      setIsEditDialogOpen(false);
      setEditForm({});
      setSelectedSupplier(null);
    }
  };

  // Toggle fornecedor preferencial
  const handleTogglePreferred = async (supplier: EnhancedSupplier) => {
    await togglePreferredSupplier(supplier.id, !supplier.is_preferred);
  };

  return (
    <div className="space-y-6">
      {/* Lista de Fornecedores */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {displaySuppliers.map((supplier) => (
          <Card key={supplier.id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg flex items-center gap-2">
                    {supplier.name}
                    {supplier.is_preferred && (
                      <Badge variant="secondary" className="text-xs">
                        <Heart className="w-3 h-3 mr-1 fill-red-500 text-red-500" />
                        Preferencial
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription>
                    {supplier.contact_person && (
                      <span>Contato: {supplier.contact_person}</span>
                    )}
                  </CardDescription>
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleTogglePreferred(supplier)}
                >
                  {supplier.is_preferred ? (
                    <Heart className="w-4 h-4 fill-red-500 text-red-500" />
                  ) : (
                    <HeartOff className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-3">
              {/* Rating */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Avaliação</span>
                <div className="flex items-center gap-2">
                  {renderStars(supplier.rating)}
                  <span className="text-sm font-medium">
                    {supplier.rating.toFixed(1)}
                  </span>
                </div>
              </div>
              
              {/* Estatísticas */}
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-green-500" />
                  <span>{supplier.on_time_delivery_rate.toFixed(0)}% pontual</span>
                </div>
                <div className="flex items-center gap-1">
                  <Package className="w-3 h-3 text-blue-500" />
                  <span>{supplier.total_orders} pedidos</span>
                </div>
              </div>
              
              {/* Contatos */}
              <div className="space-y-1">
                {supplier.phone && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="w-3 h-3" />
                    <span>{supplier.phone}</span>
                  </div>
                )}
                {supplier.email && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="w-3 h-3" />
                    <span>{supplier.email}</span>
                  </div>
                )}
                {supplier.whatsapp && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MessageCircle className="w-3 h-3" />
                    <span>{supplier.whatsapp}</span>
                  </div>
                )}
              </div>
              
              {/* Categorias */}
              {supplier.categories && supplier.categories.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {supplier.categories.slice(0, 3).map((category) => (
                    <Badge key={category} variant="outline" className="text-xs">
                      {category}
                    </Badge>
                  ))}
                  {supplier.categories.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{supplier.categories.length - 3}
                    </Badge>
                  )}
                </div>
              )}
              
              {/* Ações */}
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedSupplier(supplier);
                    setEditForm(supplier);
                    setIsEditDialogOpen(true);
                  }}
                >
                  <Edit className="w-3 h-3 mr-1" />
                  Editar
                </Button>
                
                {purchaseOrderId && (
                  <Button
                    size="sm"
                    onClick={() => {
                      setSelectedSupplier(supplier);
                      setIsEvaluationDialogOpen(true);
                    }}
                  >
                    <Star className="w-3 h-3 mr-1" />
                    Avaliar
                  </Button>
                )}
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedSupplier(supplier);
                  }}
                >
                  <Eye className="w-3 h-3 mr-1" />
                  Detalhes
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Detalhes do Fornecedor Selecionado */}
      {selectedSupplier && !isEditDialogOpen && !isEvaluationDialogOpen && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Detalhes - {selectedSupplier.name}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setContactForm({ ...contactForm });
                    setIsContactDialogOpen(true);
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Contato
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setSelectedSupplier(null)}
                >
                  Fechar
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Estatísticas */}
            {supplierStats && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <Star className="h-4 w-4 text-yellow-500" />
                      <div>
                        <p className="text-sm text-muted-foreground">Avaliação Média</p>
                        <p className="text-2xl font-bold">{supplierStats.averageRating.toFixed(1)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-green-500" />
                      <div>
                        <p className="text-sm text-muted-foreground">Pontualidade</p>
                        <p className="text-2xl font-bold">{supplierStats.onTimeDeliveryRate.toFixed(0)}%</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="h-4 w-4 text-red-500" />
                      <div>
                        <p className="text-sm text-muted-foreground">Problemas Qualidade</p>
                        <p className="text-2xl font-bold">{supplierStats.qualityIssuesRate.toFixed(0)}%</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <Award className="h-4 w-4 text-blue-500" />
                      <div>
                        <p className="text-sm text-muted-foreground">Total Avaliações</p>
                        <p className="text-2xl font-bold">{supplierStats.totalEvaluations}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Contatos */}
            {selectedSupplier.contacts && selectedSupplier.contacts.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3">Contatos</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedSupplier.contacts.map((contact) => (
                    <Card key={contact.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium">{contact.name}</p>
                            {contact.role && (
                              <p className="text-sm text-muted-foreground">{contact.role}</p>
                            )}
                          </div>
                          {contact.is_primary && (
                            <Badge variant="secondary" className="text-xs">
                              Principal
                            </Badge>
                          )}
                        </div>
                        
                        <div className="mt-2 space-y-1">
                          {contact.email && (
                            <div className="flex items-center gap-2 text-sm">
                              <Mail className="w-3 h-3" />
                              <span>{contact.email}</span>
                            </div>
                          )}
                          {contact.phone && (
                            <div className="flex items-center gap-2 text-sm">
                              <Phone className="w-3 h-3" />
                              <span>{contact.phone}</span>
                            </div>
                          )}
                          {contact.whatsapp && (
                            <div className="flex items-center gap-2 text-sm">
                              <MessageCircle className="w-3 h-3" />
                              <span>{contact.whatsapp}</span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Histórico de Compras */}
            {purchaseHistory.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3">Histórico de Compras (Últimos 10)</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Pedido</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {purchaseHistory.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">{order.po_number}</TableCell>
                        <TableCell>
                          {format(new Date(order.order_date), 'dd/MM/yyyy')}
                        </TableCell>
                        <TableCell>
                          R$ {order.total_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{order.status}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Avaliações */}
            {displayEvaluations.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3">Avaliações Recentes</h3>
                <div className="space-y-4">
                  {displayEvaluations.slice(0, 5).map((evaluation) => (
                    <Card key={evaluation.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <p className="font-medium">
                              PO: {evaluation.purchase_order?.po_number}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(evaluation.evaluated_at), 'dd/MM/yyyy', { locale: ptBR })}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {renderStars(evaluation.overall_rating)}
                            <span className="text-sm font-medium">
                              {evaluation.overall_rating.toFixed(1)}
                            </span>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                          <div>
                            <p className="text-xs text-muted-foreground">Entrega</p>
                            {renderStars(evaluation.delivery_rating)}
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Qualidade</p>
                            {renderStars(evaluation.quality_rating)}
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Preço</p>
                            {renderStars(evaluation.price_rating)}
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Atendimento</p>
                            {renderStars(evaluation.service_rating)}
                          </div>
                        </div>
                        
                        <div className="flex gap-4 text-sm">
                          <div className="flex items-center gap-1">
                            {evaluation.delivered_on_time ? (
                              <CheckCircle className="w-3 h-3 text-green-500" />
                            ) : (
                              <AlertCircle className="w-3 h-3 text-red-500" />
                            )}
                            <span>
                              {evaluation.delivered_on_time ? 'Entregue no prazo' : 'Entregue com atraso'}
                            </span>
                          </div>
                          
                          {evaluation.had_quality_issues && (
                            <div className="flex items-center gap-1">
                              <AlertCircle className="w-3 h-3 text-yellow-500" />
                              <span>Problemas de qualidade</span>
                            </div>
                          )}
                        </div>
                        
                        {evaluation.comments && (
                          <div className="mt-3 p-2 bg-muted rounded text-sm">
                            {evaluation.comments}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Dialog de Avaliação */}
      <Dialog open={isEvaluationDialogOpen} onOpenChange={setIsEvaluationDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Avaliar Fornecedor</DialogTitle>
            <DialogDescription>
              Avalie o desempenho do fornecedor {selectedSupplier?.name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {renderRatingInput(
                evaluationForm.delivery_rating,
                (value) => setEvaluationForm({ ...evaluationForm, delivery_rating: value }),
                "Pontualidade de Entrega"
              )}
              
              {renderRatingInput(
                evaluationForm.quality_rating,
                (value) => setEvaluationForm({ ...evaluationForm, quality_rating: value }),
                "Qualidade dos Produtos"
              )}
              
              {renderRatingInput(
                evaluationForm.price_rating,
                (value) => setEvaluationForm({ ...evaluationForm, price_rating: value }),
                "Competitividade de Preço"
              )}
              
              {renderRatingInput(
                evaluationForm.service_rating,
                (value) => setEvaluationForm({ ...evaluationForm, service_rating: value }),
                "Qualidade do Atendimento"
              )}
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={evaluationForm.delivered_on_time}
                  onCheckedChange={(checked) => 
                    setEvaluationForm({ ...evaluationForm, delivered_on_time: checked })
                  }
                />
                <Label>Entregue no prazo</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  checked={evaluationForm.had_quality_issues}
                  onCheckedChange={(checked) => 
                    setEvaluationForm({ ...evaluationForm, had_quality_issues: checked })
                  }
                />
                <Label>Houve problemas de qualidade</Label>
              </div>
            </div>
            
            <div>
              <Label htmlFor="comments">Comentários (opcional)</Label>
              <Textarea
                id="comments"
                value={evaluationForm.comments}
                onChange={(e) => setEvaluationForm({ ...evaluationForm, comments: e.target.value })}
                placeholder="Descreva sua experiência com este fornecedor..."
                className="mt-2"
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsEvaluationDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmitEvaluation} disabled={loading}>
              Salvar Avaliação
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de Adicionar Contato */}
      <Dialog open={isContactDialogOpen} onOpenChange={setIsContactDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Contato</DialogTitle>
            <DialogDescription>
              Adicione um novo contato para {selectedSupplier?.name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="contact-name">Nome *</Label>
                <Input
                  id="contact-name"
                  value={contactForm.name}
                  onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                  placeholder="Nome do contato"
                />
              </div>
              <div>
                <Label htmlFor="contact-role">Cargo</Label>
                <Input
                  id="contact-role"
                  value={contactForm.role}
                  onChange={(e) => setContactForm({ ...contactForm, role: e.target.value })}
                  placeholder="Ex: Vendedor, Gerente"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="contact-email">Email</Label>
                <Input
                  id="contact-email"
                  type="email"
                  value={contactForm.email}
                  onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                  placeholder="email@fornecedor.com"
                />
              </div>
              <div>
                <FormField
                  label="Telefone"
                  name="contact-phone"
                  mask="phone"
                  value={contactForm.phone}
                  onChange={(value, rawValue) => setContactForm({ ...contactForm, phone: rawValue || '' })}
                  placeholder="(11) 99999-9999"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="contact-whatsapp">WhatsApp</Label>
              <Input
                id="contact-whatsapp"
                value={contactForm.whatsapp}
                onChange={(e) => setContactForm({ ...contactForm, whatsapp: e.target.value })}
                placeholder="(11) 99999-9999"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                checked={contactForm.is_primary}
                onCheckedChange={(checked) => 
                  setContactForm({ ...contactForm, is_primary: checked })
                }
              />
              <Label>Contato principal</Label>
            </div>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsContactDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddContact} disabled={loading || !contactForm.name}>
              Adicionar Contato
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de Edição */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Fornecedor</DialogTitle>
            <DialogDescription>
              Atualize as informações do fornecedor
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-name">Nome da Empresa *</Label>
                <Input
                  id="edit-name"
                  value={editForm.name || ''}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                />
              </div>
              <div>
                <FormField
                  label="CNPJ"
                  name="edit-cnpj"
                  mask="cnpj"
                  value={editForm.cnpj || ''}
                  onChange={(value, rawValue) => setEditForm({ ...editForm, cnpj: rawValue || '' })}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editForm.email || ''}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                />
              </div>
              <div>
                <FormField
                  label="Telefone"
                  name="edit-phone"
                  mask="phone"
                  value={editForm.phone || ''}
                  onChange={(value, rawValue) => setEditForm({ ...editForm, phone: rawValue || '' })}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-whatsapp">WhatsApp</Label>
                <Input
                  id="edit-whatsapp"
                  value={editForm.whatsapp || ''}
                  onChange={(e) => setEditForm({ ...editForm, whatsapp: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-website">Website</Label>
                <Input
                  id="edit-website"
                  value={editForm.website || ''}
                  onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="edit-address">Endereço</Label>
              <Textarea
                id="edit-address"
                value={editForm.address || ''}
                onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-payment-terms">Condições de Pagamento</Label>
                <Input
                  id="edit-payment-terms"
                  value={editForm.payment_terms || ''}
                  onChange={(e) => setEditForm({ ...editForm, payment_terms: e.target.value })}
                  placeholder="Ex: 30/60/90 dias"
                />
              </div>
              <div>
                <Label htmlFor="edit-delivery-days">Prazo de Entrega (dias)</Label>
                <Input
                  id="edit-delivery-days"
                  type="number"
                  value={editForm.delivery_days || 0}
                  onChange={(e) => setEditForm({ ...editForm, delivery_days: Number(e.target.value) })}
                />
              </div>
            </div>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateSupplier} disabled={loading}>
              Salvar Alterações
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SupplierEvaluation;
