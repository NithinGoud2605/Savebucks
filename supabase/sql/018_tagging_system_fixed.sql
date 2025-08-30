-- Enhanced Tagging System for Deals and Coupons (Fixed Version)
-- This creates a comprehensive tagging system that allows categorization and filtering

-- Create tags table first
CREATE TABLE IF NOT EXISTS public.tags (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#3B82F6',
  icon TEXT,
  category TEXT,
  is_featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for tags table
CREATE INDEX IF NOT EXISTS idx_tags_category ON public.tags(category);
CREATE INDEX IF NOT EXISTS idx_tags_is_featured ON public.tags(is_featured);
CREATE INDEX IF NOT EXISTS idx_tags_slug ON public.tags(slug);

-- Insert default tags
INSERT INTO public.tags (name, slug, description, color, category, is_featured) VALUES
-- Category tags
('Electronics', 'electronics', 'Electronic devices and gadgets', '#3B82F6', 'category', TRUE),
('Fashion', 'fashion', 'Clothing, shoes, and accessories', '#EC4899', 'category', TRUE),
('Home & Garden', 'home-garden', 'Home improvement and garden items', '#10B981', 'category', TRUE),
('Books & Media', 'books-media', 'Books, movies, music, and games', '#8B5CF6', 'category', TRUE),
('Sports & Outdoors', 'sports-outdoors', 'Sports equipment and outdoor gear', '#F59E0B', 'category', TRUE),
('Health & Beauty', 'health-beauty', 'Health, beauty, and personal care', '#EF4444', 'category', TRUE),
('Food & Drinks', 'food-drinks', 'Food, beverages, and dining', '#F97316', 'category', TRUE),
('Travel', 'travel', 'Travel deals and vacation packages', '#06B6D4', 'category', TRUE),

-- Brand tags
('Amazon', 'amazon', 'Amazon deals and products', '#FF9900', 'brand', TRUE),
('Apple', 'apple', 'Apple products and accessories', '#000000', 'brand', TRUE),
('Samsung', 'samsung', 'Samsung electronics and devices', '#1428A0', 'brand', FALSE),
('Nike', 'nike', 'Nike sportswear and equipment', '#000000', 'brand', FALSE),
('Adidas', 'adidas', 'Adidas sportswear and equipment', '#000000', 'brand', FALSE),

-- Feature tags
('Free Shipping', 'free-shipping', 'Deals with free shipping', '#10B981', 'feature', TRUE),
('Limited Time', 'limited-time', 'Time-sensitive deals', '#EF4444', 'feature', TRUE),
('Flash Sale', 'flash-sale', 'Flash sale deals', '#F59E0B', 'feature', TRUE),
('Clearance', 'clearance', 'Clearance and closeout deals', '#8B5CF6', 'feature', FALSE),
('New Release', 'new-release', 'Newly released products', '#06B6D4', 'feature', FALSE),
('Best Seller', 'best-seller', 'Best selling products', '#10B981', 'feature', TRUE),

-- Price range tags
('Under $10', 'under-10', 'Deals under $10', '#10B981', 'price-range', FALSE),
('Under $25', 'under-25', 'Deals under $25', '#10B981', 'price-range', FALSE),
('Under $50', 'under-50', 'Deals under $50', '#F59E0B', 'price-range', FALSE),
('Under $100', 'under-100', 'Deals under $100', '#EF4444', 'price-range', FALSE),
('Premium', 'premium', 'High-end premium products', '#8B5CF6', 'price-range', FALSE),

-- Discount tags
('50% Off or More', '50-off-more', 'Deals with 50% or more discount', '#EF4444', 'discount', TRUE),
('Buy One Get One', 'bogo', 'Buy one get one deals', '#F59E0B', 'discount', TRUE),
('Free Gift', 'free-gift', 'Deals with free gifts', '#10B981', 'discount', FALSE),

-- Seasonal tags
('Holiday', 'holiday', 'Holiday season deals', '#EF4444', 'seasonal', FALSE),
('Back to School', 'back-to-school', 'Back to school deals', '#3B82F6', 'seasonal', FALSE),
('Black Friday', 'black-friday', 'Black Friday deals', '#000000', 'seasonal', FALSE),
('Cyber Monday', 'cyber-monday', 'Cyber Monday deals', '#3B82F6', 'seasonal', FALSE)

ON CONFLICT (slug) DO NOTHING;

-- Enable RLS for tags
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tags
CREATE POLICY "Anyone can view tags" ON public.tags FOR SELECT USING (true);
CREATE POLICY "Only admins can manage tags" ON public.tags FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Function to automatically suggest tags based on title and description
CREATE OR REPLACE FUNCTION suggest_tags_for_content(
  title_text TEXT,
  description_text TEXT DEFAULT '',
  max_suggestions INT DEFAULT 10
)
RETURNS TABLE (
  tag_id INT,
  tag_name TEXT,
  tag_slug TEXT,
  relevance_score FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id,
    t.name,
    t.slug,
    (
      CASE 
        WHEN LOWER(title_text) LIKE '%' || LOWER(t.name) || '%' THEN 3.0
        WHEN LOWER(description_text) LIKE '%' || LOWER(t.name) || '%' THEN 2.0
        WHEN LOWER(title_text) LIKE '%' || LOWER(SPLIT_PART(t.name, ' ', 1)) || '%' THEN 1.5
        ELSE 0.0
      END
    ) as relevance_score
  FROM public.tags t
  WHERE (
    LOWER(title_text) LIKE '%' || LOWER(t.name) || '%'
    OR LOWER(description_text) LIKE '%' || LOWER(t.name) || '%'
    OR LOWER(title_text) LIKE '%' || LOWER(SPLIT_PART(t.name, ' ', 1)) || '%'
  )
  ORDER BY relevance_score DESC, t.is_featured DESC, t.name ASC
  LIMIT max_suggestions;
END;
$$;

-- Simple function to get tags (without junction table dependencies)
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
    0::BIGINT as usage_count -- Default to 0 for now, will be updated when junction tables exist
  FROM public.tags t
  WHERE (tag_category_filter IS NULL OR t.category = tag_category_filter)
  ORDER BY t.is_featured DESC, t.name ASC
  LIMIT limit_count;
END;
$$;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_tags_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_tags_updated_at
  BEFORE UPDATE ON public.tags
  FOR EACH ROW EXECUTE FUNCTION update_tags_updated_at();

-- Create junction tables using a simple approach
-- This will be executed separately after the main tables exist

-- Comments for documentation
COMMENT ON TABLE public.tags IS 'Tags for categorizing deals and coupons';
COMMENT ON FUNCTION suggest_tags_for_content IS 'Suggests relevant tags based on content analysis';
COMMENT ON FUNCTION get_popular_tags IS 'Returns popular tags with usage statistics';
