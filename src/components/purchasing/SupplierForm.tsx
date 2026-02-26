import React from 'react';
import { useForm, Controller, type FieldErrors } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Loader2, Building2, MapPin, CreditCard, Tag } from 'lucide-react';
import {
  supplierSchema,
  type SupplierFormData,
  type Supplier,
  SUPPLIER_CATEGORIES,
  PAYMENT_METHODS_OPTIONS,
  PAYMENT_TERMS_OPTIONS,
  SupplierService,
} from '@/services/SupplierService';

interface SupplierFormProps {
  supplier?: Supplier;
  onSuccess: (supplier: Supplier) => void;
  onCancel: () => void;
  onSubmit: (data: SupplierFormData) => Promise<Supplier | null>;
  isLoading?: boolean;
}

export function SupplierForm({
  supplier,
  onSuccess,
  onCancel,
  onSubmit,
  isLoading = false,
}: SupplierFormProps) {
  const isEdit = !!supplier;

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<SupplierFormData>({
    resolver: zodResolver(supplierSchema),
    defaultValues: supplier
      ? {
          trade_name:             supplier.trade_name ?? supplier.name,
          legal_name:             supplier.legal_name ?? supplier.name,
          document:               SupplierService.formatCNPJ(supplier.document ?? supplier.cnpj ?? ''),
          state_registration:     supplier.state_registration ?? '',
          municipal_registration: supplier.municipal_registration ?? '',
          email:                  supplier.email ?? '',
          phone:                  supplier.phone ?? '',
          whatsapp:               supplier.whatsapp ?? '',
          website:                supplier.website ?? '',
          contact_person:         supplier.contact_person ?? '',
          address_jsonb:          supplier.address_jsonb,
          payment_terms:          supplier.payment_terms ?? '',
          payment_methods:        supplier.payment_methods ?? ['boleto'],
          credit_limit:           supplier.credit_limit ?? undefined,
          discount_percentage:    supplier.discount_percentage ?? undefined,
          categories:             supplier.categories ?? [],
          delivery_days:          supplier.delivery_days ?? 0,
          is_active:              supplier.is_active ?? true,
          notes:                  supplier.notes ?? '',
        }
      : {
          is_active:       true,
          payment_methods: ['boleto'],
          categories:      [],
        },
  });

  const selectedCategories = watch('categories') ?? [];
  const selectedMethods    = watch('payment_methods') ?? [];

  const handleFormSubmit = async (rawData: SupplierFormData) => {
    const addr = rawData.address_jsonb;
    const hasAddress = addr && (addr.street?.trim() || addr.city?.trim() || addr.postal_code?.trim());
    const data: SupplierFormData = hasAddress
      ? rawData
      : { ...rawData, address_jsonb: undefined };
    const result = await onSubmit(data);
    if (result) onSuccess(result);
  };

  const handleInvalidSubmit = (errs: FieldErrors<SupplierFormData>) => {
    const messages = Object.values(errs)
      .map(e => (typeof e?.message === 'string' ? e.message : null))
      .filter(Boolean);
    const first = messages[0] ?? 'Verifique os campos obrigatórios';
    toast.error(first);
  };

  const toggleCategory = (value: string) => {
    const current = selectedCategories;
    const updated  = current.includes(value)
      ? current.filter(c => c !== value)
      : [...current, value];
    setValue('categories', updated, { shouldValidate: true });
  };

  const toggleMethod = (value: string) => {
    const current = selectedMethods;
    const updated  = current.includes(value)
      ? current.filter(m => m !== value)
      : [...current, value];
    setValue('payment_methods', updated, { shouldValidate: true });
  };

  const busy = isSubmitting || isLoading;

  const hasGeneralErrors  = !!(errors.trade_name || errors.legal_name || errors.document || errors.email || errors.phone);
  const hasAddressErrors  = !!(errors.address_jsonb);
  const hasCommercialErrors = !!(errors.payment_methods || errors.credit_limit || errors.discount_percentage);
  const hasCategoryErrors = !!(errors.categories);

  return (
    <form onSubmit={handleSubmit(handleFormSubmit, handleInvalidSubmit)} className="space-y-4">
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-4 h-auto">
          <TabsTrigger value="general" className="relative flex items-center gap-1 text-xs sm:text-sm py-2">
            <Building2 className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Dados Gerais</span>
            <span className="sm:hidden">Geral</span>
            {hasGeneralErrors && <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-destructive" />}
          </TabsTrigger>
          <TabsTrigger value="address" className="relative flex items-center gap-1 text-xs sm:text-sm py-2">
            <MapPin className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Endereço</span>
            <span className="sm:hidden">End.</span>
            {hasAddressErrors && <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-destructive" />}
          </TabsTrigger>
          <TabsTrigger value="commercial" className="relative flex items-center gap-1 text-xs sm:text-sm py-2">
            <CreditCard className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Comercial</span>
            <span className="sm:hidden">Com.</span>
            {hasCommercialErrors && <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-destructive" />}
          </TabsTrigger>
          <TabsTrigger value="categories" className="relative flex items-center gap-1 text-xs sm:text-sm py-2">
            <Tag className="w-3 h-3 sm:w-4 sm:h-4" />
            <span>Categorias</span>
            {hasCategoryErrors && <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-destructive" />}
          </TabsTrigger>
        </TabsList>

        {/* ── ABA DADOS GERAIS ── */}
        <TabsContent value="general" className="space-y-4 pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="trade_name">Nome Fantasia *</Label>
              <Input
                id="trade_name"
                {...register('trade_name')}
                placeholder="Ex: Rolamentos Sul"
                className={errors.trade_name ? 'border-destructive' : ''}
              />
              {errors.trade_name && (
                <p className="text-xs text-destructive">{errors.trade_name.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="legal_name">Razão Social *</Label>
              <Input
                id="legal_name"
                {...register('legal_name')}
                placeholder="Ex: Rolamentos Sul Ltda"
                className={errors.legal_name ? 'border-destructive' : ''}
              />
              {errors.legal_name && (
                <p className="text-xs text-destructive">{errors.legal_name.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="document">CNPJ *</Label>
              <Controller
                name="document"
                control={control}
                render={({ field }) => (
                  <Input
                    id="document"
                    {...field}
                    placeholder="00.000.000/0000-00"
                    maxLength={18}
                    onChange={e => {
                      const raw = e.target.value.replace(/\D/g, '');
                      const fmt = raw
                        .replace(/^(\d{2})(\d)/, '$1.$2')
                        .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
                        .replace(/\.(\d{3})(\d)/, '.$1/$2')
                        .replace(/(\d{4})(\d)/, '$1-$2')
                        .slice(0, 18);
                      field.onChange(fmt);
                    }}
                    className={errors.document ? 'border-destructive' : ''}
                  />
                )}
              />
              {errors.document && (
                <p className="text-xs text-destructive">{errors.document.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="state_registration">Inscrição Estadual</Label>
              <Input id="state_registration" {...register('state_registration')} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                {...register('email')}
                placeholder="contato@fornecedor.com"
                className={errors.email ? 'border-destructive' : ''}
              />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="phone">Telefone *</Label>
              <Controller
                name="phone"
                control={control}
                render={({ field }) => (
                  <Input
                    id="phone"
                    {...field}
                    placeholder="(11) 99999-9999"
                    maxLength={15}
                    onChange={e => {
                      const raw = e.target.value.replace(/\D/g, '');
                      const fmt = raw.length <= 10
                        ? raw.replace(/^(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3')
                        : raw.replace(/^(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
                      field.onChange(fmt.trim().replace(/-$/, ''));
                    }}
                    className={errors.phone ? 'border-destructive' : ''}
                  />
                )}
              />
              {errors.phone && (
                <p className="text-xs text-destructive">{errors.phone.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="whatsapp">WhatsApp</Label>
              <Input id="whatsapp" {...register('whatsapp')} placeholder="(11) 99999-9999" />
            </div>

            <div className="space-y-1">
              <Label htmlFor="website">Site</Label>
              <Input id="website" {...register('website')} placeholder="https://..." />
              {errors.website && (
                <p className="text-xs text-destructive">{errors.website.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="contact_person">Pessoa de Contato</Label>
            <Input id="contact_person" {...register('contact_person')} placeholder="Nome do responsável" />
          </div>
        </TabsContent>

        {/* ── ABA ENDEREÇO ── */}
        <TabsContent value="address" className="space-y-4 pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2 space-y-1">
              <Label htmlFor="street">Logradouro</Label>
              <Input
                id="street"
                {...register('address_jsonb.street')}
                placeholder="Rua, Avenida, etc."
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="number">Número</Label>
              <Input id="number" {...register('address_jsonb.number')} placeholder="123" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="complement">Complemento</Label>
              <Input id="complement" {...register('address_jsonb.complement')} placeholder="Sala, Apto..." />
            </div>
            <div className="space-y-1">
              <Label htmlFor="neighborhood">Bairro</Label>
              <Input id="neighborhood" {...register('address_jsonb.neighborhood')} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-1 space-y-1">
              <Label htmlFor="postal_code">CEP</Label>
              <Controller
                name="address_jsonb.postal_code"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    value={field.value ?? ''}
                    placeholder="00000-000"
                    maxLength={9}
                    onChange={e => {
                      const raw = e.target.value.replace(/\D/g, '');
                      field.onChange(raw.replace(/^(\d{5})(\d{0,3})/, '$1-$2').replace(/-$/, ''));
                    }}
                  />
                )}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="city">Cidade</Label>
              <Input id="city" {...register('address_jsonb.city')} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="state">UF</Label>
              <Input
                id="state"
                {...register('address_jsonb.state')}
                maxLength={2}
                className="uppercase"
                placeholder="SP"
              />
            </div>
          </div>
        </TabsContent>

        {/* ── ABA COMERCIAL ── */}
        <TabsContent value="commercial" className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label>Formas de Pagamento *</Label>
            {errors.payment_methods && (
              <p className="text-xs text-destructive">{errors.payment_methods.message}</p>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {PAYMENT_METHODS_OPTIONS.map(opt => (
                <label
                  key={opt.value}
                  className="flex items-center gap-2 cursor-pointer p-2 rounded-md border hover:bg-accent transition-colors"
                >
                  <Checkbox
                    checked={selectedMethods.includes(opt.value)}
                    onCheckedChange={() => toggleMethod(opt.value)}
                  />
                  <span className="text-sm">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="payment_terms">Prazo de Pagamento</Label>
            <Input
              id="payment_terms"
              {...register('payment_terms')}
              placeholder="Ex: 30/60/90 dias, À vista, etc."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <Label htmlFor="credit_limit">Limite de Crédito (R$)</Label>
              <Controller
                name="credit_limit"
                control={control}
                render={({ field }) => (
                  <Input
                    id="credit_limit"
                    type="number"
                    min="0"
                    step="0.01"
                    value={field.value ?? ''}
                    onChange={e => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                    placeholder="0,00"
                  />
                )}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="discount_percentage">Desconto Padrão (%)</Label>
              <Controller
                name="discount_percentage"
                control={control}
                render={({ field }) => (
                  <Input
                    id="discount_percentage"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={field.value ?? ''}
                    onChange={e => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                    placeholder="0"
                  />
                )}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="delivery_days">Prazo de Entrega (dias)</Label>
              <Controller
                name="delivery_days"
                control={control}
                render={({ field }) => (
                  <Input
                    id="delivery_days"
                    type="number"
                    min="0"
                    value={field.value ?? ''}
                    onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : 0)}
                    placeholder="0"
                  />
                )}
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              {...register('notes')}
              placeholder="Informações adicionais sobre o fornecedor..."
              rows={3}
            />
          </div>

          {isEdit && (
            <div className="flex items-center gap-2 p-3 rounded-md border">
              <Controller
                name="is_active"
                control={control}
                render={({ field }) => (
                  <Checkbox
                    id="is_active"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
              <Label htmlFor="is_active" className="cursor-pointer">Fornecedor ativo</Label>
            </div>
          )}
        </TabsContent>

        {/* ── ABA CATEGORIAS ── */}
        <TabsContent value="categories" className="space-y-4 pt-4">
          <div>
            <Label>Categorias de Fornecimento *</Label>
            <p className="text-xs text-muted-foreground mb-3">Selecione todas as categorias de produtos/serviços fornecidos</p>
            {errors.categories && (
              <p className="text-xs text-destructive mb-2">{errors.categories.message}</p>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {SUPPLIER_CATEGORIES.map(cat => {
                const active = selectedCategories.includes(cat.value);
                return (
                  <label
                    key={cat.value}
                    className={`flex items-center gap-2 cursor-pointer p-3 rounded-md border transition-colors ${
                      active ? 'border-primary bg-primary/5' : 'hover:bg-accent'
                    }`}
                  >
                    <Checkbox
                      checked={active}
                      onCheckedChange={() => toggleCategory(cat.value)}
                    />
                    <span className="text-sm font-medium">{cat.label}</span>
                    {active && (
                      <Badge variant="default" className="ml-auto text-xs h-5">✓</Badge>
                    )}
                  </label>
                );
              })}
            </div>

            {selectedCategories.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1">
                {selectedCategories.map(val => {
                  const cat = SUPPLIER_CATEGORIES.find(c => c.value === val);
                  return cat ? (
                    <Badge key={val} variant="secondary" className="text-xs">
                      {cat.label}
                    </Badge>
                  ) : null;
                })}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Botões */}
      <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-2 border-t">
        <Button type="button" variant="outline" onClick={onCancel} disabled={busy} className="w-full sm:w-auto">
          Cancelar
        </Button>
        <Button type="submit" disabled={busy} className="w-full sm:w-auto">
          {busy && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {isEdit ? 'Salvar Alterações' : 'Cadastrar Fornecedor'}
        </Button>
      </div>
    </form>
  );
}
