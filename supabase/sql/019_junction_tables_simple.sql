-- Junction Tables for Tagging System (Simple Version)
-- This should be run AFTER the main deals, coupons, and tags tables exist

-- First, let's check what tables exist and create junction tables accordingly

-- Create or recreate deal_tags table with proper structure
DO $$
BEGIN
  -- Drop table if it exists and recreate it to ensure correct structure
  DROP TABLE IF EXISTS public.deal_tags;
  
  -- Create deal_tags table with proper columns
  CREATE TABLE public.deal_tags (
    deal_id BIGINT NOT NULL,
    tag_id INT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (deal_id, tag_id)
  );
  
  RAISE NOTICE 'deal_tags table created with proper structure';
  
  -- Add foreign key constraints only if the referenced tables exist
  -- Add deal_id foreign key if deals table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'deals') THEN
    BEGIN
      ALTER TABLE public.deal_tags ADD CONSTRAINT fk_deal_tags_deal_id 
        FOREIGN KEY (deal_id) REFERENCES public.deals(id) ON DELETE CASCADE;
      RAISE NOTICE 'Added foreign key constraint for deal_tags.deal_id';
    EXCEPTION
      WHEN duplicate_object THEN
        RAISE NOTICE 'Foreign key constraint for deal_tags.deal_id already exists';
    END;
  ELSE
    RAISE NOTICE 'deals table does not exist, skipping foreign key for deal_id';
  END IF;

  -- Add tag_id foreign key if tags table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tags') THEN
    BEGIN
      ALTER TABLE public.deal_tags ADD CONSTRAINT fk_deal_tags_tag_id 
        FOREIGN KEY (tag_id) REFERENCES public.tags(id) ON DELETE CASCADE;
      RAISE NOTICE 'Added foreign key constraint for deal_tags.tag_id';
    EXCEPTION
      WHEN duplicate_object THEN
        RAISE NOTICE 'Foreign key constraint for deal_tags.tag_id already exists';
    END;
  ELSE
    RAISE NOTICE 'tags table does not exist, skipping foreign key for tag_id';
  END IF;
END $$;

-- Create or recreate coupon_tags table with proper structure
DO $$
BEGIN
  -- Drop table if it exists and recreate it to ensure correct structure
  DROP TABLE IF EXISTS public.coupon_tags;
  
  -- Create coupon_tags table with proper columns
  CREATE TABLE public.coupon_tags (
    coupon_id BIGINT NOT NULL,
    tag_id INT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (coupon_id, tag_id)
  );
  
  RAISE NOTICE 'coupon_tags table created with proper structure';
  
  -- Add foreign key constraints for coupon_tags
  -- Add coupon_id foreign key if coupons table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'coupons') THEN
    BEGIN
      ALTER TABLE public.coupon_tags ADD CONSTRAINT fk_coupon_tags_coupon_id 
        FOREIGN KEY (coupon_id) REFERENCES public.coupons(id) ON DELETE CASCADE;
      RAISE NOTICE 'Added foreign key constraint for coupon_tags.coupon_id';
    EXCEPTION
      WHEN duplicate_object THEN
        RAISE NOTICE 'Foreign key constraint for coupon_tags.coupon_id already exists';
    END;
  ELSE
    RAISE NOTICE 'coupons table does not exist, skipping foreign key for coupon_id';
  END IF;

  -- Add tag_id foreign key if tags table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tags') THEN
    BEGIN
      ALTER TABLE public.coupon_tags ADD CONSTRAINT fk_coupon_tags_tag_id 
        FOREIGN KEY (tag_id) REFERENCES public.tags(id) ON DELETE CASCADE;
      RAISE NOTICE 'Added foreign key constraint for coupon_tags.tag_id';
    EXCEPTION
      WHEN duplicate_object THEN
        RAISE NOTICE 'Foreign key constraint for coupon_tags.tag_id already exists';
    END;
  ELSE
    RAISE NOTICE 'tags table does not exist, skipping foreign key for tag_id';
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_deal_tags_deal_id ON public.deal_tags(deal_id);
CREATE INDEX IF NOT EXISTS idx_deal_tags_tag_id ON public.deal_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_coupon_tags_coupon_id ON public.coupon_tags(coupon_id);
CREATE INDEX IF NOT EXISTS idx_coupon_tags_tag_id ON public.coupon_tags(tag_id);

-- Enable RLS
ALTER TABLE public.deal_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_tags ENABLE ROW LEVEL SECURITY;

-- RLS Policies for deal_tags
CREATE POLICY "Anyone can view deal tags" ON public.deal_tags FOR SELECT USING (true);

-- Only create the management policy if the deals table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'deals') THEN
    EXECUTE 'CREATE POLICY "Authenticated users can manage their deal tags" ON public.deal_tags FOR ALL USING (
      EXISTS (
        SELECT 1 FROM public.deals 
        WHERE id = deal_id AND submitter_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = ''admin''
      )
    )';
    RAISE NOTICE 'Created management policy for deal_tags';
  ELSE
    -- Create a simple policy if deals table doesn't exist
    EXECUTE 'CREATE POLICY "Admin can manage deal tags" ON public.deal_tags FOR ALL USING (
      EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = ''admin''
      )
    )';
    RAISE NOTICE 'Created admin-only policy for deal_tags (deals table not found)';
  END IF;
END $$;

-- RLS Policies for coupon_tags
CREATE POLICY "Anyone can view coupon tags" ON public.coupon_tags FOR SELECT USING (true);

-- Only create the management policy if the coupons table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'coupons') THEN
    EXECUTE 'CREATE POLICY "Authenticated users can manage their coupon tags" ON public.coupon_tags FOR ALL USING (
      EXISTS (
        SELECT 1 FROM public.coupons 
        WHERE id = coupon_id AND submitter_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = ''admin''
      )
    )';
    RAISE NOTICE 'Created management policy for coupon_tags';
  ELSE
    -- Create a simple policy if coupons table doesn't exist
    EXECUTE 'CREATE POLICY "Admin can manage coupon tags" ON public.coupon_tags FOR ALL USING (
      EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = ''admin''
      )
    )';
    RAISE NOTICE 'Created admin-only policy for coupon_tags (coupons table not found)';
  END IF;
END $$;

-- Update the get_popular_tags function to use the junction tables
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

-- Comments for documentation
COMMENT ON TABLE public.deal_tags IS 'Junction table linking deals to tags';
COMMENT ON TABLE public.coupon_tags IS 'Junction table linking coupons to tags';

-- Final success message
DO $$
BEGIN
  RAISE NOTICE 'Junction tables setup completed successfully!';
  RAISE NOTICE 'Tables created: deal_tags, coupon_tags';
  RAISE NOTICE 'Indexes created for better performance';
  RAISE NOTICE 'RLS policies configured';
  RAISE NOTICE 'get_popular_tags function updated';
END $$;
