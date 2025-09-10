-- Fix missing columns in deals table
-- This migration ensures all required columns exist

-- Add stock_quantity column if it doesn't exist
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS stock_quantity INTEGER;

-- Add stock_status column if it doesn't exist  
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS stock_status TEXT DEFAULT 'unknown' CHECK (stock_status IN ('in_stock', 'low_stock', 'out_of_stock', 'unknown'));

-- Add other potentially missing columns
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS company_id BIGINT REFERENCES public.companies(id) ON DELETE SET NULL;
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS deal_type TEXT DEFAULT 'deal' CHECK (deal_type IN ('deal', 'sale', 'clearance', 'flash_sale', 'bundle', 'cashback'));
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS minimum_order_amount DECIMAL(10,2);
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS maximum_discount_amount DECIMAL(10,2);
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS terms_conditions TEXT;
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS starts_at TIMESTAMPTZ;
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS tags TEXT[];
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE;
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS is_exclusive BOOLEAN DEFAULT FALSE;
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0;
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS clicks_count INTEGER DEFAULT 0;
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS deal_images TEXT[];
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS featured_image TEXT;

-- Add indexes for new columns
CREATE INDEX IF NOT EXISTS idx_deals_stock_status ON public.deals(stock_status);
CREATE INDEX IF NOT EXISTS idx_deals_stock_quantity ON public.deals(stock_quantity) WHERE stock_quantity IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_deals_company_id ON public.deals(company_id);
CREATE INDEX IF NOT EXISTS idx_deals_deal_type ON public.deals(deal_type);
CREATE INDEX IF NOT EXISTS idx_deals_is_featured ON public.deals(is_featured);
CREATE INDEX IF NOT EXISTS idx_deals_is_exclusive ON public.deals(is_exclusive);
CREATE INDEX IF NOT EXISTS idx_deals_views_count ON public.deals(views_count);
CREATE INDEX IF NOT EXISTS idx_deals_clicks_count ON public.deals(clicks_count);


