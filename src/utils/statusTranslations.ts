/**
 * Traduções centralizadas para português
 * Mantenha este arquivo como fonte única de verdade para TODAS as traduções
 */

// ========== STATUS ==========

// Status de Orçamentos (Budgets)
export const BUDGET_STATUS: Record<string, string> = {
  draft: 'Rascunho',
  pending: 'Pendente',
  pending_customer: 'Em Aprovação do Cliente',
  approved: 'Aprovado',
  rejected: 'Rejeitado',
  partial: 'Parcial',
  partially_approved: 'Parcialmente Aprovado',
  cancelled: 'Cancelado',
  active: 'Ativo',
  inactive: 'Inativo',
  reopened: 'Reaberto'
};

// Status de Diagnósticos
export const DIAGNOSTIC_STATUS: Record<string, string> = {
  pending: 'Pendente',
  completed: 'Concluído',
  approved: 'Aprovado',
  rejected: 'Rejeitado',
  in_progress: 'Em Andamento'
};

// Status de Ordens de Serviço
export const ORDER_STATUS: Record<string, string> = {
  ativa: 'Ativa',
  cancelada: 'Cancelada',
  concluida: 'Concluída',
  pending: 'Pendente',
  active: 'Ativa',
  cancelled: 'Cancelada',
  completed: 'Concluída'
};

// Status de Workflow
export const WORKFLOW_STATUS: Record<string, string> = {
  entrada: 'Entrada',
  orcamentos: 'Orçamentos',
  metrologia: 'Metrologia',
  usinagem: 'Usinagem',
  montagem: 'Montagem',
  pronto: 'Pronto',
  garantia: 'Garantia',
  entregue: 'Entregue',
  pending: 'Pendente',
  in_progress: 'Em Andamento',
  completed: 'Concluído'
};

// Status de Compras
export const PURCHASE_STATUS: Record<string, string> = {
  pending: 'Pendente',
  pending_approval: 'Aguardando Aprovação',
  ordered: 'Pedido',
  approved: 'Aprovado',
  sent: 'Enviado',
  confirmed: 'Confirmado',
  in_transit: 'Em Trânsito',
  delivered: 'Entregue',
  received: 'Recebido',
  cancelled: 'Cancelado',
  in_progress: 'Em Andamento',
  completed: 'Concluído',
  draft: 'Rascunho',
};

// Status de Contas a Pagar/Receber
export const PAYMENT_STATUS: Record<string, string> = {
  pending: 'Pendente',
  paid: 'Pago',
  overdue: 'Vencido',
  cancelled: 'Cancelado',
  received: 'Recebido',
  partial: 'Parcial',
  processing: 'Processando',
  failed: 'Falhou'
};

// Status de PCP (Planejamento)
export const SCHEDULE_STATUS: Record<string, string> = {
  pending: 'Pendente',
  in_progress: 'Em Andamento',
  completed: 'Concluído',
  cancelled: 'Cancelado',
  planned: 'Planejado',
  delayed: 'Atrasado'
};

// Status Genéricos
export const GENERIC_STATUS: Record<string, string> = {
  active: 'Ativo',
  inactive: 'Inativo',
  enabled: 'Habilitado',
  disabled: 'Desabilitado',
  success: 'Sucesso',
  error: 'Erro',
  warning: 'Aviso',
  info: 'Informação',
  loading: 'Carregando',
  processing: 'Processando',
  failed: 'Falhou',
  done: 'Concluído'
};

// ========== AÇÕES E BOTÕES ==========

export const ACTIONS: Record<string, string> = {
  add: 'Adicionar',
  edit: 'Editar',
  delete: 'Excluir',
  remove: 'Remover',
  save: 'Salvar',
  cancel: 'Cancelar',
  submit: 'Enviar',
  create: 'Criar',
  update: 'Atualizar',
  view: 'Visualizar',
  details: 'Detalhes',
  actions: 'Ações',
  search: 'Buscar',
  filter: 'Filtrar',
  export: 'Exportar',
  import: 'Importar',
  print: 'Imprimir',
  download: 'Baixar',
  upload: 'Enviar',
  close: 'Fechar',
  back: 'Voltar',
  next: 'Próximo',
  previous: 'Anterior',
  confirm: 'Confirmar',
  yes: 'Sim',
  no: 'Não',
  ok: 'OK',
  apply: 'Aplicar',
  reset: 'Redefinir',
  clear: 'Limpar',
  select: 'Selecionar',
  deselect: 'Desselecionar',
  duplicate: 'Duplicar',
  copy: 'Copiar',
  paste: 'Colar',
  cut: 'Recortar',
  send: 'Enviar',
  refresh: 'Atualizar',
  reload: 'Recarregar',
  start: 'Iniciar',
  stop: 'Parar',
  pause: 'Pausar',
  resume: 'Retomar',
  finish: 'Finalizar',
  complete: 'Concluir',
  approve: 'Aprovar',
  reject: 'Rejeitar',
  archive: 'Arquivar',
  restore: 'Restaurar',
  enable: 'Habilitar',
  disable: 'Desabilitar',
  activate: 'Ativar',
  deactivate: 'Desativar',
  new: 'Novo',
  open: 'Abrir',
  expand: 'Expandir',
  collapse: 'Recolher',
  more: 'Mais',
  less: 'Menos',
  show: 'Mostrar',
  hide: 'Ocultar'
};

// ========== MENSAGENS COMUNS ==========

export const MESSAGES: Record<string, string> = {
  loading: 'Carregando...',
  saving: 'Salvando...',
  processing: 'Processando...',
  deleting: 'Excluindo...',
  updating: 'Atualizando...',
  creating: 'Criando...',
  success: 'Sucesso!',
  error: 'Erro!',
  warning: 'Atenção!',
  info: 'Informação',
  'confirm_delete': 'Tem certeza que deseja excluir?',
  'confirm_action': 'Tem certeza que deseja prosseguir?',
  'no_data': 'Nenhum dado encontrado',
  'no_results': 'Nenhum resultado encontrado',
  'select_option': 'Selecione uma opção',
  'required_field': 'Campo obrigatório',
  'invalid_format': 'Formato inválido',
  'operation_success': 'Operação realizada com sucesso',
  'operation_failed': 'Falha na operação',
  'changes_saved': 'Alterações salvas com sucesso',
  'changes_discarded': 'Alterações descartadas',
  'unsaved_changes': 'Você tem alterações não salvas'
};

// ========== CAMPOS E LABELS ==========

export const FIELDS: Record<string, string> = {
  name: 'Nome',
  description: 'Descrição',
  email: 'E-mail',
  phone: 'Telefone',
  address: 'Endereço',
  city: 'Cidade',
  state: 'Estado',
  country: 'País',
  zipcode: 'CEP',
  document: 'Documento',
  cpf: 'CPF',
  cnpj: 'CNPJ',
  date: 'Data',
  time: 'Hora',
  datetime: 'Data e Hora',
  status: 'Status',
  type: 'Tipo',
  category: 'Categoria',
  price: 'Preço',
  quantity: 'Quantidade',
  total: 'Total',
  subtotal: 'Subtotal',
  discount: 'Desconto',
  tax: 'Imposto',
  notes: 'Observações',
  comments: 'Comentários',
  attachments: 'Anexos',
  files: 'Arquivos',
  image: 'Imagem',
  photo: 'Foto',
  user: 'Usuário',
  password: 'Senha',
  confirm_password: 'Confirmar Senha',
  role: 'Função',
  permission: 'Permissão',
  active: 'Ativo',
  inactive: 'Inativo'
};

/**
 * Função genérica para traduzir status
 * @param status - Status em inglês
 * @param type - Tipo de status (budget, diagnostic, order, workflow, purchase, payment, schedule, generic)
 * @returns Status traduzido ou o original se não encontrar tradução
 */
export function translateStatus(
  status: string,
  type: 'budget' | 'diagnostic' | 'order' | 'workflow' | 'purchase' | 'payment' | 'schedule' | 'generic' = 'generic'
): string {
  const translations = {
    budget: BUDGET_STATUS,
    diagnostic: DIAGNOSTIC_STATUS,
    order: ORDER_STATUS,
    workflow: WORKFLOW_STATUS,
    purchase: PURCHASE_STATUS,
    payment: PAYMENT_STATUS,
    schedule: SCHEDULE_STATUS,
    generic: GENERIC_STATUS
  };

  return translations[type][status] || GENERIC_STATUS[status] || status;
}

/**
 * Função para traduzir ações
 */
export function translateAction(action: string): string {
  return ACTIONS[action.toLowerCase()] || action;
}

/**
 * Função para traduzir mensagens
 */
export function translateMessage(message: string): string {
  return MESSAGES[message.toLowerCase()] || message;
}

/**
 * Função para traduzir campos
 */
export function translateField(field: string): string {
  return FIELDS[field.toLowerCase()] || field;
}

/**
 * Função para obter a cor do badge baseado no status
 */
export function getStatusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  const positiveStatuses = ['approved', 'paid', 'received', 'completed', 'concluida', 'entregue'];
  const negativeStatuses = ['rejected', 'cancelled', 'overdue', 'cancelada'];
  const warningStatuses = ['pending', 'draft', 'partial', 'in_progress'];

  if (positiveStatuses.includes(status)) return 'default';
  if (negativeStatuses.includes(status)) return 'destructive';
  if (warningStatuses.includes(status)) return 'secondary';
  
  return 'outline';
}

