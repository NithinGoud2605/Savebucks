-- Enhanced Reviews & Ratings System
-- Comprehensive review system with voting, analytics, and moderation

-- Create deal_reviews table
CREATE TABLE IF NOT EXISTS public.deal_reviews (
  id BIGSERIAL PRIMARY KEY,
  deal_id BIGINT NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Review content
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  
  -- Review metadata
  is_verified_purchase BOOLEAN DEFAULT FALSE,
  is_featured BOOLEAN DEFAULT FALSE,
  is_helpful_count INTEGER DEFAULT 0,
  is_not_helpful_count INTEGER DEFAULT 0,
  
  -- Moderation
  status TEXT DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected', 'flagged')),
  moderation_notes TEXT,
  moderated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  moderated_at TIMESTAMPTZ,
  
  -- Analytics
  views_count INTEGER DEFAULT 0,
  shares_count INTEGER DEFAULT 0,
  reports_count INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(deal_id, user_id), -- One review per user per deal
  CONSTRAINT valid_rating CHECK (rating >= 1 AND rating <= 5)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_deal_reviews_deal_id ON public.deal_reviews(deal_id);
CREATE INDEX IF NOT EXISTS idx_deal_reviews_user_id ON public.deal_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_deal_reviews_rating ON public.deal_reviews(rating);
CREATE INDEX IF NOT EXISTS idx_deal_reviews_status ON public.deal_reviews(status);
CREATE INDEX IF NOT EXISTS idx_deal_reviews_created_at ON public.deal_reviews(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_deal_reviews_helpful ON public.deal_reviews((is_helpful_count - is_not_helpful_count) DESC);

-- Create review_votes table for helpful/not helpful voting
CREATE TABLE IF NOT EXISTS public.review_votes (
  id BIGSERIAL PRIMARY KEY,
  review_id BIGINT NOT NULL REFERENCES public.deal_reviews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('helpful', 'not_helpful')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- One vote per user per review
  UNIQUE(review_id, user_id)
);

-- Create indexes for review_votes
CREATE INDEX IF NOT EXISTS idx_review_votes_review_id ON public.review_votes(review_id);
CREATE INDEX IF NOT EXISTS idx_review_votes_user_id ON public.review_votes(user_id);
CREATE INDEX IF NOT EXISTS idx_review_votes_type ON public.review_votes(vote_type);

-- Create review_reports table for moderation
CREATE TABLE IF NOT EXISTS public.review_reports (
  id BIGSERIAL PRIMARY KEY,
  review_id BIGINT NOT NULL REFERENCES public.deal_reviews(id) ON DELETE CASCADE,
  reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reason TEXT NOT NULL CHECK (reason IN ('spam', 'inappropriate', 'fake', 'off_topic', 'harassment', 'other')),
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- One report per user per review
  UNIQUE(review_id, reporter_id)
);

-- Create indexes for review_reports
CREATE INDEX IF NOT EXISTS idx_review_reports_review_id ON public.review_reports(review_id);
CREATE INDEX IF NOT EXISTS idx_review_reports_reporter_id ON public.review_reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_review_reports_status ON public.review_reports(status);

-- Add updated_at trigger for deal_reviews
CREATE OR REPLACE FUNCTION update_deal_reviews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_deal_reviews_updated_at ON public.deal_reviews;
CREATE TRIGGER trg_deal_reviews_updated_at
  BEFORE UPDATE ON public.deal_reviews
  FOR EACH ROW EXECUTE FUNCTION update_deal_reviews_updated_at();

-- Function to get review statistics for a deal
CREATE OR REPLACE FUNCTION get_deal_review_stats(deal_id_param BIGINT)
RETURNS JSONB AS $$
DECLARE
  stats JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_reviews', COUNT(*),
    'average_rating', ROUND(AVG(rating)::numeric, 2),
    'rating_distribution', jsonb_build_object(
      '5_star', COUNT(*) FILTER (WHERE rating = 5),
      '4_star', COUNT(*) FILTER (WHERE rating = 4),
      '3_star', COUNT(*) FILTER (WHERE rating = 3),
      '2_star', COUNT(*) FILTER (WHERE rating = 2),
      '1_star', COUNT(*) FILTER (WHERE rating = 1)
    ),
    'verified_purchases', COUNT(*) FILTER (WHERE is_verified_purchase = true),
    'featured_reviews', COUNT(*) FILTER (WHERE is_featured = true),
    'total_helpful_votes', SUM(is_helpful_count),
    'total_not_helpful_votes', SUM(is_not_helpful_count)
  ) INTO stats
  FROM deal_reviews
  WHERE deal_id = deal_id_param AND status = 'approved';
  
  RETURN COALESCE(stats, '{}'::jsonb);
END;
$$ LANGUAGE plpgsql;

-- Function to vote on a review
CREATE OR REPLACE FUNCTION vote_on_review(
  review_id_param BIGINT,
  user_id_param UUID,
  vote_type_param TEXT
)
RETURNS JSONB AS $$
DECLARE
  existing_vote RECORD;
  result JSONB;
BEGIN
  -- Check if user already voted
  SELECT * INTO existing_vote
  FROM review_votes
  WHERE review_id = review_id_param AND user_id = user_id_param;
  
  IF existing_vote IS NOT NULL THEN
    -- Update existing vote
    IF existing_vote.vote_type = vote_type_param THEN
      -- Same vote type, remove the vote
      DELETE FROM review_votes WHERE id = existing_vote.id;
      
      -- Update review vote counts
      IF vote_type_param = 'helpful' THEN
        UPDATE deal_reviews SET is_helpful_count = is_helpful_count - 1 WHERE id = review_id_param;
      ELSE
        UPDATE deal_reviews SET is_not_helpful_count = is_not_helpful_count - 1 WHERE id = review_id_param;
      END IF;
      
      result := jsonb_build_object('action', 'removed', 'vote_type', vote_type_param);
    ELSE
      -- Different vote type, update the vote
      UPDATE review_votes SET vote_type = vote_type_param WHERE id = existing_vote.id;
      
      -- Update review vote counts
      IF existing_vote.vote_type = 'helpful' THEN
        UPDATE deal_reviews SET is_helpful_count = is_helpful_count - 1 WHERE id = review_id_param;
      ELSE
        UPDATE deal_reviews SET is_not_helpful_count = is_not_helpful_count - 1 WHERE id = review_id_param;
      END IF;
      
      IF vote_type_param = 'helpful' THEN
        UPDATE deal_reviews SET is_helpful_count = is_helpful_count + 1 WHERE id = review_id_param;
      ELSE
        UPDATE deal_reviews SET is_not_helpful_count = is_not_helpful_count + 1 WHERE id = review_id_param;
      END IF;
      
      result := jsonb_build_object('action', 'updated', 'vote_type', vote_type_param);
    END IF;
  ELSE
    -- New vote
    INSERT INTO review_votes (review_id, user_id, vote_type)
    VALUES (review_id_param, user_id_param, vote_type_param);
    
    -- Update review vote counts
    IF vote_type_param = 'helpful' THEN
      UPDATE deal_reviews SET is_helpful_count = is_helpful_count + 1 WHERE id = review_id_param;
    ELSE
      UPDATE deal_reviews SET is_not_helpful_count = is_not_helpful_count + 1 WHERE id = review_id_param;
    END IF;
    
    result := jsonb_build_object('action', 'added', 'vote_type', vote_type_param);
  END IF;
  
  -- Get updated vote counts
  SELECT jsonb_build_object(
    'helpful_count', is_helpful_count,
    'not_helpful_count', is_not_helpful_count
  ) INTO result
  FROM deal_reviews
  WHERE id = review_id_param;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to get user's vote on a review
CREATE OR REPLACE FUNCTION get_user_review_vote(
  review_id_param BIGINT,
  user_id_param UUID
)
RETURNS TEXT AS $$
DECLARE
  vote_type TEXT;
BEGIN
  SELECT rv.vote_type INTO vote_type
  FROM review_votes rv
  WHERE rv.review_id = review_id_param AND rv.user_id = user_id_param;
  
  RETURN COALESCE(vote_type, 'none');
END;
$$ LANGUAGE plpgsql;

-- Function to increment review views
CREATE OR REPLACE FUNCTION increment_review_views(review_id_param BIGINT)
RETURNS VOID AS $$
BEGIN
  UPDATE deal_reviews
  SET views_count = views_count + 1
  WHERE id = review_id_param;
END;
$$ LANGUAGE plpgsql;

-- Function to report a review
CREATE OR REPLACE FUNCTION report_review(
  review_id_param BIGINT,
  reporter_id_param UUID,
  reason_param TEXT,
  description_param TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  -- Insert report
  INSERT INTO review_reports (review_id, reporter_id, reason, description)
  VALUES (review_id_param, reporter_id_param, reason_param, description_param)
  ON CONFLICT (review_id, reporter_id) DO NOTHING;
  
  -- Update review reports count
  UPDATE deal_reviews
  SET reports_count = reports_count + 1
  WHERE id = review_id_param;
  
  result := jsonb_build_object('success', true, 'message', 'Review reported successfully');
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- RLS Policies for deal_reviews
ALTER TABLE public.deal_reviews ENABLE ROW LEVEL SECURITY;

-- Users can view approved reviews
CREATE POLICY "Users can view approved reviews" ON public.deal_reviews
  FOR SELECT USING (status = 'approved');

-- Users can view their own reviews
CREATE POLICY "Users can view their own reviews" ON public.deal_reviews
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own reviews
CREATE POLICY "Users can insert their own reviews" ON public.deal_reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own reviews
CREATE POLICY "Users can update their own reviews" ON public.deal_reviews
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own reviews
CREATE POLICY "Users can delete their own reviews" ON public.deal_reviews
  FOR DELETE USING (auth.uid() = user_id);

-- Admins can do everything
CREATE POLICY "Admins can do everything on reviews" ON public.deal_reviews
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for review_votes
ALTER TABLE public.review_votes ENABLE ROW LEVEL SECURITY;

-- Users can view all votes
CREATE POLICY "Users can view all votes" ON public.review_votes
  FOR SELECT USING (true);

-- Users can insert their own votes
CREATE POLICY "Users can insert their own votes" ON public.review_votes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own votes
CREATE POLICY "Users can update their own votes" ON public.review_votes
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own votes
CREATE POLICY "Users can delete their own votes" ON public.review_votes
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for review_reports
ALTER TABLE public.review_reports ENABLE ROW LEVEL SECURITY;

-- Users can view their own reports
CREATE POLICY "Users can view their own reports" ON public.review_reports
  FOR SELECT USING (auth.uid() = reporter_id);

-- Users can insert their own reports
CREATE POLICY "Users can insert their own reports" ON public.review_reports
  FOR INSERT WITH CHECK (auth.uid() = reporter_id);

-- Admins can view all reports
CREATE POLICY "Admins can view all reports" ON public.review_reports
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can update reports
CREATE POLICY "Admins can update reports" ON public.review_reports
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- No seed data - reviews will be created by real users
