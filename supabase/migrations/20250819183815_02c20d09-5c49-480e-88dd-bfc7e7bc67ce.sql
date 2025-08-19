-- Fix security warning: Function Search Path Mutable
-- Update the function to have immutable search_path

CREATE OR REPLACE FUNCTION update_jurisdiction_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';