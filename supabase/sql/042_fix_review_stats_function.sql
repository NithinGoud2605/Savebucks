-- Fix review stats function overload issue
-- Drop the old function that expects BIGINT and keep the new one that expects UUID

-- Drop the old function that expects BIGINT
DROP FUNCTION IF EXISTS public.get_deal_review_stats(deal_id_param BIGINT);

-- The new function that expects UUID should already exist from the previous migration
-- If it doesn't exist, create it
CREATE OR REPLACE FUNCTION public.get_deal_review_stats(deal_id_param UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_reviews', COUNT(*),
    'average_rating', COALESCE(AVG(rating), 0),
    'rating_distribution', json_build_object(
      '5_star', COUNT(*) FILTER (WHERE rating = 5),
      '4_star', COUNT(*) FILTER (WHERE rating = 4),
      '3_star', COUNT(*) FILTER (WHERE rating = 3),
      '2_star', COUNT(*) FILTER (WHERE rating = 2),
      '1_star', COUNT(*) FILTER (WHERE rating = 1)
    ),
    'verified_purchases', COUNT(*) FILTER (WHERE is_verified_purchase = true),
    'featured_reviews', COUNT(*) FILTER (WHERE is_featured = true),
    'total_helpful_votes', COALESCE(SUM(is_helpful_count), 0),
    'total_not_helpful_votes', COALESCE(SUM(is_not_helpful_count), 0)
  ) INTO result
  FROM public.deal_reviews
  WHERE deal_id = deal_id_param;
  
  RETURN result;
END;
$$;

-- Add comment
COMMENT ON FUNCTION public.get_deal_review_stats IS 'Get review statistics for a deal (UUID version)';

SELECT 'Review stats function fixed - now only UUID version exists' as status;
