-- ============================================================================
-- AI Conversations & Messages System
-- SaveBucks.ai Chat History Storage
-- ============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- AI Conversations Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS ai_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT DEFAULT 'New Conversation',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  message_count INTEGER DEFAULT 0,
  is_archived BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Index for user lookup (most common query pattern)
CREATE INDEX IF NOT EXISTS idx_ai_conversations_user 
  ON ai_conversations(user_id, updated_at DESC)
  WHERE is_archived = FALSE;

-- Index for cleanup operations
CREATE INDEX IF NOT EXISTS idx_ai_conversations_archived 
  ON ai_conversations(is_archived, updated_at);

COMMENT ON TABLE ai_conversations IS 'Stores AI chat conversation sessions';
COMMENT ON COLUMN ai_conversations.title IS 'Auto-generated from first message or user-provided';
COMMENT ON COLUMN ai_conversations.metadata IS 'Additional data like context, preferences';

-- ============================================================================
-- AI Messages Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS ai_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES ai_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system', 'tool')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  tokens_used INTEGER,
  latency_ms INTEGER,
  model_used TEXT,
  tool_calls JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fetching conversation messages
CREATE INDEX IF NOT EXISTS idx_ai_messages_conversation 
  ON ai_messages(conversation_id, created_at);

-- Index for analytics queries
CREATE INDEX IF NOT EXISTS idx_ai_messages_created 
  ON ai_messages(created_at DESC);

COMMENT ON TABLE ai_messages IS 'Individual messages within AI conversations';
COMMENT ON COLUMN ai_messages.role IS 'Message role: user, assistant, system, or tool';
COMMENT ON COLUMN ai_messages.metadata IS 'Feedback, tool results, deal IDs shown, etc.';
COMMENT ON COLUMN ai_messages.tool_calls IS 'Function calls made by the assistant';

-- ============================================================================
-- AI Usage Logs Table (Analytics)
-- ============================================================================

CREATE TABLE IF NOT EXISTS ai_usage_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  conversation_id UUID REFERENCES ai_conversations(id) ON DELETE SET NULL,
  query TEXT NOT NULL,
  intent TEXT,
  complexity TEXT,
  model_used TEXT,
  tokens_input INTEGER,
  tokens_output INTEGER,
  estimated_cost DECIMAL(10, 6),
  latency_ms INTEGER,
  cache_hit BOOLEAN DEFAULT FALSE,
  tools_used TEXT[],
  success BOOLEAN DEFAULT TRUE,
  error_code TEXT,
  error_message TEXT,
  ip_hash TEXT, -- Hashed IP for rate limiting analytics
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for time-based analytics
CREATE INDEX IF NOT EXISTS idx_ai_usage_created 
  ON ai_usage_logs(created_at DESC);

-- Index for user analytics
CREATE INDEX IF NOT EXISTS idx_ai_usage_user 
  ON ai_usage_logs(user_id, created_at DESC)
  WHERE user_id IS NOT NULL;

-- Index for cost tracking
CREATE INDEX IF NOT EXISTS idx_ai_usage_cost 
  ON ai_usage_logs(created_at, estimated_cost)
  WHERE estimated_cost > 0;

COMMENT ON TABLE ai_usage_logs IS 'Analytics for AI usage, costs, and performance';

-- ============================================================================
-- Row Level Security
-- ============================================================================

ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage_logs ENABLE ROW LEVEL SECURITY;

-- Conversations: Users can only see their own
CREATE POLICY "Users can view own conversations" ON ai_conversations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own conversations" ON ai_conversations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conversations" ON ai_conversations
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own conversations" ON ai_conversations
  FOR DELETE USING (auth.uid() = user_id);

-- Messages: Users can see messages in their conversations
CREATE POLICY "Users can view messages in own conversations" ON ai_messages
  FOR SELECT USING (
    conversation_id IN (
      SELECT id FROM ai_conversations WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create messages in own conversations" ON ai_messages
  FOR INSERT WITH CHECK (
    conversation_id IN (
      SELECT id FROM ai_conversations WHERE user_id = auth.uid()
    )
  );

-- Usage logs: Only admins can see (service role has full access)
CREATE POLICY "Admins can view usage logs" ON ai_usage_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- Helper Functions
-- ============================================================================

-- Function to auto-update conversation updated_at and message_count
CREATE OR REPLACE FUNCTION update_conversation_on_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE ai_conversations
  SET 
    updated_at = NOW(),
    message_count = message_count + 1,
    title = CASE 
      WHEN title = 'New Conversation' AND NEW.role = 'user' 
      THEN LEFT(NEW.content, 50) || CASE WHEN LENGTH(NEW.content) > 50 THEN '...' ELSE '' END
      ELSE title
    END
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for message insert
DROP TRIGGER IF EXISTS trigger_update_conversation_on_message ON ai_messages;
CREATE TRIGGER trigger_update_conversation_on_message
  AFTER INSERT ON ai_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_on_message();

-- Function to clean up old conversations (for scheduled job)
CREATE OR REPLACE FUNCTION cleanup_old_ai_conversations(days_old INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete archived conversations older than threshold
  WITH deleted AS (
    DELETE FROM ai_conversations
    WHERE is_archived = TRUE 
      AND updated_at < NOW() - (days_old || ' days')::INTERVAL
    RETURNING id
  )
  SELECT COUNT(*) INTO deleted_count FROM deleted;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get conversation summary for API
CREATE OR REPLACE FUNCTION get_ai_conversation_with_messages(conv_id UUID, user_uuid UUID)
RETURNS TABLE (
  conversation JSONB,
  messages JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (
      SELECT to_jsonb(c.*)
      FROM ai_conversations c
      WHERE c.id = conv_id AND c.user_id = user_uuid
    ) AS conversation,
    (
      SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
          'id', m.id,
          'role', m.role,
          'content', m.content,
          'created_at', m.created_at,
          'metadata', m.metadata
        ) ORDER BY m.created_at
      ), '[]'::jsonb)
      FROM ai_messages m
      WHERE m.conversation_id = conv_id
    ) AS messages;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get daily AI usage stats
CREATE OR REPLACE FUNCTION get_ai_usage_stats(start_date DATE DEFAULT CURRENT_DATE - 7, end_date DATE DEFAULT CURRENT_DATE)
RETURNS TABLE (
  date DATE,
  total_queries INTEGER,
  unique_users INTEGER,
  cache_hit_rate DECIMAL,
  avg_latency_ms DECIMAL,
  total_cost DECIMAL,
  top_intents JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    DATE(l.created_at) AS date,
    COUNT(*)::INTEGER AS total_queries,
    COUNT(DISTINCT l.user_id)::INTEGER AS unique_users,
    ROUND(AVG(CASE WHEN l.cache_hit THEN 1 ELSE 0 END) * 100, 2) AS cache_hit_rate,
    ROUND(AVG(l.latency_ms), 0) AS avg_latency_ms,
    ROUND(SUM(COALESCE(l.estimated_cost, 0)), 4) AS total_cost,
    (
      SELECT jsonb_object_agg(intent, cnt)
      FROM (
        SELECT intent, COUNT(*) as cnt
        FROM ai_usage_logs 
        WHERE DATE(created_at) = DATE(l.created_at)
          AND intent IS NOT NULL
        GROUP BY intent
        ORDER BY cnt DESC
        LIMIT 5
      ) top
    ) AS top_intents
  FROM ai_usage_logs l
  WHERE DATE(l.created_at) BETWEEN start_date AND end_date
  GROUP BY DATE(l.created_at)
  ORDER BY date DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_ai_conversation_with_messages TO authenticated;
GRANT EXECUTE ON FUNCTION get_ai_usage_stats TO authenticated;

-- ============================================================================
-- Done
-- ============================================================================

SELECT 'AI Conversations System installed successfully' AS status;
