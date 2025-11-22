import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { corsHeaders } from '../_shared/cors.ts';

interface BudgetApprovalRequest {
  budget_id: string;
  approval_type: 'total' | 'partial' | 'parcial';
  approved_amount: number;
  registered_by?: string;
  approval_notes?: string;
}

interface Part {
  part_code: string;
  part_name: string;
  quantity: number;
  unit_price: number;
}

interface DetailedBudget {
  id: string;
  order_id: string;
  org_id: string;
  parts: Part[];
  status: string;
}

interface ProcessResult {
  success: boolean;
  message: string;
  order_id?: string;
  order_status?: string;
  reservations_created?: number;
  purchase_needs_created?: number;
  alerts_created?: number;
  error?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const jwt = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(jwt);
    
    if (userError || !user) {
      console.error('Erro de autenticação:', userError);
      return new Response(
        JSON.stringify({ error: 'Invalid authorization' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const { budget_id, approval_type, approved_amount, registered_by, approval_notes }: BudgetApprovalRequest = await req.json();

    if (!budget_id || !approval_type || !approved_amount) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: budget_id, approval_type, approved_amount' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!['total', 'partial', 'parcial'].includes(approval_type)) {
      return new Response(
        JSON.stringify({ error: 'Invalid approval_type. Must be: total, partial, or parcial' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const finalRegisteredBy = registered_by || user.id;

    console.log(`📋 Processando aprovação de orçamento: ${budget_id}, tipo: ${approval_type}`);

    const { data: budget, error: budgetError } = await supabaseAdmin
      .from('detailed_budgets')
      .select('id, order_id, org_id, parts, status')
      .eq('id', budget_id)
      .single();

    if (budgetError || !budget) {
      console.error('❌ Erro ao buscar orçamento:', budgetError);
      return new Response(
        JSON.stringify({ error: 'Orçamento não encontrado', details: budgetError?.message }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const detailedBudget = budget as DetailedBudget;
    console.log(`✅ Orçamento encontrado: order_id=${detailedBudget.order_id}, org_id=${detailedBudget.org_id}`);

    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('id, status, customer_id')
      .eq('id', detailedBudget.order_id)
      .single();

    if (orderError || !order) {
      console.error('❌ Erro ao buscar ordem:', orderError);
      return new Response(
        JSON.stringify({ error: 'Ordem não encontrada', details: orderError?.message }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const oldOrderStatus = order.status as string;
    console.log(`📊 Status atual da ordem: ${oldOrderStatus}`);

    if (!['total', 'partial', 'parcial'].includes(approval_type)) {
      console.log(`⚠️ Tipo de aprovação não processado: ${approval_type}`);
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: `Tipo de aprovação '${approval_type}' não requer processamento automático` 
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
  
    const parts = detailedBudget.parts as Part[];
    let reservationsCreated = 0;
    let purchaseNeedsCreated = 0;
    let alertsCreated = 0;

    console.log(`🔧 Processando ${parts.length} peças...`);

    for (const part of parts) {
      const partCode = part.part_code;
      const partName = part.part_name;
      const partQuantity = part.quantity;
      const partUnitPrice = part.unit_price;

      console.log(`  📦 Processando peça: ${partCode} (qtd: ${partQuantity})`);

      // Buscar ID da peça no inventário
      const { data: inventoryPart } = await supabaseAdmin
        .from('parts_inventory')
        .select('id, quantity')
        .eq('part_code', partCode)
        .eq('org_id', detailedBudget.org_id)
        .limit(1)
        .single();

      // Calcular estoque disponível
      const { data: stockData } = await supabaseAdmin
        .from('parts_inventory')
        .select('quantity')
        .eq('part_code', partCode)
        .eq('org_id', detailedBudget.org_id);

      const availableStock = stockData?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;
      const shortage = Math.max(0, partQuantity - availableStock);

      console.log(`    📊 Estoque disponível: ${availableStock}, Necessário: ${partQuantity}, Falta: ${shortage}`);

      // Se não há estoque suficiente, criar necessidade de compra
      if (shortage > 0) {
        console.log(`    ⚠️ Estoque insuficiente, criando purchase_need...`);

        // Criar/atualizar alerta de estoque
        const { error: stockAlertError } = await supabaseAdmin
          .from('stock_alerts')
          .upsert({
            org_id: detailedBudget.org_id,
            part_code: partCode,
            part_name: partName,
            current_stock: availableStock,
            minimum_stock: Math.max(1, partQuantity),
            alert_type: 'insufficient_for_order',
            alert_level: 'critical',
            is_active: true
          }, {
            onConflict: 'org_id,part_code'
          });

        if (!stockAlertError) {
          alertsCreated++;
          console.log(`    ✅ Alerta de estoque criado/atualizado`);
        } else {
          console.error(`    ❌ Erro ao criar alerta de estoque:`, stockAlertError);
        }

        
        const priorityLevel = shortage > partQuantity * 0.5 ? 'high' : 
                             availableStock === 0 ? 'critical' : 'normal';

        const { data: existingPurchaseNeed } = await supabaseAdmin
          .from('purchase_needs')
          .select('id')
          .eq('org_id', detailedBudget.org_id)
          .eq('part_code', partCode)
          .eq('status', 'pending')
          .limit(1)
          .single();

          console.log('existingPurchaseNeed', JSON.stringify(existingPurchaseNeed, null, 2));

        let purchaseNeedError;
        if (existingPurchaseNeed?.id) {
          try {
          const { error } = await supabaseAdmin
            .from('purchase_needs')
            .update({
              part_name: partName,
              required_quantity: partQuantity,
              available_quantity: availableStock,
              priority_level: priorityLevel,
              need_type: 'planned',
              related_orders: [{ order_id: detailedBudget.order_id }],
              estimated_cost: partUnitPrice * shortage,
              delivery_urgency_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              updated_at: new Date().toISOString()
            })
            .eq('id', existingPurchaseNeed.id);

            console.log('purchaseNeedError update', JSON.stringify(error, null, 2));
            purchaseNeedError = error;
          } catch (error) {
            console.log('purchaseNeedError update', JSON.stringify(error, null, 2));
            purchaseNeedError = error;
          }
        } else {
          try {
          const { error } = await supabaseAdmin
            .from('purchase_needs')
            .insert({
              org_id: detailedBudget.org_id,
              part_code: partCode,
              part_name: partName,
              required_quantity: partQuantity,
              available_quantity: availableStock,
              priority_level: priorityLevel,
              need_type: 'planned',
              related_orders: [{ order_id: detailedBudget.order_id }],
              estimated_cost: partUnitPrice * shortage,
              delivery_urgency_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              status: 'pending'
            });

            console.log('purchaseNeedError insert', JSON.stringify(error, null, 2));
            purchaseNeedError = error;
          } catch (error) {
            console.log('purchaseNeedError insert', JSON.stringify(error, null, 2));
            purchaseNeedError = error;
          }
        }

        if (!purchaseNeedError) {
          purchaseNeedsCreated++;
          console.log(`    ✅ Purchase need criado/atualizado`);
          
          const { data: purchaseNeedData } = await supabaseAdmin
            .from('purchase_needs')
            .select('id')
            .eq('org_id', detailedBudget.org_id)
            .eq('part_code', partCode)
            .eq('status', 'pending')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          if (purchaseNeedData?.id) {
            const { data: existingAlert } = await supabaseAdmin
              .from('alerts')
              .select('id')
              .eq('org_id', detailedBudget.org_id)
              .eq('alert_type', 'purchase_need')
              .eq('metadata->>purchase_need_id', purchaseNeedData.id)
              .eq('is_active', true)
              .limit(1)
              .single();

            const severity = priorityLevel === 'critical' ? 'error' : 
                           priorityLevel === 'high' ? 'warning' : 'info';
            
            const alertTitle = `Necessidade de Compra: ${partName}`;
            const alertMessage = `Necessário comprar ${shortage} unidades de ${partName}` + 
              (availableStock > 0 ? ` (Estoque atual: ${availableStock})` : ' (Estoque esgotado)') +
              ` - Urgência: ${new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0].split('-').reverse().join('/')}`;

            const alertData = {
              org_id: detailedBudget.org_id,
              alert_type: 'purchase_need',
              title: alertTitle,
              message: alertMessage,
              severity: severity,
              is_active: true,
              is_dismissible: true,
              action_label: 'Ver Necessidades',
              action_url: '/compras',
              metadata: {
                purchase_need_id: purchaseNeedData.id,
                part_code: partCode,
                part_name: partName,
                required_quantity: partQuantity,
                available_quantity: availableStock,
                shortage_quantity: shortage,
                priority_level: priorityLevel,
                need_type: 'planned',
                status: 'pending',
                estimated_cost: partUnitPrice * shortage,
                delivery_urgency_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
              },
              expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
            };

            let alertError;
            if (existingAlert?.id) {
              const { error } = await supabaseAdmin
                .from('alerts')
                .update(alertData)
                .eq('id', existingAlert.id);
              alertError = error;
            } else {
              const { error } = await supabaseAdmin
                .from('alerts')
                .insert(alertData);
              alertError = error;
            }

            if (!alertError) {
              console.log(`    ✅ Alerta criado/atualizado na tabela alerts`);
            } else {
              console.error(`    ⚠️ Erro ao criar alerta na tabela alerts:`, alertError);
            }
          }
        } else {
          console.error(`    ❌ Erro ao criar purchase need:`, purchaseNeedError);
        }
      }

      // Se houver estoque, reservar o que tem
      if (availableStock > 0 && inventoryPart?.id) {
        const { data: existingReservation } = await supabaseAdmin
          .from('parts_reservations')
          .select('id')
          .eq('budget_id', budget_id)
          .eq('part_code', partCode)
          .eq('order_id', detailedBudget.order_id)
          .limit(1)
          .single();

        if (!existingReservation) {
          const quantityToReserve = Math.min(availableStock, partQuantity);
          
          const { error: reservationError } = await supabaseAdmin
            .from('parts_reservations')
            .insert({
              order_id: detailedBudget.order_id,
              budget_id: budget_id,
              part_id: inventoryPart.id,
              part_code: partCode,
              part_name: partName,
              quantity_reserved: quantityToReserve,
              unit_cost: partUnitPrice,
              reservation_status: 'reserved',
              reserved_by: finalRegisteredBy,
              org_id: detailedBudget.org_id
            });

          if (!reservationError) {
            reservationsCreated++;
            console.log(`    ✅ Reserva criada: ${quantityToReserve} unidades`);
            
            const { error: movementError } = await supabaseAdmin
              .from('inventory_movements')
              .insert({
                org_id: detailedBudget.org_id,
                part_id: inventoryPart.id,
                movement_type: 'reserva',
                quantity: quantityToReserve,
                previous_quantity: availableStock,
                new_quantity: availableStock - quantityToReserve,
                reason: 'Reserva automática para orçamento aprovado',
                created_by: finalRegisteredBy,
                metadata: {
                  budget_id: budget_id,
                  order_id: detailedBudget.order_id,
                  part_code: partCode,
                  reservation_type: 'budget_approval'
                }
              });

            if (movementError) {
              console.error(`    ⚠️ Erro ao criar movimento de estoque:`, movementError);
            }
          } else {
            console.error(`    ❌ Erro ao criar reserva:`, reservationError);
          }
        } else {
          console.log(`    ℹ️ Reserva já existe para esta peça`);
        }
      }
    }

    console.log(`✅ Processamento de peças concluído: ${reservationsCreated} reservas, ${purchaseNeedsCreated} purchase needs, ${alertsCreated} alertas`);

    // ETAPA 4: Criar contas a receber
    const { data: existingAccount } = await supabaseAdmin
      .from('accounts_receivable')
      .select('id')
      .eq('order_id', detailedBudget.order_id)
      .eq('budget_id', budget_id)
      .limit(1)
      .single();

    let accountsReceivableError;
    if (existingAccount?.id) {
      const { error } = await supabaseAdmin
        .from('accounts_receivable')
        .update({
          amount: approved_amount,
          due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          status: 'pending',
          updated_at: new Date().toISOString()
        })
        .eq('id', existingAccount.id);
      accountsReceivableError = error;
    } else {
      const { error } = await supabaseAdmin
        .from('accounts_receivable')
        .insert({
          order_id: detailedBudget.order_id,
          budget_id: budget_id,
          customer_id: order.customer_id,
          installment_number: 1,
          total_installments: 1,
          amount: approved_amount,
          due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          status: 'pending',
          org_id: detailedBudget.org_id
        });
      accountsReceivableError = error;
    }

    if (accountsReceivableError) {
      console.error('⚠️ Erro ao criar conta a receber:', accountsReceivableError);
    } else {
      console.log('✅ Conta a receber criada/atualizada');
    }

    const { error: budgetUpdateError } = await supabaseAdmin
      .from('detailed_budgets')
      .update({
        status: 'approved',
        updated_at: new Date().toISOString()
      })
      .eq('id', budget_id);

    if (budgetUpdateError) {
      console.error('❌ Erro ao atualizar status do orçamento:', budgetUpdateError);
      throw budgetUpdateError;
    }

    console.log('✅ Status do orçamento atualizado para "approved"');

    const { error: orderUpdateError } = await supabaseAdmin
      .from('orders')
      .update({
        status: 'aprovada',
        updated_at: new Date().toISOString()
      })
      .eq('id', detailedBudget.order_id);

    if (orderUpdateError) {
      console.error('❌ Erro ao atualizar status da ordem:', orderUpdateError);
      throw orderUpdateError;
    }

    console.log(`✅ Status da ordem atualizado de "${oldOrderStatus}" para "aprovada"`);

    // Criar workflows para a ordem baseado no tipo de motor
    const { error: workflowError } = await supabaseAdmin.rpc('create_workflow_from_engine_type', {
      p_order_id: detailedBudget.order_id
    });

    if (workflowError) {
      console.error('⚠️ Erro ao criar workflows:', workflowError);
    } else {
      console.log('✅ Workflows criados para a ordem');
    }

    const { error: historyError } = await supabaseAdmin
      .from('order_status_history')
      .insert({
        order_id: detailedBudget.order_id,
        old_status: oldOrderStatus,
        new_status: 'aprovada',
        changed_by: finalRegisteredBy,
        notes: `Orçamento aprovado - ${approval_type}` + (approval_notes ? `: ${approval_notes}` : ''),
        org_id: detailedBudget.org_id
      });

    if (historyError) {
      console.error('⚠️ Erro ao criar histórico:', historyError);
    } else {
      console.log('✅ Histórico de status criado');
    }

    const { data: existingApproval, error: checkError } = await supabaseAdmin
      .from('budget_approvals')
      .select('id, approval_method')
      .eq('budget_id', budget_id)
      .limit(1)
      .maybeSingle();

    let approvalError;
    if (existingApproval?.id) {
      const updateData: Record<string, unknown> = {
        approval_type: approval_type,
        approved_amount: approved_amount,
        registered_by: finalRegisteredBy,
        approval_notes: approval_notes || null
      };
      
      if (!existingApproval.approval_method) {
        updateData.approval_method = 'manual';
      }
      
      const { error } = await supabaseAdmin
        .from('budget_approvals')
        .update(updateData)
        .eq('id', existingApproval.id);
      approvalError = error;
    } else {
      const { error } = await supabaseAdmin
        .from('budget_approvals')
        .insert({
          budget_id: budget_id,
          approval_type: approval_type,
          approved_amount: approved_amount,
            approval_method: 'manual',
          registered_by: finalRegisteredBy,
          approval_notes: approval_notes || null,
          org_id: detailedBudget.org_id
        });
      approvalError = error;
    }

    if (approvalError) {
      console.error('⚠️ Erro ao criar registro de aprovação:', approvalError);
    } else {
      console.log('✅ Registro de aprovação criado/atualizado');
    }

    // Resultado final
    const result: ProcessResult = {
      success: true,
      message: 'Aprovação processada com sucesso',
      order_id: detailedBudget.order_id,
      order_status: 'aprovada',
      reservations_created: reservationsCreated,
      purchase_needs_created: purchaseNeedsCreated,
      alerts_created: alertsCreated
    };

    console.log('🎉 Processamento concluído com sucesso!', result);

    return new Response(
      JSON.stringify(result),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('❌ Erro ao processar aprovação:', error);
    
    const result: ProcessResult = {
      success: false,
      message: 'Erro ao processar aprovação de orçamento',
      error: error instanceof Error ? error.message : String(error)
    };

    return new Response(
      JSON.stringify(result),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

