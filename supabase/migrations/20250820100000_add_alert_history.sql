-- Migration: Add Alert History and Goals Configuration
-- Description: Adiciona tabela de histórico de alertas e sistema de metas configuráveis

-- Tabela de histórico de alertas
CREATE TABLE IF NOT EXISTS public.alert_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  alert_id UUID NOT NULL,
  org_id UUID NOT NULL,
  alert_type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'error', 'success')),
  dismissed_by UUID,
  dismissed_at TIMESTAMP WITH TIME ZONE,
  action_taken TEXT,
  action_taken_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (dismissed_by) REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Índices para performance
CREATE INDEX idx_alert_history_org_id ON public.alert_history(org_id);
CREATE INDEX idx_alert_history_alert_id ON public.alert_history(alert_id);
CREATE INDEX idx_alert_history_created_at ON public.alert_history(created_at DESC);
CREATE INDEX idx_alert_history_severity ON public.alert_history(severity);

-- Trigger para arquivar alertas quando são dispensados
CREATE OR REPLACE FUNCTION archive_dismissed_alert()
RETURNS TRIGGER AS $$
BEGIN
  -- Se o alerta foi desativado, arquivar no histórico
  IF OLD.is_active = true AND NEW.is_active = false THEN
    INSERT INTO public.alert_history (
      alert_id,
      org_id,
      alert_type,
      title,
      message,
      severity,
      dismissed_at,
      metadata
    ) VALUES (
      OLD.id,
      OLD.org_id,
      OLD.alert_type,
      OLD.title,
      OLD.message,
      OLD.severity,
      NOW(),
      OLD.metadata
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_archive_dismissed_alert
  AFTER UPDATE ON public.alerts
  FOR EACH ROW
  EXECUTE FUNCTION archive_dismissed_alert();

-- Expandir tabela kpi_targets para sistema de metas configurável
ALTER TABLE public.kpi_targets
  ADD COLUMN IF NOT EXISTS goal_type TEXT DEFAULT 'kpi' CHECK (goal_type IN ('kpi', 'custom', 'project')),
  ADD COLUMN IF NOT EXISTS progress_current NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS progress_unit TEXT DEFAULT 'number',
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'on_track', 'at_risk', 'delayed', 'completed')),
  ADD COLUMN IF NOT EXISTS assigned_to UUID[],
  ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  ADD COLUMN IF NOT EXISTS parent_goal_id UUID,
  ADD COLUMN IF NOT EXISTS milestones JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS notifications_enabled BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS auto_update_from_kpi BOOLEAN DEFAULT true;

-- Adicionar FK para parent_goal_id
ALTER TABLE public.kpi_targets
  ADD CONSTRAINT fk_parent_goal 
  FOREIGN KEY (parent_goal_id) 
  REFERENCES public.kpi_targets(id) 
  ON DELETE SET NULL;

-- Índices adicionais para metas
CREATE INDEX IF NOT EXISTS idx_kpi_targets_status ON public.kpi_targets(status);
CREATE INDEX IF NOT EXISTS idx_kpi_targets_priority ON public.kpi_targets(priority);
CREATE INDEX IF NOT EXISTS idx_kpi_targets_goal_type ON public.kpi_targets(goal_type);
CREATE INDEX IF NOT EXISTS idx_kpi_targets_parent_goal ON public.kpi_targets(parent_goal_id);

-- Função para atualizar status da meta automaticamente
CREATE OR REPLACE FUNCTION update_goal_status()
RETURNS TRIGGER AS $$
DECLARE
  progress_percentage NUMERIC;
  days_remaining INTEGER;
BEGIN
  -- Calcular porcentagem de progresso
  IF NEW.target_value > 0 THEN
    progress_percentage := (NEW.progress_current / NEW.target_value) * 100;
  ELSE
    progress_percentage := 0;
  END IF;
  
  -- Calcular dias restantes
  days_remaining := EXTRACT(DAY FROM (NEW.target_period_end - NOW()));
  
  -- Atualizar status baseado no progresso e prazo
  IF progress_percentage >= 100 THEN
    NEW.status := 'completed';
  ELSIF days_remaining < 0 THEN
    NEW.status := 'delayed';
  ELSIF progress_percentage >= 80 THEN
    NEW.status := 'on_track';
  ELSIF days_remaining <= 7 AND progress_percentage < 80 THEN
    NEW.status := 'at_risk';
  ELSIF progress_percentage >= 50 THEN
    NEW.status := 'on_track';
  ELSE
    NEW.status := 'at_risk';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_goal_status
  BEFORE INSERT OR UPDATE OF progress_current, target_value, target_period_end
  ON public.kpi_targets
  FOR EACH ROW
  EXECUTE FUNCTION update_goal_status();

-- Enable RLS
ALTER TABLE public.alert_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies para alert_history
CREATE POLICY "Users can view alert history from their organization"
  ON public.alert_history
  FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM public.organization_users 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert alert history for their organization"
  ON public.alert_history
  FOR INSERT
  WITH CHECK (
    org_id IN (
      SELECT org_id FROM public.organization_users 
      WHERE user_id = auth.uid()
    )
  );

-- Comentários
COMMENT ON TABLE public.alert_history IS 'Histórico de alertas dispensados e ações tomadas';
COMMENT ON COLUMN public.alert_history.action_taken IS 'Descrição da ação tomada pelo usuário em resposta ao alerta';
COMMENT ON COLUMN public.kpi_targets.goal_type IS 'Tipo de meta: kpi (baseada em KPI), custom (personalizada), project (projeto)';
COMMENT ON COLUMN public.kpi_targets.milestones IS 'Array de marcos intermediários: [{name, target, date, completed}]';
COMMENT ON COLUMN public.kpi_targets.auto_update_from_kpi IS 'Se true, progress_current é atualizado automaticamente do KPI vinculado';
