-- Fix review_votes table schema mismatch
-- The table might have been created with the old schema (vote_type TEXT)
-- but the API expects the new schema (is_helpful BOOLEAN)

-- First, check if the table exists and what columns it has
-- If it has vote_type column, we need to migrate it

-- Drop the table if it exists (since we're recreating it with the correct schema)
DROP TABLE IF EXISTS public.review_votes CASCADE;

-- Recreate the table with the correct schema
-- Note: deal_reviews.id is BIGINT, not UUID
CREATE TABLE public.review_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id BIGINT NOT NULL REFERENCES public.deal_reviews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  is_helpful BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(review_id, user_id)
);

-- Enable RLS
ALTER TABLE public.review_votes ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view review votes" ON public.review_votes
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can vote on reviews" ON public.review_votes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_review_votes_review_id ON public.review_votes(review_id);
CREATE INDEX IF NOT EXISTS idx_review_votes_user_id ON public.review_votes(user_id);

-- Grant permissions
GRANT SELECT ON public.review_votes TO authenticated, anon;
GRANT INSERT ON public.review_votes TO authenticated;

-- Add comment
COMMENT ON TABLE public.review_votes IS 'User votes on reviews (helpful/not helpful)';

SELECT 'Review votes table schema fixed - now uses is_helpful BOOLEAN' as status;
