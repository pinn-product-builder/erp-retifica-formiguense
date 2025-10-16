-- Create system_config table for dynamic configuration
CREATE TABLE public.system_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID REFERENCES public.organizations(id),
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  data_type TEXT NOT NULL DEFAULT 'string' CHECK (data_type IN ('string', 'number', 'boolean', 'json')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(org_id, key)
);

-- Enable RLS
ALTER TABLE public.system_config ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view system_config from their organization"
ON public.system_config
FOR SELECT
USING (org_id = current_org_id() OR org_id IS NULL);

CREATE POLICY "Users can create system_config for their organization"
ON public.system_config
FOR INSERT
WITH CHECK (org_id = current_org_id());

CREATE POLICY "Users can update system_config from their organization"
ON public.system_config
FOR UPDATE
USING (org_id = current_org_id())
WITH CHECK (org_id = current_org_id());

CREATE POLICY "Users can delete system_config from their organization"
ON public.system_config
FOR DELETE
USING (org_id = current_org_id());

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_system_config_updated_at
BEFORE UPDATE ON public.system_config
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();