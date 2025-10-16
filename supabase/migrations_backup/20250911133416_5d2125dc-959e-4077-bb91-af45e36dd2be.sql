-- PCP: Production Planning and Control improvements
CREATE TABLE production_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES orders(id),
  component engine_component NOT NULL,
  planned_start_date DATE NOT NULL,
  planned_end_date DATE NOT NULL,
  actual_start_date DATE,
  actual_end_date DATE,
  estimated_hours DECIMAL(8,2) DEFAULT 0,
  actual_hours DECIMAL(8,2) DEFAULT 0,
  priority INTEGER DEFAULT 1,
  status TEXT DEFAULT 'planned',
  assigned_to TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  org_id UUID REFERENCES organizations(id)
);

-- Resource capacity management
CREATE TABLE resource_capacity (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  resource_name TEXT NOT NULL,
  resource_type TEXT NOT NULL, -- 'equipment', 'workstation', 'employee'
  daily_capacity_hours DECIMAL(8,2) DEFAULT 8,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  org_id UUID REFERENCES organizations(id)
);

-- Production alerts
CREATE TABLE production_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  alert_type TEXT NOT NULL, -- 'delay', 'overdue', 'resource_conflict'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  severity TEXT DEFAULT 'warning', -- 'info', 'warning', 'error', 'critical'
  order_id UUID REFERENCES orders(id),
  schedule_id UUID REFERENCES production_schedules(id),
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  org_id UUID REFERENCES organizations(id)
);

-- COMPRAS: Complete purchasing system
CREATE TABLE suppliers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  cnpj TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  contact_person TEXT,
  payment_terms TEXT,
  delivery_days INTEGER DEFAULT 0,
  rating DECIMAL(3,2) DEFAULT 5.00,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  org_id UUID REFERENCES organizations(id)
);

-- Purchase requisitions
CREATE TABLE purchase_requisitions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  requisition_number TEXT NOT NULL,
  requested_by UUID REFERENCES auth.users(id),
  department TEXT,
  priority TEXT DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
  justification TEXT,
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'cancelled'
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  total_estimated_value DECIMAL(15,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  org_id UUID REFERENCES organizations(id)
);

-- Purchase requisition items
CREATE TABLE purchase_requisition_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  requisition_id UUID NOT NULL REFERENCES purchase_requisitions(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  description TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(15,2),
  total_price DECIMAL(15,2),
  urgency_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Purchase orders
CREATE TABLE purchase_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  po_number TEXT NOT NULL,
  requisition_id UUID REFERENCES purchase_requisitions(id),
  supplier_id UUID NOT NULL REFERENCES suppliers(id),
  status TEXT DEFAULT 'pending', -- 'pending', 'sent', 'confirmed', 'partially_received', 'completed', 'cancelled'
  order_date DATE DEFAULT CURRENT_DATE,
  expected_delivery DATE,
  actual_delivery DATE,
  total_value DECIMAL(15,2) DEFAULT 0,
  terms TEXT,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  org_id UUID REFERENCES organizations(id)
);

-- Purchase order items
CREATE TABLE purchase_order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  po_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  description TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(15,2) NOT NULL,
  total_price DECIMAL(15,2) NOT NULL,
  received_quantity INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Quotations
CREATE TABLE quotations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  requisition_id UUID NOT NULL REFERENCES purchase_requisitions(id),
  supplier_id UUID NOT NULL REFERENCES suppliers(id),
  quote_number TEXT,
  quote_date DATE DEFAULT CURRENT_DATE,
  validity_date DATE,
  total_value DECIMAL(15,2) DEFAULT 0,
  delivery_time INTEGER, -- days
  terms TEXT,
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  org_id UUID REFERENCES organizations(id)
);

-- Quotation items
CREATE TABLE quotation_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quotation_id UUID NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  description TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(15,2) NOT NULL,
  total_price DECIMAL(15,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- PESSOAS: Enhanced people management
CREATE TABLE employees (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_number TEXT NOT NULL UNIQUE,
  user_id UUID REFERENCES auth.users(id),
  full_name TEXT NOT NULL,
  cpf TEXT UNIQUE,
  hire_date DATE DEFAULT CURRENT_DATE,
  position TEXT NOT NULL,
  department TEXT,
  salary DECIMAL(15,2),
  hourly_rate DECIMAL(8,2),
  commission_rate DECIMAL(5,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  phone TEXT,
  email TEXT,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  org_id UUID REFERENCES organizations(id)
);

-- Work schedules
CREATE TABLE work_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES employees(id),
  shift_name TEXT NOT NULL,
  monday_start TIME,
  monday_end TIME,
  tuesday_start TIME,
  tuesday_end TIME,
  wednesday_start TIME,
  wednesday_end TIME,
  thursday_start TIME,
  thursday_end TIME,
  friday_start TIME,
  friday_end TIME,
  saturday_start TIME,
  saturday_end TIME,
  sunday_start TIME,
  sunday_end TIME,
  effective_from DATE DEFAULT CURRENT_DATE,
  effective_to DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  org_id UUID REFERENCES organizations(id)
);

-- Time tracking
CREATE TABLE employee_time_tracking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES employees(id),
  date DATE NOT NULL,
  clock_in TIME,
  clock_out TIME,
  break_duration INTEGER DEFAULT 0, -- minutes
  total_hours DECIMAL(8,2),
  overtime_hours DECIMAL(8,2) DEFAULT 0,
  status TEXT DEFAULT 'present', -- 'present', 'absent', 'vacation', 'sick'
  notes TEXT,
  approved_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  org_id UUID REFERENCES organizations(id)
);

-- Performance reviews
CREATE TABLE performance_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES employees(id),
  reviewer_id UUID NOT NULL REFERENCES auth.users(id),
  review_period_start DATE NOT NULL,
  review_period_end DATE NOT NULL,
  overall_rating DECIMAL(3,2), -- 1.00 to 5.00
  productivity_score DECIMAL(3,2),
  quality_score DECIMAL(3,2),
  punctuality_score DECIMAL(3,2),
  teamwork_score DECIMAL(3,2),
  goals TEXT,
  achievements TEXT,
  improvement_areas TEXT,
  comments TEXT,
  status TEXT DEFAULT 'draft', -- 'draft', 'submitted', 'approved'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  org_id UUID REFERENCES organizations(id)
);

-- Commission calculations
CREATE TABLE commission_calculations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES employees(id),
  period_month INTEGER NOT NULL,
  period_year INTEGER NOT NULL,
  base_sales DECIMAL(15,2) DEFAULT 0,
  commission_rate DECIMAL(5,2) DEFAULT 0,
  calculated_commission DECIMAL(15,2) DEFAULT 0,
  bonus DECIMAL(15,2) DEFAULT 0,
  deductions DECIMAL(15,2) DEFAULT 0,
  final_commission DECIMAL(15,2) DEFAULT 0,
  status TEXT DEFAULT 'calculated', -- 'calculated', 'approved', 'paid'
  approved_by UUID REFERENCES auth.users(id),
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  org_id UUID REFERENCES organizations(id)
);

-- Enable RLS on all tables
ALTER TABLE production_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_capacity ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_requisitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_requisition_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_time_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE commission_calculations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for organization-based access
-- Production Schedules
CREATE POLICY "Users can manage production_schedules for their organization" ON production_schedules
FOR ALL USING (org_id = current_org_id()) WITH CHECK (org_id = current_org_id());

-- Resource Capacity
CREATE POLICY "Users can manage resource_capacity for their organization" ON resource_capacity
FOR ALL USING (org_id = current_org_id()) WITH CHECK (org_id = current_org_id());

-- Production Alerts
CREATE POLICY "Users can manage production_alerts for their organization" ON production_alerts
FOR ALL USING (org_id = current_org_id()) WITH CHECK (org_id = current_org_id());

-- Suppliers
CREATE POLICY "Users can manage suppliers for their organization" ON suppliers
FOR ALL USING (org_id = current_org_id()) WITH CHECK (org_id = current_org_id());

-- Purchase Requisitions
CREATE POLICY "Users can manage purchase_requisitions for their organization" ON purchase_requisitions
FOR ALL USING (org_id = current_org_id()) WITH CHECK (org_id = current_org_id());

-- Purchase Requisition Items
CREATE POLICY "Users can manage purchase_requisition_items through requisitions" ON purchase_requisition_items
FOR ALL USING (EXISTS (
  SELECT 1 FROM purchase_requisitions pr 
  WHERE pr.id = purchase_requisition_items.requisition_id 
  AND pr.org_id = current_org_id()
));

-- Purchase Orders
CREATE POLICY "Users can manage purchase_orders for their organization" ON purchase_orders
FOR ALL USING (org_id = current_org_id()) WITH CHECK (org_id = current_org_id());

-- Purchase Order Items
CREATE POLICY "Users can manage purchase_order_items through orders" ON purchase_order_items
FOR ALL USING (EXISTS (
  SELECT 1 FROM purchase_orders po 
  WHERE po.id = purchase_order_items.po_id 
  AND po.org_id = current_org_id()
));

-- Quotations
CREATE POLICY "Users can manage quotations for their organization" ON quotations
FOR ALL USING (org_id = current_org_id()) WITH CHECK (org_id = current_org_id());

-- Quotation Items
CREATE POLICY "Users can manage quotation_items through quotations" ON quotation_items
FOR ALL USING (EXISTS (
  SELECT 1 FROM quotations q 
  WHERE q.id = quotation_items.quotation_id 
  AND q.org_id = current_org_id()
));

-- Employees
CREATE POLICY "Users can manage employees for their organization" ON employees
FOR ALL USING (org_id = current_org_id()) WITH CHECK (org_id = current_org_id());

-- Work Schedules
CREATE POLICY "Users can manage work_schedules for their organization" ON work_schedules
FOR ALL USING (org_id = current_org_id()) WITH CHECK (org_id = current_org_id());

-- Employee Time Tracking
CREATE POLICY "Users can manage employee_time_tracking for their organization" ON employee_time_tracking
FOR ALL USING (org_id = current_org_id()) WITH CHECK (org_id = current_org_id());

-- Performance Reviews
CREATE POLICY "Users can manage performance_reviews for their organization" ON performance_reviews
FOR ALL USING (org_id = current_org_id()) WITH CHECK (org_id = current_org_id());

-- Commission Calculations
CREATE POLICY "Users can manage commission_calculations for their organization" ON commission_calculations
FOR ALL USING (org_id = current_org_id()) WITH CHECK (org_id = current_org_id());

-- Triggers for updated_at
CREATE TRIGGER update_production_schedules_updated_at
  BEFORE UPDATE ON production_schedules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_resource_capacity_updated_at
  BEFORE UPDATE ON resource_capacity
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_suppliers_updated_at
  BEFORE UPDATE ON suppliers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_purchase_requisitions_updated_at
  BEFORE UPDATE ON purchase_requisitions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_purchase_orders_updated_at
  BEFORE UPDATE ON purchase_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quotations_updated_at
  BEFORE UPDATE ON quotations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_employees_updated_at
  BEFORE UPDATE ON employees
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_performance_reviews_updated_at
  BEFORE UPDATE ON performance_reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_commission_calculations_updated_at
  BEFORE UPDATE ON commission_calculations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Generate requisition number function
CREATE OR REPLACE FUNCTION generate_requisition_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_year TEXT;
  sequence_num INTEGER;
  req_number TEXT;
BEGIN
  current_year := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
  
  SELECT COALESCE(
    MAX(SUBSTRING(requisition_number FROM 'REQ-' || current_year || '-(\d+)')::INTEGER), 
    0
  ) + 1
  INTO sequence_num
  FROM purchase_requisitions
  WHERE requisition_number LIKE 'REQ-' || current_year || '-%';
  
  req_number := 'REQ-' || current_year || '-' || LPAD(sequence_num::TEXT, 4, '0');
  
  RETURN req_number;
END;
$$;

-- Generate PO number function  
CREATE OR REPLACE FUNCTION generate_po_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_year TEXT;
  sequence_num INTEGER;
  po_number TEXT;
BEGIN
  current_year := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
  
  SELECT COALESCE(
    MAX(SUBSTRING(po_number FROM 'PO-' || current_year || '-(\d+)')::INTEGER), 
    0
  ) + 1
  INTO sequence_num
  FROM purchase_orders
  WHERE po_number LIKE 'PO-' || current_year || '-%';
  
  po_number := 'PO-' || current_year || '-' || LPAD(sequence_num::TEXT, 4, '0');
  
  RETURN po_number;
END;
$$;

-- Auto-set requisition number trigger
CREATE OR REPLACE FUNCTION set_requisition_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.requisition_number IS NULL OR NEW.requisition_number = '' THEN
    NEW.requisition_number := generate_requisition_number();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_purchase_requisition_number
  BEFORE INSERT ON purchase_requisitions
  FOR EACH ROW EXECUTE FUNCTION set_requisition_number();

-- Auto-set PO number trigger
CREATE OR REPLACE FUNCTION set_po_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.po_number IS NULL OR NEW.po_number = '' THEN
    NEW.po_number := generate_po_number();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_purchase_order_number
  BEFORE INSERT ON purchase_orders
  FOR EACH ROW EXECUTE FUNCTION set_po_number();