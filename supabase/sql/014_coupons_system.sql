-- Separate Coupons System with Company Management

-- Companies/Merchants table (enhanced)
CREATE TABLE IF NOT EXISTS public.companies (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  website TEXT,
  logo_url TEXT,
  category TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  rating DECIMAL(3,2) DEFAULT 0.00,
  total_reviews INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_companies_slug ON public.companies(slug);
CREATE INDEX IF NOT EXISTS idx_companies_category ON public.companies(category);
CREATE INDEX IF NOT EXISTS idx_companies_verified ON public.companies(is_verified);

-- Coupons table (separate from deals)
CREATE TABLE IF NOT EXISTS public.coupons (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  coupon_code TEXT NOT NULL,
  coupon_type TEXT NOT NULL CHECK (coupon_type IN ('percentage', 'fixed_amount', 'free_shipping', 'bogo', 'other')),
  discount_value DECIMAL(10,2), -- percentage or fixed amount
  minimum_order_amount DECIMAL(10,2),
  maximum_discount_amount DECIMAL(10,2),
  company_id BIGINT REFERENCES public.companies(id) ON DELETE CASCADE,
  category_id BIGINT REFERENCES public.categories(id) ON DELETE SET NULL,
  submitter_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  
  -- Coupon details
  terms_conditions TEXT,
  usage_limit INT, -- how many times this coupon can be used total
  usage_limit_per_user INT DEFAULT 1,
  used_count INT DEFAULT 0,
  
  -- Dates and status
  starts_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'expired', 'disabled')),
  rejection_reason TEXT,
  approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  
  -- Additional fields
  featured_image TEXT,
  coupon_images TEXT[], -- Array of image URLs
  tags TEXT[],
  is_featured BOOLEAN DEFAULT FALSE,
  is_exclusive BOOLEAN DEFAULT FALSE,
  source_url TEXT, -- Where the coupon can be used
  
  -- Tracking
  views_count INT DEFAULT 0,
  clicks_count INT DEFAULT 0,
  success_rate DECIMAL(5,2) DEFAULT 0.00, -- percentage of successful uses
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for coupons
CREATE INDEX IF NOT EXISTS idx_coupons_company ON public.coupons(company_id);
CREATE INDEX IF NOT EXISTS idx_coupons_category ON public.coupons(category_id);
CREATE INDEX IF NOT EXISTS idx_coupons_submitter ON public.coupons(submitter_id);
CREATE INDEX IF NOT EXISTS idx_coupons_status ON public.coupons(status);
CREATE INDEX IF NOT EXISTS idx_coupons_expires ON public.coupons(expires_at);
CREATE INDEX IF NOT EXISTS idx_coupons_featured ON public.coupons(is_featured);
CREATE INDEX IF NOT EXISTS idx_coupons_code ON public.coupons(coupon_code);

-- Coupon usage tracking
CREATE TABLE IF NOT EXISTS public.coupon_usage (
  id BIGSERIAL PRIMARY KEY,
  coupon_id BIGINT NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  used_at TIMESTAMPTZ DEFAULT NOW(),
  order_amount DECIMAL(10,2),
  discount_applied DECIMAL(10,2),
  was_successful BOOLEAN DEFAULT TRUE,
  ip_address INET,
  user_agent TEXT,
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_coupon_usage_coupon ON public.coupon_usage(coupon_id);
CREATE INDEX IF NOT EXISTS idx_coupon_usage_user ON public.coupon_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_coupon_usage_date ON public.coupon_usage(used_at);

-- Coupon votes (similar to deal votes)
CREATE TABLE IF NOT EXISTS public.coupon_votes (
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  coupon_id BIGINT NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
  value SMALLINT NOT NULL CHECK (value IN (-1, 1)),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, coupon_id)
);

CREATE INDEX IF NOT EXISTS idx_coupon_votes_coupon ON public.coupon_votes(coupon_id);

-- Coupon comments
CREATE TABLE IF NOT EXISTS public.coupon_comments (
  id BIGSERIAL PRIMARY KEY,
  coupon_id BIGINT NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  parent_id BIGINT REFERENCES public.coupon_comments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coupon_comments_coupon ON public.coupon_comments(coupon_id, created_at);

-- Enhanced deals table (add more fields)
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS company_id BIGINT REFERENCES public.companies(id) ON DELETE SET NULL;
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS deal_type TEXT DEFAULT 'deal' CHECK (deal_type IN ('deal', 'sale', 'clearance', 'flash_sale', 'bundle', 'cashback'));
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS minimum_order_amount DECIMAL(10,2);
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS maximum_discount_amount DECIMAL(10,2);
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS terms_conditions TEXT;
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS starts_at TIMESTAMPTZ;
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS tags TEXT[];
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE;
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS is_exclusive BOOLEAN DEFAULT FALSE;
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS views_count INT DEFAULT 0;
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS clicks_count INT DEFAULT 0;

-- Create indexes for new deal fields
CREATE INDEX IF NOT EXISTS idx_deals_company ON public.deals(company_id);
CREATE INDEX IF NOT EXISTS idx_deals_type ON public.deals(deal_type);
CREATE INDEX IF NOT EXISTS idx_deals_featured ON public.deals(is_featured);
CREATE INDEX IF NOT EXISTS idx_deals_starts_at ON public.deals(starts_at);

-- Triggers for updated_at
CREATE TRIGGER trg_companies_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_coupons_updated_at
  BEFORE UPDATE ON public.coupons
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Functions for coupon management

-- Function to get coupon votes aggregation
CREATE OR REPLACE FUNCTION get_coupon_votes_agg()
RETURNS TABLE (
  coupon_id BIGINT,
  ups BIGINT,
  downs BIGINT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cv.coupon_id,
    COUNT(*) FILTER (WHERE cv.value = 1) as ups,
    COUNT(*) FILTER (WHERE cv.value = -1) as downs
  FROM public.coupon_votes cv
  GROUP BY cv.coupon_id;
END;
$$;

-- Function to get user's vote on a coupon
CREATE OR REPLACE FUNCTION get_user_coupon_vote(coupon_id_param BIGINT, user_id_param UUID)
RETURNS INT
LANGUAGE plpgsql
AS $$
DECLARE
  vote_value INT;
BEGIN
  SELECT value INTO vote_value
  FROM public.coupon_votes
  WHERE coupon_id = coupon_id_param AND user_id = user_id_param;
  
  RETURN COALESCE(vote_value, 0);
END;
$$;

-- Function to track coupon usage
CREATE OR REPLACE FUNCTION track_coupon_usage(
  coupon_id_param BIGINT,
  user_id_param UUID DEFAULT NULL,
  order_amount_param DECIMAL DEFAULT NULL,
  was_successful_param BOOLEAN DEFAULT TRUE
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  -- Insert usage record
  INSERT INTO public.coupon_usage (
    coupon_id, user_id, order_amount, was_successful
  ) VALUES (
    coupon_id_param, user_id_param, order_amount_param, was_successful_param
  );
  
  -- Update coupon usage count and success rate
  UPDATE public.coupons SET
    used_count = used_count + 1,
    success_rate = (
      SELECT (COUNT(*) FILTER (WHERE was_successful = TRUE) * 100.0 / COUNT(*))::DECIMAL(5,2)
      FROM public.coupon_usage
      WHERE coupon_id = coupon_id_param
    )
  WHERE id = coupon_id_param;
END;
$$;

-- Function to check if coupon is valid
CREATE OR REPLACE FUNCTION is_coupon_valid(coupon_id_param BIGINT, user_id_param UUID DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  coupon_record RECORD;
  user_usage_count INT;
BEGIN
  -- Get coupon details
  SELECT * INTO coupon_record
  FROM public.coupons
  WHERE id = coupon_id_param;
  
  -- Check if coupon exists
  IF coupon_record IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Check status
  IF coupon_record.status != 'approved' THEN
    RETURN FALSE;
  END IF;
  
  -- Check expiration
  IF coupon_record.expires_at IS NOT NULL AND coupon_record.expires_at < NOW() THEN
    RETURN FALSE;
  END IF;
  
  -- Check start date
  IF coupon_record.starts_at IS NOT NULL AND coupon_record.starts_at > NOW() THEN
    RETURN FALSE;
  END IF;
  
  -- Check total usage limit
  IF coupon_record.usage_limit IS NOT NULL AND coupon_record.used_count >= coupon_record.usage_limit THEN
    RETURN FALSE;
  END IF;
  
  -- Check per-user usage limit
  IF user_id_param IS NOT NULL AND coupon_record.usage_limit_per_user IS NOT NULL THEN
    SELECT COUNT(*) INTO user_usage_count
    FROM public.coupon_usage
    WHERE coupon_id = coupon_id_param AND user_id = user_id_param;
    
    IF user_usage_count >= coupon_record.usage_limit_per_user THEN
      RETURN FALSE;
    END IF;
  END IF;
  
  RETURN TRUE;
END;
$$;

-- Triggers for automatic status updates

-- Set coupon submitter
CREATE OR REPLACE FUNCTION set_coupon_submitter()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.submitter_id = auth.uid();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_coupons_set_submitter
  BEFORE INSERT ON public.coupons
  FOR EACH ROW EXECUTE FUNCTION set_coupon_submitter();

-- Award points for coupon activities
CREATE OR REPLACE FUNCTION award_coupon_points()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Award points for coupon submission
  IF TG_OP = 'INSERT' AND NEW.submitter_id IS NOT NULL THEN
    PERFORM award_activity_points(NEW.submitter_id, 'coupon_posted', 'coupon', NEW.id);
  END IF;
  
  -- Award points for coupon approval
  IF TG_OP = 'UPDATE' AND NEW.status = 'approved' AND OLD.status != 'approved' AND NEW.submitter_id IS NOT NULL THEN
    PERFORM award_activity_points(NEW.submitter_id, 'coupon_approved', 'coupon', NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_coupons_award_points
  AFTER INSERT OR UPDATE ON public.coupons
  FOR EACH ROW EXECUTE FUNCTION award_coupon_points();

-- Update user stats for coupon activities
CREATE OR REPLACE FUNCTION update_coupon_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Update total posts count (include coupons)
  IF TG_OP = 'INSERT' AND NEW.submitter_id IS NOT NULL THEN
    UPDATE public.profiles SET 
      total_posts = total_posts + 1,
      last_active = NOW()
    WHERE id = NEW.submitter_id;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_coupons_update_stats
  AFTER INSERT ON public.coupons
  FOR EACH ROW EXECUTE FUNCTION update_coupon_stats();

-- RLS Policies for coupons
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_comments ENABLE ROW LEVEL SECURITY;

-- Coupons policies
CREATE POLICY "Anyone can view approved coupons" ON public.coupons
  FOR SELECT USING (status = 'approved');

CREATE POLICY "Users can view own coupons" ON public.coupons
  FOR SELECT USING (auth.uid() = submitter_id);

CREATE POLICY "Admins can view all coupons" ON public.coupons
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Users can create coupons" ON public.coupons
  FOR INSERT WITH CHECK (auth.uid() = submitter_id);

CREATE POLICY "Users can update own coupons" ON public.coupons
  FOR UPDATE USING (auth.uid() = submitter_id);

CREATE POLICY "Admins can update all coupons" ON public.coupons
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Companies policies
CREATE POLICY "Anyone can view companies" ON public.companies
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage companies" ON public.companies
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Coupon usage policies
CREATE POLICY "Users can view own coupon usage" ON public.coupon_usage
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all coupon usage" ON public.coupon_usage
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Users can create coupon usage records" ON public.coupon_usage
  FOR INSERT WITH CHECK (true);

-- Coupon votes policies
CREATE POLICY "Users can vote on coupons" ON public.coupon_votes
  FOR ALL USING (auth.uid() = user_id);

-- Coupon comments policies
CREATE POLICY "Anyone can view coupon comments" ON public.coupon_comments
  FOR SELECT USING (true);

CREATE POLICY "Users can create coupon comments" ON public.coupon_comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own coupon comments" ON public.coupon_comments
  FOR UPDATE USING (auth.uid() = user_id);

-- Insert some sample companies
INSERT INTO public.companies (name, slug, description, website, category, is_verified) VALUES
('Amazon', 'amazon', 'Online marketplace and cloud computing company', 'https://amazon.com', 'E-commerce', true),
('Walmart', 'walmart', 'American multinational retail corporation', 'https://walmart.com', 'Retail', true),
('Target', 'target', 'American big box department store chain', 'https://target.com', 'Retail', true),
('Best Buy', 'best-buy', 'American multinational consumer electronics retailer', 'https://bestbuy.com', 'Electronics', true),
('Nike', 'nike', 'American multinational corporation engaged in design and manufacturing of footwear, apparel, equipment, accessories and services', 'https://nike.com', 'Fashion', true),
('Apple', 'apple', 'American multinational technology company', 'https://apple.com', 'Technology', true),
('McDonald\'s', 'mcdonalds', 'American fast food company', 'https://mcdonalds.com', 'Food', true),
('Starbucks', 'starbucks', 'American multinational chain of coffeehouses', 'https://starbucks.com', 'Food', true)
ON CONFLICT (slug) DO NOTHING;
