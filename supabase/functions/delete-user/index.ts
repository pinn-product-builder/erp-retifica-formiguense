import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DeleteUserRequest {
  userId: string;
  organizationId: string;
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
    const { userId, organizationId }: DeleteUserRequest = await req.json();

    if (!userId || !organizationId) {
      return new Response(
        JSON.stringify({ error: 'Missing userId or organizationId' }),
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

    // Verificar se o usuário está em outras organizações
    const { data: otherOrgs, error: otherOrgsError } = await supabaseAdmin
      .from('organization_users')
      .select('organization_id')
      .eq('user_id', userId)
      .neq('organization_id', organizationId);

    if (otherOrgsError) {
      throw otherOrgsError;
    }

    // Remover da organização atual
    const { error: removeOrgError } = await supabaseAdmin
      .from('organization_users')
      .delete()
      .eq('organization_id', organizationId)
      .eq('user_id', userId);

    if (removeOrgError) {
      throw removeOrgError;
    }

    let deletedCompletely = false;

    // Se não está em outras organizações, deletar completamente
    if (!otherOrgs || otherOrgs.length === 0) {
      // Deletar das tabelas relacionadas primeiro
      
      // 1. Deletar de user_basic_info se existir
      try {
        await supabaseAdmin
          .from('user_basic_info')
          .delete()
          .eq('user_id', userId);
      } catch (error) {
        console.warn('user_basic_info deletion failed or table does not exist:', error);
      }

      // 2. Deletar de profiles
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .delete()
        .eq('user_id', userId);

      if (profileError) {
        console.error('Error deleting profile:', profileError);
        throw profileError;
      }

      // 3. Deletar da tabela auth.users usando admin client
      const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);

      if (authError) {
        console.error('Error deleting from auth.users:', authError);
        throw authError;
      }

      deletedCompletely = true;
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        deletedCompletely,
        message: deletedCompletely 
          ? 'Usuário removido completamente do sistema' 
          : 'Usuário removido da organização mas permanece em outras'
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in delete-user function:', error);
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
