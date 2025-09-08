-- Fix views and clicks tracking schema issues
-- This migration ensures consistent column names and working tracking

-- First, let's check what columns exist and fix any inconsistencies
DO $$
BEGIN
  -- Check if view_count exists but views_count doesn't
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'deals' AND column_name = 'view_count') 
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'deals' AND column_name = 'views_count') THEN
    -- Rename view_count to views_count
    ALTER TABLE deals RENAME COLUMN view_count TO views_count;
  END IF;
  
  -- Ensure views_count and clicks_count exist with proper defaults
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'deals' AND column_name = 'views_count') THEN
    ALTER TABLE deals ADD COLUMN views_count INTEGER DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'deals' AND column_name = 'clicks_count') THEN
    ALTER TABLE deals ADD COLUMN clicks_count INTEGER DEFAULT 0;
  END IF;
  
  -- Ensure coupons have the same columns
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'coupons' AND column_name = 'views_count') THEN
    ALTER TABLE coupons ADD COLUMN views_count INTEGER DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'coupons' AND column_name = 'clicks_count') THEN
    ALTER TABLE coupons ADD COLUMN clicks_count INTEGER DEFAULT 0;
  END IF;
END $$;

-- Update any NULL values to 0
UPDATE deals SET views_count = 0 WHERE views_count IS NULL;
UPDATE deals SET clicks_count = 0 WHERE clicks_count IS NULL;
UPDATE coupons SET views_count = 0 WHERE views_count IS NULL;
UPDATE coupons SET clicks_count = 0 WHERE clicks_count IS NULL;

-- Drop existing function first to avoid parameter name conflicts
DROP FUNCTION IF EXISTS increment_deal_views(BIGINT);
DROP FUNCTION IF EXISTS increment_deal_views(deal_id_param BIGINT);

-- Create the increment_deal_views function with correct column name
CREATE OR REPLACE FUNCTION increment_deal_views(deal_id BIGINT)
RETURNS VOID AS $$
BEGIN
  UPDATE deals 
  SET views_count = COALESCE(views_count, 0) + 1
  WHERE id = deal_id;
END;
$$ LANGUAGE plpgsql;

-- Drop existing coupon functions to avoid conflicts
DROP FUNCTION IF EXISTS increment_coupon_views(BIGINT);
DROP FUNCTION IF EXISTS increment_coupon_views(coupon_id_param BIGINT);

-- Create or replace the increment_coupon_views function
CREATE OR REPLACE FUNCTION increment_coupon_views(coupon_id BIGINT)
RETURNS VOID AS $$
BEGIN
  UPDATE coupons 
  SET views_count = COALESCE(views_count, 0) + 1
  WHERE id = coupon_id;
END;
$$ LANGUAGE plpgsql;

-- Drop existing click functions to avoid conflicts
DROP FUNCTION IF EXISTS increment_deal_clicks(BIGINT);
DROP FUNCTION IF EXISTS increment_coupon_clicks(BIGINT);

-- Create function to increment deal clicks
CREATE OR REPLACE FUNCTION increment_deal_clicks(deal_id BIGINT)
RETURNS VOID AS $$
BEGIN
  UPDATE deals 
  SET clicks_count = COALESCE(clicks_count, 0) + 1
  WHERE id = deal_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to increment coupon clicks
CREATE OR REPLACE FUNCTION increment_coupon_clicks(coupon_id BIGINT)
RETURNS VOID AS $$
BEGIN
  UPDATE coupons 
  SET clicks_count = COALESCE(clicks_count, 0) + 1
  WHERE id = coupon_id;
END;
$$ LANGUAGE plpgsql;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_deals_views_count ON deals(views_count);
CREATE INDEX IF NOT EXISTS idx_deals_clicks_count ON deals(clicks_count);
CREATE INDEX IF NOT EXISTS idx_coupons_views_count ON coupons(views_count);
CREATE INDEX IF NOT EXISTS idx_coupons_clicks_count ON coupons(clicks_count);

-- Fix user_sessions table structure to match API expectations
-- Drop existing table if it exists with wrong structure
DROP TABLE IF EXISTS user_sessions CASCADE;

-- Create user_sessions table with correct structure for API
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  current_page TEXT DEFAULT 'unknown',
  user_agent TEXT DEFAULT 'unknown',
  ip_address INET,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id) -- This allows upsert on user_id
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_last_seen ON user_sessions(last_seen);

-- Create analytics_events table if it doesn't exist
CREATE TABLE IF NOT EXISTS analytics_events (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  event_name TEXT NOT NULL,
  properties JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for analytics
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_name ON analytics_events(event_name);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events(created_at);

-- Success message
SELECT 'Views and clicks tracking schema fixed successfully!' as status;
