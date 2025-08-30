-- Fix for get_popular_tags function to resolve ambiguous column reference
-- This version handles the case where junction tables might not exist yet

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
  -- Check if junction tables exist
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'deal_tags')
     AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'coupon_tags') THEN
    
    -- Use junction tables if they exist
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
      SELECT dt_inner.tag_id, COUNT(*) as deal_count
      FROM public.deal_tags dt_inner
      GROUP BY dt_inner.tag_id
    ) dt ON dt.tag_id = t.id
    LEFT JOIN (
      SELECT ct_inner.tag_id, COUNT(*) as coupon_count
      FROM public.coupon_tags ct_inner
      GROUP BY ct_inner.tag_id
    ) ct ON ct.tag_id = t.id
    WHERE (tag_category_filter IS NULL OR t.category = tag_category_filter)
    ORDER BY usage_count DESC, t.is_featured DESC, t.name ASC
    LIMIT limit_count;
    
  ELSE
    
    -- Fallback to simple version without junction tables
    RETURN QUERY
    SELECT 
      t.id,
      t.name,
      t.slug,
      t.color,
      t.category,
      0::BIGINT as usage_count
    FROM public.tags t
    WHERE (tag_category_filter IS NULL OR t.category = tag_category_filter)
    ORDER BY t.is_featured DESC, t.name ASC
    LIMIT limit_count;
    
  END IF;
END;
$$;
