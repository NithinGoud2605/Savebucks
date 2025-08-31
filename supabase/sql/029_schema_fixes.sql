-- Schema Fixes for API Issues
-- Fixes identified issues from API testing

-- Fix 1: Add missing notification_methods column to price_alerts table
ALTER TABLE public.price_alerts ADD COLUMN IF NOT EXISTS notification_methods TEXT[] DEFAULT ARRAY['email', 'push'];

-- Fix 2: Add missing achievement_notifications column to user_notification_preferences table
ALTER TABLE public.user_notification_preferences ADD COLUMN IF NOT EXISTS achievement_notifications BOOLEAN DEFAULT TRUE;

-- Fix 3: Add missing weekly_digest column to user_notification_preferences table
ALTER TABLE public.user_notification_preferences ADD COLUMN IF NOT EXISTS weekly_digest BOOLEAN DEFAULT TRUE;

-- Fix 4: Update saved_searches search_type enum to include 'deals' and 'coupons'
ALTER TABLE public.saved_searches DROP CONSTRAINT IF EXISTS saved_searches_search_type_check;
ALTER TABLE public.saved_searches ADD CONSTRAINT saved_searches_search_type_check 
  CHECK (search_type IN ('keyword', 'merchant', 'category', 'advanced', 'deals', 'coupons'));

-- Fix 5: Create a view for notifications with proper joins
CREATE OR REPLACE VIEW public.notification_queue_with_details AS
SELECT 
  nq.id,
  nq.user_id,
  nq.saved_search_id,
  nq.deal_id,
  nq.coupon_id,
  nq.notification_type,
  nq.priority,
  nq.title,
  nq.message,
  nq.action_url,
  nq.image_url,
  nq.status,
  nq.sent_at,
  nq.scheduled_for,
  nq.created_at,
  -- Deal details
  d.id as deal_detail_id,
  d.title as deal_title,
  d.price as deal_price,
  -- Coupon details  
  c.id as coupon_detail_id,
  c.title as coupon_title,
  c.coupon_code as coupon_code,
  -- Saved search details
  ss.id as saved_search_detail_id,
  ss.name as saved_search_name,
  -- User details
  p.handle as user_handle
FROM public.notification_queue nq
LEFT JOIN public.deals d ON nq.deal_id = d.id
LEFT JOIN public.coupons c ON nq.coupon_id = c.id
LEFT JOIN public.saved_searches ss ON nq.saved_search_id = ss.id
LEFT JOIN public.profiles p ON nq.user_id = p.id;

-- Fix 6: Update notification functions to use correct column names
CREATE OR REPLACE FUNCTION get_user_notifications(
  user_id_param UUID,
  limit_param INTEGER DEFAULT 10,
  offset_param INTEGER DEFAULT 0,
  status_param TEXT DEFAULT NULL
)
RETURNS TABLE (
  id BIGINT,
  title TEXT,
  message TEXT,
  action_url TEXT,
  image_url TEXT,
  priority INTEGER,
  notification_type TEXT,
  status TEXT,
  sent_at TIMESTAMPTZ,
  scheduled_for TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  deal JSONB,
  coupon JSONB,
  saved_search JSONB,
  "user" JSONB
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    nq.id,
    nq.title,
    nq.message,
    nq.action_url,
    nq.image_url,
    nq.priority,
    nq.notification_type,
    nq.status,
    nq.sent_at,
    nq.scheduled_for,
    nq.created_at,
    CASE 
      WHEN nq.deal_id IS NOT NULL THEN 
        jsonb_build_object(
          'id', d.id,
          'title', d.title,
          'price', d.price
        )
      ELSE NULL 
    END as deal,
    CASE 
      WHEN nq.coupon_id IS NOT NULL THEN 
        jsonb_build_object(
          'id', c.id,
          'title', c.title,
          'code', c.coupon_code
        )
      ELSE NULL 
    END as coupon,
    CASE 
      WHEN nq.saved_search_id IS NOT NULL THEN 
        jsonb_build_object(
          'id', ss.id,
          'name', ss.name
        )
      ELSE NULL 
    END as saved_search,
    jsonb_build_object(
      'handle', p.handle
    ) as "user"
  FROM public.notification_queue nq
  LEFT JOIN public.deals d ON nq.deal_id = d.id
  LEFT JOIN public.coupons c ON nq.coupon_id = c.id
  LEFT JOIN public.saved_searches ss ON nq.saved_search_id = ss.id
  LEFT JOIN public.profiles p ON nq.user_id = p.id
  WHERE nq.user_id = user_id_param
    AND (status_param IS NULL OR nq.status = status_param)
  ORDER BY nq.created_at DESC
  LIMIT limit_param OFFSET offset_param;
END;
$$;

-- Fix 7: Create function to get admin notification queue
CREATE OR REPLACE FUNCTION get_admin_notification_queue(
  limit_param INTEGER DEFAULT 50,
  offset_param INTEGER DEFAULT 0,
  status_param TEXT DEFAULT NULL
)
RETURNS TABLE (
  id BIGINT,
  title TEXT,
  message TEXT,
  action_url TEXT,
  image_url TEXT,
  priority INTEGER,
  notification_type TEXT,
  status TEXT,
  sent_at TIMESTAMPTZ,
  scheduled_for TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  deal JSONB,
  coupon JSONB,
  saved_search JSONB,
  "user" JSONB
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    nq.id,
    nq.title,
    nq.message,
    nq.action_url,
    nq.image_url,
    nq.priority,
    nq.notification_type,
    nq.status,
    nq.sent_at,
    nq.scheduled_for,
    nq.created_at,
    CASE 
      WHEN nq.deal_id IS NOT NULL THEN 
        jsonb_build_object(
          'id', d.id,
          'title', d.title,
          'price', d.price
        )
      ELSE NULL 
    END as deal,
    CASE 
      WHEN nq.coupon_id IS NOT NULL THEN 
        jsonb_build_object(
          'id', c.id,
          'title', c.title,
          'code', c.coupon_code
        )
      ELSE NULL 
    END as coupon,
    CASE 
      WHEN nq.saved_search_id IS NOT NULL THEN 
        jsonb_build_object(
          'id', ss.id,
          'name', ss.name
        )
      ELSE NULL 
    END as saved_search,
    jsonb_build_object(
      'handle', p.handle
    ) as "user"
  FROM public.notification_queue nq
  LEFT JOIN public.deals d ON nq.deal_id = d.id
  LEFT JOIN public.coupons c ON nq.coupon_id = c.id
  LEFT JOIN public.saved_searches ss ON nq.saved_search_id = ss.id
  LEFT JOIN public.profiles p ON nq.user_id = p.id
  WHERE (status_param IS NULL OR nq.status = status_param)
  ORDER BY nq.created_at DESC
  LIMIT limit_param OFFSET offset_param;
END;
$$;

-- Fix 8: Add indexes for the new columns
CREATE INDEX IF NOT EXISTS idx_price_alerts_notification_methods ON public.price_alerts USING GIN(notification_methods);
CREATE INDEX IF NOT EXISTS idx_user_notification_preferences_achievement ON public.user_notification_preferences(achievement_notifications) WHERE achievement_notifications = TRUE;
CREATE INDEX IF NOT EXISTS idx_user_notification_preferences_weekly_digest ON public.user_notification_preferences(weekly_digest) WHERE weekly_digest = TRUE;

-- Fix 9: Grant permissions on the new view and functions
GRANT SELECT ON public.notification_queue_with_details TO authenticated;

-- Fix 10: Create updated trigger function for price alerts with notification methods
CREATE OR REPLACE FUNCTION check_price_alerts_with_methods(deal_id_param BIGINT)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  alert_record public.price_alerts%ROWTYPE;
  deal_record public.deals%ROWTYPE;
  alerts_triggered INTEGER := 0;
  notification_method TEXT;
BEGIN
  -- Get current deal data
  SELECT * INTO deal_record FROM public.deals WHERE id = deal_id_param;
  IF NOT FOUND THEN
    RETURN 0;
  END IF;
  
  -- Check all active alerts for this deal
  FOR alert_record IN 
    SELECT * FROM public.price_alerts 
    WHERE deal_id = deal_id_param AND is_active = TRUE AND triggered_at IS NULL
  LOOP
    CASE alert_record.alert_type
      WHEN 'price_drop' THEN
        IF deal_record.price IS NOT NULL AND deal_record.price <= alert_record.target_price THEN
          -- Trigger price drop alert for each notification method
          FOREACH notification_method IN ARRAY alert_record.notification_methods
          LOOP
            INSERT INTO public.notification_queue (
              user_id, deal_id, notification_type, priority,
              title, message, action_url
            ) VALUES (
              alert_record.user_id, deal_id_param, notification_method, 3,
              'Price Drop Alert!',
              deal_record.title || ' is now $' || deal_record.price,
              '/deal/' || deal_id_param
            );
          END LOOP;
          
          -- Mark alert as triggered
          UPDATE public.price_alerts SET 
            triggered_at = NOW(),
            is_active = FALSE 
          WHERE id = alert_record.id;
          
          alerts_triggered := alerts_triggered + 1;
        END IF;
        
      WHEN 'back_in_stock' THEN
        IF deal_record.stock_status = 'in_stock' THEN
          -- Trigger back in stock alert for each notification method
          FOREACH notification_method IN ARRAY alert_record.notification_methods
          LOOP
            INSERT INTO public.notification_queue (
              user_id, deal_id, notification_type, priority,
              title, message, action_url
            ) VALUES (
              alert_record.user_id, deal_id_param, notification_method, 4,
              'Back in Stock!',
              deal_record.title || ' is available again',
              '/deal/' || deal_id_param
            );
          END LOOP;
          
          -- Mark alert as triggered
          UPDATE public.price_alerts SET 
            triggered_at = NOW(),
            is_active = FALSE 
          WHERE id = alert_record.id;
          
          alerts_triggered := alerts_triggered + 1;
        END IF;
    END CASE;
  END LOOP;
  
  RETURN alerts_triggered;
END;
$$;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '=== SCHEMA FIXES APPLIED ===';
  RAISE NOTICE 'Fixed: notification_methods column, achievement_notifications column, search_type enum, notification queries';
  RAISE NOTICE 'Added: proper notification functions with correct column references';
END $$;
