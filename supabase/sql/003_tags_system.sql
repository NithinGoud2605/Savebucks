-- TAGS SYSTEM
-- Fixed version with proper junction tables and relationships

-- Tags table
CREATE TABLE IF NOT EXISTS public.tags (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  color TEXT DEFAULT '#6B7280',
  category TEXT, -- for grouping tags
  usage_count INTEGER NOT NULL DEFAULT 0,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add trigger for tags updated_at
DROP TRIGGER IF EXISTS trg_tags_updated_at ON public.tags;
CREATE TRIGGER trg_tags_updated_at
  BEFORE UPDATE ON public.tags
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add indexes for tags
CREATE INDEX IF NOT EXISTS idx_tags_slug ON public.tags(slug);
CREATE INDEX IF NOT EXISTS idx_tags_name ON public.tags(name);
CREATE INDEX IF NOT EXISTS idx_tags_category ON public.tags(category);
CREATE INDEX IF NOT EXISTS idx_tags_usage_count ON public.tags(usage_count);

-- Deal tags junction table
CREATE TABLE IF NOT EXISTS public.deal_tags (
  id BIGSERIAL PRIMARY KEY,
  deal_id BIGINT REFERENCES public.deals(id) ON DELETE CASCADE,
  tag_id BIGINT REFERENCES public.tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(deal_id, tag_id)
);

-- Add indexes for deal_tags
CREATE INDEX IF NOT EXISTS idx_deal_tags_deal ON public.deal_tags(deal_id);
CREATE INDEX IF NOT EXISTS idx_deal_tags_tag ON public.deal_tags(tag_id);

-- Coupon tags junction table
CREATE TABLE IF NOT EXISTS public.coupon_tags (
  id BIGSERIAL PRIMARY KEY,
  coupon_id BIGINT REFERENCES public.coupons(id) ON DELETE CASCADE,
  tag_id BIGINT REFERENCES public.tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(coupon_id, tag_id)
);

-- Add indexes for coupon_tags
CREATE INDEX IF NOT EXISTS idx_coupon_tags_coupon ON public.coupon_tags(coupon_id);
CREATE INDEX IF NOT EXISTS idx_coupon_tags_tag ON public.coupon_tags(tag_id);

-- RLS policies for tags tables
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deal_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_tags ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (allow all for now)
CREATE POLICY "Allow all on tags" ON public.tags FOR ALL USING (true);
CREATE POLICY "Allow all on deal_tags" ON public.deal_tags FOR ALL USING (true);
CREATE POLICY "Allow all on coupon_tags" ON public.coupon_tags FOR ALL USING (true);

-- Function to get popular tags
CREATE OR REPLACE FUNCTION get_popular_tags(
  category_filter TEXT DEFAULT NULL,
  limit_count INTEGER DEFAULT 20
)
RETURNS TABLE(
  id BIGINT,
  name TEXT,
  slug TEXT,
  color TEXT,
  category TEXT,
  usage_count BIGINT
)
LANGUAGE sql STABLE AS $$
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
  ) dt ON t.id = dt.tag_id
  LEFT JOIN (
    SELECT tag_id, COUNT(*) as coupon_count
    FROM public.coupon_tags
    GROUP BY tag_id
  ) ct ON t.id = ct.tag_id
  WHERE (category_filter IS NULL OR t.category = category_filter)
  ORDER BY usage_count DESC, t.name ASC
  LIMIT limit_count;
$$;

-- Function to update tag usage counts
CREATE OR REPLACE FUNCTION update_tag_usage_counts()
RETURNS void
LANGUAGE plpgsql AS $$
BEGIN
  UPDATE public.tags
  SET usage_count = (
    COALESCE(dt.deal_count, 0) + COALESCE(ct.coupon_count, 0)
  )
  FROM (
    SELECT tag_id, COUNT(*) as deal_count
    FROM public.deal_tags
    GROUP BY tag_id
  ) dt
  FULL OUTER JOIN (
    SELECT tag_id, COUNT(*) as coupon_count
    FROM public.coupon_tags
    GROUP BY tag_id
  ) ct ON dt.tag_id = ct.tag_id
  WHERE public.tags.id = COALESCE(dt.tag_id, ct.tag_id);
END $$;

-- Trigger function to update tag usage count when deal_tags changes
CREATE OR REPLACE FUNCTION update_tag_count_on_deal_tag_change()
RETURNS TRIGGER
LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.tags 
    SET usage_count = usage_count + 1 
    WHERE id = NEW.tag_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.tags 
    SET usage_count = GREATEST(0, usage_count - 1) 
    WHERE id = OLD.tag_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END $$;

-- Trigger function to update tag usage count when coupon_tags changes
CREATE OR REPLACE FUNCTION update_tag_count_on_coupon_tag_change()
RETURNS TRIGGER
LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.tags 
    SET usage_count = usage_count + 1 
    WHERE id = NEW.tag_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.tags 
    SET usage_count = GREATEST(0, usage_count - 1) 
    WHERE id = OLD.tag_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END $$;

-- Add triggers for tag usage count updates
DROP TRIGGER IF EXISTS trg_deal_tags_update_count ON public.deal_tags;
CREATE TRIGGER trg_deal_tags_update_count
  AFTER INSERT OR DELETE ON public.deal_tags
  FOR EACH ROW EXECUTE FUNCTION update_tag_count_on_deal_tag_change();

DROP TRIGGER IF EXISTS trg_coupon_tags_update_count ON public.coupon_tags;
CREATE TRIGGER trg_coupon_tags_update_count
  AFTER INSERT OR DELETE ON public.coupon_tags
  FOR EACH ROW EXECUTE FUNCTION update_tag_count_on_coupon_tag_change();

-- Success message
SELECT 'Tags system created successfully!' as status;
