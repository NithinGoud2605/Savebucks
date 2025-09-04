-- Company Enhancements for Comprehensive Company Pages
-- Adds additional fields to companies table and creates functions for company data

-- Create company categories table
CREATE TABLE IF NOT EXISTS public.company_categories (
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

-- Insert default company categories
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
  ('Other', 'other', 'Miscellaneous businesses and services', 'question-mark-circle', '#9CA3AF')
ON CONFLICT (slug) DO NOTHING;

-- Enhance companies table with additional fields
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

ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS 
  featured_image TEXT;

ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS 
  banner_image TEXT;

ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS 
  gallery_images TEXT[];

ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS 
  video_url TEXT;

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

-- Add missing columns that are referenced in functions
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS 
  rating DECIMAL(3,2) DEFAULT 0.00;

ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS 
  total_reviews INTEGER DEFAULT 0;

ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS 
  category_id BIGINT REFERENCES public.company_categories(id);

ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS 
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected'));

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

-- Create indexes for new fields
CREATE INDEX IF NOT EXISTS idx_companies_founded_year ON public.companies(founded_year);
CREATE INDEX IF NOT EXISTS idx_companies_headquarters ON public.companies(headquarters);
CREATE INDEX IF NOT EXISTS idx_companies_verified_rating ON public.companies(is_verified, rating);
CREATE INDEX IF NOT EXISTS idx_companies_category_id ON public.companies(category_id);
CREATE INDEX IF NOT EXISTS idx_companies_status ON public.companies(status);
CREATE INDEX IF NOT EXISTS idx_companies_submitted_by ON public.companies(submitted_by);

-- Function to get comprehensive company data with deals and coupons
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
    'faq_url', c.faq_url,
    'blog_url', c.blog_url,
    'newsletter_signup', c.newsletter_signup,
    'loyalty_program', c.loyalty_program,
    'mobile_app_url', c.mobile_app_url,
    'app_store_rating', c.app_store_rating,
    'play_store_rating', c.play_store_rating,
    'trustpilot_rating', c.trustpilot_rating,
    'trustpilot_reviews_count', c.trustpilot_reviews_count,
    'bbb_rating', c.bbb_rating,
    'bbb_accreditation', c.bbb_accreditation,
    'certifications', c.certifications,
    'awards', c.awards,
    'featured_image', c.featured_image,
    'banner_image', c.banner_image,
    'gallery_images', c.gallery_images,
    'video_url', c.video_url,
    'meta_title', c.meta_title,
    'meta_description', c.meta_description,
    'meta_keywords', c.meta_keywords,
    'seo_slug', c.seo_slug,
    'canonical_url', c.canonical_url,
    'rating', c.rating,
    'total_reviews', c.total_reviews,
    'category', jsonb_build_object(
      'id', cc.id,
      'name', cc.name,
      'slug', cc.slug,
      'description', cc.description,
      'icon', cc.icon,
      'color', cc.color
    ),
    'status', c.status,
    'created_at', c.created_at,
    'updated_at', c.updated_at
  ) INTO company_data
  FROM companies c
  LEFT JOIN company_categories cc ON c.category_id = cc.id
  WHERE c.slug = company_slug AND c.status = 'approved';
  
  IF company_data IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Get company deals
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', d.id,
      'title', d.title,
      'description', d.description,
      'url', d.url,
      'price', d.price,
      'original_price', d.original_price,
      'discount_percentage', d.discount_percentage,
      'discount_amount', d.discount_amount,
      'coupon_code', d.coupon_code,
      'coupon_type', d.coupon_type,
      'image_url', d.image_url,
      'status', d.status,
      'created_at', d.created_at,
      'approved_at', d.approved_at,
      'expires_at', d.expires_at,
      'is_featured', d.is_featured,
      'is_exclusive', d.is_exclusive,
      'views_count', d.views_count,
      'clicks_count', d.clicks_count,
      'category', jsonb_build_object(
        'id', cat.id,
        'name', cat.name,
        'slug', cat.slug,
        'color', cat.color
      ),
      'submitter', jsonb_build_object(
        'handle', p.handle,
        'avatar_url', p.avatar_url
      )
    )
  ) INTO deals_data
  FROM deals d
  LEFT JOIN categories cat ON d.category_id = cat.id
  LEFT JOIN profiles p ON d.submitter_id = p.id
  WHERE d.company_id = (company_data->>'id')::BIGINT
    AND d.status = 'approved'
  ORDER BY d.created_at DESC;
  
  -- Get company coupons
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', c.id,
      'title', c.title,
      'description', c.description,
      'coupon_code', c.coupon_code,
      'coupon_type', c.coupon_code,
      'discount_value', c.discount_value,
      'minimum_order_amount', c.minimum_order_amount,
      'maximum_discount_amount', c.maximum_discount_amount,
      'terms_conditions', c.terms_conditions,
      'starts_at', c.starts_at,
      'expires_at', c.expires_at,
      'is_featured', c.is_featured,
      'is_exclusive', c.is_exclusive,
      'views_count', c.views_count,
      'clicks_count', c.clicks_count,
      'success_rate', c.success_rate,
      'status', c.status,
      'created_at', c.created_at,
      'approved_at', c.approved_at,
      'category', jsonb_build_object(
        'id', cat.id,
        'name', cat.name,
        'slug', cat.slug,
        'color', cat.color
      ),
      'submitter', jsonb_build_object(
        'handle', p.handle,
        'avatar_url', p.avatar_url
      )
    )
  ) INTO coupons_data
  FROM coupons c
  LEFT JOIN categories cat ON c.category_id = cat.id
  LEFT JOIN profiles p ON c.submitter_id = p.id
  WHERE c.company_id = (company_data->>'id')::BIGINT
    AND c.status = 'approved'
  ORDER BY c.created_at DESC;
  
  -- Get company stats
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
    ),
    'active_deals', COALESCE(
      (SELECT COUNT(*) FROM deals 
       WHERE company_id = (company_data->>'id')::BIGINT 
         AND status = 'approved' 
         AND (expires_at IS NULL OR expires_at > NOW())), 0
    ),
    'active_coupons', COALESCE(
      (SELECT COUNT(*) FROM coupons 
       WHERE company_id = (company_data->>'id')::BIGINT 
         AND status = 'approved' 
         AND (expires_at IS NULL OR expires_at > NOW())), 0
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

-- Function to search companies with full-text search
DROP FUNCTION IF EXISTS search_companies(TEXT, TEXT, BOOLEAN);
CREATE OR REPLACE FUNCTION search_companies(search_term TEXT, category_filter TEXT DEFAULT NULL, verified_only BOOLEAN DEFAULT FALSE)
RETURNS TABLE(
  id BIGINT,
  name TEXT,
  slug TEXT,
  description TEXT,
  logo_url TEXT,
  website_url TEXT,
  category_name TEXT,
  category_slug TEXT,
  is_verified BOOLEAN,
  rating DECIMAL(3,2),
  total_reviews INTEGER,
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
    cc.name as category_name,
    cc.slug as category_slug,
    c.is_verified,
    c.rating,
    c.total_reviews,
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

-- Create a view for company listings with stats
CREATE OR REPLACE VIEW company_listings AS
SELECT 
  c.*,
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

-- Grant permissions
GRANT SELECT ON company_listings TO anon, authenticated;
GRANT SELECT ON company_categories TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_company_full_data(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION search_companies(TEXT, TEXT, BOOLEAN) TO anon, authenticated;

-- Insert some enhanced company data
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

-- Add more sample data for other companies as needed
