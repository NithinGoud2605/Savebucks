-- Categories and Collections System for SaveBucks

-- Categories table
CREATE TABLE IF NOT EXISTS public.categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  icon TEXT, -- Icon name or URL
  color TEXT, -- Hex color for theming
  image_url TEXT,
  parent_id INTEGER REFERENCES public.categories(id) ON DELETE CASCADE,
  sort_order INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add trigger for updated_at
CREATE TRIGGER trg_categories_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Collections table (for curated deal groups like "Amazon Best Sellers")
CREATE TABLE IF NOT EXISTS public.collections (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  image_url TEXT,
  type TEXT NOT NULL DEFAULT 'manual', -- 'manual', 'auto_category', 'auto_merchant', 'auto_discount'
  category_id INTEGER REFERENCES public.categories(id) ON DELETE SET NULL,
  merchant TEXT, -- For merchant-specific collections
  min_discount INTEGER, -- Minimum discount percentage for auto collections
  max_items INTEGER DEFAULT 20,
  is_featured BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add trigger for updated_at
CREATE TRIGGER trg_collections_updated_at
  BEFORE UPDATE ON public.collections
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Collection items (manual collections)
CREATE TABLE IF NOT EXISTS public.collection_items (
  id SERIAL PRIMARY KEY,
  collection_id INTEGER NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
  deal_id BIGINT NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  sort_order INTEGER DEFAULT 0,
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(collection_id, deal_id)
);

-- Banners/Hero sections
CREATE TABLE IF NOT EXISTS public.banners (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT,
  description TEXT,
  image_url TEXT NOT NULL,
  mobile_image_url TEXT,
  link_url TEXT,
  link_text TEXT DEFAULT 'Shop now',
  background_color TEXT DEFAULT '#f3f4f6',
  text_color TEXT DEFAULT '#1f2937',
  position TEXT DEFAULT 'hero', -- 'hero', 'secondary', 'sidebar'
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add trigger for updated_at
CREATE TRIGGER trg_banners_updated_at
  BEFORE UPDATE ON public.banners
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Add category_id to deals table
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS category_id INTEGER REFERENCES public.categories(id) ON DELETE SET NULL;

-- Add coupon fields to deals table
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS coupon_code TEXT;
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS coupon_type TEXT DEFAULT 'none'; -- 'none', 'code', 'automatic', 'cashback'
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS discount_percentage INTEGER;
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS discount_amount NUMERIC;
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS original_price NUMERIC;
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

-- Deal tags table (for flexible tagging)
CREATE TABLE IF NOT EXISTS public.deal_tags (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  color TEXT DEFAULT '#6b7280',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Deal to tags mapping
CREATE TABLE IF NOT EXISTS public.deal_tag_relations (
  deal_id BIGINT NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  tag_id INTEGER NOT NULL REFERENCES public.deal_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (deal_id, tag_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON public.categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_featured ON public.categories(is_featured, is_active);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories(slug);

CREATE INDEX IF NOT EXISTS idx_collections_type ON public.collections(type, is_active);
CREATE INDEX IF NOT EXISTS idx_collections_featured ON public.collections(is_featured, is_active);
CREATE INDEX IF NOT EXISTS idx_collections_category ON public.collections(category_id);

CREATE INDEX IF NOT EXISTS idx_collection_items_collection ON public.collection_items(collection_id, sort_order);

CREATE INDEX IF NOT EXISTS idx_banners_position ON public.banners(position, is_active, sort_order);
CREATE INDEX IF NOT EXISTS idx_banners_dates ON public.banners(start_date, end_date);

CREATE INDEX IF NOT EXISTS idx_deals_category ON public.deals(category_id, status, approved_at DESC);
CREATE INDEX IF NOT EXISTS idx_deals_coupon ON public.deals(coupon_type, status);
CREATE INDEX IF NOT EXISTS idx_deals_expires ON public.deals(expires_at);

CREATE INDEX IF NOT EXISTS idx_deal_tag_relations_deal ON public.deal_tag_relations(deal_id);
CREATE INDEX IF NOT EXISTS idx_deal_tag_relations_tag ON public.deal_tag_relations(tag_id);

-- RLS Policies
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deal_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deal_tag_relations ENABLE ROW LEVEL SECURITY;

-- Categories: read all, admin write
CREATE POLICY "categories_read_all" ON public.categories FOR SELECT USING (is_active = true);
CREATE POLICY "categories_admin_write" ON public.categories FOR ALL USING (is_admin());

-- Collections: read all, admin write
CREATE POLICY "collections_read_all" ON public.collections FOR SELECT USING (is_active = true);
CREATE POLICY "collections_admin_write" ON public.collections FOR ALL USING (is_admin());

-- Collection items: read all, admin write
CREATE POLICY "collection_items_read_all" ON public.collection_items FOR SELECT USING (true);
CREATE POLICY "collection_items_admin_write" ON public.collection_items FOR ALL USING (is_admin());

-- Banners: read active, admin write
CREATE POLICY "banners_read_active" ON public.banners 
  FOR SELECT USING (
    is_active = true AND 
    (start_date IS NULL OR start_date <= NOW()) AND 
    (end_date IS NULL OR end_date >= NOW())
  );
CREATE POLICY "banners_admin_write" ON public.banners FOR ALL USING (is_admin());

-- Deal tags: read all, admin write
CREATE POLICY "deal_tags_read_all" ON public.deal_tags FOR SELECT USING (true);
CREATE POLICY "deal_tags_admin_write" ON public.deal_tags FOR ALL USING (is_admin());

-- Deal tag relations: read all, admin write
CREATE POLICY "deal_tag_relations_read_all" ON public.deal_tag_relations FOR SELECT USING (true);
CREATE POLICY "deal_tag_relations_admin_write" ON public.deal_tag_relations FOR ALL USING (is_admin());
