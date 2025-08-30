-- Expiration handling system
-- This creates functions and triggers to automatically handle expired deals and coupons

-- Function to mark expired deals and coupons
CREATE OR REPLACE FUNCTION mark_expired_items()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  expired_deals_count INTEGER := 0;
  expired_coupons_count INTEGER := 0;
BEGIN
  -- Mark expired deals
  UPDATE public.deals 
  SET status = 'expired',
      updated_at = NOW()
  WHERE status = 'approved' 
    AND expires_at IS NOT NULL 
    AND expires_at <= NOW();
  
  GET DIAGNOSTICS expired_deals_count = ROW_COUNT;
  
  -- Mark expired coupons
  UPDATE public.coupons 
  SET status = 'expired',
      updated_at = NOW()
  WHERE status = 'approved' 
    AND expires_at IS NOT NULL 
    AND expires_at <= NOW();
  
  GET DIAGNOSTICS expired_coupons_count = ROW_COUNT;
  
  -- Log the expiration activity
  IF expired_deals_count > 0 OR expired_coupons_count > 0 THEN
    INSERT INTO public.user_activities (
      user_id,
      activity_type,
      entity_type,
      entity_id,
      metadata,
      created_at
    ) VALUES (
      NULL, -- System action
      'system_expiration',
      'system',
      NULL,
      json_build_object(
        'expired_deals', expired_deals_count,
        'expired_coupons', expired_coupons_count
      ),
      NOW()
    );
  END IF;
  
  RETURN expired_deals_count + expired_coupons_count;
END;
$$;

-- Function to get items expiring soon (next 24 hours)
CREATE OR REPLACE FUNCTION get_expiring_soon(hours_ahead INTEGER DEFAULT 24)
RETURNS TABLE(
  entity_type TEXT,
  entity_id BIGINT,
  title TEXT,
  expires_at TIMESTAMPTZ,
  hours_until_expiry NUMERIC
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    'deal'::TEXT as entity_type,
    d.id as entity_id,
    d.title,
    d.expires_at,
    EXTRACT(EPOCH FROM (d.expires_at - NOW())) / 3600 as hours_until_expiry
  FROM public.deals d
  WHERE d.status = 'approved'
    AND d.expires_at IS NOT NULL
    AND d.expires_at > NOW()
    AND d.expires_at <= NOW() + (hours_ahead || ' hours')::INTERVAL
  
  UNION ALL
  
  SELECT 
    'coupon'::TEXT as entity_type,
    c.id as entity_id,
    c.title,
    c.expires_at,
    EXTRACT(EPOCH FROM (c.expires_at - NOW())) / 3600 as hours_until_expiry
  FROM public.coupons c
  WHERE c.status = 'approved'
    AND c.expires_at IS NOT NULL
    AND c.expires_at > NOW()
    AND c.expires_at <= NOW() + (hours_ahead || ' hours')::INTERVAL
  
  ORDER BY expires_at ASC;
END;
$$;

-- Function to clean up old expired items (older than 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_expired_items()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  deals_cleanup_count INTEGER := 0;
  coupons_cleanup_count INTEGER := 0;
BEGIN
  -- Archive very old expired deals (move to archived status instead of deleting)
  UPDATE public.deals 
  SET status = 'archived',
      updated_at = NOW()
  WHERE status = 'expired' 
    AND updated_at <= NOW() - INTERVAL '30 days';
  
  GET DIAGNOSTICS deals_cleanup_count = ROW_COUNT;
  
  -- Archive very old expired coupons
  UPDATE public.coupons 
  SET status = 'archived',
      updated_at = NOW()
  WHERE status = 'expired' 
    AND updated_at <= NOW() - INTERVAL '30 days';
  
  GET DIAGNOSTICS coupons_cleanup_count = ROW_COUNT;
  
  RETURN deals_cleanup_count + coupons_cleanup_count;
END;
$$;

-- Function to get expiration statistics
CREATE OR REPLACE FUNCTION get_expiration_stats()
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  stats JSON;
BEGIN
  SELECT json_build_object(
    'deals', json_build_object(
      'active', (SELECT COUNT(*) FROM deals WHERE status = 'approved' AND (expires_at IS NULL OR expires_at > NOW())),
      'expired', (SELECT COUNT(*) FROM deals WHERE status = 'expired'),
      'expiring_soon', (SELECT COUNT(*) FROM deals WHERE status = 'approved' AND expires_at IS NOT NULL AND expires_at > NOW() AND expires_at <= NOW() + INTERVAL '24 hours'),
      'no_expiry', (SELECT COUNT(*) FROM deals WHERE status = 'approved' AND expires_at IS NULL)
    ),
    'coupons', json_build_object(
      'active', (SELECT COUNT(*) FROM coupons WHERE status = 'approved' AND (expires_at IS NULL OR expires_at > NOW())),
      'expired', (SELECT COUNT(*) FROM coupons WHERE status = 'expired'),
      'expiring_soon', (SELECT COUNT(*) FROM coupons WHERE status = 'approved' AND expires_at IS NOT NULL AND expires_at > NOW() AND expires_at <= NOW() + INTERVAL '24 hours'),
      'no_expiry', (SELECT COUNT(*) FROM coupons WHERE status = 'approved' AND expires_at IS NULL)
    )
  ) INTO stats;
  
  RETURN stats;
END;
$$;

-- Create a function to send expiration notifications (for future webhook integration)
CREATE OR REPLACE FUNCTION notify_expiring_items()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  notification_count INTEGER := 0;
  expiring_item RECORD;
BEGIN
  -- Get items expiring in the next 2 hours
  FOR expiring_item IN 
    SELECT * FROM get_expiring_soon(2)
    WHERE hours_until_expiry <= 2
  LOOP
    -- Insert notification record (you can extend this to integrate with external notification services)
    INSERT INTO public.user_activities (
      user_id,
      activity_type,
      entity_type,
      entity_id,
      metadata,
      created_at
    ) VALUES (
      NULL, -- System notification
      'expiration_warning',
      expiring_item.entity_type,
      expiring_item.entity_id,
      json_build_object(
        'title', expiring_item.title,
        'expires_at', expiring_item.expires_at,
        'hours_until_expiry', expiring_item.hours_until_expiry
      ),
      NOW()
    );
    
    notification_count := notification_count + 1;
  END LOOP;
  
  RETURN notification_count;
END;
$$;

-- Add indexes for better performance on expiration queries
CREATE INDEX IF NOT EXISTS idx_deals_expires_at_status ON public.deals(expires_at, status) WHERE expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_coupons_expires_at_status ON public.coupons(expires_at, status) WHERE expires_at IS NOT NULL;

-- Add a trigger to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Apply the trigger to deals and coupons if not already exists
DROP TRIGGER IF EXISTS update_deals_updated_at ON public.deals;
CREATE TRIGGER update_deals_updated_at
  BEFORE UPDATE ON public.deals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_coupons_updated_at ON public.coupons;
CREATE TRIGGER update_coupons_updated_at
  BEFORE UPDATE ON public.coupons
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create a view for active (non-expired) deals and coupons
CREATE OR REPLACE VIEW active_deals AS
SELECT *
FROM public.deals
WHERE status = 'approved' 
  AND (expires_at IS NULL OR expires_at > NOW());

CREATE OR REPLACE VIEW active_coupons AS
SELECT *
FROM public.coupons
WHERE status = 'approved' 
  AND (expires_at IS NULL OR expires_at > NOW());

-- Grant permissions for the views
GRANT SELECT ON active_deals TO authenticated;
GRANT SELECT ON active_coupons TO authenticated;

-- Note: RLS cannot be enabled on views in PostgreSQL
-- The views inherit security from the underlying tables

COMMENT ON FUNCTION mark_expired_items() IS 'Marks deals and coupons as expired when their expiry date has passed';
COMMENT ON FUNCTION get_expiring_soon(INTEGER) IS 'Returns deals and coupons that will expire within the specified number of hours';
COMMENT ON FUNCTION cleanup_old_expired_items() IS 'Archives expired items that are older than 30 days';
COMMENT ON FUNCTION get_expiration_stats() IS 'Returns statistics about active, expired, and expiring items';
COMMENT ON FUNCTION notify_expiring_items() IS 'Creates notification records for items expiring soon';

-- Example usage (these would typically be run by a cron job or scheduled task):
-- SELECT mark_expired_items(); -- Mark expired items
-- SELECT get_expiring_soon(24); -- Get items expiring in next 24 hours
-- SELECT cleanup_old_expired_items(); -- Archive old expired items
-- SELECT get_expiration_stats(); -- Get expiration statistics
-- SELECT notify_expiring_items(); -- Send notifications for expiring items
