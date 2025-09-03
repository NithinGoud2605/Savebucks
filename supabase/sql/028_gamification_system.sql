-- Comprehensive Gamification System v1
-- XP system, badges, achievements, leaderboards, and user progression

-- XP Events tracking table
CREATE TABLE IF NOT EXISTS public.xp_events (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Event details
  event_type TEXT NOT NULL, -- 'deal_posted', 'comment_posted', 'vote_cast', 'deal_approved', etc.
  event_category TEXT NOT NULL CHECK (event_category IN ('content', 'engagement', 'social', 'achievement', 'bonus')),
  
  -- XP details
  xp_amount INTEGER NOT NULL CHECK (xp_amount >= 0),
  multiplier DECIMAL(3,2) DEFAULT 1.0,
  final_xp INTEGER NOT NULL CHECK (final_xp >= 0),
  
  -- Context
  target_type TEXT, -- 'deal', 'comment', 'user', etc.
  target_id BIGINT, -- ID of the target object
  description TEXT,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  processed BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Prevent duplicate XP for same event
  UNIQUE(user_id, event_type, target_type, target_id)
);

-- Enhanced user progression tracking
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS total_xp INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS current_level INTEGER DEFAULT 1;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS xp_to_next_level INTEGER DEFAULT 100;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS streak_days INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS longest_streak INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_activity_date DATE;

-- User statistics enhancement
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS deals_approved INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS comments_received INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS votes_received INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS badges_earned INTEGER DEFAULT 0;

-- Achievement definitions table (enhanced badges)
CREATE TABLE IF NOT EXISTS public.achievements (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  
  -- Achievement criteria
  category TEXT NOT NULL CHECK (category IN ('posting', 'engagement', 'social', 'milestone', 'special', 'seasonal')),
  criteria_type TEXT NOT NULL CHECK (criteria_type IN ('count', 'streak', 'ratio', 'special')),
  criteria_value INTEGER, -- Target value for count/streak achievements
  criteria_metadata JSONB DEFAULT '{}', -- Additional criteria details
  
  -- Rewards
  xp_reward INTEGER DEFAULT 0,
  badge_icon TEXT, -- Icon identifier
  badge_color TEXT DEFAULT '#3B82F6',
  rarity TEXT DEFAULT 'common' CHECK (rarity IN ('common', 'uncommon', 'rare', 'epic', 'legendary')),
  
  -- Visibility
  is_hidden BOOLEAN DEFAULT FALSE, -- Hidden achievements (surprises)
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add missing columns if table already exists
ALTER TABLE public.achievements ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE public.achievements ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE public.achievements ADD COLUMN IF NOT EXISTS criteria_type TEXT;
ALTER TABLE public.achievements ADD COLUMN IF NOT EXISTS criteria_value INTEGER;
ALTER TABLE public.achievements ADD COLUMN IF NOT EXISTS criteria_metadata JSONB DEFAULT '{}';
ALTER TABLE public.achievements ADD COLUMN IF NOT EXISTS xp_reward INTEGER DEFAULT 0;
ALTER TABLE public.achievements ADD COLUMN IF NOT EXISTS badge_icon TEXT;
ALTER TABLE public.achievements ADD COLUMN IF NOT EXISTS badge_color TEXT DEFAULT '#3B82F6';
ALTER TABLE public.achievements ADD COLUMN IF NOT EXISTS rarity TEXT DEFAULT 'common';
ALTER TABLE public.achievements ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT FALSE;
ALTER TABLE public.achievements ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE public.achievements ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Handle existing table structure - make all potentially problematic columns nullable
DO $$
BEGIN
  -- List of columns that might have NOT NULL constraints in existing table
  DECLARE
    col_name TEXT;
    col_list TEXT[] := ARRAY['code', 'requirement_type', 'requirement_value', 'badge_image', 'badge_background'];
  BEGIN
    FOREACH col_name IN ARRAY col_list
    LOOP
      IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'achievements' AND column_name = col_name
      ) THEN
        -- Try to make column nullable if it has NOT NULL constraint
        BEGIN
          EXECUTE format('ALTER TABLE public.achievements ALTER COLUMN %I DROP NOT NULL', col_name);
        EXCEPTION WHEN OTHERS THEN
          -- Column might not have NOT NULL constraint, ignore error
          NULL;
        END;
      END IF;
    END LOOP;
  END;
END $$;

-- Ensure unique constraints exist
DO $$
BEGIN
  -- Add unique constraint on slug if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'achievements_slug_key' 
    AND conrelid = 'public.achievements'::regclass
  ) THEN
    ALTER TABLE public.achievements ADD CONSTRAINT achievements_slug_key UNIQUE (slug);
  END IF;
END $$;

-- User achievements (earned badges)
CREATE TABLE IF NOT EXISTS public.user_achievements (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  achievement_id INTEGER NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  
  -- Progress tracking
  progress INTEGER DEFAULT 0, -- Current progress towards achievement
  completed_at TIMESTAMPTZ,
  
  -- Context
  trigger_event_id BIGINT REFERENCES public.xp_events(id),
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, achievement_id)
);

-- Leaderboard periods table
CREATE TABLE IF NOT EXISTS public.leaderboard_periods (
  id SERIAL PRIMARY KEY,
  period_type TEXT NOT NULL CHECK (period_type IN ('daily', 'weekly', 'monthly', 'yearly', 'all_time')),
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  is_current BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(period_type, period_start)
);

-- Enhanced leaderboard entries
CREATE TABLE IF NOT EXISTS public.leaderboard_entries (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  period_id INTEGER NOT NULL REFERENCES public.leaderboard_periods(id) ON DELETE CASCADE,
  
  -- Rankings
  rank INTEGER NOT NULL,
  previous_rank INTEGER,
  rank_change INTEGER DEFAULT 0,
  
  -- Scores
  total_xp INTEGER DEFAULT 0,
  deals_posted INTEGER DEFAULT 0,
  comments_posted INTEGER DEFAULT 0,
  votes_cast INTEGER DEFAULT 0,
  votes_received INTEGER DEFAULT 0,
  
  -- Calculated scores
  engagement_score DECIMAL(10,2) DEFAULT 0,
  quality_score DECIMAL(10,2) DEFAULT 0,
  
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, period_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_xp_events_user_id ON public.xp_events(user_id);
CREATE INDEX IF NOT EXISTS idx_xp_events_created_at ON public.xp_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_xp_events_type ON public.xp_events(event_type);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON public.user_achievements(user_id);

-- Conditional index creation for user_achievements
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_achievements' AND column_name = 'completed_at') THEN
    CREATE INDEX IF NOT EXISTS idx_user_achievements_completed ON public.user_achievements(completed_at) WHERE completed_at IS NOT NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_leaderboard_entries_period ON public.leaderboard_entries(period_id, rank);
CREATE INDEX IF NOT EXISTS idx_leaderboard_entries_user ON public.leaderboard_entries(user_id);

-- Insert default achievements
DO $$
BEGIN
  -- Insert achievements one by one to handle conflicts gracefully
  INSERT INTO public.achievements (name, slug, description, category, criteria_type, criteria_value, xp_reward, badge_icon, badge_color, rarity, code, requirement_type, requirement_value) 
  VALUES ('First Deal', 'first-deal', 'Post your first deal', 'posting', 'count', 1, 50, '🎯', '#10B981', 'common', 'FIRST_DEAL', 'posts', 1)
  ON CONFLICT (slug) DO NOTHING;
  
  INSERT INTO public.achievements (name, slug, description, category, criteria_type, criteria_value, xp_reward, badge_icon, badge_color, rarity, code, requirement_type, requirement_value) 
  VALUES ('Deal Maker', 'deal-maker', 'Post 10 deals', 'posting', 'count', 10, 200, '📝', '#3B82F6', 'uncommon', 'DEAL_MAKER', 'posts', 10)
  ON CONFLICT (slug) DO NOTHING;
  
  INSERT INTO public.achievements (name, slug, description, category, criteria_type, criteria_value, xp_reward, badge_icon, badge_color, rarity, code, requirement_type, requirement_value) 
  VALUES ('Deal Master', 'deal-master', 'Post 50 deals', 'posting', 'count', 50, 500, '🏆', '#F59E0B', 'rare', 'DEAL_MASTER', 'posts', 50)
  ON CONFLICT (slug) DO NOTHING;
  
  INSERT INTO public.achievements (name, slug, description, category, criteria_type, criteria_value, xp_reward, badge_icon, badge_color, rarity, code, requirement_type, requirement_value) 
  VALUES ('Deal Legend', 'deal-legend', 'Post 100 deals', 'posting', 'count', 100, 1000, '👑', '#8B5CF6', 'epic', 'DEAL_LEGEND', 'posts', 100)
  ON CONFLICT (slug) DO NOTHING;
  
  INSERT INTO public.achievements (name, slug, description, category, criteria_type, criteria_value, xp_reward, badge_icon, badge_color, rarity, code, requirement_type, requirement_value) 
  VALUES ('First Vote', 'first-vote', 'Cast your first vote', 'engagement', 'count', 1, 10, '👍', '#10B981', 'common', 'FIRST_VOTE', 'votes', 1)
  ON CONFLICT (slug) DO NOTHING;
  
  INSERT INTO public.achievements (name, slug, description, category, criteria_type, criteria_value, xp_reward, badge_icon, badge_color, rarity, code, requirement_type, requirement_value) 
  VALUES ('Voter', 'voter', 'Cast 100 votes', 'engagement', 'count', 100, 100, '🗳️', '#3B82F6', 'uncommon', 'VOTER', 'votes', 100)
  ON CONFLICT (slug) DO NOTHING;
  
  INSERT INTO public.achievements (name, slug, description, category, criteria_type, criteria_value, xp_reward, badge_icon, badge_color, rarity, code, requirement_type, requirement_value) 
  VALUES ('Super Voter', 'super-voter', 'Cast 500 votes', 'engagement', 'count', 500, 300, '⭐', '#F59E0B', 'rare', 'SUPER_VOTER', 'votes', 500)
  ON CONFLICT (slug) DO NOTHING;
  
  INSERT INTO public.achievements (name, slug, description, category, criteria_type, criteria_value, xp_reward, badge_icon, badge_color, rarity, code, requirement_type, requirement_value) 
  VALUES ('First Comment', 'first-comment', 'Post your first comment', 'engagement', 'count', 1, 25, '💬', '#10B981', 'common', 'FIRST_COMMENT', 'comments', 1)
  ON CONFLICT (slug) DO NOTHING;
  
  INSERT INTO public.achievements (name, slug, description, category, criteria_type, criteria_value, xp_reward, badge_icon, badge_color, rarity, code, requirement_type, requirement_value) 
  VALUES ('Commentator', 'commentator', 'Post 50 comments', 'engagement', 'count', 50, 150, '📢', '#3B82F6', 'uncommon', 'COMMENTATOR', 'comments', 50)
  ON CONFLICT (slug) DO NOTHING;
  
  INSERT INTO public.achievements (name, slug, description, category, criteria_type, criteria_value, xp_reward, badge_icon, badge_color, rarity, code, requirement_type, requirement_value) 
  VALUES ('Popular Deal', 'popular-deal', 'Get 10 upvotes on a single deal', 'social', 'count', 10, 100, '🔥', '#EF4444', 'uncommon', 'POPULAR_DEAL', 'upvotes', 10)
  ON CONFLICT (slug) DO NOTHING;
  
  INSERT INTO public.achievements (name, slug, description, category, criteria_type, criteria_value, xp_reward, badge_icon, badge_color, rarity, code, requirement_type, requirement_value) 
  VALUES ('Viral Deal', 'viral-deal', 'Get 50 upvotes on a single deal', 'social', 'count', 50, 300, '🚀', '#F59E0B', 'rare', 'VIRAL_DEAL', 'upvotes', 50)
  ON CONFLICT (slug) DO NOTHING;
  
  INSERT INTO public.achievements (name, slug, description, category, criteria_type, criteria_value, xp_reward, badge_icon, badge_color, rarity, code, requirement_type, requirement_value) 
  VALUES ('Community Favorite', 'community-favorite', 'Get 100 upvotes on a single deal', 'social', 'count', 100, 500, '❤️', '#EC4899', 'epic', 'COMMUNITY_FAVORITE', 'upvotes', 100)
  ON CONFLICT (slug) DO NOTHING;
  
  INSERT INTO public.achievements (name, slug, description, category, criteria_type, criteria_value, xp_reward, badge_icon, badge_color, rarity, code, requirement_type, requirement_value) 
  VALUES ('Level 5', 'level-5', 'Reach level 5', 'milestone', 'count', 5, 100, '🏅', '#10B981', 'common', 'LEVEL_5', 'level', 5)
  ON CONFLICT (slug) DO NOTHING;
  
  INSERT INTO public.achievements (name, slug, description, category, criteria_type, criteria_value, xp_reward, badge_icon, badge_color, rarity, code, requirement_type, requirement_value) 
  VALUES ('Level 10', 'level-10', 'Reach level 10', 'milestone', 'count', 10, 250, '🥉', '#CD7F32', 'uncommon', 'LEVEL_10', 'level', 10)
  ON CONFLICT (slug) DO NOTHING;
  
  INSERT INTO public.achievements (name, slug, description, category, criteria_type, criteria_value, xp_reward, badge_icon, badge_color, rarity, code, requirement_type, requirement_value) 
  VALUES ('Level 25', 'level-25', 'Reach level 25', 'milestone', 'count', 25, 500, '🥈', '#C0C0C0', 'rare', 'LEVEL_25', 'level', 25)
  ON CONFLICT (slug) DO NOTHING;
  
  INSERT INTO public.achievements (name, slug, description, category, criteria_type, criteria_value, xp_reward, badge_icon, badge_color, rarity, code, requirement_type, requirement_value) 
  VALUES ('Level 50', 'level-50', 'Reach level 50', 'milestone', 'count', 50, 1000, '🥇', '#FFD700', 'epic', 'LEVEL_50', 'level', 50)
  ON CONFLICT (slug) DO NOTHING;
  
  INSERT INTO public.achievements (name, slug, description, category, criteria_type, criteria_value, xp_reward, badge_icon, badge_color, rarity, code, requirement_type, requirement_value) 
  VALUES ('Level 100', 'level-100', 'Reach level 100', 'milestone', 'count', 100, 2500, '💎', '#B91C1C', 'legendary', 'LEVEL_100', 'level', 100)
  ON CONFLICT (slug) DO NOTHING;
  
  INSERT INTO public.achievements (name, slug, description, category, criteria_type, criteria_value, xp_reward, badge_icon, badge_color, rarity, code, requirement_type, requirement_value) 
  VALUES ('Week Warrior', 'week-warrior', 'Maintain a 7-day activity streak', 'special', 'streak', 7, 200, '🔥', '#F59E0B', 'uncommon', 'WEEK_WARRIOR', 'streak', 7)
  ON CONFLICT (slug) DO NOTHING;
  
  INSERT INTO public.achievements (name, slug, description, category, criteria_type, criteria_value, xp_reward, badge_icon, badge_color, rarity, code, requirement_type, requirement_value) 
  VALUES ('Month Master', 'month-master', 'Maintain a 30-day activity streak', 'special', 'streak', 30, 500, '📅', '#8B5CF6', 'rare', 'MONTH_MASTER', 'streak', 30)
  ON CONFLICT (slug) DO NOTHING;
  
  INSERT INTO public.achievements (name, slug, description, category, criteria_type, criteria_value, xp_reward, badge_icon, badge_color, rarity, code, requirement_type, requirement_value) 
  VALUES ('Year Champion', 'year-champion', 'Maintain a 365-day activity streak', 'special', 'streak', 365, 2000, '🏆', '#F59E0B', 'legendary', 'YEAR_CHAMPION', 'streak', 365)
  ON CONFLICT (slug) DO NOTHING;
END $$;

-- XP calculation configuration
CREATE TABLE IF NOT EXISTS public.xp_config (
  id SERIAL PRIMARY KEY,
  event_type TEXT NOT NULL UNIQUE,
  base_xp INTEGER NOT NULL CHECK (base_xp >= 0),
  max_daily INTEGER DEFAULT NULL, -- Max XP per day from this event type
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default XP values
INSERT INTO public.xp_config (event_type, base_xp, max_daily, description) VALUES
('deal_posted', 25, 200, 'XP for posting a new deal'),
('deal_approved', 50, NULL, 'Bonus XP when deal gets approved'),
('comment_posted', 5, 50, 'XP for posting a comment'),
('vote_cast', 1, 20, 'XP for casting a vote'),
('vote_received', 3, NULL, 'XP when receiving an upvote'),
('deal_featured', 100, NULL, 'Bonus XP when deal gets featured'),
('first_deal_day', 10, 10, 'Daily login bonus'),
('achievement_earned', 0, NULL, 'XP from achievement rewards'),
('referral_signup', 100, 500, 'XP for successful referrals')
ON CONFLICT (event_type) DO NOTHING;

-- Function to calculate level from XP
CREATE OR REPLACE FUNCTION calculate_level_from_xp(total_xp INTEGER)
RETURNS TABLE (
  level INTEGER,
  xp_for_current_level INTEGER,
  xp_for_next_level INTEGER,
  progress_to_next DECIMAL(5,2)
)
LANGUAGE plpgsql
AS $$
DECLARE
  current_level INTEGER := 1;
  xp_needed INTEGER := 100; -- XP needed for level 2
  xp_remaining INTEGER := total_xp;
  next_level_xp INTEGER;
BEGIN
  -- Calculate level using progressive XP requirements
  WHILE xp_remaining >= xp_needed LOOP
    xp_remaining := xp_remaining - xp_needed;
    current_level := current_level + 1;
    -- Each level requires 20% more XP than the previous
    xp_needed := ROUND(xp_needed * 1.2);
  END LOOP;
  
  -- Calculate XP for next level
  next_level_xp := xp_needed;
  
  RETURN QUERY SELECT 
    current_level,
    xp_remaining,
    next_level_xp,
    ROUND((xp_remaining::DECIMAL / next_level_xp::DECIMAL) * 100, 2);
END;
$$;

-- Function to award XP
CREATE OR REPLACE FUNCTION award_xp(
  user_id_param UUID,
  event_type_param TEXT,
  target_type_param TEXT DEFAULT NULL,
  target_id_param BIGINT DEFAULT NULL,
  multiplier_param DECIMAL(3,2) DEFAULT 1.0,
  description_param TEXT DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  xp_config_record public.xp_config%ROWTYPE;
  base_xp INTEGER;
  final_xp INTEGER;
  daily_xp INTEGER;
  level_info RECORD;
  new_level INTEGER;
  old_level INTEGER;
BEGIN
  -- Get XP configuration
  SELECT * INTO xp_config_record 
  FROM public.xp_config 
  WHERE event_type = event_type_param AND is_active = TRUE;
  
  IF NOT FOUND THEN
    RAISE NOTICE 'XP config not found for event type: %', event_type_param;
    RETURN 0;
  END IF;
  
  base_xp := xp_config_record.base_xp;
  final_xp := ROUND(base_xp * multiplier_param);
  
  -- Check daily limits
  IF xp_config_record.max_daily IS NOT NULL THEN
    SELECT COALESCE(SUM(xe.final_xp), 0) INTO daily_xp
    FROM public.xp_events xe
    WHERE xe.user_id = user_id_param 
      AND xe.event_type = event_type_param
      AND xe.created_at >= CURRENT_DATE;
    
    -- Don't exceed daily limit
    IF daily_xp + final_xp > xp_config_record.max_daily THEN
      final_xp := GREATEST(0, xp_config_record.max_daily - daily_xp);
    END IF;
  END IF;
  
  -- Skip if no XP to award
  IF final_xp <= 0 THEN
    RETURN 0;
  END IF;
  
  -- Record XP event (with conflict handling)
  INSERT INTO public.xp_events (
    user_id, event_type, event_category, xp_amount, multiplier, final_xp,
    target_type, target_id, description
  ) VALUES (
    user_id_param, event_type_param, 
    CASE 
      WHEN event_type_param IN ('deal_posted', 'comment_posted') THEN 'content'
      WHEN event_type_param IN ('vote_cast', 'vote_received') THEN 'engagement'
      WHEN event_type_param IN ('referral_signup') THEN 'social'
      WHEN event_type_param IN ('achievement_earned') THEN 'achievement'
      ELSE 'bonus'
    END,
    base_xp, multiplier_param, final_xp,
    target_type_param, target_id_param, description_param
  )
  ON CONFLICT (user_id, event_type, target_type, target_id) DO NOTHING;
  
  -- Check if insert was successful (not a duplicate)
  IF NOT FOUND THEN
    RETURN 0;
  END IF;
  
  -- Get current level
  SELECT current_level INTO old_level FROM public.profiles WHERE id = user_id_param;
  
  -- Update user's total XP and recalculate level
  UPDATE public.profiles 
  SET total_xp = total_xp + final_xp
  WHERE id = user_id_param;
  
  -- Calculate new level
  SELECT * INTO level_info 
  FROM calculate_level_from_xp((SELECT total_xp FROM public.profiles WHERE id = user_id_param));
  
  new_level := level_info.level;
  
  -- Update level information
  UPDATE public.profiles 
  SET 
    current_level = new_level,
    xp_to_next_level = level_info.xp_for_next_level - level_info.xp_for_current_level
  WHERE id = user_id_param;
  
  -- Check for level-up achievement
  IF new_level > old_level THEN
    PERFORM check_level_achievements(user_id_param, new_level);
  END IF;
  
  -- Check for other achievements
  PERFORM check_user_achievements(user_id_param, event_type_param, target_type_param, target_id_param);
  
  RETURN final_xp;
END;
$$;

-- Function to check and award achievements
CREATE OR REPLACE FUNCTION check_user_achievements(
  user_id_param UUID,
  event_type_param TEXT DEFAULT NULL,
  target_type_param TEXT DEFAULT NULL,
  target_id_param BIGINT DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  achievement_record public.achievements%ROWTYPE;
  user_stats RECORD;
  achievements_earned INTEGER := 0;
  current_progress INTEGER;
  target_deal_votes INTEGER;
BEGIN
  -- Get user statistics
  SELECT 
    total_posts, total_comments, karma, total_xp, current_level, streak_days,
    deals_approved, votes_received
  INTO user_stats
  FROM public.profiles 
  WHERE id = user_id_param;
  
  -- Check all active achievements
  FOR achievement_record IN 
    SELECT * FROM public.achievements 
    WHERE is_active = TRUE
  LOOP
    current_progress := 0;
    
    -- Calculate progress based on achievement type
    CASE achievement_record.criteria_type
      WHEN 'count' THEN
        CASE achievement_record.category
          WHEN 'posting' THEN
            current_progress := user_stats.total_posts;
          WHEN 'engagement' THEN
            IF achievement_record.slug LIKE '%vote%' THEN
              SELECT COUNT(*) INTO current_progress
              FROM public.votes
              WHERE user_id = user_id_param;
            ELSIF achievement_record.slug LIKE '%comment%' THEN
              current_progress := user_stats.total_comments;
            END IF;
          WHEN 'milestone' THEN
            current_progress := user_stats.current_level;
          WHEN 'social' THEN
            -- Check for deal-specific achievements
            IF target_type_param = 'deal' AND target_id_param IS NOT NULL THEN
              SELECT COUNT(*) INTO target_deal_votes
              FROM public.votes
              WHERE deal_id = target_id_param AND value > 0;
              current_progress := target_deal_votes;
            END IF;
        END CASE;
        
      WHEN 'streak' THEN
        current_progress := user_stats.streak_days;
        
    END CASE;
    
    -- Check if achievement should be awarded
    IF current_progress >= achievement_record.criteria_value THEN
      -- Insert or update user achievement
      INSERT INTO public.user_achievements (
        user_id, achievement_id, progress, completed_at
      ) VALUES (
        user_id_param, achievement_record.id, current_progress, NOW()
      )
      ON CONFLICT (user_id, achievement_id) 
      DO UPDATE SET 
        progress = EXCLUDED.progress,
        completed_at = CASE 
          WHEN user_achievements.completed_at IS NULL THEN EXCLUDED.completed_at
          ELSE user_achievements.completed_at
        END;
      
      -- Award XP if newly completed
      IF NOT EXISTS (
        SELECT 1 FROM public.user_achievements 
        WHERE user_id = user_id_param 
          AND achievement_id = achievement_record.id 
          AND completed_at IS NOT NULL
      ) THEN
        IF achievement_record.xp_reward > 0 THEN
          PERFORM award_xp(
            user_id_param, 
            'achievement_earned', 
            'achievement', 
            achievement_record.id,
            1.0,
            'Achievement: ' || achievement_record.name
          );
        END IF;
        
        achievements_earned := achievements_earned + 1;
      END IF;
    ELSE
      -- Update progress for incomplete achievements
      INSERT INTO public.user_achievements (
        user_id, achievement_id, progress
      ) VALUES (
        user_id_param, achievement_record.id, current_progress
      )
      ON CONFLICT (user_id, achievement_id) 
      DO UPDATE SET progress = EXCLUDED.progress
      WHERE user_achievements.completed_at IS NULL;
    END IF;
  END LOOP;
  
  -- Update badge count
  UPDATE public.profiles 
  SET badges_earned = (
    SELECT COUNT(*) FROM public.user_achievements 
    WHERE user_id = user_id_param AND completed_at IS NOT NULL
  )
  WHERE id = user_id_param;
  
  RETURN achievements_earned;
END;
$$;

-- Function to check level achievements
CREATE OR REPLACE FUNCTION check_level_achievements(user_id_param UUID, new_level INTEGER)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  -- Award level-based achievements
  INSERT INTO public.user_achievements (user_id, achievement_id, progress, completed_at)
  SELECT user_id_param, a.id, new_level, NOW()
  FROM public.achievements a
  WHERE a.category = 'milestone' 
    AND a.criteria_value <= new_level
    AND NOT EXISTS (
      SELECT 1 FROM public.user_achievements ua 
      WHERE ua.user_id = user_id_param 
        AND ua.achievement_id = a.id 
        AND ua.completed_at IS NOT NULL
    )
  ON CONFLICT (user_id, achievement_id) DO NOTHING;
END;
$$;

-- Function to update daily streaks
CREATE OR REPLACE FUNCTION update_user_streak(user_id_param UUID)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  last_active DATE;
  current_streak INTEGER;
  longest_streak INTEGER;
  new_streak INTEGER;
BEGIN
  SELECT last_activity_date, streak_days, longest_streak 
  INTO last_active, current_streak, longest_streak
  FROM public.profiles 
  WHERE id = user_id_param;
  
  -- Check if user was active yesterday or today
  IF last_active = CURRENT_DATE THEN
    -- Already updated today
    RETURN current_streak;
  ELSIF last_active = CURRENT_DATE - INTERVAL '1 day' THEN
    -- Continue streak
    new_streak := current_streak + 1;
  ELSIF last_active IS NULL OR last_active < CURRENT_DATE - INTERVAL '1 day' THEN
    -- Streak broken or first activity
    new_streak := 1;
  ELSE
    -- Future date (shouldn't happen)
    new_streak := current_streak;
  END IF;
  
  -- Update profile
  UPDATE public.profiles 
  SET 
    last_activity_date = CURRENT_DATE,
    streak_days = new_streak,
    longest_streak = GREATEST(longest_streak, new_streak)
  WHERE id = user_id_param;
  
  -- Check streak achievements
  PERFORM check_user_achievements(user_id_param, 'streak_updated');
  
  RETURN new_streak;
END;
$$;

-- Enhanced leaderboard function
CREATE OR REPLACE FUNCTION get_enhanced_leaderboard(
  period_type_param TEXT DEFAULT 'all_time',
  limit_count INTEGER DEFAULT 50
)
RETURNS TABLE (
  user_id UUID,
  handle TEXT,
  avatar_url TEXT,
  rank INTEGER,
  total_xp INTEGER,
  current_level INTEGER,
  deals_posted INTEGER,
  comments_posted INTEGER,
  votes_received INTEGER,
  badges_earned INTEGER,
  streak_days INTEGER,
  engagement_score DECIMAL(10,2)
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.handle,
    p.avatar_url,
    ROW_NUMBER() OVER (ORDER BY p.total_xp DESC, p.karma DESC)::INTEGER,
    p.total_xp,
    p.current_level,
    p.total_posts,
    p.total_comments,
    p.votes_received,
    p.badges_earned,
    p.streak_days,
    -- Engagement score calculation
    (
      p.total_xp * 0.4 + 
      p.karma * 0.3 + 
      p.total_posts * 5 + 
      p.total_comments * 2 +
      p.badges_earned * 10
    )::DECIMAL(10,2)
  FROM public.profiles p
  WHERE p.total_xp > 0
  ORDER BY p.total_xp DESC, p.karma DESC
  LIMIT limit_count;
END;
$$;

-- Triggers to award XP automatically
CREATE OR REPLACE FUNCTION trigger_award_xp_deal()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Award XP for posting deal
  IF TG_OP = 'INSERT' THEN
    PERFORM award_xp(NEW.submitter_id, 'deal_posted', 'deal', NEW.id);
    PERFORM update_user_streak(NEW.submitter_id);
  END IF;
  
  -- Award XP for deal approval
  IF TG_OP = 'UPDATE' AND NEW.status = 'approved' AND OLD.status != 'approved' THEN
    PERFORM award_xp(NEW.submitter_id, 'deal_approved', 'deal', NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION trigger_award_xp_comment()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM award_xp(NEW.user_id, 'comment_posted', 'comment', NEW.id);
    PERFORM update_user_streak(NEW.user_id);
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION trigger_award_xp_vote()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  deal_submitter UUID;
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Award XP to voter
    PERFORM award_xp(NEW.user_id, 'vote_cast', 'vote', NEW.id);
    PERFORM update_user_streak(NEW.user_id);
    
    -- Award XP to deal submitter for receiving vote
    IF NEW.deal_id IS NOT NULL AND NEW.value > 0 THEN
      SELECT submitter_id INTO deal_submitter 
      FROM public.deals 
      WHERE id = NEW.deal_id;
      
      IF deal_submitter IS NOT NULL THEN
        PERFORM award_xp(deal_submitter, 'vote_received', 'deal', NEW.deal_id);
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create triggers
DROP TRIGGER IF EXISTS trigger_xp_deal ON public.deals;
CREATE TRIGGER trigger_xp_deal
  AFTER INSERT OR UPDATE ON public.deals
  FOR EACH ROW
  EXECUTE FUNCTION trigger_award_xp_deal();

DROP TRIGGER IF EXISTS trigger_xp_comment ON public.comments;
CREATE TRIGGER trigger_xp_comment
  AFTER INSERT ON public.comments
  FOR EACH ROW
  EXECUTE FUNCTION trigger_award_xp_comment();

DROP TRIGGER IF EXISTS trigger_xp_vote ON public.votes;
CREATE TRIGGER trigger_xp_vote
  AFTER INSERT ON public.votes
  FOR EACH ROW
  EXECUTE FUNCTION trigger_award_xp_vote();

-- RLS Policies
ALTER TABLE public.xp_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaderboard_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaderboard_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.xp_config ENABLE ROW LEVEL SECURITY;

-- Users can view their own XP events
CREATE POLICY "Users can view their own XP events" ON public.xp_events
  FOR SELECT USING (user_id = auth.uid());

-- Everyone can view achievements
CREATE POLICY "Everyone can view achievements" ON public.achievements
  FOR SELECT USING (true);

-- Users can view their own achievements
CREATE POLICY "Users can view their own achievements" ON public.user_achievements
  FOR SELECT USING (user_id = auth.uid());

-- Everyone can view leaderboards
CREATE POLICY "Everyone can view leaderboard periods" ON public.leaderboard_periods
  FOR SELECT USING (true);

CREATE POLICY "Everyone can view leaderboard entries" ON public.leaderboard_entries
  FOR SELECT USING (true);

-- Everyone can view XP config (transparency)
CREATE POLICY "Everyone can view XP config" ON public.xp_config
  FOR SELECT USING (true);

-- Admins can manage everything
CREATE POLICY "Admins can manage XP events" ON public.xp_events
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can manage achievements" ON public.achievements
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Comments
COMMENT ON TABLE public.xp_events IS 'XP events and point tracking for gamification';
COMMENT ON TABLE public.achievements IS 'Achievement definitions with criteria and rewards';
COMMENT ON TABLE public.user_achievements IS 'User progress and earned achievements';
COMMENT ON FUNCTION award_xp IS 'Awards XP to users for various actions';
COMMENT ON FUNCTION check_user_achievements IS 'Checks and awards achievements based on user activity';
COMMENT ON FUNCTION get_enhanced_leaderboard IS 'Returns enhanced leaderboard with engagement metrics';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '=== GAMIFICATION SYSTEM V1 IMPLEMENTED ===';
  RAISE NOTICE 'Features: XP system, achievements, badges, leaderboards, streaks, levels';
  RAISE NOTICE 'Automatic XP awarding for deals, comments, votes with achievement checking';
  RAISE NOTICE 'Progressive leveling system with 25+ default achievements';
END $$;
