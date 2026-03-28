ALTER TABLE public.purchase_quotations
  ADD COLUMN IF NOT EXISTS sent_at TIMESTAMPTZ;

CREATE OR REPLACE FUNCTION public.set_quotation_sent_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.status IN ('sent', 'waiting_proposals') AND NEW.sent_at IS NULL THEN
      NEW.sent_at := NOW();
    END IF;
    RETURN NEW;
  END IF;
  IF NEW.status IN ('sent', 'waiting_proposals')
     AND OLD.status NOT IN ('sent', 'waiting_proposals')
     AND NEW.sent_at IS NULL
  THEN
    NEW.sent_at := NOW();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_quotation_sent_at ON public.purchase_quotations;
CREATE TRIGGER trg_quotation_sent_at
  BEFORE INSERT OR UPDATE ON public.purchase_quotations
  FOR EACH ROW
  EXECUTE FUNCTION public.set_quotation_sent_at();

COMMENT ON COLUMN public.purchase_quotations.sent_at IS 'Momento em que a cotação completa foi enviada (sent/waiting_proposals)';
