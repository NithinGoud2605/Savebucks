-- Navbar dynamic data functions
-- This file creates functions to provide real-time data for the navbar

-- Function to get trending categories
CREATE OR REPLACE FUNCTION get_trending_categories()
RETURNS TABLE (
  category_id UUID,
  category_name TEXT,
  deal_count BIGINT,
  trend_score NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id as category_id,
    c.name as category_name,
    COUNT(d.id) as deal_count,
    (COUNT(d.id) * 0.7 + COALESCE(AVG(d.upvotes - d.downvotes), 0) * 0.3) as trend_score
  FROM categories c
  LEFT JOIN deals d ON d.category_id = c.id 
    AND d.status = 'approved' 
    AND d.created_at > NOW() - INTERVAL '7 days'
  GROUP BY c.id, c.name
  HAVING COUNT(d.id) > 0
  ORDER BY trend_score DESC, deal_count DESC
  LIMIT 10;
END;
$$ LANGUAGE plpgsql;

-- Function to get navbar stats
CREATE OR REPLACE FUNCTION get_navbar_stats()
RETURNS TABLE (
  total_deals BIGINT,
  users_online BIGINT,
  total_views BIGINT,
  total_saves BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM deals WHERE status = 'approved') as total_deals,
    (SELECT COUNT(DISTINCT user_id) FROM user_sessions WHERE last_seen > NOW() - INTERVAL '15 minutes') as users_online,
    (SELECT COALESCE(SUM(view_count), 0) FROM deals WHERE status = 'approved') as total_views,
    (SELECT COUNT(*) FROM saved_deals) as total_saves;
END;
$$ LANGUAGE plpgsql;

-- Function to get trending categories with counts
CREATE OR REPLACE FUNCTION get_trending_categories_with_counts()
RETURNS TABLE (
  id UUID,
  name TEXT,
  slug TEXT,
  deal_count BIGINT,
  recent_count BIGINT,
  trending_score NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.name,
    c.slug,
    COUNT(d.id) as deal_count,
    COUNT(CASE WHEN d.created_at > NOW() - INTERVAL '24 hours' THEN 1 END) as recent_count,
    (
      COUNT(d.id) * 0.4 + 
      COUNT(CASE WHEN d.created_at > NOW() - INTERVAL '24 hours' THEN 1 END) * 0.3 +
      COALESCE(AVG(d.upvotes - d.downvotes), 0) * 0.3
    ) as trending_score
  FROM categories c
  LEFT JOIN deals d ON d.category_id = c.id AND d.status = 'approved'
  GROUP BY c.id, c.name, c.slug
  ORDER BY trending_score DESC, deal_count DESC;
END;
$$ LANGUAGE plpgsql;

-- Create user_sessions table for tracking online users
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(session_id)
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_user_sessions_last_seen ON user_sessions(last_seen);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);

-- Function to update user session
CREATE OR REPLACE FUNCTION update_user_session(
  p_user_id UUID DEFAULT NULL,
  p_session_id TEXT DEFAULT NULL,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO user_sessions (user_id, session_id, last_seen, ip_address, user_agent)
  VALUES (p_user_id, p_session_id, NOW(), p_ip_address, p_user_agent)
  ON CONFLICT (session_id) 
  DO UPDATE SET 
    user_id = EXCLUDED.user_id,
    last_seen = NOW(),
    ip_address = EXCLUDED.ip_address,
    user_agent = EXCLUDED.user_agent;
END;
$$ LANGUAGE plpgsql;

-- Function to clean old sessions (run periodically)
CREATE OR REPLACE FUNCTION cleanup_old_sessions()
RETURNS VOID AS $$
BEGIN
  DELETE FROM user_sessions 
  WHERE last_seen < NOW() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql;

-- Add view_count to deals table if it doesn't exist
ALTER TABLE deals ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;

-- Create saved_deals table if it doesn't exist
CREATE TABLE IF NOT EXISTS saved_deals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  deal_id BIGINT NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, deal_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_saved_deals_user_id ON saved_deals(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_deals_deal_id ON saved_deals(deal_id);
CREATE INDEX IF NOT EXISTS idx_deals_view_count ON deals(view_count);
CREATE INDEX IF NOT EXISTS idx_deals_status_created ON deals(status, created_at);

-- Function to increment deal view count
CREATE OR REPLACE FUNCTION increment_deal_views(deal_id BIGINT)
RETURNS VOID AS $$
BEGIN
  UPDATE deals 
  SET view_count = COALESCE(view_count, 0) + 1
  WHERE id = deal_id;
END;
$$ LANGUAGE plpgsql;
