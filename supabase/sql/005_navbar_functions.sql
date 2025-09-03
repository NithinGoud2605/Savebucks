-- NAVBAR FUNCTIONS
-- Functions for navbar statistics and trending data

-- Function to get navbar statistics
CREATE OR REPLACE FUNCTION get_navbar_stats()
RETURNS JSON
LANGUAGE plpgsql STABLE AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'usersOnline', 0, -- Placeholder for now
    'dealsToday', (
      SELECT COUNT(*) 
      FROM public.deals 
      WHERE status = 'approved' 
        AND created_at >= CURRENT_DATE
    ),
    'couponsToday', (
      SELECT COUNT(*) 
      FROM public.coupons 
      WHERE status = 'approved' 
        AND created_at >= CURRENT_DATE
    ),
    'totalDeals', (
      SELECT COUNT(*) 
      FROM public.deals 
      WHERE status = 'approved'
    ),
    'totalCoupons', (
      SELECT COUNT(*) 
      FROM public.coupons 
      WHERE status = 'approved'
    )
  ) INTO result;
  
  RETURN result;
END $$;

-- Function to get trending categories with counts
CREATE OR REPLACE FUNCTION get_trending_categories_with_counts()
RETURNS TABLE(
  id BIGINT,
  name TEXT,
  slug TEXT,
  color TEXT,
  deal_count BIGINT,
  coupon_count BIGINT,
  total_count BIGINT
)
LANGUAGE sql STABLE AS $$
  SELECT 
    c.id,
    c.name,
    c.slug,
    c.color,
    COALESCE(d.deal_count, 0) as deal_count,
    COALESCE(cp.coupon_count, 0) as coupon_count,
    COALESCE(d.deal_count, 0) + COALESCE(cp.coupon_count, 0) as total_count
  FROM public.categories c
  LEFT JOIN (
    SELECT category_id, COUNT(*) as deal_count
    FROM public.deals
    WHERE status = 'approved'
      AND created_at >= CURRENT_DATE - INTERVAL '7 days'
    GROUP BY category_id
  ) d ON c.id = d.category_id
  LEFT JOIN (
    SELECT category_id, COUNT(*) as coupon_count
    FROM public.coupons
    WHERE status = 'approved'
      AND created_at >= CURRENT_DATE - INTERVAL '7 days'
    GROUP BY category_id
  ) cp ON c.id = cp.category_id
  ORDER BY total_count DESC, c.name ASC
  LIMIT 10;
$$;

-- Function to get trending categories (simple version)
CREATE OR REPLACE FUNCTION get_trending_categories()
RETURNS TABLE(
  id BIGINT,
  name TEXT,
  slug TEXT,
  color TEXT
)
LANGUAGE sql STABLE AS $$
  SELECT 
    c.id,
    c.name,
    c.slug,
    c.color
  FROM public.categories c
  LEFT JOIN (
    SELECT category_id, COUNT(*) as total_items
    FROM (
      SELECT category_id FROM public.deals WHERE status = 'approved' AND created_at >= CURRENT_DATE - INTERVAL '7 days'
      UNION ALL
      SELECT category_id FROM public.coupons WHERE status = 'approved' AND created_at >= CURRENT_DATE - INTERVAL '7 days'
    ) combined
    GROUP BY category_id
  ) trending ON c.id = trending.category_id
  ORDER BY COALESCE(trending.total_items, 0) DESC, c.name ASC
  LIMIT 8;
$$;

-- Function to increment deal views
CREATE OR REPLACE FUNCTION increment_deal_views(deal_id_param BIGINT)
RETURNS void
LANGUAGE plpgsql AS $$
BEGIN
  UPDATE public.deals 
  SET views_count = views_count + 1
  WHERE id = deal_id_param;
END $$;

-- Function to increment coupon views
CREATE OR REPLACE FUNCTION increment_coupon_views(coupon_id_param BIGINT)
RETURNS void
LANGUAGE plpgsql AS $$
BEGIN
  UPDATE public.coupons 
  SET views_count = views_count + 1
  WHERE id = coupon_id_param;
END $$;

-- Success message
SELECT 'Navbar functions created successfully!' as status;
