-- Storage setup for images
-- This should be run in Supabase dashboard or via CLI

-- Create storage bucket for images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'images', 
  'images', 
  true, 
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Storage policies for images bucket
-- Allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'images' AND 
    auth.role() = 'authenticated'
  );

-- Allow public read access to images
CREATE POLICY "Public can view images" ON storage.objects
  FOR SELECT USING (bucket_id = 'images');

-- Allow users to update their own uploaded images
CREATE POLICY "Users can update own images" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'images' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow users to delete their own images
CREATE POLICY "Users can delete own images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'images' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow admins to manage all images
CREATE POLICY "Admins can manage all images" ON storage.objects
  FOR ALL USING (
    bucket_id = 'images' AND 
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Add company logo upload functionality
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS logo_uploaded_by UUID REFERENCES public.profiles(id);
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS logo_uploaded_at TIMESTAMPTZ DEFAULT NOW();

-- Function to handle image cleanup when records are deleted
CREATE OR REPLACE FUNCTION cleanup_entity_images()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Delete associated images when entity is deleted
  DELETE FROM public.images 
  WHERE entity_type = TG_ARGV[0] AND entity_id = OLD.id;
  
  -- Note: Storage files should be cleaned up via a scheduled job
  -- as we can't directly delete from storage in triggers
  
  RETURN OLD;
END;
$$;

-- Create cleanup triggers
DROP TRIGGER IF EXISTS cleanup_deal_images ON public.deals;
CREATE TRIGGER cleanup_deal_images
  AFTER DELETE ON public.deals
  FOR EACH ROW EXECUTE FUNCTION cleanup_entity_images('deal');

DROP TRIGGER IF EXISTS cleanup_coupon_images ON public.coupons;
CREATE TRIGGER cleanup_coupon_images
  AFTER DELETE ON public.coupons
  FOR EACH ROW EXECUTE FUNCTION cleanup_entity_images('coupon');

DROP TRIGGER IF EXISTS cleanup_profile_images ON public.profiles;
CREATE TRIGGER cleanup_profile_images
  AFTER DELETE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION cleanup_entity_images('profile');

-- Function to optimize image storage paths
CREATE OR REPLACE FUNCTION get_image_storage_path(
  entity_type TEXT,
  entity_id BIGINT,
  user_id UUID,
  filename TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN CASE entity_type
    WHEN 'profile' THEN 'profiles/' || user_id || '/' || filename
    WHEN 'deal' THEN 'deals/' || entity_id || '/' || filename
    WHEN 'coupon' THEN 'coupons/' || entity_id || '/' || filename
    WHEN 'company' THEN 'companies/' || entity_id || '/' || filename
    ELSE 'misc/' || user_id || '/' || filename
  END;
END;
$$;
