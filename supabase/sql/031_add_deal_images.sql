-- Add multiple images support to deals table
-- This migration adds support for multiple images per deal

-- Add deal_images column (array of image URLs)
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS deal_images TEXT[];

-- Add featured_image column (main image URL)
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS featured_image TEXT;

-- Add index for better performance when querying by featured images
CREATE INDEX IF NOT EXISTS idx_deals_featured_image ON public.deals(featured_image) WHERE featured_image IS NOT NULL;

-- Add index for array operations on deal_images
CREATE INDEX IF NOT EXISTS idx_deals_images_gin ON public.deals USING GIN (deal_images);

-- Update existing deals to have featured_image set to image_url if they don't have one
UPDATE public.deals 
SET featured_image = image_url 
WHERE featured_image IS NULL AND image_url IS NOT NULL;

-- Add comment to document the new columns
COMMENT ON COLUMN public.deals.deal_images IS 'Array of image URLs for the deal. First image is typically the main image.';
COMMENT ON COLUMN public.deals.featured_image IS 'Main/featured image URL for the deal. Usually the first image in deal_images array.';

