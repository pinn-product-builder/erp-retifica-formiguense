import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateUserRequest {
  email: string;
  name: string;
  role: string;
  organizationId: string;
  tempPassword: string;
  profileId?: string;
  currentOrganizationId?: string; // Organização atual do usuário que está criando
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Verificar se é um POST request
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Parse request body
    const { email, name, role, organizationId, tempPassword, profileId, currentOrganizationId }: CreateUserRequest = await req.json();

    if (!email || !name || !role || !organizationId || !tempPassword) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: email, name, role, organizationId, tempPassword' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Criar cliente Supabase com service role para ter permissões administrativas
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

    console.log('🔍 Tentando criar usuário via admin:', { email, name, role });

    // Criar novo usuário usando admin client (não faz login automático)
    const { data: signUpData, error: signUpError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: tempPassword,
      user_metadata: {
        name: name,
        created_by_admin: true,
        needs_password_change: true
      },
      email_confirm: true // Confirma o email automaticamente
    });

    if (signUpError) {
      console.error('🔴 Erro do Supabase Admin:', signUpError);
      
      // Verificar se é usuário já existente
      const isUserExists = 
        signUpError.message?.toLowerCase().includes('user already registered') ||
        signUpError.message?.toLowerCase().includes('already registered') ||
        signUpError.message?.toLowerCase().includes('user_already_exists') ||
        signUpError.code === 'user_already_exists' ||
        signUpError.status === 422 ||
        signUpError.status === 400;
      
      if (isUserExists) {
        return new Response(
          JSON.stringify({ 
            error: 'user_already_exists',
            message: 'Este email já está cadastrado no sistema.'
          }),
          { 
            status: 422, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
      
      // Para outros erros, retornar erro genérico
      return new Response(
        JSON.stringify({ 
          error: 'signup_failed',
          message: signUpError.message || 'Falha ao criar usuário. Tente novamente.'
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!signUpData.user) {
      return new Response(
        JSON.stringify({ error: 'User creation failed - no user data returned' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('✅ Usuário criado no auth:', signUpData.user.id);

    // Inserir informações básicas do usuário na tabela user_basic_info (se existir)
    try {
      const basicInfoData = {
        user_id: signUpData.user.id,
        name: name,
        email: email,
      };

      const { error: basicInfoError } = await supabaseAdmin
        .from('user_basic_info')
        .insert([basicInfoData]);

      if (basicInfoError) {
        console.warn('Error inserting into user_basic_info:', basicInfoError);
      }
    } catch (error) {
      console.warn('user_basic_info table not available');
    }

    // Verificar se o usuário já existe em alguma organização
    const { data: existingOrgUser, error: checkError } = await supabaseAdmin
      .from('organization_users')
      .select('organization_id, role')
      .eq('user_id', signUpData.user.id)
      .eq('is_active', true);

    if (checkError) {
      console.error('Error checking existing organization membership:', checkError);
    }

    const userOrganizations = existingOrgUser || [];
    const organizationsToAdd = new Set<string>();

    // Sempre adicionar à organização especificada
    organizationsToAdd.add(organizationId);

    // Se existe uma organização atual diferente da especificada, adicionar também
    if (currentOrganizationId && currentOrganizationId !== organizationId) {
      organizationsToAdd.add(currentOrganizationId);
    }

    // Verificar quais organizações o usuário ainda não faz parte
    const existingOrgIds = userOrganizations.map(ou => ou.organization_id);
    const newOrganizations = Array.from(organizationsToAdd).filter(orgId => 
      !existingOrgIds.includes(orgId)
    );

    console.log('🏢 Organizações para adicionar:', newOrganizations);

    // Inserir o usuário nas organizações necessárias
    const organizationInserts = [];
    
    for (const orgId of newOrganizations) {
      // Usar o role especificado para a organização principal, 'user' para as outras
      const userRole = orgId === organizationId ? role : 'user';
      
      organizationInserts.push({
        organization_id: orgId,
        user_id: signUpData.user.id,
        role: userRole,
        is_active: true,
        joined_at: new Date().toISOString()
      });
    }

    if (organizationInserts.length > 0) {
      const { error: orgUserError } = await supabaseAdmin
        .from('organization_users')
        .insert(organizationInserts);

      if (orgUserError) {
        console.error('Error adding user to organizations:', orgUserError);
        // Se falhar ao adicionar às organizações, deletar o usuário criado
        await supabaseAdmin.auth.admin.deleteUser(signUpData.user.id);
        throw orgUserError;
      }

      console.log(`✅ Usuário adicionado a ${organizationInserts.length} organização(ões)`);
    } else {
      console.log('ℹ️ Usuário já fazia parte de todas as organizações necessárias');
    }

    // Criar o novo usuário para retornar na resposta
    const newUser = {
      id: crypto.randomUUID(),
      user_id: signUpData.user.id,
      role: role,
      is_active: true,
      created_at: new Date().toISOString(),
      user: {
        id: signUpData.user.id,
        name: name,
        email: email,
        is_super_admin: false
      },
      organizations_added: Array.from(organizationsToAdd)
    };

    const message = organizationInserts.length > 1 
      ? `Usuário criado e vinculado a ${organizationInserts.length} organizações`
      : 'Usuário criado com sucesso';

    return new Response(
      JSON.stringify({ 
        success: true,
        user: newUser,
        message: message,
        organizations_count: organizationInserts.length
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in create-user-admin function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
