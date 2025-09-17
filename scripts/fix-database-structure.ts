#!/usr/bin/env tsx

/**
 * Script para corrigir a estrutura do banco de dados
 * 
 * Este script aplica as correções necessárias para resolver inconsistências
 * entre a documentação e a implementação atual das tabelas de usuários.
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';
import dotenv from 'dotenv';
dotenv.config();

// Configuração do Supabase (usar variáveis de ambiente)
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log(supabaseUrl, supabaseServiceKey);

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
  console.log('🔧 Iniciando correção da estrutura do banco de dados...\n');

  try {
    // 1. Ler o arquivo de migração
    const migrationPath = join(__dirname, '../supabase/migrations/fix_user_tables_structure.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');

    console.log('📄 Aplicando migração de correção...');

    // 2. Executar a migração
    const { error } = await supabase.rpc('exec', { sql: migrationSQL });

    if (error) {
      throw error;
    }

    console.log('✅ Migração aplicada com sucesso!');

    // 3. Verificar a estrutura das tabelas
    console.log('\n🔍 Verificando estrutura das tabelas...');

    // Verificar tabela profiles
    const { data: profilesColumns, error: profilesError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'profiles')
      .eq('table_schema', 'public');

    if (profilesError) {
      console.warn('⚠️  Não foi possível verificar a estrutura da tabela profiles');
    } else {
      console.log('\n📋 Estrutura da tabela profiles:');
      profilesColumns?.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? '(nullable)' : '(not null)'}`);
      });
    }

    // Verificar tabela organization_users
    const { data: orgUsersColumns, error: orgUsersError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'organization_users')
      .eq('table_schema', 'public');

    if (orgUsersError) {
      console.warn('⚠️  Não foi possível verificar a estrutura da tabela organization_users');
    } else {
      console.log('\n📋 Estrutura da tabela organization_users:');
      orgUsersColumns?.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? '(nullable)' : '(not null)'}`);
      });
    }

    // 4. Testar as funções
    console.log('\n🧪 Testando funções do banco...');

    const { data: currentOrgTest, error: currentOrgError } = await supabase.rpc('current_org_id');
    if (currentOrgError) {
      console.warn('⚠️  Função current_org_id() apresentou erro:', currentOrgError.message);
    } else {
      console.log('✅ Função current_org_id() está funcionando');
    }

    console.log('\n🎉 Correção da estrutura do banco concluída com sucesso!');
    console.log('\n📝 Próximos passos:');
    console.log('  1. Regenerar os types do Supabase: npm run types:generate');
    console.log('  2. Testar a tela de Gestão de Usuários');
    console.log('  3. Verificar se todas as funcionalidades estão funcionando');

  } catch (error) {
    console.error('❌ Erro ao aplicar correções:', error);
    process.exit(1);
  }
}

// Executar apenas se chamado diretamente
if (require.main === module) {
  main().catch(console.error);
}

export { main as fixDatabaseStructure };
