
-- Criar enum para tipos de cliente
CREATE TYPE public.customer_type AS ENUM ('oficina', 'direto');

-- Criar enum para status de workflow
CREATE TYPE public.workflow_status AS ENUM ('entrada', 'metrologia', 'usinagem', 'montagem', 'pronto', 'garantia', 'entregue');

-- Criar enum para componentes do motor
CREATE TYPE public.engine_component AS ENUM ('bloco', 'eixo', 'biela', 'comando', 'cabecote');

-- Criar enum para status do orçamento
CREATE TYPE public.budget_status AS ENUM ('pendente', 'aprovado', 'reprovado', 'em_producao');

-- Criar enum para status da OS
CREATE TYPE public.order_status AS ENUM ('ativa', 'concluida', 'cancelada');

-- Tabela de consultores
CREATE TABLE public.consultants (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE,
    phone TEXT,
    commission_rate DECIMAL(5,2) DEFAULT 0.00,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de clientes/oficinas
CREATE TABLE public.customers (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    type customer_type NOT NULL,
    name TEXT NOT NULL,
    document TEXT NOT NULL, -- CPF ou CNPJ
    phone TEXT NOT NULL,
    email TEXT,
    address TEXT,
    -- Dados específicos da oficina (quando aplicável)
    workshop_name TEXT,
    workshop_cnpj TEXT,
    workshop_contact TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de motores
CREATE TABLE public.engines (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    type TEXT NOT NULL, -- leve, pesado, agricola, estacionario
    brand TEXT NOT NULL,
    model TEXT NOT NULL,
    fuel_type TEXT NOT NULL, -- gasolina, etanol, flex, diesel, gnv
    serial_number TEXT,
    is_complete BOOLEAN DEFAULT false,
    assembly_state TEXT, -- montado, desmontado, parcial
    has_block BOOLEAN DEFAULT false,
    has_head BOOLEAN DEFAULT false,
    has_crankshaft BOOLEAN DEFAULT false,
    has_piston BOOLEAN DEFAULT false,
    has_connecting_rod BOOLEAN DEFAULT false,
    turns_manually BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela principal de ordens de serviço
CREATE TABLE public.orders (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    order_number TEXT NOT NULL UNIQUE, -- Gerado automaticamente: RF-YYYY-NNNN
    customer_id UUID REFERENCES public.customers(id) NOT NULL,
    consultant_id UUID REFERENCES public.consultants(id) NOT NULL,
    engine_id UUID REFERENCES public.engines(id) NOT NULL,
    
    -- Dados da coleta
    collection_date DATE NOT NULL,
    collection_time TIME NOT NULL,
    collection_location TEXT NOT NULL,
    driver_name TEXT NOT NULL,
    failure_reason TEXT,
    
    -- Status geral da OS
    status order_status DEFAULT 'ativa',
    
    -- Observações e notas
    initial_observations TEXT,
    final_observations TEXT,
    
    -- Datas importantes
    estimated_delivery DATE,
    actual_delivery DATE,
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de workflow por componente
CREATE TABLE public.order_workflow (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
    component engine_component NOT NULL,
    status workflow_status DEFAULT 'entrada',
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    assigned_to TEXT, -- Nome do funcionário responsável
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    
    -- Garantir um registro por componente por OS
    UNIQUE(order_id, component)
);

-- Tabela de fotos por etapa
CREATE TABLE public.order_photos (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
    component engine_component,
    workflow_step workflow_status,
    photo_type TEXT NOT NULL, -- frente, traseira, lateral1, lateral2, cabecote, carter, etiqueta, metrologia, usinagem, etc
    file_path TEXT NOT NULL,
    file_name TEXT NOT NULL,
    description TEXT,
    uploaded_by TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de orçamentos
CREATE TABLE public.budgets (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
    component engine_component NOT NULL,
    description TEXT NOT NULL,
    labor_cost DECIMAL(10,2) DEFAULT 0.00,
    parts_cost DECIMAL(10,2) DEFAULT 0.00,
    total_cost DECIMAL(10,2) GENERATED ALWAYS AS (labor_cost + parts_cost) STORED,
    status budget_status DEFAULT 'pendente',
    approved_at TIMESTAMP WITH TIME ZONE,
    approved_by TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de apontamentos de tempo
CREATE TABLE public.time_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
    component engine_component NOT NULL,
    workflow_step workflow_status NOT NULL,
    employee_name TEXT NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    duration_minutes INTEGER GENERATED ALWAYS AS (
        CASE 
            WHEN end_time IS NOT NULL THEN 
                EXTRACT(EPOCH FROM (end_time - start_time))/60 
            ELSE NULL 
        END
    ) STORED,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de controle de peças
CREATE TABLE public.parts_inventory (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    part_name TEXT NOT NULL,
    part_code TEXT,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_cost DECIMAL(10,2) DEFAULT 0.00,
    supplier TEXT,
    component engine_component,
    status TEXT DEFAULT 'pendente', -- pendente, separado, aplicado
    separated_at TIMESTAMP WITH TIME ZONE,
    applied_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Função para gerar número da OS automaticamente
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
    current_year TEXT;
    sequence_num INTEGER;
    order_number TEXT;
BEGIN
    current_year := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
    
    -- Buscar o próximo número sequencial para o ano atual
    SELECT COALESCE(
        MAX(SUBSTRING(order_number FROM 'RF-' || current_year || '-(\d+)')::INTEGER), 
        0
    ) + 1
    INTO sequence_num
    FROM public.orders
    WHERE order_number LIKE 'RF-' || current_year || '-%';
    
    -- Formatar como RF-YYYY-NNNN
    order_number := 'RF-' || current_year || '-' || LPAD(sequence_num::TEXT, 4, '0');
    
    RETURN order_number;
END;
$$ LANGUAGE plpgsql;

-- Trigger para gerar número da OS automaticamente
CREATE OR REPLACE FUNCTION set_order_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
        NEW.order_number := generate_order_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_order_number
    BEFORE INSERT ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION set_order_number();

-- Trigger para criar workflow automático quando uma OS é criada
CREATE OR REPLACE FUNCTION create_default_workflow()
RETURNS TRIGGER AS $$
DECLARE
    component_name engine_component;
BEGIN
    -- Criar entrada de workflow para cada componente
    FOREACH component_name IN ARRAY ENUM_RANGE(NULL::engine_component) LOOP
        INSERT INTO public.order_workflow (order_id, component, status)
        VALUES (NEW.id, component_name, 'entrada');
    END LOOP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_workflow
    AFTER INSERT ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION create_default_workflow();

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger de updated_at em todas as tabelas relevantes
CREATE TRIGGER trigger_updated_at_consultants
    BEFORE UPDATE ON public.consultants
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_updated_at_customers
    BEFORE UPDATE ON public.customers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_updated_at_engines
    BEFORE UPDATE ON public.engines
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_updated_at_orders
    BEFORE UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_updated_at_order_workflow
    BEFORE UPDATE ON public.order_workflow
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_updated_at_budgets
    BEFORE UPDATE ON public.budgets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.consultants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.engines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_workflow ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parts_inventory ENABLE ROW LEVEL SECURITY;

-- Políticas RLS temporárias (permissivas para desenvolvimento)
-- TODO: Implementar políticas mais restritivas baseadas em autenticação

CREATE POLICY "Enable all access for development" ON public.consultants FOR ALL USING (true);
CREATE POLICY "Enable all access for development" ON public.customers FOR ALL USING (true);
CREATE POLICY "Enable all access for development" ON public.engines FOR ALL USING (true);
CREATE POLICY "Enable all access for development" ON public.orders FOR ALL USING (true);
CREATE POLICY "Enable all access for development" ON public.order_workflow FOR ALL USING (true);
CREATE POLICY "Enable all access for development" ON public.order_photos FOR ALL USING (true);
CREATE POLICY "Enable all access for development" ON public.budgets FOR ALL USING (true);
CREATE POLICY "Enable all access for development" ON public.time_logs FOR ALL USING (true);
CREATE POLICY "Enable all access for development" ON public.parts_inventory FOR ALL USING (true);

-- Inserir dados iniciais para testes
INSERT INTO public.consultants (name, email, commission_rate) VALUES
('José Silva', 'jose@retifica.com', 5.00),
('Maria Santos', 'maria@retifica.com', 5.00),
('Carlos Oliveira', 'carlos@retifica.com', 5.00);

-- Criar bucket para fotos no Storage
INSERT INTO storage.buckets (id, name, public) VALUES ('order-photos', 'order-photos', true);

-- Política de storage para fotos
CREATE POLICY "Enable all access for order photos" ON storage.objects FOR ALL USING (bucket_id = 'order-photos');
