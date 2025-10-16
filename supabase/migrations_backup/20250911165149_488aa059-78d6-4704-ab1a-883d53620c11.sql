-- Create order status history table for tracking changes
CREATE TABLE public.order_status_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  old_status TEXT,
  new_status TEXT NOT NULL,
  changed_by UUID REFERENCES auth.users(id),
  changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT,
  org_id UUID REFERENCES public.organizations(id)
);

-- Enable RLS on order_status_history
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;

-- Create policies for order_status_history
CREATE POLICY "Users can view order_status_history from their organization" 
ON public.order_status_history 
FOR SELECT 
USING (org_id = current_org_id());

CREATE POLICY "Users can create order_status_history for their organization" 
ON public.order_status_history 
FOR INSERT 
WITH CHECK (org_id = current_org_id());

-- Create order materials table for tracking parts used
CREATE TABLE public.order_materials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  part_id UUID REFERENCES public.parts_inventory(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_cost NUMERIC(10,2) DEFAULT 0.00,
  total_cost NUMERIC(10,2) GENERATED ALWAYS AS (quantity * unit_cost) STORED,
  used_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  used_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  org_id UUID REFERENCES public.organizations(id),
  part_name TEXT NOT NULL,
  part_code TEXT,
  notes TEXT
);

-- Enable RLS on order_materials
ALTER TABLE public.order_materials ENABLE ROW LEVEL SECURITY;

-- Create policies for order_materials
CREATE POLICY "Users can manage order_materials for their organization" 
ON public.order_materials 
FOR ALL 
USING (org_id = current_org_id())
WITH CHECK (org_id = current_org_id());

-- Create order warranties table
CREATE TABLE public.order_warranties (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  warranty_type TEXT NOT NULL CHECK (warranty_type IN ('pecas', 'servico', 'total')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  terms TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  org_id UUID REFERENCES public.organizations(id)
);

-- Enable RLS on order_warranties
ALTER TABLE public.order_warranties ENABLE ROW LEVEL SECURITY;

-- Create policies for order_warranties
CREATE POLICY "Users can manage order_warranties for their organization" 
ON public.order_warranties 
FOR ALL 
USING (org_id = current_org_id())
WITH CHECK (org_id = current_org_id());

-- Add missing fields to orders table
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS estimated_delivery DATE;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS actual_delivery DATE;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 1;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS warranty_months INTEGER DEFAULT 3;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS consultant_id UUID REFERENCES public.employees(id);

-- Create function to update order status history
CREATE OR REPLACE FUNCTION public.log_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.order_status_history (
      order_id, old_status, new_status, changed_by, org_id
    ) VALUES (
      NEW.id, OLD.status, NEW.status, auth.uid(), NEW.org_id
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for order status changes
DROP TRIGGER IF EXISTS order_status_change_trigger ON public.orders;
CREATE TRIGGER order_status_change_trigger
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.log_order_status_change();

-- Create function to automatically create warranty entries
CREATE OR REPLACE FUNCTION public.create_order_warranty()
RETURNS TRIGGER AS $$
BEGIN
  -- Create warranty when order is completed
  IF NEW.status = 'concluido' AND (OLD.status IS NULL OR OLD.status != 'concluido') THEN
    INSERT INTO public.order_warranties (
      order_id,
      warranty_type,
      start_date,
      end_date,
      terms,
      org_id
    ) VALUES (
      NEW.id,
      'total',
      CURRENT_DATE,
      CURRENT_DATE + INTERVAL '1 month' * COALESCE(NEW.warranty_months, 3),
      'Garantia padrão para serviços executados',
      NEW.org_id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic warranty creation
DROP TRIGGER IF EXISTS create_warranty_trigger ON public.orders;
CREATE TRIGGER create_warranty_trigger
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.create_order_warranty();

-- Add updated_at triggers
CREATE TRIGGER update_order_materials_updated_at
  BEFORE UPDATE ON public.order_materials
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_order_warranties_updated_at
  BEFORE UPDATE ON public.order_warranties
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();