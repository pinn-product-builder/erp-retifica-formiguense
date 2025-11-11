import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FormField } from '@/components/ui/form-field';
import { Textarea } from '@/components/ui/textarea';
import { usePurchasing, type Supplier } from '@/hooks/usePurchasing';
import { useSupplierEvaluation } from '@/hooks/useSupplierEvaluation';
import { useToast } from '@/hooks/use-toast';
import { Plus, Star, Edit } from 'lucide-react';

// Funções de validação
const validateCNPJ = (cnpj: string): boolean => {
  if (!cnpj) return true;
  const cleanCNPJ = cnpj.replace(/\D/g, '');
  if (cleanCNPJ.length !== 14) return false;
  if (/^(\d)\1+$/.test(cleanCNPJ)) return false;
  
  let length = cleanCNPJ.length - 2;
  let numbers = cleanCNPJ.substring(0, length);
  const digits = cleanCNPJ.substring(length);
  let sum = 0;
  let pos = length - 7;
  
  for (let i = length; i >= 1; i--) {
    sum += parseInt(numbers.charAt(length - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  
  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(0))) return false;
  
  length = length + 1;
  numbers = cleanCNPJ.substring(0, length);
  sum = 0;
  pos = length - 7;
  
  for (let i = length; i >= 1; i--) {
    sum += parseInt(numbers.charAt(length - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  
  result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(1))) return false;
  
  return true;
};

const validateEmail = (email: string): boolean => {
  if (!email) return true;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePhone = (phone: string): boolean => {
  if (!phone) return true;
  const cleanPhone = phone.replace(/\D/g, '');
  return cleanPhone.length === 10 || cleanPhone.length === 11;
};

export default function SuppliersManager() {
  const { 
    suppliers, 
    loading, 
    createSupplier, 
    fetchSuppliers
  } = usePurchasing();
  const { updateSupplier } = useSupplierEvaluation();
  const { toast } = useToast();

  const [newSupplier, setNewSupplier] = useState({
    name: '',
    cnpj: '',
    email: '',
    phone: '',
    address: '',
    contact_person: '',
    payment_terms: '',
    delivery_days: 0,
  });

  const [supplierErrors, setSupplierErrors] = useState<{
    email?: string;
    phone?: string;
    cnpj?: string;
  }>({});

  const [editingSupplier, setEditingSupplier] = useState<{
    id: string;
    name: string;
    cnpj: string;
    email: string;
    phone: string;
    address: string;
    contact_person: string;
    payment_terms: string;
    delivery_days: number;
  } | null>(null);

  const [editSupplierErrors, setEditSupplierErrors] = useState<{
    email?: string;
    phone?: string;
    cnpj?: string;
  }>({});

  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const validateSupplierForm = (formData: typeof newSupplier): boolean => {
    const errors: {
      email?: string;
      phone?: string;
      cnpj?: string;
    } = {};

    if (formData.email && !validateEmail(formData.email)) {
      errors.email = 'Email inválido';
    }

    if (formData.phone && !validatePhone(formData.phone)) {
      errors.phone = 'Telefone inválido. Deve ter 10 ou 11 dígitos';
    }

    if (formData.cnpj && !validateCNPJ(formData.cnpj)) {
      errors.cnpj = 'CNPJ inválido';
    }

    setSupplierErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateSupplier = async () => {
    if (!newSupplier.name) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Nome do fornecedor é obrigatório"
      });
      return;
    }

    if (!validateSupplierForm(newSupplier)) {
      toast({
        variant: "destructive",
        title: "Erro de validação",
        description: "Por favor, corrija os erros no formulário antes de salvar"
      });
      return;
    }
    
    try {
      await createSupplier({
        ...newSupplier,
        rating: 5.0,
        is_active: true,
      });
      
      setNewSupplier({
        name: '',
        cnpj: '',
        email: '',
        phone: '',
        address: '',
        contact_person: '',
        payment_terms: '',
        delivery_days: 0,
      });
      setSupplierErrors({});
      setShowCreateDialog(false);

      toast({
        title: "Sucesso",
        description: "Fornecedor criado com sucesso"
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Falha ao criar fornecedor"
      });
    }
  };

  const handleEditSupplier = (supplier: Supplier) => {
    setEditingSupplier({
      id: supplier.id,
      name: supplier.name,
      cnpj: supplier.cnpj || '',
      email: supplier.email || '',
      phone: supplier.phone || '',
      address: supplier.address || '',
      contact_person: supplier.contact_person || '',
      payment_terms: supplier.payment_terms || '',
      delivery_days: supplier.delivery_days,
    });
    setEditSupplierErrors({});
  };

  const validateEditSupplierForm = (formData: typeof editingSupplier): boolean => {
    if (!formData) return false;
    
    const errors: {
      email?: string;
      phone?: string;
      cnpj?: string;
    } = {};

    if (formData.email && !validateEmail(formData.email)) {
      errors.email = 'Email inválido';
    }

    if (formData.phone && !validatePhone(formData.phone)) {
      errors.phone = 'Telefone inválido. Deve ter 10 ou 11 dígitos';
    }

    if (formData.cnpj && !validateCNPJ(formData.cnpj)) {
      errors.cnpj = 'CNPJ inválido';
    }

    setEditSupplierErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleUpdateSupplier = async () => {
    if (!editingSupplier) return;

    if (!validateEditSupplierForm(editingSupplier)) {
      toast({
        variant: "destructive",
        title: "Erro de validação",
        description: "Por favor, corrija os erros no formulário antes de salvar"
      });
      return;
    }

    try {
      await updateSupplier(editingSupplier.id, editingSupplier);
      setEditingSupplier(null);
      setEditSupplierErrors({});
      await fetchSuppliers();
      
      toast({
        title: "Sucesso",
        description: "Fornecedor atualizado com sucesso"
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Falha ao atualizar fornecedor"
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Fornecedores</h2>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Fornecedor
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cadastrar Fornecedor</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Nome da Empresa</Label>
                <Input
                  value={newSupplier.name}
                  onChange={(e) => setNewSupplier({...newSupplier, name: e.target.value})}
                  placeholder="Razão social do fornecedor"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <FormField
                    label="CNPJ"
                    name="new-cnpj"
                    mask="cnpj"
                    value={newSupplier.cnpj}
                    onChange={(value, rawValue) => {
                      setNewSupplier({...newSupplier, cnpj: rawValue || ''});
                      if (supplierErrors.cnpj) {
                        setSupplierErrors({...supplierErrors, cnpj: undefined});
                      }
                    }}
                    error={supplierErrors.cnpj}
                    validation={{
                      custom: (value) => {
                        if (!value) return true;
                        return validateCNPJ(value);
                      }
                    }}
                  />
                </div>
                <div>
                  <Label>Prazo de Entrega (dias)</Label>
                  <Input
                    type="text"
                    value={newSupplier.delivery_days}
                    onChange={(e) => setNewSupplier({...newSupplier, delivery_days: Number(e.target.value)})}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={newSupplier.email}
                    onChange={(e) => {
                      setNewSupplier({...newSupplier, email: e.target.value});
                      if (supplierErrors.email) {
                        setSupplierErrors({...supplierErrors, email: undefined});
                      }
                    }}
                    onBlur={() => {
                      if (newSupplier.email && !validateEmail(newSupplier.email)) {
                        setSupplierErrors({...supplierErrors, email: 'Email inválido'});
                      }
                    }}
                    placeholder="contato@fornecedor.com"
                    className={supplierErrors.email ? 'border-destructive' : ''}
                  />
                  {supplierErrors.email && (
                    <p className="text-sm text-destructive mt-1">{supplierErrors.email}</p>
                  )}
                </div>
                <div>
                  <FormField
                    label="Telefone"
                    name="new-phone"
                    mask="phone"
                    value={newSupplier.phone}
                    onChange={(value, rawValue) => {
                      setNewSupplier({...newSupplier, phone: rawValue || ''});
                      if (supplierErrors.phone) {
                        setSupplierErrors({...supplierErrors, phone: undefined});
                      }
                    }}
                    error={supplierErrors.phone}
                    validation={{
                      custom: (value) => {
                        if (!value) return true;
                        return validatePhone(value);
                      }
                    }}
                    placeholder="(11) 99999-9999"
                  />
                </div>
              </div>
              <div>
                <Label>Pessoa de Contato</Label>
                <Input
                  value={newSupplier.contact_person}
                  onChange={(e) => setNewSupplier({...newSupplier, contact_person: e.target.value})}
                  placeholder="Nome do responsável"
                />
              </div>
              <div>
                <Label>Endereço</Label>
                <Textarea
                  value={newSupplier.address}
                  onChange={(e) => setNewSupplier({...newSupplier, address: e.target.value})}
                  placeholder="Endereço completo"
                />
              </div>
              <div>
                <Label>Condições de Pagamento</Label>
                <Input
                  value={newSupplier.payment_terms}
                  onChange={(e) => setNewSupplier({...newSupplier, payment_terms: e.target.value})}
                  placeholder="Ex: 30/60/90 dias"
                />
              </div>
              <Button onClick={handleCreateSupplier} className="w-full">
                Cadastrar Fornecedor
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {suppliers.map((supplier) => (
          <Card key={supplier.id}>
            <CardContent className="p-4">
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <h3 className="font-medium">{supplier.name}</h3>
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 text-yellow-500 fill-current" />
                    <span className="text-sm">{supplier.rating.toFixed(1)}</span>
                  </div>
                </div>
                {supplier.contact_person && (
                  <p className="text-sm text-muted-foreground">
                    Contato: {supplier.contact_person}
                  </p>
                )}
                <p className="text-sm text-muted-foreground">
                  Entrega: {supplier.delivery_days} dias
                </p>
                {supplier.phone && (
                  <p className="text-sm text-muted-foreground">
                    Tel: {supplier.phone}
                  </p>
                )}
                <div className="pt-2 flex items-center justify-between">
                  <Badge variant={supplier.is_active ? "default" : "secondary"}>
                    {supplier.is_active ? "Ativo" : "Inativo"}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditSupplier(supplier)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {suppliers.length === 0 && (
          <Card className="col-span-full">
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">Nenhum fornecedor cadastrado</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Dialog de Edição */}
      <Dialog open={!!editingSupplier} onOpenChange={(open) => !open && setEditingSupplier(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Fornecedor</DialogTitle>
          </DialogHeader>
          {editingSupplier && (
            <div className="space-y-4">
              <div>
                <Label>Nome da Empresa *</Label>
                <Input
                  value={editingSupplier.name}
                  onChange={(e) => setEditingSupplier({...editingSupplier, name: e.target.value})}
                  placeholder="Razão social do fornecedor"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <FormField
                    label="CNPJ"
                    name="edit-cnpj"
                    mask="cnpj"
                    value={editingSupplier.cnpj}
                    onChange={(value, rawValue) => {
                      setEditingSupplier({...editingSupplier, cnpj: rawValue || ''});
                      if (editSupplierErrors.cnpj) {
                        setEditSupplierErrors({...editSupplierErrors, cnpj: undefined});
                      }
                    }}
                    error={editSupplierErrors.cnpj}
                    validation={{
                      custom: (value) => {
                        if (!value) return true;
                        return validateCNPJ(value);
                      }
                    }}
                  />
                </div>
                <div>
                  <Label>Prazo de Entrega (dias)</Label>
                  <Input
                    type="text"
                    value={editingSupplier.delivery_days}
                    onChange={(e) => setEditingSupplier({...editingSupplier, delivery_days: Number(e.target.value) || 0})}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={editingSupplier.email}
                    onChange={(e) => {
                      setEditingSupplier({...editingSupplier, email: e.target.value});
                      if (editSupplierErrors.email) {
                        setEditSupplierErrors({...editSupplierErrors, email: undefined});
                      }
                    }}
                    onBlur={() => {
                      if (editingSupplier.email && !validateEmail(editingSupplier.email)) {
                        setEditSupplierErrors({...editSupplierErrors, email: 'Email inválido'});
                      }
                    }}
                    placeholder="contato@fornecedor.com"
                    className={editSupplierErrors.email ? 'border-destructive' : ''}
                  />
                  {editSupplierErrors.email && (
                    <p className="text-sm text-destructive mt-1">{editSupplierErrors.email}</p>
                  )}
                </div>
                <div>
                  <FormField
                    label="Telefone"
                    name="edit-phone"
                    mask="phone"
                    value={editingSupplier.phone}
                    onChange={(value, rawValue) => {
                      setEditingSupplier({...editingSupplier, phone: rawValue || ''});
                      if (editSupplierErrors.phone) {
                        setEditSupplierErrors({...editSupplierErrors, phone: undefined});
                      }
                    }}
                    error={editSupplierErrors.phone}
                    validation={{
                      custom: (value) => {
                        if (!value) return true;
                        return validatePhone(value);
                      }
                    }}
                    placeholder="(11) 99999-9999"
                  />
                </div>
              </div>
              <div>
                <Label>Pessoa de Contato</Label>
                <Input
                  value={editingSupplier.contact_person}
                  onChange={(e) => setEditingSupplier({...editingSupplier, contact_person: e.target.value})}
                  placeholder="Nome do responsável"
                />
              </div>
              <div>
                <Label>Endereço</Label>
                <Textarea
                  value={editingSupplier.address}
                  onChange={(e) => setEditingSupplier({...editingSupplier, address: e.target.value})}
                  placeholder="Endereço completo"
                />
              </div>
              <div>
                <Label>Condições de Pagamento</Label>
                <Input
                  value={editingSupplier.payment_terms}
                  onChange={(e) => setEditingSupplier({...editingSupplier, payment_terms: e.target.value})}
                  placeholder="Ex: 30/60/90 dias"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditingSupplier(null)}>
                  Cancelar
                </Button>
                <Button onClick={handleUpdateSupplier} disabled={loading}>
                  Salvar Alterações
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

