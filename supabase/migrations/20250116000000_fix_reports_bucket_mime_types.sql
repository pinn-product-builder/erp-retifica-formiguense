-- Create dedicated bucket for budget approval images
-- This migration creates a new bucket specifically for budget approval documents

-- Create budget-approvals bucket for image uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('budget-approvals', 'budget-approvals', false, 10485760, ARRAY['image/jpeg', 'image/jpg', 'image/png'])
ON CONFLICT (id) DO UPDATE SET
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png'],
  file_size_limit = 10485760;

-- Create RLS policies for budget-approvals bucket
CREATE POLICY "Users can view budget approval images from their organization" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'budget-approvals' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can upload budget approval images for their organization" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'budget-approvals' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update budget approval images for their organization" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'budget-approvals' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete budget approval images for their organization" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'budget-approvals' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Add comment for documentation
COMMENT ON TABLE storage.buckets IS 'Storage buckets configuration - budget-approvals bucket created for budget approval image uploads';
