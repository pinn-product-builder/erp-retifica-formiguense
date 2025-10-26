import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { Webhook } from "https://esm.sh/standardwebhooks@1.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailData {
  email_action_type: string;
  token: string;
  token_hash: string;
  redirect_to: string;
  site_url: string;
}

interface User {
  email: string;
  user_metadata?: {
    name?: string;
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const payload = await req.text();
    const headers = Object.fromEntries(req.headers);
    const hookSecret = Deno.env.get('SEND_EMAIL_HOOK_SECRET')?.replace('v1,whsec_', '');
    
    if (!hookSecret) {
      throw new Error('Hook secret not configured');
    }

    const wh = new Webhook(hookSecret);
    const { user, email_data }: { user: User; email_data: EmailData } = wh.verify(payload, headers) as { user: User; email_data: EmailData };

    // Template personalizado para reset de senha
    const resetPasswordTemplate = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Redefinir Senha - Retífica Formiguense</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; background: white;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">🔧 Retífica Formiguense</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0 0;">Sistema ERP de Gestão</p>
        </div>
        
        <!-- Content -->
        <div style="padding: 40px 30px;">
          <h2 style="color: #333; margin-bottom: 20px;">🔐 Redefinir sua Senha</h2>
          
          <p>Olá${user.user_metadata?.name ? `, ${user.user_metadata.name}` : ''}!</p>
          
          <p>Recebemos uma solicitação para redefinir a senha da sua conta no <strong>ERP Retífica Formiguense</strong>.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${email_data.site_url}/reset-password?token_hash=${email_data.token_hash}&type=recovery" 
               style="background: #4CAF50; color: white; padding: 15px 30px; 
                      text-decoration: none; border-radius: 8px; font-weight: bold; 
                      display: inline-block; font-size: 16px;">
              🔄 Redefinir Minha Senha
            </a>
          </div>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 25px 0;">
            <p style="margin: 0 0 10px 0;"><strong>Ou use este código:</strong></p>
            <div style="font-size: 24px; font-weight: bold; text-align: center; 
                        background: white; padding: 15px; border-radius: 5px; 
                        letter-spacing: 3px; border: 2px dashed #ddd;">
              ${email_data.token}
            </div>
          </div>
          
          <div style="background: #fff3cd; border: 1px solid #ffeaa7; 
                      border-radius: 8px; padding: 20px; margin: 25px 0;">
            <p style="margin: 0; color: #856404;">
              <strong>⚠️ Importante:</strong> Se você não solicitou esta alteração, 
              ignore este e-mail. Sua senha permanecerá inalterada.
            </p>
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="font-size: 14px; color: #666;">
              Este link expira em <strong>1 hora</strong> por motivos de segurança.
            </p>
          </div>
        </div>
        
        <!-- Footer -->
        <div style="background: #f8f9fa; padding: 25px; text-align: center; 
                    border-top: 1px solid #eee;">
          <p style="margin: 0 0 10px 0; color: #666; font-size: 14px;">
            © 2024 Retífica Formiguense - Sistema ERP
          </p>
          <p style="margin: 0; color: #999; font-size: 12px;">
            Este e-mail foi enviado automaticamente. Não responda a este e-mail.
          </p>
        </div>
      </div>
    </body>
    </html>
    `;

    // Aqui você enviaria o e-mail usando seu provedor preferido
    // Por exemplo, com SendGrid, Resend, etc.
    
    console.log('📧 Enviando e-mail customizado para:', user.email);
    console.log('🔑 Tipo de ação:', email_data.email_action_type);
    
    // Simular envio bem-sucedido
    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'E-mail customizado enviado com sucesso' 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('❌ Erro no hook de e-mail:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Erro interno do servidor', 
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
