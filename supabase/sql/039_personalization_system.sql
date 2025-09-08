-- Personalization System
-- Comprehensive user preferences, activity tracking, and recommendation engine

-- User preferences table
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Deal preferences
  preferred_categories INTEGER[] DEFAULT '{}',
  preferred_companies INTEGER[] DEFAULT '{}',
  preferred_price_range JSONB DEFAULT '{"min": 0, "max": 10000}',
  preferred_discount_minimum DECIMAL(5,2) DEFAULT 10.00,
  
  -- Notification preferences
  email_notifications BOOLEAN DEFAULT true,
  push_notifications BOOLEAN DEFAULT true,
  deal_alerts BOOLEAN DEFAULT true,
  price_drop_alerts BOOLEAN DEFAULT true,
  new_deal_notifications BOOLEAN DEFAULT true,
  weekly_digest BOOLEAN DEFAULT true,
  
  -- UI preferences
  theme TEXT DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'auto')),
  language TEXT DEFAULT 'en',
  currency TEXT DEFAULT 'USD',
  timezone TEXT DEFAULT 'UTC',
  
  -- Content preferences
  show_adult_content BOOLEAN DEFAULT false,
  content_filter_level TEXT DEFAULT 'moderate' CHECK (content_filter_level IN ('strict', 'moderate', 'lenient')),
  
  -- Privacy preferences
  profile_visibility TEXT DEFAULT 'public' CHECK (profile_visibility IN ('public', 'friends', 'private')),
  show_activity BOOLEAN DEFAULT true,
  allow_data_collection BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- One preference record per user
  UNIQUE(user_id)
);

-- User activity tracking table
CREATE TABLE IF NOT EXISTS public.user_activities (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Activity details
  activity_type TEXT NOT NULL CHECK (activity_type IN (
    'deal_view', 'deal_click', 'deal_save', 'deal_unsave',
    'coupon_view', 'coupon_click', 'coupon_save', 'coupon_unsave',
    'review_submit', 'review_vote', 'search', 'category_view',
    'company_view', 'profile_view', 'settings_change'
  )),
  
  -- Target information
  target_type TEXT CHECK (target_type IN ('deal', 'coupon', 'company', 'category', 'user', 'search')),
  target_id BIGINT,
  target_slug TEXT,
  
  -- Additional data
  metadata JSONB DEFAULT '{}',
  session_id TEXT,
  ip_address INET,
  user_agent TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User interests table (derived from activities)
CREATE TABLE IF NOT EXISTS public.user_interests (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Interest details
  interest_type TEXT NOT NULL CHECK (interest_type IN ('category', 'company', 'brand', 'price_range', 'deal_type')),
  interest_value TEXT NOT NULL,
  interest_weight DECIMAL(5,2) DEFAULT 1.00,
  
  -- Interest metadata
  last_activity TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  activity_count INTEGER DEFAULT 1,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Unique interest per user
  UNIQUE(user_id, interest_type, interest_value)
);

-- User recommendations table
CREATE TABLE IF NOT EXISTS public.user_recommendations (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Recommendation details
  recommendation_type TEXT NOT NULL CHECK (recommendation_type IN ('deal', 'coupon', 'company', 'category')),
  target_id BIGINT NOT NULL,
  target_slug TEXT,
  
  -- Recommendation scoring
  score DECIMAL(5,2) NOT NULL,
  confidence DECIMAL(5,2) NOT NULL,
  algorithm_version TEXT DEFAULT 'v1.0',
  
  -- Recommendation metadata
  reason TEXT,
  metadata JSONB DEFAULT '{}',
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_viewed BOOLEAN DEFAULT false,
  is_clicked BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  
  -- Unique recommendation per user
  UNIQUE(user_id, recommendation_type, target_id)
);

-- User saved searches table
CREATE TABLE IF NOT EXISTS public.user_saved_searches (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Search details
  search_name TEXT NOT NULL,
  search_query TEXT NOT NULL,
  search_filters JSONB DEFAULT '{}',
  
  -- Search metadata
  result_count INTEGER DEFAULT 0,
  last_searched TIMESTAMPTZ,
  search_count INTEGER DEFAULT 1,
  
  -- Notification settings
  notify_on_new_results BOOLEAN DEFAULT false,
  notification_frequency TEXT DEFAULT 'daily' CHECK (notification_frequency IN ('immediate', 'daily', 'weekly')),
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User follow system
CREATE TABLE IF NOT EXISTS public.user_follows (
  id BIGSERIAL PRIMARY KEY,
  follower_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Follow metadata
  follow_type TEXT DEFAULT 'user' CHECK (follow_type IN ('user', 'company', 'category')),
  is_active BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Prevent self-following and duplicate follows
  CHECK (follower_id != following_id),
  UNIQUE(follower_id, following_id, follow_type)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON public.user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activities_user_id ON public.user_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activities_type ON public.user_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_user_activities_created_at ON public.user_activities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_activities_target ON public.user_activities(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_user_interests_user_id ON public.user_interests(user_id);
CREATE INDEX IF NOT EXISTS idx_user_interests_type ON public.user_interests(interest_type);
CREATE INDEX IF NOT EXISTS idx_user_interests_weight ON public.user_interests(interest_weight DESC);
CREATE INDEX IF NOT EXISTS idx_user_recommendations_user_id ON public.user_recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_recommendations_type ON public.user_recommendations(recommendation_type);
CREATE INDEX IF NOT EXISTS idx_user_recommendations_score ON public.user_recommendations(score DESC);
CREATE INDEX IF NOT EXISTS idx_user_recommendations_active ON public.user_recommendations(is_active, expires_at);
CREATE INDEX IF NOT EXISTS idx_user_saved_searches_user_id ON public.user_saved_searches(user_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_follower ON public.user_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_following ON public.user_follows(following_id);

-- Add updated_at triggers
CREATE OR REPLACE FUNCTION update_user_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_user_interests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_user_saved_searches_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_user_preferences_updated_at ON public.user_preferences;
CREATE TRIGGER trg_user_preferences_updated_at
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW EXECUTE FUNCTION update_user_preferences_updated_at();

DROP TRIGGER IF EXISTS trg_user_interests_updated_at ON public.user_interests;
CREATE TRIGGER trg_user_interests_updated_at
  BEFORE UPDATE ON public.user_interests
  FOR EACH ROW EXECUTE FUNCTION update_user_interests_updated_at();

DROP TRIGGER IF EXISTS trg_user_saved_searches_updated_at ON public.user_saved_searches;
CREATE TRIGGER trg_user_saved_searches_updated_at
  BEFORE UPDATE ON public.user_saved_searches
  FOR EACH ROW EXECUTE FUNCTION update_user_saved_searches_updated_at();

-- Function to track user activity
CREATE OR REPLACE FUNCTION track_user_activity(
  user_id_param UUID,
  activity_type_param TEXT,
  target_type_param TEXT DEFAULT NULL,
  target_id_param BIGINT DEFAULT NULL,
  target_slug_param TEXT DEFAULT NULL,
  metadata_param JSONB DEFAULT '{}',
  session_id_param TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  -- Insert activity record
  INSERT INTO user_activities (
    user_id, activity_type, target_type, target_id, target_slug,
    metadata, session_id, created_at
  ) VALUES (
    user_id_param, activity_type_param, target_type_param, target_id_param,
    target_slug_param, metadata_param, session_id_param, NOW()
  );
  
  -- Update user interests based on activity
  IF target_type_param = 'deal' AND target_id_param IS NOT NULL THEN
    -- Get deal category and company
    DECLARE
      deal_category_id INTEGER;
      deal_company_id INTEGER;
    BEGIN
      SELECT category_id, company_id INTO deal_category_id, deal_company_id
      FROM deals WHERE id = target_id_param;
      
      -- Update category interest
      IF deal_category_id IS NOT NULL THEN
        INSERT INTO user_interests (user_id, interest_type, interest_value, interest_weight, last_activity, activity_count)
        VALUES (user_id_param, 'category', deal_category_id::TEXT, 1.0, NOW(), 1)
        ON CONFLICT (user_id, interest_type, interest_value)
        DO UPDATE SET
          interest_weight = user_interests.interest_weight + 1.0,
          last_activity = NOW(),
          activity_count = user_interests.activity_count + 1;
      END IF;
      
      -- Update company interest
      IF deal_company_id IS NOT NULL THEN
        INSERT INTO user_interests (user_id, interest_type, interest_value, interest_weight, last_activity, activity_count)
        VALUES (user_id_param, 'company', deal_company_id::TEXT, 1.0, NOW(), 1)
        ON CONFLICT (user_id, interest_type, interest_value)
        DO UPDATE SET
          interest_weight = user_interests.interest_weight + 1.0,
          last_activity = NOW(),
          activity_count = user_interests.activity_count + 1;
      END IF;
    END;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to get user recommendations
CREATE OR REPLACE FUNCTION get_user_recommendations(
  user_id_param UUID,
  limit_param INTEGER DEFAULT 10,
  recommendation_type_param TEXT DEFAULT NULL
)
RETURNS TABLE (
  id BIGINT,
  recommendation_type TEXT,
  target_id BIGINT,
  target_slug TEXT,
  score DECIMAL(5,2),
  confidence DECIMAL(5,2),
  reason TEXT,
  metadata JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ur.id,
    ur.recommendation_type,
    ur.target_id,
    ur.target_slug,
    ur.score,
    ur.confidence,
    ur.reason,
    ur.metadata
  FROM user_recommendations ur
  WHERE ur.user_id = user_id_param
    AND ur.is_active = true
    AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
    AND (recommendation_type_param IS NULL OR ur.recommendation_type = recommendation_type_param)
  ORDER BY ur.score DESC, ur.confidence DESC
  LIMIT limit_param;
END;
$$ LANGUAGE plpgsql;

-- Function to generate personalized recommendations
CREATE OR REPLACE FUNCTION generate_user_recommendations(user_id_param UUID)
RETURNS VOID AS $$
DECLARE
  user_interest RECORD;
  deal_record RECORD;
  recommendation_score DECIMAL(5,2);
  recommendation_confidence DECIMAL(5,2);
BEGIN
  -- Clear existing recommendations
  UPDATE user_recommendations 
  SET is_active = false 
  WHERE user_id = user_id_param;
  
  -- Generate recommendations based on user interests
  FOR user_interest IN 
    SELECT * FROM user_interests 
    WHERE user_id = user_id_param 
    ORDER BY interest_weight DESC 
    LIMIT 20
  LOOP
    IF user_interest.interest_type = 'category' THEN
      -- Recommend deals from interested categories
      FOR deal_record IN
        SELECT d.id, d.slug, d.title, d.price, d.discount_percentage
        FROM deals d
        WHERE d.category_id = user_interest.interest_value::INTEGER
          AND d.status = 'approved'
          AND d.expires_at > NOW()
        ORDER BY d.created_at DESC
        LIMIT 5
      LOOP
        -- Calculate recommendation score
        recommendation_score := user_interest.interest_weight * 0.7 + 
                               COALESCE(deal_record.discount_percentage, 0) * 0.3;
        recommendation_confidence := LEAST(user_interest.interest_weight / 10.0, 1.0);
        
        -- Insert recommendation
        INSERT INTO user_recommendations (
          user_id, recommendation_type, target_id, target_slug,
          score, confidence, reason, metadata
        ) VALUES (
          user_id_param, 'deal', deal_record.id, deal_record.slug,
          recommendation_score, recommendation_confidence,
          'Based on your interest in this category',
          jsonb_build_object('category_id', user_interest.interest_value)
        )
        ON CONFLICT (user_id, recommendation_type, target_id)
        DO UPDATE SET
          score = EXCLUDED.score,
          confidence = EXCLUDED.confidence,
          is_active = true,
          expires_at = NOW() + INTERVAL '7 days';
      END LOOP;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- RLS Policies
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_saved_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;

-- User preferences policies
CREATE POLICY "Users can view their own preferences" ON public.user_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences" ON public.user_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences" ON public.user_preferences
  FOR UPDATE USING (auth.uid() = user_id);

-- User activities policies
CREATE POLICY "Users can view their own activities" ON public.user_activities
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own activities" ON public.user_activities
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User interests policies
CREATE POLICY "Users can view their own interests" ON public.user_interests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own interests" ON public.user_interests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own interests" ON public.user_interests
  FOR UPDATE USING (auth.uid() = user_id);

-- User recommendations policies
CREATE POLICY "Users can view their own recommendations" ON public.user_recommendations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own recommendations" ON public.user_recommendations
  FOR UPDATE USING (auth.uid() = user_id);

-- User saved searches policies
CREATE POLICY "Users can view their own saved searches" ON public.user_saved_searches
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own saved searches" ON public.user_saved_searches
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own saved searches" ON public.user_saved_searches
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved searches" ON public.user_saved_searches
  FOR DELETE USING (auth.uid() = user_id);

-- User follows policies
CREATE POLICY "Users can view their own follows" ON public.user_follows
  FOR SELECT USING (auth.uid() = follower_id OR auth.uid() = following_id);

CREATE POLICY "Users can insert their own follows" ON public.user_follows
  FOR INSERT WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can delete their own follows" ON public.user_follows
  FOR DELETE USING (auth.uid() = follower_id);

-- Insert default preferences for existing users
INSERT INTO public.user_preferences (user_id)
SELECT id FROM public.profiles
WHERE id NOT IN (SELECT user_id FROM public.user_preferences)
ON CONFLICT (user_id) DO NOTHING;

-- Insert sample activities for testing
INSERT INTO public.user_activities (user_id, activity_type, target_type, target_id, metadata)
SELECT 
  p.id,
  'deal_view',
  'deal',
  d.id,
  jsonb_build_object('deal_title', d.title, 'deal_price', d.price)
FROM public.profiles p
CROSS JOIN public.deals d
WHERE p.role = 'user' AND d.status = 'approved'
LIMIT 100;

-- Insert sample interests based on activities
INSERT INTO public.user_interests (user_id, interest_type, interest_value, interest_weight, activity_count)
SELECT 
  ua.user_id,
  'category',
  d.category_id::TEXT,
  COUNT(*) * 1.0,
  COUNT(*)
FROM public.user_activities ua
JOIN public.deals d ON ua.target_id = d.id
WHERE ua.activity_type = 'deal_view' AND ua.target_type = 'deal'
GROUP BY ua.user_id, d.category_id
ON CONFLICT (user_id, interest_type, interest_value)
DO UPDATE SET
  interest_weight = user_interests.interest_weight + EXCLUDED.interest_weight,
  activity_count = user_interests.activity_count + EXCLUDED.activity_count,
  last_activity = NOW();
