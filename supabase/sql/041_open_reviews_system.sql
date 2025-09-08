-- Make reviews system completely open like Amazon
-- Remove approval requirements and make reviews immediately visible

-- First, clean up existing mock data
DELETE FROM public.deal_reviews;

-- Remove approval-related policies first (to avoid dependency issues)
DROP POLICY IF EXISTS "Users can view approved reviews" ON public.deal_reviews;
DROP POLICY IF EXISTS "Users can submit reviews for approval" ON public.deal_reviews;
DROP POLICY IF EXISTS "Admins can moderate reviews" ON public.deal_reviews;

-- Remove the status column and approval requirements (now that policies are dropped)
ALTER TABLE public.deal_reviews DROP COLUMN IF EXISTS status CASCADE;
ALTER TABLE public.deal_reviews DROP COLUMN IF EXISTS moderated_by CASCADE;
ALTER TABLE public.deal_reviews DROP COLUMN IF EXISTS moderated_at CASCADE;
ALTER TABLE public.deal_reviews DROP COLUMN IF EXISTS moderation_notes CASCADE;

-- Create new open policies (like Amazon) - drop existing ones first
DROP POLICY IF EXISTS "Anyone can view reviews" ON public.deal_reviews;
DROP POLICY IF EXISTS "Authenticated users can submit reviews" ON public.deal_reviews;
DROP POLICY IF EXISTS "Users can edit their own reviews" ON public.deal_reviews;
DROP POLICY IF EXISTS "Users can delete their own reviews" ON public.deal_reviews;

CREATE POLICY "Anyone can view reviews" ON public.deal_reviews
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can submit reviews" ON public.deal_reviews
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());

CREATE POLICY "Users can edit their own reviews" ON public.deal_reviews
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reviews" ON public.deal_reviews
  FOR DELETE USING (auth.uid() = user_id);

-- Remove approval-related functions
DROP FUNCTION IF EXISTS public.moderate_review(UUID, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.approve_review(UUID);
DROP FUNCTION IF EXISTS public.reject_review(UUID, TEXT);

-- Update the review submission function to be immediate (no approval)
CREATE OR REPLACE FUNCTION public.submit_review(
  deal_id_param UUID,
  title_param TEXT,
  content_param TEXT,
  rating_param INTEGER,
  is_verified_purchase_param BOOLEAN DEFAULT FALSE
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  review_id UUID;
BEGIN
  -- Validate inputs
  IF deal_id_param IS NULL THEN
    RAISE EXCEPTION 'Deal ID is required';
  END IF;
  
  IF title_param IS NULL OR LENGTH(TRIM(title_param)) = 0 THEN
    RAISE EXCEPTION 'Review title is required';
  END IF;
  
  IF content_param IS NULL OR LENGTH(TRIM(content_param)) = 0 THEN
    RAISE EXCEPTION 'Review content is required';
  END IF;
  
  IF rating_param IS NULL OR rating_param < 1 OR rating_param > 5 THEN
    RAISE EXCEPTION 'Rating must be between 1 and 5';
  END IF;
  
  -- Check if user is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  -- Check if deal exists
  IF NOT EXISTS (SELECT 1 FROM public.deals WHERE id = deal_id_param AND status = 'approved') THEN
    RAISE EXCEPTION 'Deal not found or not approved';
  END IF;
  
  -- Check if user already reviewed this deal
  IF EXISTS (SELECT 1 FROM public.deal_reviews WHERE deal_id = deal_id_param AND user_id = auth.uid()) THEN
    RAISE EXCEPTION 'You have already reviewed this deal';
  END IF;
  
  -- Insert the review (immediately visible, no approval needed)
  INSERT INTO public.deal_reviews (
    deal_id,
    user_id,
    title,
    content,
    rating,
    is_verified_purchase,
    is_helpful_count,
    is_not_helpful_count,
    views_count,
    created_at,
    updated_at
  ) VALUES (
    deal_id_param,
    auth.uid(),
    TRIM(title_param),
    TRIM(content_param),
    rating_param,
    is_verified_purchase_param,
    0,
    0,
    0,
    NOW(),
    NOW()
  ) RETURNING id INTO review_id;
  
  -- Update deal review count
  UPDATE public.deals 
  SET review_count = (
    SELECT COUNT(*) FROM public.deal_reviews 
    WHERE deal_id = deal_id_param
  )
  WHERE id = deal_id_param;
  
  RETURN review_id;
END;
$$;

-- Update the review stats function to work with open reviews
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

-- Create a function to vote on reviews (helpful/not helpful)
CREATE OR REPLACE FUNCTION public.vote_on_review(
  review_id_param UUID,
  is_helpful_param BOOLEAN
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_id_param UUID;
BEGIN
  -- Get current user
  user_id_param := auth.uid();
  
  IF user_id_param IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  -- Check if review exists
  IF NOT EXISTS (SELECT 1 FROM public.deal_reviews WHERE id = review_id_param) THEN
    RAISE EXCEPTION 'Review not found';
  END IF;
  
  -- Check if user already voted on this review
  IF EXISTS (SELECT 1 FROM public.review_votes WHERE review_id = review_id_param AND user_id = user_id_param) THEN
    RAISE EXCEPTION 'You have already voted on this review';
  END IF;
  
  -- Insert the vote
  INSERT INTO public.review_votes (review_id, user_id, is_helpful, created_at)
  VALUES (review_id_param, user_id_param, is_helpful_param, NOW());
  
  -- Update the review vote counts
  IF is_helpful_param THEN
    UPDATE public.deal_reviews 
    SET is_helpful_count = is_helpful_count + 1
    WHERE id = review_id_param;
  ELSE
    UPDATE public.deal_reviews 
    SET is_not_helpful_count = is_not_helpful_count + 1
    WHERE id = review_id_param;
  END IF;
  
  RETURN true;
END;
$$;

-- Create review_votes table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.review_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES public.deal_reviews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  is_helpful BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(review_id, user_id)
);

-- Enable RLS on review_votes
ALTER TABLE public.review_votes ENABLE ROW LEVEL SECURITY;

-- Create policies for review_votes - drop existing ones first
DROP POLICY IF EXISTS "Anyone can view review votes" ON public.review_votes;
DROP POLICY IF EXISTS "Authenticated users can vote on reviews" ON public.review_votes;

CREATE POLICY "Anyone can view review votes" ON public.review_votes
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can vote on reviews" ON public.review_votes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_deal_reviews_deal_id ON public.deal_reviews(deal_id);
CREATE INDEX IF NOT EXISTS idx_deal_reviews_user_id ON public.deal_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_deal_reviews_rating ON public.deal_reviews(rating);
CREATE INDEX IF NOT EXISTS idx_deal_reviews_created_at ON public.deal_reviews(created_at);
CREATE INDEX IF NOT EXISTS idx_review_votes_review_id ON public.review_votes(review_id);
CREATE INDEX IF NOT EXISTS idx_review_votes_user_id ON public.review_votes(user_id);

-- Grant necessary permissions
GRANT SELECT ON public.deal_reviews TO authenticated, anon;
GRANT INSERT, UPDATE, DELETE ON public.deal_reviews TO authenticated;
GRANT SELECT ON public.review_votes TO authenticated, anon;
GRANT INSERT ON public.review_votes TO authenticated;

-- Add comment
COMMENT ON TABLE public.deal_reviews IS 'Open reviews system - no approval required, like Amazon';
COMMENT ON TABLE public.review_votes IS 'User votes on reviews (helpful/not helpful)';

SELECT 'Reviews system made completely open like Amazon' as status;
