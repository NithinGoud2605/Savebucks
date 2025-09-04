-- Step-by-step migration to avoid function return type conflicts
-- Apply these statements one by one

-- Step 1: Create company_categories table
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

-- Step 2: Insert default categories
INSERT INTO public.company_categories (name, slug, description, icon, color) VALUES
  ('E-commerce', 'e-commerce', 'Online retail and shopping platforms', 'shopping-bag', '#3B82F6'),
  ('Technology', 'technology', 'Software, hardware, and tech services', 'computer-desktop', '#10B981'),
  ('Restaurant', 'restaurant', 'Food and dining establishments', 'cake', '#F59E0B'),
  ('Travel', 'travel', 'Hotels, flights, and travel services', 'airplane', '#8B5CF6'),
  ('Fashion', 'fashion', 'Clothing, accessories, and style', 'shirt', '#EC4899'),
  ('Health & Beauty', 'health-beauty', 'Wellness, cosmetics, and personal care', 'heart', '#EF4444'),
  ('Home & Garden', 'home-garden', 'Furniture, decor, and outdoor living', 'home', '#84CC16'),
  ('Automotive', 'automotive', 'Cars, parts, and automotive services', 'truck', '#6B7280'),
  ('Entertainment', 'entertainment', 'Movies, games, and leisure activities', 'play', '#F97316'),
  ('Education', 'education', 'Learning platforms and educational services', 'academic-cap', '#06B6D4'),
  ('Finance', 'finance', 'Banking, insurance, and financial services', 'currency-dollar', '#059669'),
  ('Sports & Fitness', 'sports-fitness', 'Athletic equipment and fitness services', 'muscle', '#DC2626'),
  ('Pets', 'pets', 'Pet supplies and veterinary services', 'heart', '#7C3AED'),
  ('Books & Media', 'books-media', 'Books, music, and digital content', 'book-open', '#1E40AF')
ON CONFLICT (slug) DO NOTHING;

-- Step 3: Add new columns to companies table
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS category_id BIGINT REFERENCES public.company_categories(id),
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
ADD COLUMN IF NOT EXISTS submitted_by UUID REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS review_notes TEXT;

-- Step 4: Add missing columns that might not exist
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS rating DECIMAL(3,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS total_reviews INTEGER DEFAULT 0;

-- Step 5: Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_companies_category_id ON public.companies(category_id);
CREATE INDEX IF NOT EXISTS idx_companies_status ON public.companies(status);
CREATE INDEX IF NOT EXISTS idx_companies_submitted_by ON public.companies(submitted_by);

-- Step 6: Update existing companies to have approved status
UPDATE public.companies 
SET status = 'approved', is_verified = true 
WHERE status IS NULL;

-- Step 7: Grant permissions
GRANT SELECT ON public.company_categories TO anon, authenticated;
