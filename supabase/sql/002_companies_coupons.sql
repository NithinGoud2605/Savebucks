-- COMPANIES AND COUPONS SYSTEM
-- Fixed version with proper relationships and constraints

-- Companies table (replaces merchants)
CREATE TABLE IF NOT EXISTS public.companies (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  website_url TEXT,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add trigger for companies updated_at
DROP TRIGGER IF EXISTS trg_companies_updated_at ON public.companies;
CREATE TRIGGER trg_companies_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add indexes for companies
CREATE INDEX IF NOT EXISTS idx_companies_slug ON public.companies(slug);
CREATE INDEX IF NOT EXISTS idx_companies_name ON public.companies(name);

-- Coupons table
CREATE TABLE IF NOT EXISTS public.coupons (
  id BIGSERIAL PRIMARY KEY,
  submitter_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  company_id BIGINT REFERENCES public.companies(id) ON DELETE CASCADE,
  category_id BIGINT REFERENCES public.categories(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  coupon_code TEXT,
  coupon_type TEXT NOT NULL DEFAULT 'percentage', -- percentage, fixed_amount, free_shipping, etc.
  discount_value DECIMAL(10,2),
  minimum_order_amount DECIMAL(10,2),
  maximum_discount_amount DECIMAL(10,2),
  terms_conditions TEXT,
  starts_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  is_exclusive BOOLEAN NOT NULL DEFAULT false,
  views_count INTEGER NOT NULL DEFAULT 0,
  clicks_count INTEGER NOT NULL DEFAULT 0,
  success_rate DECIMAL(5,2) DEFAULT 0.00,
  status deal_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  approved_at TIMESTAMPTZ
);

-- Add trigger for coupons updated_at
DROP TRIGGER IF EXISTS trg_coupons_updated_at ON public.coupons;
CREATE TRIGGER trg_coupons_updated_at
  BEFORE UPDATE ON public.coupons
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add indexes for coupons
CREATE INDEX IF NOT EXISTS idx_coupons_company ON public.coupons(company_id);
CREATE INDEX IF NOT EXISTS idx_coupons_category ON public.coupons(category_id);
CREATE INDEX IF NOT EXISTS idx_coupons_status ON public.coupons(status);
CREATE INDEX IF NOT EXISTS idx_coupons_expires_at ON public.coupons(expires_at);
CREATE INDEX IF NOT EXISTS idx_coupons_featured ON public.coupons(is_featured);
CREATE INDEX IF NOT EXISTS idx_coupons_created_at ON public.coupons(created_at);

-- Coupon votes table
CREATE TABLE IF NOT EXISTS public.coupon_votes (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  coupon_id BIGINT REFERENCES public.coupons(id) ON DELETE CASCADE,
  value INTEGER NOT NULL CHECK (value IN (-1, 1)),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, coupon_id)
);

-- Add indexes for coupon_votes
CREATE INDEX IF NOT EXISTS idx_coupon_votes_coupon ON public.coupon_votes(coupon_id);
CREATE INDEX IF NOT EXISTS idx_coupon_votes_user ON public.coupon_votes(user_id);

-- Coupon comments table
CREATE TABLE IF NOT EXISTS public.coupon_comments (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  coupon_id BIGINT REFERENCES public.coupons(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  parent_id BIGINT REFERENCES public.coupon_comments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes for coupon_comments
CREATE INDEX IF NOT EXISTS idx_coupon_comments_coupon ON public.coupon_comments(coupon_id);
CREATE INDEX IF NOT EXISTS idx_coupon_comments_user ON public.coupon_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_coupon_comments_parent ON public.coupon_comments(parent_id);

-- Coupon usage tracking
CREATE TABLE IF NOT EXISTS public.coupon_usage (
  id BIGSERIAL PRIMARY KEY,
  coupon_id BIGINT REFERENCES public.coupons(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  order_amount DECIMAL(10,2),
  was_successful BOOLEAN NOT NULL DEFAULT true,
  used_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT
);

-- Add indexes for coupon_usage
CREATE INDEX IF NOT EXISTS idx_coupon_usage_coupon ON public.coupon_usage(coupon_id);
CREATE INDEX IF NOT EXISTS idx_coupon_usage_user ON public.coupon_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_coupon_usage_used_at ON public.coupon_usage(used_at);

-- Update deals table to reference companies
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS company_id BIGINT REFERENCES public.companies(id) ON DELETE SET NULL;
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS deal_type TEXT DEFAULT 'discount';
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS minimum_order_amount DECIMAL(10,2);
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS maximum_discount_amount DECIMAL(10,2);
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS terms_conditions TEXT;
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS starts_at TIMESTAMPTZ;
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS tags TEXT[];
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS is_exclusive BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS views_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS clicks_count INTEGER NOT NULL DEFAULT 0;

-- Add index for deals company
CREATE INDEX IF NOT EXISTS idx_deals_company ON public.deals(company_id);

-- RLS policies for new tables
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_usage ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (allow all for now)
CREATE POLICY "Allow all on companies" ON public.companies FOR ALL USING (true);
CREATE POLICY "Allow all on coupons" ON public.coupons FOR ALL USING (true);
CREATE POLICY "Allow all on coupon_votes" ON public.coupon_votes FOR ALL USING (true);
CREATE POLICY "Allow all on coupon_comments" ON public.coupon_comments FOR ALL USING (true);
CREATE POLICY "Allow all on coupon_usage" ON public.coupon_usage FOR ALL USING (true);

-- Function to track coupon usage
CREATE OR REPLACE FUNCTION track_coupon_usage(
  coupon_id_param BIGINT,
  user_id_param UUID DEFAULT NULL,
  order_amount_param DECIMAL DEFAULT NULL,
  was_successful_param BOOLEAN DEFAULT true
)
RETURNS void
LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO public.coupon_usage (
    coupon_id, user_id, order_amount, was_successful
  ) VALUES (
    coupon_id_param, user_id_param, order_amount_param, was_successful_param
  );
  
  -- Update coupon clicks count
  UPDATE public.coupons 
  SET clicks_count = clicks_count + 1
  WHERE id = coupon_id_param;
  
  -- Update success rate if this was a successful use
  IF was_successful_param THEN
    UPDATE public.coupons 
    SET success_rate = (
      SELECT (COUNT(*) FILTER (WHERE was_successful = true) * 100.0 / COUNT(*))::DECIMAL(5,2)
      FROM public.coupon_usage 
      WHERE coupon_id = coupon_id_param
    )
    WHERE id = coupon_id_param;
  END IF;
END $$;

-- Success message
SELECT 'Companies and coupons system created successfully!' as status;
