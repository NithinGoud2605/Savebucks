-- Clean up invalid image URLs in deals and coupons
-- This migration removes obviously invalid image URLs that cause proxy errors

-- Function to check if a URL is a valid image URL
CREATE OR REPLACE FUNCTION is_valid_image_url(url TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
  -- Return false for null or empty URLs
  IF url IS NULL OR url = '' THEN
    RETURN FALSE;
  END IF;
  
  -- Check for obviously invalid URLs
  IF url LIKE '%localhost%' AND url NOT LIKE '%.jpg' AND url NOT LIKE '%.jpeg' AND url NOT LIKE '%.png' AND url NOT LIKE '%.gif' AND url NOT LIKE '%.webp' AND url NOT LIKE '%.svg' THEN
    RETURN FALSE;
  END IF;
  
  -- Check for non-image file extensions
  IF url LIKE '%.html' OR url LIKE '%.htm' OR url LIKE '%.php' OR url LIKE '%.asp' OR url LIKE '%.aspx' OR url LIKE '%.jsp' OR url LIKE '%.js' OR url LIKE '%.css' OR url LIKE '%.txt' OR url LIKE '%.pdf' OR url LIKE '%.doc' OR url LIKE '%.docx' THEN
    RETURN FALSE;
  END IF;
  
  -- Check for common invalid patterns
  IF url LIKE '%/post' OR url LIKE '%/login' OR url LIKE '%/register' OR url LIKE '%/admin' THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$;

-- Clean up invalid image URLs in deals table
-- First check if columns exist before updating
DO $$
BEGIN
  -- Check and clean image_url column if it exists
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'deals' AND column_name = 'image_url') THEN
    UPDATE public.deals 
    SET image_url = NULL
    WHERE NOT is_valid_image_url(image_url);
  END IF;
  
  -- Check and clean featured_image column if it exists
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'deals' AND column_name = 'featured_image') THEN
    UPDATE public.deals 
    SET featured_image = NULL
    WHERE NOT is_valid_image_url(featured_image);
  END IF;
  
  -- Check and clean deal_images column if it exists
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'deals' AND column_name = 'deal_images') THEN
    UPDATE public.deals 
    SET deal_images = NULL
    WHERE deal_images IS NOT NULL AND array_length(deal_images, 1) > 0 AND NOT is_valid_image_url(deal_images[1]);
  END IF;
END;
$$;

-- Clean up invalid image URLs in coupons table
DO $$
BEGIN
  -- Check and clean image_url column if it exists
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'coupons' AND column_name = 'image_url') THEN
    UPDATE public.coupons 
    SET image_url = NULL
    WHERE NOT is_valid_image_url(image_url);
  END IF;
  
  -- Check and clean featured_image column if it exists
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'coupons' AND column_name = 'featured_image') THEN
    UPDATE public.coupons 
    SET featured_image = NULL
    WHERE NOT is_valid_image_url(featured_image);
  END IF;
  
  -- Check and clean coupon_images column if it exists
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'coupons' AND column_name = 'coupon_images') THEN
    UPDATE public.coupons 
    SET coupon_images = NULL
    WHERE coupon_images IS NOT NULL AND array_length(coupon_images, 1) > 0 AND NOT is_valid_image_url(coupon_images[1]);
  END IF;
END;
$$;

-- Clean up invalid image URLs in companies table
DO $$
BEGIN
  -- Check and clean logo_url column if it exists
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'logo_url') THEN
    UPDATE public.companies 
    SET logo_url = NULL
    WHERE NOT is_valid_image_url(logo_url);
  END IF;
  
  -- Check and clean featured_image column if it exists
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'featured_image') THEN
    UPDATE public.companies 
    SET featured_image = NULL
    WHERE NOT is_valid_image_url(featured_image);
  END IF;
END;
$$;

-- Add comment to document the cleanup
COMMENT ON FUNCTION is_valid_image_url(TEXT) IS 'Validates if a URL is a valid image URL by checking for common invalid patterns and file extensions';

-- Log the cleanup results
DO $$
DECLARE
  deals_cleaned INT := 0;
  coupons_cleaned INT := 0;
  companies_cleaned INT := 0;
BEGIN
  -- Count deals with no images (check which columns exist)
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'deals' AND column_name = 'image_url') 
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'deals' AND column_name = 'featured_image') THEN
    SELECT COUNT(*) INTO deals_cleaned FROM public.deals WHERE image_url IS NULL AND featured_image IS NULL;
  ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'deals' AND column_name = 'featured_image') THEN
    SELECT COUNT(*) INTO deals_cleaned FROM public.deals WHERE featured_image IS NULL;
  END IF;
  
  -- Count coupons with no images (check which columns exist)
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'coupons' AND column_name = 'image_url') 
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'coupons' AND column_name = 'featured_image') THEN
    SELECT COUNT(*) INTO coupons_cleaned FROM public.coupons WHERE image_url IS NULL AND featured_image IS NULL;
  ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'coupons' AND column_name = 'featured_image') THEN
    SELECT COUNT(*) INTO coupons_cleaned FROM public.coupons WHERE featured_image IS NULL;
  END IF;
  
  -- Count companies with no logos (check which columns exist)
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'logo_url') THEN
    SELECT COUNT(*) INTO companies_cleaned FROM public.companies WHERE logo_url IS NULL;
  ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'featured_image') THEN
    SELECT COUNT(*) INTO companies_cleaned FROM public.companies WHERE featured_image IS NULL;
  END IF;
  
  RAISE NOTICE 'Image URL cleanup completed:';
  RAISE NOTICE 'Deals with no images: %', deals_cleaned;
  RAISE NOTICE 'Coupons with no images: %', coupons_cleaned;
  RAISE NOTICE 'Companies with no logos: %', companies_cleaned;
END;
$$;
