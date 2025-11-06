-- Migration: Public Schema - Types and Enums
-- Description: Creates all custom types and enums used in the public schema
-- Based on: backup/public-ddl.sql and types.ts

-- Create enum types
DO $$ BEGIN
    CREATE TYPE public.app_role AS ENUM ('owner', 'admin', 'manager', 'user', 'super_admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.base_calc_method AS ENUM (
        'percentual',
        'valor_fixo',
        'mva',
        'reducao_base',
        'substituicao_tributaria',
        'isento',
        'nao_incidencia'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.budget_status AS ENUM ('pendente', 'aprovado', 'reprovado', 'em_producao');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.classification_type AS ENUM ('produto', 'servico');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.customer_type AS ENUM ('oficina', 'direto');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.engine_component AS ENUM (
        'bloco',
        'eixo',
        'biela',
        'comando',
        'cabecote',
        'virabrequim',
        'pistao'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.expense_category AS ENUM (
        'fixed',
        'variable',
        'tax',
        'supplier',
        'salary',
        'equipment',
        'maintenance'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.filing_status AS ENUM ('rascunho', 'gerado', 'validado', 'enviado', 'erro');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.jurisdiction AS ENUM ('federal', 'estadual', 'municipal');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.operation_type AS ENUM ('venda', 'compra', 'prestacao_servico');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.order_status AS ENUM (
        'ativa',
        'concluida',
        'cancelada',
        'entregue',
        'pendente',
        'em_andamento',
        'aguardando_aprovacao'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.payment_method AS ENUM (
        'cash',
        'pix',
        'credit_card',
        'debit_card',
        'bank_transfer',
        'check'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.payment_status AS ENUM ('pending', 'paid', 'overdue', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.period_status AS ENUM ('aberto', 'fechado', 'transmitido');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.status_transition_type AS ENUM (
        'automatic',
        'manual',
        'approval_required',
        'conditional'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.transaction_type AS ENUM ('income', 'expense');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.workflow_status AS ENUM (
        'entrada',
        'metrologia',
        'usinagem',
        'montagem',
        'pronto',
        'garantia',
        'entregue'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

