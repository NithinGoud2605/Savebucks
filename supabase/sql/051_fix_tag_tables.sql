-- Fix tag tables and ensure they exist with proper structure
-- This script ensures deal_tags and coupon_tags tables exist and are accessible

-- First, check if tags table exists and create if needed
CREATE TABLE IF NOT EXISTS public.tags (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  color TEXT DEFAULT '#3B82F6',
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create deal_tags junction table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.deal_tags (
  id SERIAL PRIMARY KEY,
  deal_id BIGINT NOT NULL,
  tag_id INTEGER NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(deal_id, tag_id)
);

-- Create coupon_tags junction table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.coupon_tags (
  id SERIAL PRIMARY KEY,
  coupon_id BIGINT NOT NULL,
  tag_id INTEGER NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(coupon_id, tag_id)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_deal_tags_deal_id ON public.deal_tags(deal_id);
CREATE INDEX IF NOT EXISTS idx_deal_tags_tag_id ON public.deal_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_coupon_tags_coupon_id ON public.coupon_tags(coupon_id);
CREATE INDEX IF NOT EXISTS idx_coupon_tags_tag_id ON public.coupon_tags(tag_id);

-- Enable RLS
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deal_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_tags ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Anyone can view tags" ON public.tags;
DROP POLICY IF EXISTS "Anyone can view deal tags" ON public.deal_tags;
DROP POLICY IF EXISTS "Anyone can view coupon tags" ON public.coupon_tags;
DROP POLICY IF EXISTS "Admin can manage tags" ON public.tags;
DROP POLICY IF EXISTS "Admin can manage deal tags" ON public.deal_tags;
DROP POLICY IF EXISTS "Admin can manage coupon tags" ON public.coupon_tags;

-- Create simple, permissive policies for admin operations
CREATE POLICY "Anyone can view tags" ON public.tags FOR SELECT USING (true);
CREATE POLICY "Anyone can view deal tags" ON public.deal_tags FOR SELECT USING (true);
CREATE POLICY "Anyone can view coupon tags" ON public.coupon_tags FOR SELECT USING (true);

-- Allow all operations for authenticated users (admin operations)
CREATE POLICY "Authenticated users can manage tags" ON public.tags FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can manage deal tags" ON public.deal_tags FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can manage coupon tags" ON public.coupon_tags FOR ALL USING (auth.role() = 'authenticated');

-- Function to update tag usage count
CREATE OR REPLACE FUNCTION update_tag_usage_count()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Increment usage count
    UPDATE public.tags 
    SET usage_count = usage_count + 1, updated_at = NOW()
    WHERE id = NEW.tag_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrement usage count
    UPDATE public.tags 
    SET usage_count = GREATEST(usage_count - 1, 0), updated_at = NOW()
    WHERE id = OLD.tag_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Create triggers to update usage count
DROP TRIGGER IF EXISTS trg_deal_tags_update_count ON public.deal_tags;
CREATE TRIGGER trg_deal_tags_update_count
  AFTER INSERT OR DELETE ON public.deal_tags
  FOR EACH ROW EXECUTE FUNCTION update_tag_usage_count();

DROP TRIGGER IF EXISTS trg_coupon_tags_update_count ON public.coupon_tags;
CREATE TRIGGER trg_coupon_tags_update_count
  AFTER INSERT OR DELETE ON public.coupon_tags
  FOR EACH ROW EXECUTE FUNCTION update_tag_usage_count();

-- Insert some sample tags if they don't exist
INSERT INTO public.tags (name, slug, color) VALUES
  ('Electronics', 'electronics', '#3B82F6'),
  ('Fashion', 'fashion', '#EF4444'),
  ('Home & Garden', 'home-garden', '#10B981'),
  ('Sports', 'sports', '#F59E0B'),
  ('Books', 'books', '#8B5CF6'),
  ('Beauty', 'beauty', '#EC4899'),
  ('Food & Drink', 'food-drink', '#F97316'),
  ('Travel', 'travel', '#06B6D4'),
  ('Health', 'health', '#84CC16'),
  ('Gaming', 'gaming', '#6366F1')
ON CONFLICT (slug) DO NOTHING;

-- Add comments
COMMENT ON TABLE public.tags IS 'Tags for categorizing deals and coupons';
COMMENT ON TABLE public.deal_tags IS 'Junction table linking deals to tags';
COMMENT ON TABLE public.coupon_tags IS 'Junction table linking coupons to tags';

-- Log success
DO $$
BEGIN
  RAISE NOTICE 'Tag tables created/verified successfully';
  RAISE NOTICE 'Tables: tags, deal_tags, coupon_tags';
  RAISE NOTICE 'Policies: permissive for authenticated users';
  RAISE NOTICE 'Triggers: usage count updates';
END $$;











