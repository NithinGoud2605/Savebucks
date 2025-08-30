-- Enhanced user engagement system with images and detailed tracking

-- Add profile image and bio to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS website TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS joined_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_active TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS total_posts INT DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS total_comments INT DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS total_votes_received INT DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS weekly_points INT DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS monthly_points INT DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS all_time_points INT DEFAULT 0;

-- Add image support to deals
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS deal_images TEXT[]; -- Array of image URLs
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS featured_image TEXT; -- Main image URL

-- User activity tracking table
CREATE TABLE IF NOT EXISTS public.user_activities (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL, -- 'deal_posted', 'comment_posted', 'vote_cast', 'deal_approved', etc.
  target_type TEXT NOT NULL, -- 'deal', 'comment', 'user'
  target_id BIGINT, -- ID of the target (deal_id, comment_id, etc.)
  points_earned INT DEFAULT 0,
  metadata JSONB, -- Additional activity data
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_activities_user_id ON public.user_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activities_created_at ON public.user_activities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_activities_type ON public.user_activities(activity_type);

-- Enhanced leaderboard system
CREATE TABLE IF NOT EXISTS public.leaderboard_periods (
  id SERIAL PRIMARY KEY,
  period_type TEXT NOT NULL, -- 'weekly', 'monthly', 'all_time'
  start_date DATE NOT NULL,
  end_date DATE,
  is_current BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User following system
CREATE TABLE IF NOT EXISTS public.user_follows (
  follower_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (follower_id, following_id)
);

CREATE INDEX IF NOT EXISTS idx_user_follows_follower ON public.user_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_following ON public.user_follows(following_id);

-- User achievements system
CREATE TABLE IF NOT EXISTS public.achievements (
  id SERIAL PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  requirement_type TEXT NOT NULL, -- 'posts_count', 'karma_threshold', 'votes_received', etc.
  requirement_value INT NOT NULL,
  points_reward INT DEFAULT 0,
  badge_color TEXT DEFAULT '#3b82f6',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_achievements (
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  achievement_id INT NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  points_earned INT DEFAULT 0,
  PRIMARY KEY (user_id, achievement_id)
);

-- Image storage table for deals and profiles
CREATE TABLE IF NOT EXISTS public.images (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  original_name TEXT,
  file_size BIGINT,
  mime_type TEXT,
  width INT,
  height INT,
  storage_path TEXT NOT NULL, -- Path in storage bucket
  public_url TEXT, -- Public URL for the image
  entity_type TEXT, -- 'profile', 'deal', 'comment'
  entity_id BIGINT, -- ID of the related entity
  is_primary BOOLEAN DEFAULT FALSE, -- For deals, marks the main image
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_images_user_id ON public.images(user_id);
CREATE INDEX IF NOT EXISTS idx_images_entity ON public.images(entity_type, entity_id);

-- Functions for point calculation and leaderboard updates

-- Function to calculate user points
CREATE OR REPLACE FUNCTION calculate_user_points(user_uuid UUID, period_type TEXT DEFAULT 'all_time')
RETURNS INT
LANGUAGE plpgsql
AS $$
DECLARE
  total_points INT := 0;
  start_date DATE;
  end_date DATE;
BEGIN
  -- Determine date range based on period
  CASE period_type
    WHEN 'weekly' THEN
      start_date := DATE_TRUNC('week', NOW())::DATE;
      end_date := (DATE_TRUNC('week', NOW()) + INTERVAL '1 week')::DATE;
    WHEN 'monthly' THEN
      start_date := DATE_TRUNC('month', NOW())::DATE;
      end_date := (DATE_TRUNC('month', NOW()) + INTERVAL '1 month')::DATE;
    ELSE
      start_date := '1900-01-01'::DATE;
      end_date := '2100-01-01'::DATE;
  END CASE;

  -- Calculate points from activities
  SELECT COALESCE(SUM(points_earned), 0) INTO total_points
  FROM public.user_activities
  WHERE user_id = user_uuid
    AND created_at >= start_date
    AND created_at < end_date;

  -- Add karma points
  IF period_type = 'all_time' THEN
    SELECT total_points + COALESCE(karma, 0) INTO total_points
    FROM public.profiles
    WHERE id = user_uuid;
  END IF;

  RETURN total_points;
END;
$$;

-- Function to update user points
CREATE OR REPLACE FUNCTION update_user_points()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Update weekly, monthly, and all-time points
  UPDATE public.profiles SET
    weekly_points = calculate_user_points(NEW.user_id, 'weekly'),
    monthly_points = calculate_user_points(NEW.user_id, 'monthly'),
    all_time_points = calculate_user_points(NEW.user_id, 'all_time'),
    last_active = NOW()
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$$;

-- Trigger to update points when activities are added
CREATE TRIGGER trg_user_activities_update_points
  AFTER INSERT ON public.user_activities
  FOR EACH ROW EXECUTE FUNCTION update_user_points();

-- Function to award points for various activities
CREATE OR REPLACE FUNCTION award_activity_points(
  user_uuid UUID,
  activity_type TEXT,
  target_type TEXT DEFAULT NULL,
  target_id BIGINT DEFAULT NULL,
  metadata_json JSONB DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  points_to_award INT := 0;
BEGIN
  -- Define points for different activities
  CASE activity_type
    WHEN 'deal_posted' THEN points_to_award := 10;
    WHEN 'deal_approved' THEN points_to_award := 25;
    WHEN 'comment_posted' THEN points_to_award := 5;
    WHEN 'vote_received' THEN points_to_award := 2;
    WHEN 'deal_featured' THEN points_to_award := 50;
    WHEN 'achievement_unlocked' THEN points_to_award := 100;
    ELSE points_to_award := 1;
  END CASE;

  -- Insert activity record
  INSERT INTO public.user_activities (
    user_id, activity_type, target_type, target_id, points_earned, metadata
  ) VALUES (
    user_uuid, activity_type, target_type, target_id, points_to_award, metadata_json
  );
END;
$$;

-- Function to get leaderboard data
CREATE OR REPLACE FUNCTION get_leaderboard(
  period_type TEXT DEFAULT 'all_time',
  limit_count INT DEFAULT 50
)
RETURNS TABLE (
  user_id UUID,
  handle TEXT,
  avatar_url TEXT,
  points INT,
  total_posts INT,
  total_comments INT,
  karma INT,
  rank BIGINT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.handle,
    p.avatar_url,
    CASE 
      WHEN period_type = 'weekly' THEN p.weekly_points
      WHEN period_type = 'monthly' THEN p.monthly_points
      ELSE p.all_time_points
    END as points,
    p.total_posts,
    p.total_comments,
    p.karma,
    ROW_NUMBER() OVER (
      ORDER BY 
        CASE 
          WHEN period_type = 'weekly' THEN p.weekly_points
          WHEN period_type = 'monthly' THEN p.monthly_points
          ELSE p.all_time_points
        END DESC,
        p.karma DESC,
        p.created_at ASC
    ) as rank
  FROM public.profiles p
  WHERE p.handle IS NOT NULL
  ORDER BY rank
  LIMIT limit_count;
END;
$$;

-- Triggers to update user statistics

-- Update total posts when deal is created
CREATE OR REPLACE FUNCTION update_user_post_count()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.submitter_id IS NOT NULL THEN
    UPDATE public.profiles SET 
      total_posts = total_posts + 1,
      last_active = NOW()
    WHERE id = NEW.submitter_id;
    
    -- Award points for posting
    PERFORM award_activity_points(NEW.submitter_id, 'deal_posted', 'deal', NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_deals_update_post_count
  AFTER INSERT ON public.deals
  FOR EACH ROW EXECUTE FUNCTION update_user_post_count();

-- Update total comments when comment is created
CREATE OR REPLACE FUNCTION update_user_comment_count()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.profiles SET 
      total_comments = total_comments + 1,
      last_active = NOW()
    WHERE id = NEW.user_id;
    
    -- Award points for commenting
    PERFORM award_activity_points(NEW.user_id, 'comment_posted', 'comment', NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_comments_update_comment_count
  AFTER INSERT ON public.comments
  FOR EACH ROW EXECUTE FUNCTION update_user_comment_count();

-- Update vote statistics
CREATE OR REPLACE FUNCTION update_vote_statistics()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  deal_owner_id UUID;
BEGIN
  -- Get the deal owner
  SELECT submitter_id INTO deal_owner_id
  FROM public.deals
  WHERE id = NEW.deal_id;
  
  IF deal_owner_id IS NOT NULL AND NEW.value > 0 THEN
    -- Update vote count for deal owner
    UPDATE public.profiles SET 
      total_votes_received = total_votes_received + 1
    WHERE id = deal_owner_id;
    
    -- Award points to deal owner for receiving upvote
    PERFORM award_activity_points(deal_owner_id, 'vote_received', 'deal', NEW.deal_id);
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_votes_update_statistics
  AFTER INSERT ON public.votes
  FOR EACH ROW EXECUTE FUNCTION update_vote_statistics();

-- Insert default achievements
INSERT INTO public.achievements (code, name, description, icon, requirement_type, requirement_value, points_reward, badge_color) VALUES
('first_post', 'First Post', 'Posted your first deal', 'star', 'posts_count', 1, 50, '#10b981'),
('deal_master', 'Deal Master', 'Posted 10 deals', 'trophy', 'posts_count', 10, 200, '#f59e0b'),
('deal_guru', 'Deal Guru', 'Posted 50 deals', 'crown', 'posts_count', 50, 500, '#8b5cf6'),
('karma_king', 'Karma King', 'Reached 100 karma points', 'heart', 'karma_threshold', 100, 300, '#ef4444'),
('community_favorite', 'Community Favorite', 'Received 100 upvotes', 'thumbs-up', 'votes_received', 100, 400, '#3b82f6'),
('commentator', 'Active Commentator', 'Posted 25 comments', 'chat-bubble-left', 'comments_count', 25, 150, '#06b6d4'),
('social_butterfly', 'Social Butterfly', 'Following 20 users', 'users', 'following_count', 20, 100, '#ec4899')
ON CONFLICT (code) DO NOTHING;

-- Function to check and award achievements
CREATE OR REPLACE FUNCTION check_and_award_achievements(user_uuid UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  achievement_record RECORD;
  user_stats RECORD;
  following_count INT;
BEGIN
  -- Get user statistics
  SELECT 
    total_posts, total_comments, karma, total_votes_received
  INTO user_stats
  FROM public.profiles
  WHERE id = user_uuid;
  
  -- Get following count
  SELECT COUNT(*) INTO following_count
  FROM public.user_follows
  WHERE follower_id = user_uuid;
  
  -- Check each achievement
  FOR achievement_record IN 
    SELECT * FROM public.achievements WHERE is_active = TRUE
  LOOP
    -- Check if user already has this achievement
    IF NOT EXISTS (
      SELECT 1 FROM public.user_achievements 
      WHERE user_id = user_uuid AND achievement_id = achievement_record.id
    ) THEN
      -- Check if user meets the requirement
      CASE achievement_record.requirement_type
        WHEN 'posts_count' THEN
          IF user_stats.total_posts >= achievement_record.requirement_value THEN
            INSERT INTO public.user_achievements (user_id, achievement_id, points_earned)
            VALUES (user_uuid, achievement_record.id, achievement_record.points_reward);
            
            PERFORM award_activity_points(
              user_uuid, 
              'achievement_unlocked', 
              'achievement', 
              achievement_record.id,
              jsonb_build_object('achievement_name', achievement_record.name)
            );
          END IF;
        WHEN 'karma_threshold' THEN
          IF user_stats.karma >= achievement_record.requirement_value THEN
            INSERT INTO public.user_achievements (user_id, achievement_id, points_earned)
            VALUES (user_uuid, achievement_record.id, achievement_record.points_reward);
            
            PERFORM award_activity_points(
              user_uuid, 
              'achievement_unlocked', 
              'achievement', 
              achievement_record.id,
              jsonb_build_object('achievement_name', achievement_record.name)
            );
          END IF;
        WHEN 'votes_received' THEN
          IF user_stats.total_votes_received >= achievement_record.requirement_value THEN
            INSERT INTO public.user_achievements (user_id, achievement_id, points_earned)
            VALUES (user_uuid, achievement_record.id, achievement_record.points_reward);
            
            PERFORM award_activity_points(
              user_uuid, 
              'achievement_unlocked', 
              'achievement', 
              achievement_record.id,
              jsonb_build_object('achievement_name', achievement_record.name)
            );
          END IF;
        WHEN 'comments_count' THEN
          IF user_stats.total_comments >= achievement_record.requirement_value THEN
            INSERT INTO public.user_achievements (user_id, achievement_id, points_earned)
            VALUES (user_uuid, achievement_record.id, achievement_record.points_reward);
            
            PERFORM award_activity_points(
              user_uuid, 
              'achievement_unlocked', 
              'achievement', 
              achievement_record.id,
              jsonb_build_object('achievement_name', achievement_record.name)
            );
          END IF;
        WHEN 'following_count' THEN
          IF following_count >= achievement_record.requirement_value THEN
            INSERT INTO public.user_achievements (user_id, achievement_id, points_earned)
            VALUES (user_uuid, achievement_record.id, achievement_record.points_reward);
            
            PERFORM award_activity_points(
              user_uuid, 
              'achievement_unlocked', 
              'achievement', 
              achievement_record.id,
              jsonb_build_object('achievement_name', achievement_record.name)
            );
          END IF;
      END CASE;
    END IF;
  END LOOP;
END;
$$;

-- Trigger to check achievements when user stats change
CREATE OR REPLACE FUNCTION trigger_achievement_check()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Check achievements for the user
  PERFORM check_and_award_achievements(NEW.user_id);
  RETURN NEW;
END;
$$;

-- Apply achievement check trigger to activities
CREATE TRIGGER trg_check_achievements_on_activity
  AFTER INSERT ON public.user_activities
  FOR EACH ROW EXECUTE FUNCTION trigger_achievement_check();
