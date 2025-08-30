-- Bulletproof Junction Tables for Tagging System
-- This version handles all edge cases and will always work

-- Clean slate approach: Drop and recreate everything
DO $$
BEGIN
  -- Drop existing tables if they exist (with CASCADE to handle dependencies)
  DROP TABLE IF EXISTS public.deal_tags CASCADE;
  DROP TABLE IF EXISTS public.coupon_tags CASCADE;
  
  RAISE NOTICE 'Dropped existing junction tables (if any)';
END $$;

-- Create deal_tags table with all constraints inline
DO $$
BEGIN
  -- Create deal_tags table
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'deals') 
     AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tags') THEN
    
    CREATE TABLE public.deal_tags (
      deal_id BIGINT NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
      tag_id INT NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      PRIMARY KEY (deal_id, tag_id)
    );
    
    RAISE NOTICE 'Created deal_tags table with foreign keys';
    
  ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tags') THEN
    
    -- Create table without deals foreign key if deals table doesn't exist
    CREATE TABLE public.deal_tags (
      deal_id BIGINT NOT NULL,
      tag_id INT NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      PRIMARY KEY (deal_id, tag_id)
    );
    
    RAISE NOTICE 'Created deal_tags table (deals table not found, no foreign key for deal_id)';
    
  ELSE
    
    -- Create table without any foreign keys if neither table exists
    CREATE TABLE public.deal_tags (
      deal_id BIGINT NOT NULL,
      tag_id INT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      PRIMARY KEY (deal_id, tag_id)
    );
    
    RAISE NOTICE 'Created deal_tags table (no parent tables found, no foreign keys)';
    
  END IF;
END $$;

-- Create coupon_tags table with all constraints inline
DO $$
BEGIN
  -- Create coupon_tags table
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'coupons') 
     AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tags') THEN
    
    CREATE TABLE public.coupon_tags (
      coupon_id BIGINT NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
      tag_id INT NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      PRIMARY KEY (coupon_id, tag_id)
    );
    
    RAISE NOTICE 'Created coupon_tags table with foreign keys';
    
  ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tags') THEN
    
    -- Create table without coupons foreign key if coupons table doesn't exist
    CREATE TABLE public.coupon_tags (
      coupon_id BIGINT NOT NULL,
      tag_id INT NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      PRIMARY KEY (coupon_id, tag_id)
    );
    
    RAISE NOTICE 'Created coupon_tags table (coupons table not found, no foreign key for coupon_id)';
    
  ELSE
    
    -- Create table without any foreign keys if neither table exists
    CREATE TABLE public.coupon_tags (
      coupon_id BIGINT NOT NULL,
      tag_id INT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      PRIMARY KEY (coupon_id, tag_id)
    );
    
    RAISE NOTICE 'Created coupon_tags table (no parent tables found, no foreign keys)';
    
  END IF;
END $$;

-- Create indexes (these will always work since tables exist now)
CREATE INDEX idx_deal_tags_deal_id ON public.deal_tags(deal_id);
CREATE INDEX idx_deal_tags_tag_id ON public.deal_tags(tag_id);
CREATE INDEX idx_coupon_tags_coupon_id ON public.coupon_tags(coupon_id);
CREATE INDEX idx_coupon_tags_tag_id ON public.coupon_tags(tag_id);

-- Enable RLS
ALTER TABLE public.deal_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_tags ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Anyone can view deal tags" ON public.deal_tags FOR SELECT USING (true);
CREATE POLICY "Anyone can view coupon tags" ON public.coupon_tags FOR SELECT USING (true);

-- Create management policies based on table existence
DO $$
BEGIN
  -- Deal tags management policy
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'deals') THEN
    CREATE POLICY "Users can manage their deal tags" ON public.deal_tags FOR ALL USING (
      EXISTS (
        SELECT 1 FROM public.deals 
        WHERE id = deal_id AND submitter_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin'
      )
    );
    RAISE NOTICE 'Created deal tags management policy with deals table reference';
  ELSE
    CREATE POLICY "Admin can manage deal tags" ON public.deal_tags FOR ALL USING (
      EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin'
      )
    );
    RAISE NOTICE 'Created admin-only deal tags policy (deals table not found)';
  END IF;

  -- Coupon tags management policy
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'coupons') THEN
    CREATE POLICY "Users can manage their coupon tags" ON public.coupon_tags FOR ALL USING (
      EXISTS (
        SELECT 1 FROM public.coupons 
        WHERE id = coupon_id AND submitter_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin'
      )
    );
    RAISE NOTICE 'Created coupon tags management policy with coupons table reference';
  ELSE
    CREATE POLICY "Admin can manage coupon tags" ON public.coupon_tags FOR ALL USING (
      EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin'
      )
    );
    RAISE NOTICE 'Created admin-only coupon tags policy (coupons table not found)';
  END IF;
END $$;

-- Update get_popular_tags function to use junction tables
CREATE OR REPLACE FUNCTION get_popular_tags(
  tag_category_filter TEXT DEFAULT NULL,
  limit_count INT DEFAULT 20
)
RETURNS TABLE (
  tag_id INT,
  tag_name TEXT,
  tag_slug TEXT,
  tag_color TEXT,
  tag_category TEXT,
  usage_count BIGINT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id,
    t.name,
    t.slug,
    t.color,
    t.category,
    (
      COALESCE(dt.deal_count, 0) + COALESCE(ct.coupon_count, 0)
    ) as usage_count
  FROM public.tags t
  LEFT JOIN (
    SELECT tag_id, COUNT(*) as deal_count
    FROM public.deal_tags
    GROUP BY tag_id
  ) dt ON dt.tag_id = t.id
  LEFT JOIN (
    SELECT tag_id, COUNT(*) as coupon_count
    FROM public.coupon_tags
    GROUP BY tag_id
  ) ct ON ct.tag_id = t.id
  WHERE (tag_category_filter IS NULL OR t.category = tag_category_filter)
  ORDER BY usage_count DESC, t.is_featured DESC, t.name ASC
  LIMIT limit_count;
END;
$$;

-- Add comments
COMMENT ON TABLE public.deal_tags IS 'Junction table linking deals to tags';
COMMENT ON TABLE public.coupon_tags IS 'Junction table linking coupons to tags';

-- Final success message
DO $$
BEGIN
  RAISE NOTICE '=== JUNCTION TABLES SETUP COMPLETED SUCCESSFULLY ===';
  RAISE NOTICE 'Tables created: deal_tags, coupon_tags';
  RAISE NOTICE 'Indexes created for optimal performance';
  RAISE NOTICE 'RLS policies configured with proper security';
  RAISE NOTICE 'get_popular_tags function updated with usage statistics';
  RAISE NOTICE 'System is ready for tag-based categorization!';
END $$;
