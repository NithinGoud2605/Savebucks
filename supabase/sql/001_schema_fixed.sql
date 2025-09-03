-- SCHEMA: core tables, enums, indexes, triggers
-- Fixed version with proper enum handling and constraints

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ENUMS
DO $$ BEGIN
  CREATE TYPE deal_status AS ENUM ('pending','approved','rejected','expired','deleted');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE report_reason AS ENUM ('spam','expired','other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- HELPER: updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END $$;

-- TABLES

-- profiles mirrors auth.users (1:1)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY, -- equals auth.users.id
  handle TEXT UNIQUE,
  avatar_url TEXT,
  karma INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add trigger for profiles updated_at
DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- merchants table
CREATE TABLE IF NOT EXISTS public.merchants (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  url TEXT,
  logo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- categories table
CREATE TABLE IF NOT EXISTS public.categories (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  color TEXT DEFAULT '#3B82F6',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- deals table
CREATE TABLE IF NOT EXISTS public.deals (
  id BIGSERIAL PRIMARY KEY,
  submitter_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  price DECIMAL(10,2),
  original_price DECIMAL(10,2),
  merchant TEXT,
  store TEXT,
  description TEXT,
  image_url TEXT,
  coupon_code TEXT,
  coupon_type TEXT,
  discount_percentage INTEGER,
  discount_amount DECIMAL(10,2),
  category_id BIGINT REFERENCES public.categories(id) ON DELETE SET NULL,
  status deal_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ
);

-- Add indexes for deals
CREATE INDEX IF NOT EXISTS idx_deals_status ON public.deals(status);
CREATE INDEX IF NOT EXISTS idx_deals_category ON public.deals(category_id);
CREATE INDEX IF NOT EXISTS idx_deals_submitter ON public.deals(submitter_id);
CREATE INDEX IF NOT EXISTS idx_deals_created_at ON public.deals(created_at);

-- Add trigger for deals updated_at
DROP TRIGGER IF EXISTS trg_deals_updated_at ON public.deals;
CREATE TRIGGER trg_deals_updated_at
  BEFORE UPDATE ON public.deals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- votes table
CREATE TABLE IF NOT EXISTS public.votes (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  deal_id BIGINT REFERENCES public.deals(id) ON DELETE CASCADE,
  value INTEGER NOT NULL CHECK (value IN (-1, 1)),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, deal_id)
);

-- Add indexes for votes
CREATE INDEX IF NOT EXISTS idx_votes_deal ON public.votes(deal_id);
CREATE INDEX IF NOT EXISTS idx_votes_user ON public.votes(user_id);

-- comments table
CREATE TABLE IF NOT EXISTS public.comments (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  deal_id BIGINT REFERENCES public.deals(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  parent_id BIGINT REFERENCES public.comments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes for comments
CREATE INDEX IF NOT EXISTS idx_comments_deal ON public.comments(deal_id);
CREATE INDEX IF NOT EXISTS idx_comments_user ON public.comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent ON public.comments(parent_id);

-- reports table
CREATE TABLE IF NOT EXISTS public.reports (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  deal_id BIGINT REFERENCES public.deals(id) ON DELETE CASCADE,
  reason report_reason NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes for reports
CREATE INDEX IF NOT EXISTS idx_reports_deal ON public.reports(deal_id);
CREATE INDEX IF NOT EXISTS idx_reports_user ON public.reports(user_id);

-- affiliate_clicks table
CREATE TABLE IF NOT EXISTS public.affiliate_clicks (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  deal_id BIGINT REFERENCES public.deals(id) ON DELETE CASCADE,
  clicked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT
);

-- Add indexes for affiliate_clicks
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_deal ON public.affiliate_clicks(deal_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_user ON public.affiliate_clicks(user_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_clicked_at ON public.affiliate_clicks(clicked_at);

-- conversions table
CREATE TABLE IF NOT EXISTS public.conversions (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  deal_id BIGINT REFERENCES public.deals(id) ON DELETE CASCADE,
  amount DECIMAL(10,2),
  commission DECIMAL(10,2),
  converted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes for conversions
CREATE INDEX IF NOT EXISTS idx_conversions_deal ON public.conversions(deal_id);
CREATE INDEX IF NOT EXISTS idx_conversions_user ON public.conversions(user_id);

-- follows table
CREATE TABLE IF NOT EXISTS public.follows (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  merchant TEXT,
  category_id BIGINT REFERENCES public.categories(id) ON DELETE CASCADE,
  keyword TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, merchant, category_id, keyword)
);

-- Add indexes for follows
CREATE INDEX IF NOT EXISTS idx_follows_user ON public.follows(user_id);
CREATE INDEX IF NOT EXISTS idx_follows_merchant ON public.follows(merchant);
CREATE INDEX IF NOT EXISTS idx_follows_category ON public.follows(category_id);

-- Helper function to get vote aggregation
CREATE OR REPLACE FUNCTION get_votes_agg()
RETURNS TABLE(deal_id BIGINT, ups BIGINT, downs BIGINT) 
LANGUAGE sql STABLE AS $$
  SELECT 
    v.deal_id,
    COUNT(*) FILTER (WHERE v.value = 1) AS ups,
    COUNT(*) FILTER (WHERE v.value = -1) AS downs
  FROM public.votes v
  GROUP BY v.deal_id;
$$;

-- Function to bump karma when deal is approved
CREATE OR REPLACE FUNCTION bump_karma() 
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
    UPDATE public.profiles 
    SET karma = karma + 10 
    WHERE id = NEW.submitter_id;
  END IF;
  RETURN NEW;
END $$;

-- Add karma bump trigger
DROP TRIGGER IF EXISTS trg_deals_bump_karma ON public.deals;
CREATE TRIGGER trg_deals_bump_karma
  AFTER UPDATE ON public.deals
  FOR EACH ROW EXECUTE FUNCTION bump_karma();

-- RLS Policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (allow all for now, will be refined later)
CREATE POLICY "Allow all on profiles" ON public.profiles FOR ALL USING (true);
CREATE POLICY "Allow all on deals" ON public.deals FOR ALL USING (true);
CREATE POLICY "Allow all on votes" ON public.votes FOR ALL USING (true);
CREATE POLICY "Allow all on comments" ON public.comments FOR ALL USING (true);
CREATE POLICY "Allow all on reports" ON public.reports FOR ALL USING (true);
CREATE POLICY "Allow all on affiliate_clicks" ON public.affiliate_clicks FOR ALL USING (true);
CREATE POLICY "Allow all on conversions" ON public.conversions FOR ALL USING (true);
CREATE POLICY "Allow all on follows" ON public.follows FOR ALL USING (true);
CREATE POLICY "Allow all on merchants" ON public.merchants FOR ALL USING (true);
CREATE POLICY "Allow all on categories" ON public.categories FOR ALL USING (true);

-- Success message
SELECT 'Core schema created successfully!' as status;
