-- Comprehensive Saved Searches + Follow System with Push Alerts
-- This creates a powerful user engagement system with personalized notifications

-- Enhanced follows table with search queries and thresholds
CREATE TABLE IF NOT EXISTS public.saved_searches (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- User-friendly name for the search
  search_type TEXT NOT NULL CHECK (search_type IN ('keyword', 'merchant', 'category', 'advanced')),
  
  -- Search parameters
  query_text TEXT, -- For keyword searches
  merchant_domain TEXT, -- For merchant follows
  category_id BIGINT REFERENCES public.categories(id), -- For category follows
  
  -- Advanced search parameters (JSON)
  filters JSONB DEFAULT '{}', -- Price range, tags, etc.
  
  -- Alert settings
  alert_enabled BOOLEAN DEFAULT TRUE,
  alert_frequency TEXT DEFAULT 'immediate' CHECK (alert_frequency IN ('immediate', 'daily', 'weekly')),
  price_threshold DECIMAL(10,2), -- Only alert if deal is below this price
  discount_threshold INTEGER, -- Only alert if discount % is above this
  
  -- Notification preferences
  push_notifications BOOLEAN DEFAULT TRUE,
  email_notifications BOOLEAN DEFAULT TRUE,
  in_app_notifications BOOLEAN DEFAULT TRUE,
  
  -- Metadata
  last_triggered_at TIMESTAMPTZ,
  total_matches INTEGER DEFAULT 0,
  total_notifications_sent INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, name) -- Prevent duplicate search names per user
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_saved_searches_user_id ON public.saved_searches(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_searches_type ON public.saved_searches(search_type);
CREATE INDEX IF NOT EXISTS idx_saved_searches_enabled ON public.saved_searches(alert_enabled) WHERE alert_enabled = TRUE;
CREATE INDEX IF NOT EXISTS idx_saved_searches_merchant ON public.saved_searches(merchant_domain) WHERE merchant_domain IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_saved_searches_category ON public.saved_searches(category_id) WHERE category_id IS NOT NULL;

-- Full-text search index for query_text
CREATE INDEX IF NOT EXISTS idx_saved_searches_query_text ON public.saved_searches USING GIN(to_tsvector('english', query_text)) WHERE query_text IS NOT NULL;

-- Notification queue for managing alerts
CREATE TABLE IF NOT EXISTS public.notification_queue (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  saved_search_id BIGINT REFERENCES public.saved_searches(id) ON DELETE CASCADE,
  deal_id BIGINT REFERENCES public.deals(id) ON DELETE CASCADE,
  coupon_id BIGINT REFERENCES public.coupons(id) ON DELETE CASCADE,
  
  notification_type TEXT NOT NULL CHECK (notification_type IN ('push', 'email', 'in_app')),
  priority INTEGER DEFAULT 1 CHECK (priority BETWEEN 1 AND 5), -- 1=low, 5=urgent
  
  -- Notification content
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  action_url TEXT,
  image_url TEXT,
  
  -- Status tracking
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  
  -- Scheduling
  scheduled_for TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for notification queue
CREATE INDEX IF NOT EXISTS idx_notification_queue_user_id ON public.notification_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_queue_status ON public.notification_queue(status);
CREATE INDEX IF NOT EXISTS idx_notification_queue_scheduled ON public.notification_queue(scheduled_for) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_notification_queue_expires ON public.notification_queue(expires_at) WHERE expires_at IS NOT NULL;

-- User notification preferences
CREATE TABLE IF NOT EXISTS public.user_notification_preferences (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Global notification settings
  push_notifications_enabled BOOLEAN DEFAULT TRUE,
  email_notifications_enabled BOOLEAN DEFAULT TRUE,
  in_app_notifications_enabled BOOLEAN DEFAULT TRUE,
  
  -- Frequency limits
  max_daily_notifications INTEGER DEFAULT 10,
  max_weekly_notifications INTEGER DEFAULT 50,
  quiet_hours_start TIME DEFAULT '22:00',
  quiet_hours_end TIME DEFAULT '08:00',
  
  -- Content preferences
  price_drop_alerts BOOLEAN DEFAULT TRUE,
  new_deal_alerts BOOLEAN DEFAULT TRUE,
  deal_expiry_alerts BOOLEAN DEFAULT TRUE,
  followed_merchant_alerts BOOLEAN DEFAULT TRUE,
  followed_category_alerts BOOLEAN DEFAULT TRUE,
  
  -- Device tokens for push notifications
  push_tokens JSONB DEFAULT '[]', -- Array of device tokens
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Function to check if a deal matches saved search criteria
CREATE OR REPLACE FUNCTION check_deal_matches_search(
  deal_row public.deals,
  search_row public.saved_searches
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  matches BOOLEAN := FALSE;
  filter_key TEXT;
  filter_value JSONB;
BEGIN
  -- Check search type specific criteria
  CASE search_row.search_type
    WHEN 'keyword' THEN
      -- Check if deal title or description contains keywords
      IF search_row.query_text IS NOT NULL THEN
        matches := (
          LOWER(deal_row.title) LIKE '%' || LOWER(search_row.query_text) || '%' OR
          LOWER(deal_row.description) LIKE '%' || LOWER(search_row.query_text) || '%'
        );
      END IF;
      
    WHEN 'merchant' THEN
      -- Check if deal is from followed merchant
      IF search_row.merchant_domain IS NOT NULL THEN
        matches := (deal_row.merchant ILIKE '%' || search_row.merchant_domain || '%');
      END IF;
      
    WHEN 'category' THEN
      -- Check if deal is in followed category
      IF search_row.category_id IS NOT NULL THEN
        matches := (deal_row.category_id = search_row.category_id);
      END IF;
      
    WHEN 'advanced' THEN
      -- Check advanced filters from JSON
      matches := TRUE; -- Start with TRUE and filter down
      
      -- Check price range
      IF search_row.filters ? 'min_price' AND deal_row.price IS NOT NULL THEN
        matches := matches AND (deal_row.price >= (search_row.filters->>'min_price')::DECIMAL);
      END IF;
      
      IF search_row.filters ? 'max_price' AND deal_row.price IS NOT NULL THEN
        matches := matches AND (deal_row.price <= (search_row.filters->>'max_price')::DECIMAL);
      END IF;
      
      -- Check discount percentage
      IF search_row.filters ? 'min_discount' AND deal_row.discount_percentage IS NOT NULL THEN
        matches := matches AND (deal_row.discount_percentage >= (search_row.filters->>'min_discount')::INTEGER);
      END IF;
      
      -- Check tags if specified
      IF search_row.filters ? 'tags' THEN
        matches := matches AND EXISTS (
          SELECT 1 FROM public.deal_tags dt
          JOIN public.tags t ON dt.tag_id = t.id
          WHERE dt.deal_id = deal_row.id
          AND t.slug = ANY(
            SELECT jsonb_array_elements_text(search_row.filters->'tags')
          )
        );
      END IF;
  END CASE;
  
  -- Apply threshold filters
  IF matches AND search_row.price_threshold IS NOT NULL AND deal_row.price IS NOT NULL THEN
    matches := matches AND (deal_row.price <= search_row.price_threshold);
  END IF;
  
  IF matches AND search_row.discount_threshold IS NOT NULL AND deal_row.discount_percentage IS NOT NULL THEN
    matches := matches AND (deal_row.discount_percentage >= search_row.discount_threshold);
  END IF;
  
  RETURN matches;
END;
$$;

-- Function to queue notifications for matching deals
CREATE OR REPLACE FUNCTION queue_search_notifications(
  deal_id_param BIGINT,
  notification_type_param TEXT DEFAULT 'new_deal'
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  deal_record public.deals%ROWTYPE;
  search_record public.saved_searches%ROWTYPE;
  pref_record public.user_notification_preferences%ROWTYPE;
  notifications_queued INTEGER := 0;
  notification_title TEXT;
  notification_message TEXT;
  action_url TEXT;
BEGIN
  -- Get deal record
  SELECT * INTO deal_record FROM public.deals WHERE id = deal_id_param;
  IF NOT FOUND THEN
    RETURN 0;
  END IF;
  
  -- Check all active saved searches
  FOR search_record IN 
    SELECT * FROM public.saved_searches 
    WHERE alert_enabled = TRUE 
    AND (
      alert_frequency = 'immediate' OR 
      (alert_frequency = 'daily' AND (last_triggered_at IS NULL OR last_triggered_at < NOW() - INTERVAL '1 day')) OR
      (alert_frequency = 'weekly' AND (last_triggered_at IS NULL OR last_triggered_at < NOW() - INTERVAL '1 week'))
    )
  LOOP
    -- Check if deal matches this search
    IF check_deal_matches_search(deal_record, search_record) THEN
      -- Get user preferences
      SELECT * INTO pref_record 
      FROM public.user_notification_preferences 
      WHERE user_id = search_record.user_id;
      
      -- Create notification content
      notification_title := 'New Deal Alert: ' || search_record.name;
      notification_message := deal_record.title;
      IF deal_record.price IS NOT NULL THEN
        notification_message := notification_message || ' - $' || deal_record.price;
      END IF;
      action_url := '/deal/' || deal_record.id;
      
      -- Queue push notification
      IF search_record.push_notifications AND (pref_record.push_notifications_enabled OR pref_record IS NULL) THEN
        INSERT INTO public.notification_queue (
          user_id, saved_search_id, deal_id, notification_type,
          title, message, action_url, priority,
          expires_at
        ) VALUES (
          search_record.user_id, search_record.id, deal_record.id, 'push',
          notification_title, notification_message, action_url, 2,
          NOW() + INTERVAL '24 hours'
        );
        notifications_queued := notifications_queued + 1;
      END IF;
      
      -- Queue email notification
      IF search_record.email_notifications AND (pref_record.email_notifications_enabled OR pref_record IS NULL) THEN
        INSERT INTO public.notification_queue (
          user_id, saved_search_id, deal_id, notification_type,
          title, message, action_url, priority,
          expires_at
        ) VALUES (
          search_record.user_id, search_record.id, deal_record.id, 'email',
          notification_title, notification_message, action_url, 1,
          NOW() + INTERVAL '7 days'
        );
        notifications_queued := notifications_queued + 1;
      END IF;
      
      -- Queue in-app notification
      IF search_record.in_app_notifications AND (pref_record.in_app_notifications_enabled OR pref_record IS NULL) THEN
        INSERT INTO public.notification_queue (
          user_id, saved_search_id, deal_id, notification_type,
          title, message, action_url, priority,
          expires_at
        ) VALUES (
          search_record.user_id, search_record.id, deal_record.id, 'in_app',
          notification_title, notification_message, action_url, 1,
          NOW() + INTERVAL '30 days'
        );
        notifications_queued := notifications_queued + 1;
      END IF;
      
      -- Update search statistics
      UPDATE public.saved_searches 
      SET 
        last_triggered_at = NOW(),
        total_matches = total_matches + 1,
        total_notifications_sent = total_notifications_sent + 1,
        updated_at = NOW()
      WHERE id = search_record.id;
    END IF;
  END LOOP;
  
  RETURN notifications_queued;
END;
$$;

-- Trigger to automatically check for matching searches when deals are approved
CREATE OR REPLACE FUNCTION trigger_check_saved_searches()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only trigger for newly approved deals
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    PERFORM queue_search_notifications(NEW.id, 'new_deal');
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_deals_saved_searches ON public.deals;
CREATE TRIGGER trigger_deals_saved_searches
  AFTER INSERT OR UPDATE ON public.deals
  FOR EACH ROW
  EXECUTE FUNCTION trigger_check_saved_searches();

-- RLS Policies
ALTER TABLE public.saved_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_notification_preferences ENABLE ROW LEVEL SECURITY;

-- Users can only access their own saved searches
CREATE POLICY "Users can manage their own saved searches" ON public.saved_searches
  FOR ALL USING (user_id = auth.uid());

-- Users can only see their own notifications
CREATE POLICY "Users can see their own notifications" ON public.notification_queue
  FOR SELECT USING (user_id = auth.uid());

-- Admins can manage all notifications
CREATE POLICY "Admins can manage all notifications" ON public.notification_queue
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Users can manage their own notification preferences
CREATE POLICY "Users can manage their own notification preferences" ON public.user_notification_preferences
  FOR ALL USING (user_id = auth.uid());

-- Comments
COMMENT ON TABLE public.saved_searches IS 'User-defined search queries with alert capabilities';
COMMENT ON TABLE public.notification_queue IS 'Queue for managing push, email, and in-app notifications';
COMMENT ON TABLE public.user_notification_preferences IS 'User preferences for notification delivery';
COMMENT ON FUNCTION check_deal_matches_search IS 'Checks if a deal matches saved search criteria';
COMMENT ON FUNCTION queue_search_notifications IS 'Queues notifications for deals matching saved searches';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '=== SAVED SEARCHES + FOLLOW SYSTEM IMPLEMENTED ===';
  RAISE NOTICE 'Features: Keyword/merchant/category searches, advanced filters, notification queue, user preferences';
  RAISE NOTICE 'Automatic matching on deal approval with push/email/in-app alerts';
END $$;
