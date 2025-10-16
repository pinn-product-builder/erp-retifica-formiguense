-- Add foreign key to orders in tax_calculations after orders table is created
ALTER TABLE public.tax_calculations 
  ADD CONSTRAINT tax_calculations_order_id_fkey 
  FOREIGN KEY (order_id) 
  REFERENCES public.orders(id) 
  ON DELETE SET NULL;

