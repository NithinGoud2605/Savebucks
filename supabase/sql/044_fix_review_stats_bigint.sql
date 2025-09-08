-- Fix get_deal_review_stats function to work with BIGINT deal IDs
-- The deal_reviews table uses BIGINT IDs, not UUID

-- Drop the existing function that expects UUID
DROP FUNCTION IF EXISTS public.get_deal_review_stats(deal_id_param UUID);

-- Create the function to expect BIGINT (which matches deal_reviews.id)
CREATE OR REPLACE FUNCTION public.get_deal_review_stats(deal_id_param BIGINT)
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

SELECT 'Review stats function fixed to work with BIGINT deal IDs' as status;
