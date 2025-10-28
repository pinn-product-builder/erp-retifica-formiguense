-- =====================================================
-- MÓDULO: Financeiro - Contas a Pagar
-- DADOS DE SEED (EXEMPLO E DESENVOLVIMENTO)
-- =====================================================

-- =====================================================
-- CATEGORIAS PADRÃO
-- =====================================================
-- Inserir categorias padrão para todas as organizações existentes

DO $$
DECLARE
  v_org RECORD;
BEGIN
  FOR v_org IN SELECT id FROM organizations LOOP
    -- Inserir categorias padrão se não existirem
    INSERT INTO expense_categories (org_id, name, code, description, color, is_active)
    VALUES
      (v_org.id, 'Peças e Materiais', 'PEC', 'Compra de peças e materiais para reparo', '#3B82F6', true),
      (v_org.id, 'Mão de Obra', 'MDO', 'Pagamento de serviços e mão de obra', '#10B981', true),
      (v_org.id, 'Aluguel', 'ALU', 'Aluguel de imóveis e equipamentos', '#8B5CF6', true),
      (v_org.id, 'Energia Elétrica', 'ENE', 'Conta de luz', '#F59E0B', true),
      (v_org.id, 'Água', 'AGU', 'Conta de água', '#06B6D4', true),
      (v_org.id, 'Internet/Telefone', 'COM', 'Serviços de comunicação', '#EC4899', true),
      (v_org.id, 'Marketing', 'MKT', 'Despesas com marketing e publicidade', '#F97316', true),
      (v_org.id, 'Impostos', 'IMP', 'Pagamento de impostos e taxas', '#EF4444', true),
      (v_org.id, 'Seguros', 'SEG', 'Seguros diversos', '#6366F1', true),
      (v_org.id, 'Limpeza e Conservação', 'LIM', 'Materiais e serviços de limpeza', '#14B8A6', true),
      (v_org.id, 'Equipamentos', 'EQP', 'Compra e manutenção de equipamentos', '#A855F7', true),
      (v_org.id, 'Outras Despesas', 'OUT', 'Despesas não classificadas', '#6B7280', true)
    ON CONFLICT (org_id, name) DO NOTHING;
  END LOOP;
END $$;

-- =====================================================
-- EXEMPLO: Contas de Desenvolvimento
-- =====================================================
-- Apenas para ambiente de desenvolvimento
-- Inserir contas de exemplo para a primeira organização

DO $$
DECLARE
  v_org_id UUID;
  v_supplier_id UUID;
  v_category_id UUID;
  v_user_id UUID;
BEGIN
  -- Pegar primeira organização
  SELECT id INTO v_org_id FROM organizations LIMIT 1;
  
  IF v_org_id IS NULL THEN
    RAISE NOTICE 'Nenhuma organização encontrada. Pulando seed de contas.';
    RETURN;
  END IF;
  
  -- Pegar um fornecedor de exemplo
  SELECT id INTO v_supplier_id FROM suppliers WHERE org_id = v_org_id LIMIT 1;
  
  IF v_supplier_id IS NULL THEN
    RAISE NOTICE 'Nenhum fornecedor encontrado. Pulando seed de contas.';
    RETURN;
  END IF;
  
  -- Pegar categoria "Peças e Materiais"
  SELECT id INTO v_category_id 
  FROM expense_categories 
  WHERE org_id = v_org_id AND code = 'PEC' 
  LIMIT 1;
  
  -- Pegar um usuário da org
  SELECT user_id INTO v_user_id
  FROM organization_users
  WHERE organization_id = v_org_id
  LIMIT 1;
  
  -- Inserir contas de exemplo
  INSERT INTO payable_accounts (
    org_id, supplier_id, category_id, amount, due_date,
    description, status, created_by
  ) VALUES
    -- Conta pendente normal
    (
      v_org_id, v_supplier_id, v_category_id, 
      5200.00, 
      CURRENT_DATE + INTERVAL '15 days',
      'Compra de peças para reforma de motor diesel - Pedido #1234',
      'pending',
      v_user_id
    ),
    
    -- Conta vencendo em breve (alerta)
    (
      v_org_id, v_supplier_id, v_category_id,
      850.00,
      CURRENT_DATE + INTERVAL '3 days',
      'Material de escritório e consumíveis',
      'pending',
      v_user_id
    ),
    
    -- Conta vencida
    (
      v_org_id, v_supplier_id, v_category_id,
      1250.00,
      CURRENT_DATE - INTERVAL '5 days',
      'Manutenção preventiva equipamentos',
      'overdue',
      v_user_id
    ),
    
    -- Conta paga
    (
      v_org_id, v_supplier_id, v_category_id,
      3400.00,
      CURRENT_DATE - INTERVAL '30 days',
      'Fornecimento mensal de peças',
      'paid',
      v_user_id
    );
    
  -- Atualizar a conta paga com dados de pagamento
  UPDATE payable_accounts
  SET 
    paid_at = CURRENT_DATE - INTERVAL '25 days',
    paid_amount = 3400.00,
    payment_method = 'pix',
    paid_by = v_user_id
  WHERE description = 'Fornecimento mensal de peças'
    AND org_id = v_org_id;
    
  RAISE NOTICE 'Seed de contas a pagar concluído com sucesso.';
  
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Erro no seed: %', SQLERRM;
END $$;

-- =====================================================
-- COMENTÁRIOS
-- =====================================================

COMMENT ON TABLE public.expense_categories IS 
'Seed executado: Categorias padrão criadas automaticamente para todas as organizações.';

-- =====================================================
-- CLEANUP (se necessário resetar dados de teste)
-- =====================================================

-- Para limpar dados de seed em desenvolvimento:
-- DELETE FROM payable_accounts WHERE description LIKE '%Pedido #1234%';
-- DELETE FROM expense_categories WHERE code IN ('PEC', 'MDO', 'ALU', ...);
