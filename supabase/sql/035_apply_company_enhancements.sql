-- Step-by-step application of company enhancements
-- This file should be run in sequence to avoid errors

-- Step 1: Create company categories table (only if it doesn't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'company_categories') THEN
    CREATE TABLE public.company_categories (
      id BIGSERIAL PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      slug TEXT NOT NULL UNIQUE,
      description TEXT,
      icon TEXT,
      color TEXT DEFAULT '#3B82F6',
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  END IF;
END $$;

-- Step 2: Insert default company categories (only if they don't exist)
DO $$
BEGIN
  -- Only insert if no categories exist yet
  IF NOT EXISTS (SELECT 1 FROM public.company_categories LIMIT 1) THEN
    INSERT INTO public.company_categories (name, slug, description, icon, color) VALUES
      ('E-commerce', 'ecommerce', 'Online retail and shopping platforms', 'shopping-cart', '#10B981'),
      ('Technology', 'technology', 'Software, hardware, and tech services', 'chip', '#3B82F6'),
      ('Restaurant', 'restaurant', 'Food and dining establishments', 'cake', '#F59E0B'),
      ('Fashion', 'fashion', 'Clothing, accessories, and style', 'sparkles', '#EC4899'),
      ('Home & Garden', 'home-garden', 'Home improvement and outdoor living', 'home', '#8B5CF6'),
      ('Health & Beauty', 'health-beauty', 'Wellness, cosmetics, and personal care', 'heart', '#EF4444'),
      ('Automotive', 'automotive', 'Cars, parts, and automotive services', 'truck', '#6B7280'),
      ('Travel', 'travel', 'Hotels, flights, and vacation packages', 'airplane', '#06B6D4'),
      ('Entertainment', 'entertainment', 'Movies, games, and leisure activities', 'play', '#F97316'),
      ('Sports', 'sports', 'Athletic equipment and fitness', 'trophy', '#84CC16'),
      ('Education', 'education', 'Learning resources and courses', 'academic-cap', '#6366F1'),
      ('Finance', 'finance', 'Banking, insurance, and financial services', 'currency-dollar', '#059669'),
      ('Real Estate', 'real-estate', 'Property sales and rentals', 'building-office', '#7C3AED'),
      ('Other', 'other', 'Miscellaneous businesses and services', 'question-mark-circle', '#9CA3AF');
  END IF;
END $$;

-- Step 3: Add basic company fields
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS 
  founded_year INTEGER;

ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS 
  headquarters TEXT;

ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS 
  employee_count TEXT;

ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS 
  revenue_range TEXT;

ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS 
  social_media JSONB DEFAULT '{}';

ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS 
  contact_info JSONB DEFAULT '{}';

ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS 
  business_hours JSONB DEFAULT '{}';

ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS 
  payment_methods TEXT[];

ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS 
  shipping_info JSONB DEFAULT '{}';

ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS 
  return_policy TEXT;

ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS 
  customer_service TEXT;

-- Step 4: Add advanced company fields
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS 
  faq_url TEXT;

ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS 
  blog_url TEXT;

ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS 
  newsletter_signup TEXT;

ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS 
  loyalty_program TEXT;

ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS 
  mobile_app_url TEXT;

ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS 
  app_store_rating DECIMAL(3,2);

ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS 
  play_store_rating DECIMAL(3,2);

ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS 
  trustpilot_rating DECIMAL(3,2);

ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS 
  trustpilot_reviews_count INTEGER;

ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS 
  bbb_rating TEXT;

ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS 
  bbb_accreditation BOOLEAN DEFAULT FALSE;

ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS 
  certifications TEXT[];

ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS 
  awards TEXT[];

-- Step 5: Add image and media fields
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS 
  featured_image TEXT;

ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS 
  banner_image TEXT;

ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS 
  gallery_images TEXT[];

ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS 
  video_url TEXT;

-- Step 6: Add SEO and metadata fields
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS 
  meta_title TEXT;

ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS 
  meta_description TEXT;

ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS 
  meta_keywords TEXT[];

ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS 
  seo_slug TEXT;

ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS 
  canonical_url TEXT;

-- Step 7: Add approval workflow fields
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS 
  rating DECIMAL(3,2) DEFAULT 0.00;

ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS 
  total_reviews INTEGER DEFAULT 0;

ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS 
  category_id BIGINT REFERENCES public.company_categories(id);

ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS 
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'request_changes'));

ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS 
  submitted_by UUID REFERENCES public.profiles(id);

ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS 
  submitted_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS 
  reviewed_by UUID REFERENCES public.profiles(id);

ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS 
  reviewed_at TIMESTAMPTZ;

ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS 
  review_notes TEXT;

ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS 
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'medium', 'high'));

ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS 
  flags TEXT[] DEFAULT '{}';

-- Step 8: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_companies_founded_year ON public.companies(founded_year);
CREATE INDEX IF NOT EXISTS idx_companies_headquarters ON public.companies(headquarters);
CREATE INDEX IF NOT EXISTS idx_companies_verified_rating ON public.companies(is_verified, rating);
CREATE INDEX IF NOT EXISTS idx_companies_category_id ON public.companies(category_id);
CREATE INDEX IF NOT EXISTS idx_companies_status ON public.companies(status);
CREATE INDEX IF NOT EXISTS idx_companies_submitted_by ON public.companies(submitted_by);
CREATE INDEX IF NOT EXISTS idx_companies_priority ON public.companies(priority);

-- Step 9: Create comprehensive company data function (drop existing first if it exists)
DO $$
BEGIN
  -- Drop the function if it exists to avoid return type conflicts
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_company_full_data') THEN
    DROP FUNCTION IF EXISTS get_company_full_data(TEXT);
  END IF;
END $$;

CREATE OR REPLACE FUNCTION get_company_full_data(company_slug TEXT)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  company_data JSONB;
  deals_data JSONB;
  coupons_data JSONB;
  stats_data JSONB;
BEGIN
  -- Get company basic info with category
  SELECT jsonb_build_object(
    'id', c.id,
    'name', c.name,
    'slug', c.slug,
    'logo_url', c.logo_url,
    'website_url', c.website_url,
    'is_verified', c.is_verified,
    'description', c.description,
    'founded_year', c.founded_year,
    'headquarters', c.headquarters,
    'employee_count', c.employee_count,
    'revenue_range', c.revenue_range,
    'social_media', c.social_media,
    'contact_info', c.contact_info,
    'business_hours', c.business_hours,
    'payment_methods', c.payment_methods,
    'shipping_info', c.shipping_info,
    'return_policy', c.return_policy,
    'customer_service', c.customer_service,
    'mobile_app_url', c.mobile_app_url,
    'app_store_rating', c.app_store_rating,
    'play_store_rating', c.play_store_rating,
    'trustpilot_rating', c.trustpilot_rating,
    'trustpilot_reviews_count', c.trustpilot_reviews_count,
    'bbb_rating', c.bbb_rating,
    'bbb_accreditation', c.bbb_accreditation,
    'certifications', c.certifications,
    'awards', c.awards,
    'rating', c.rating,
    'total_reviews', c.total_reviews,
    'category', cc.name,
    'category_slug', cc.slug,
    'category_icon', cc.icon,
    'category_color', cc.color,
    'created_at', c.created_at,
    'updated_at', c.updated_at
  ) INTO company_data
  FROM companies c
  LEFT JOIN company_categories cc ON c.category_id = cc.id
  WHERE c.slug = company_slug AND c.status = 'approved' AND c.is_verified = true;

  IF company_data IS NULL THEN
    RETURN NULL;
  END IF;

  -- Get deals for this company
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', d.id,
      'title', d.title,
      'description', d.description,
      'price', d.price,
      'original_price', d.original_price,
      'discount_percentage', d.discount_percentage,
      'image_url', d.image_url,
      'status', d.status,
      'views_count', d.views_count,
      'clicks_count', d.clicks_count,
      'created_at', d.created_at
    )
  ) INTO deals_data
  FROM deals d
  WHERE d.company_id = (company_data->>'id')::BIGINT AND d.status = 'approved';

  -- Get coupons for this company
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', cp.id,
      'title', cp.title,
      'description', cp.description,
      'code', cp.code,
      'discount_type', cp.discount_type,
      'discount_value', cp.discount_value,
      'minimum_purchase', cp.minimum_purchase,
      'expires_at', cp.expires_at,
      'image_url', cp.image_url,
      'status', cp.status,
      'views_count', cp.views_count,
      'clicks_count', cp.clicks_count,
      'created_at', cp.created_at
    )
  ) INTO coupons_data
  FROM coupons cp
  WHERE cp.company_id = (company_data->>'id')::BIGINT AND cp.status = 'approved';

  -- Calculate stats
  SELECT jsonb_build_object(
    'total_deals', COALESCE(jsonb_array_length(deals_data), 0),
    'total_coupons', COALESCE(jsonb_array_length(coupons_data), 0),
    'total_views', COALESCE(
      (SELECT SUM(views_count) FROM deals WHERE company_id = (company_data->>'id')::BIGINT AND status = 'approved'), 0
    ) + COALESCE(
      (SELECT SUM(views_count) FROM coupons WHERE company_id = (company_data->>'id')::BIGINT AND status = 'approved'), 0
    ),
    'total_clicks', COALESCE(
      (SELECT SUM(clicks_count) FROM deals WHERE company_id = (company_data->>'id')::BIGINT AND status = 'approved'), 0
    ) + COALESCE(
      (SELECT SUM(clicks_count) FROM coupons WHERE company_id = (company_data->>'id')::BIGINT AND status = 'approved'), 0
    )
  ) INTO stats_data;

  -- Return combined data
  RETURN jsonb_build_object(
    'company', company_data,
    'deals', COALESCE(deals_data, '[]'::jsonb),
    'coupons', COALESCE(coupons_data, '[]'::jsonb),
    'stats', stats_data
  );
END;
$$;

-- Step 10: Create search function (drop existing first if it exists)
DO $$
BEGIN
  -- Drop the function if it exists to avoid return type conflicts
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'search_companies') THEN
    DROP FUNCTION IF EXISTS search_companies(TEXT, TEXT, BOOLEAN);
  END IF;
END $$;

CREATE OR REPLACE FUNCTION search_companies(
  search_term TEXT,
  category_filter TEXT DEFAULT NULL,
  verified_only BOOLEAN DEFAULT FALSE
)
RETURNS TABLE(
  id BIGINT,
  name TEXT,
  slug TEXT,
  description TEXT,
  logo_url TEXT,
  website_url TEXT,
  rating DECIMAL(3,2),
  total_reviews INTEGER,
  category_name TEXT,
  category_slug TEXT,
  category_icon TEXT,
  category_color TEXT,
  headquarters TEXT,
  founded_year INTEGER,
  is_verified BOOLEAN,
  created_at TIMESTAMPTZ,
  search_rank REAL
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.name,
    c.slug,
    c.description,
    c.logo_url,
    c.website_url,
    c.rating,
    c.total_reviews,
    cc.name as category_name,
    cc.slug as category_slug,
    cc.icon as category_icon,
    cc.color as category_color,
    c.headquarters,
    c.founded_year,
    c.is_verified,
    c.created_at,
    ts_rank(
      to_tsvector('english', COALESCE(c.name, '') || ' ' || COALESCE(c.description, '') || ' ' || COALESCE(cc.name, '')),
      plainto_tsquery('english', search_term)
    ) as search_rank
  FROM companies c
  LEFT JOIN company_categories cc ON c.category_id = cc.id
  WHERE c.status = 'approved'
    AND (
      c.name ILIKE '%' || search_term || '%'
      OR c.description ILIKE '%' || search_term || '%'
      OR cc.name ILIKE '%' || search_term || '%'
      OR to_tsvector('english', COALESCE(c.name, '') || ' ' || COALESCE(c.description, '') || ' ' || COALESCE(cc.name, '')) @@ plainto_tsquery('english', search_term)
    )
    AND (category_filter IS NULL OR cc.slug = category_filter)
    AND (NOT verified_only OR c.is_verified = TRUE)
  ORDER BY search_rank DESC, c.rating DESC NULLS LAST, c.created_at DESC;
END;
$$;

-- Step 11: Create company listings view
-- Drop the existing view first to avoid column conflicts
DROP VIEW IF EXISTS company_listings;

CREATE OR REPLACE VIEW company_listings AS
SELECT 
  c.id,
  c.name,
  c.slug,
  c.description,
  c.logo_url,
  c.website_url,
  c.is_verified,
  c.founded_year,
  c.headquarters,
  c.employee_count,
  c.revenue_range,
  c.rating,
  c.total_reviews,
  c.status,
  c.priority,
  c.flags,
  c.submitted_by,
  c.submitted_at,
  c.reviewed_by,
  c.reviewed_at,
  c.review_notes,
  c.created_at,
  c.updated_at,
  cc.name as category_name,
  cc.slug as category_slug,
  cc.icon as category_icon,
  cc.color as category_color,
  COALESCE(d.deals_count, 0) as deals_count,
  COALESCE(cp.coupons_count, 0) as coupons_count,
  COALESCE(d.total_views, 0) + COALESCE(cp.total_views, 0) as total_views,
  COALESCE(d.total_clicks, 0) + COALESCE(cp.total_clicks, 0) as total_clicks
FROM companies c
LEFT JOIN company_categories cc ON c.category_id = cc.id
LEFT JOIN (
  SELECT 
    company_id,
    COUNT(*) as deals_count,
    SUM(views_count) as total_views,
    SUM(clicks_count) as total_clicks
  FROM deals 
  WHERE status = 'approved'
  GROUP BY company_id
) d ON c.id = d.company_id
LEFT JOIN (
  SELECT 
    company_id,
    COUNT(*) as coupons_count,
    SUM(views_count) as total_views,
    SUM(clicks_count) as total_clicks
  FROM coupons 
  WHERE status = 'approved'
  GROUP BY company_id
) cp ON c.id = cp.company_id
WHERE c.status = 'approved';

-- Step 12: Grant permissions
GRANT SELECT ON company_listings TO anon, authenticated;
GRANT SELECT ON company_categories TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_company_full_data(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION search_companies(TEXT, TEXT, BOOLEAN) TO anon, authenticated;

-- Step 13: Update existing companies with sample data (only if they exist)
DO $$
BEGIN
  -- Update Amazon if it exists
  IF EXISTS (SELECT 1 FROM companies WHERE slug = 'amazon') THEN
    UPDATE companies SET 
      founded_year = 1994,
      headquarters = 'Seattle, Washington, USA',
      employee_count = '1.6M+',
      revenue_range = '$500B+',
      social_media = '{"twitter": "https://twitter.com/amazon", "facebook": "https://facebook.com/amazon", "instagram": "https://instagram.com/amazon"}',
      contact_info = '{"phone": "1-888-280-4331", "email": "customer-service@amazon.com"}',
      business_hours = '{"online": "24/7", "customer_service": "24/7"}',
      payment_methods = '{"credit_card", "debit_card", "amazon_pay", "gift_card"}',
      shipping_info = '{"free_shipping": "Prime members", "standard": "3-5 business days", "express": "1-2 business days"}',
      return_policy = '30-day return policy for most items',
      customer_service = '24/7 customer support via phone, chat, and email',
      mobile_app_url = 'https://apps.apple.com/app/amazon/id297606951',
      app_store_rating = 4.8,
      play_store_rating = 4.3,
      trustpilot_rating = 4.1,
      trustpilot_reviews_count = 125000,
      bbb_rating = 'A+',
      bbb_accreditation = true,
      certifications = '{"ISO 27001", "SOC 2", "PCI DSS"}',
      awards = '{"Fortune 500 #2", "World''s Most Admired Companies"}',
      rating = 4.5,
      total_reviews = 1500000,
      category_id = (SELECT id FROM company_categories WHERE slug = 'ecommerce'),
      status = 'approved',
      is_verified = true,
      meta_title = 'Amazon - Online Shopping for Electronics, Apparel, Computers, Books, DVDs & more',
      meta_description = 'Shop online for electronics, computers, clothing, shoes, books, DVDs, sporting goods, beauty & personal care, and more at Amazon.com'
    WHERE slug = 'amazon';
  END IF;

  -- Update Apple if it exists
  IF EXISTS (SELECT 1 FROM companies WHERE slug = 'apple') THEN
    UPDATE companies SET 
      founded_year = 1976,
      headquarters = 'Cupertino, California, USA',
      employee_count = '164K+',
      revenue_range = '$400B+',
      social_media = '{"twitter": "https://twitter.com/apple", "facebook": "https://facebook.com/apple", "instagram": "https://instagram.com/apple"}',
      contact_info = '{"phone": "1-800-275-2273", "email": "support@apple.com"}',
      business_hours = '{"online": "24/7", "customer_service": "24/7"}',
      payment_methods = '{"credit_card", "debit_card", "apple_pay", "gift_card"}',
      shipping_info = '{"free_shipping": "Free delivery on orders over $35", "standard": "3-5 business days", "express": "1-2 business days"}',
      return_policy = '14-day return policy for most items',
      customer_service = '24/7 customer support via phone, chat, and online',
      mobile_app_url = 'https://apps.apple.com/app/apple-store/id375380948',
      app_store_rating = 4.8,
      play_store_rating = 4.5,
      trustpilot_rating = 4.2,
      trustpilot_reviews_count = 89000,
      bbb_rating = 'A+',
      bbb_accreditation = true,
      certifications = '{"ISO 27001", "SOC 2", "Energy Star"}',
      awards = '{"Fortune 500 #1", "World''s Most Valuable Brand"}',
      rating = 4.8,
      total_reviews = 1200000,
      category_id = (SELECT id FROM company_categories WHERE slug = 'technology'),
      status = 'approved',
      is_verified = true,
      meta_title = 'Apple - iPhone, iPad, Mac, Apple Watch, AirPods, Apple TV',
      meta_description = 'Shop the latest iPhone, iPad, Mac, Apple Watch, AirPods, Apple TV, and more at Apple.com'
    WHERE slug = 'apple';
  END IF;
END $$;

-- Step 14: Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_company_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if it exists (PostgreSQL doesn't support IF NOT EXISTS for triggers)
DROP TRIGGER IF EXISTS trigger_update_company_updated_at ON companies;
CREATE TRIGGER trigger_update_company_updated_at
  BEFORE UPDATE ON companies
  FOR EACH ROW
  EXECUTE FUNCTION update_company_updated_at();

-- Step 15: Create trigger to update company_categories updated_at timestamp
CREATE OR REPLACE FUNCTION update_company_category_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if it exists (PostgreSQL doesn't support IF NOT EXISTS for triggers)
DROP TRIGGER IF EXISTS trigger_update_company_category_updated_at ON company_categories;
CREATE TRIGGER trigger_update_company_category_updated_at
  BEFORE UPDATE ON company_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_company_category_updated_at();

-- Success message
SELECT 'Company enhancements applied successfully!' as status;
