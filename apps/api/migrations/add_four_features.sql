-- Referral System Database Schema
-- Run this in Supabase SQL Editor

-- Referral codes table
CREATE TABLE IF NOT EXISTS referral_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code VARCHAR(12) UNIQUE NOT NULL,
  uses_count INTEGER DEFAULT 0,
  max_uses INTEGER DEFAULT NULL, -- NULL = unlimited
  reward_per_referral INTEGER DEFAULT 100, -- Points/credits
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NULL
);

-- Referral tracking table
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referral_code_id UUID REFERENCES referral_codes(id) ON DELETE SET NULL,
  status VARCHAR(20) DEFAULT 'pending', -- pending, completed, rewarded
  referrer_reward INTEGER DEFAULT 0,
  referred_reward INTEGER DEFAULT 0,
  completed_at TIMESTAMPTZ,
  rewarded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(referred_id) -- Each user can only be referred once
);

-- Comment reactions table
CREATE TABLE IF NOT EXISTS comment_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reaction VARCHAR(20) NOT NULL, -- like, love, laugh, fire, sad
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(comment_id, user_id, reaction)
);

-- User analytics aggregates (for dashboard)
CREATE TABLE IF NOT EXISTS user_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  deals_posted INTEGER DEFAULT 0,
  deals_approved INTEGER DEFAULT 0,
  upvotes_received INTEGER DEFAULT 0,
  downvotes_received INTEGER DEFAULT 0,
  comments_made INTEGER DEFAULT 0,
  saves_received INTEGER DEFAULT 0,
  views_received INTEGER DEFAULT 0,
  karma_earned INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_referral_codes_user_id ON referral_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_referral_codes_code ON referral_codes(code);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred_id ON referrals(referred_id);
CREATE INDEX IF NOT EXISTS idx_comment_reactions_comment_id ON comment_reactions(comment_id);
CREATE INDEX IF NOT EXISTS idx_user_analytics_user_date ON user_analytics(user_id, date);

-- RLS Policies
ALTER TABLE referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_analytics ENABLE ROW LEVEL SECURITY;

-- Referral codes: users can see their own
CREATE POLICY "Users can view own referral codes"
  ON referral_codes FOR SELECT USING (auth.uid() = user_id);
  
CREATE POLICY "Users can create own referral codes"
  ON referral_codes FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Anyone can look up a referral code (for signup validation)
CREATE POLICY "Anyone can lookup referral codes by code"
  ON referral_codes FOR SELECT USING (true);

-- Referrals: users can see referrals they made
CREATE POLICY "Users can view own referrals"
  ON referrals FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

-- Comment reactions: anyone can see, users can add their own
CREATE POLICY "Anyone can view reactions"
  ON comment_reactions FOR SELECT USING (true);
  
CREATE POLICY "Users can add own reactions"
  ON comment_reactions FOR INSERT WITH CHECK (auth.uid() = user_id);
  
CREATE POLICY "Users can remove own reactions"
  ON comment_reactions FOR DELETE USING (auth.uid() = user_id);

-- User analytics: users can see their own
CREATE POLICY "Users can view own analytics"
  ON user_analytics FOR SELECT USING (auth.uid() = user_id);

-- Service role full access
CREATE POLICY "Service role full access referral_codes"
  ON referral_codes FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
  
CREATE POLICY "Service role full access referrals"
  ON referrals FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
  
CREATE POLICY "Service role full access comment_reactions"
  ON comment_reactions FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
  
CREATE POLICY "Service role full access user_analytics"
  ON user_analytics FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

COMMENT ON TABLE referral_codes IS 'Unique referral codes for users to invite friends';
COMMENT ON TABLE referrals IS 'Tracks successful referrals and rewards';
COMMENT ON TABLE comment_reactions IS 'Emoji reactions on comments';
COMMENT ON TABLE user_analytics IS 'Daily aggregated analytics per user for dashboard';
