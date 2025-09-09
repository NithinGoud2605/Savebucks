-- Auto-expiration system for deals and coupons
-- This system automatically removes or marks expired deals/coupons

-- Function to handle expired deals and coupons
CREATE OR REPLACE FUNCTION handle_expired_items()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  expired_deals_count INTEGER := 0;
  expired_coupons_count INTEGER := 0;
  total_expired INTEGER := 0;
BEGIN
  -- Mark expired deals as 'expired' status (don't delete, just hide from public)
  UPDATE public.deals 
  SET 
    status = 'expired',
    updated_at = NOW()
  WHERE 
    expires_at IS NOT NULL 
    AND expires_at <= NOW() 
    AND status IN ('approved', 'pending');
  
  GET DIAGNOSTICS expired_deals_count = ROW_COUNT;
  
  -- Mark expired coupons as 'expired' status
  UPDATE public.coupons 
  SET 
    status = 'expired',
    updated_at = NOW()
  WHERE 
    expires_at IS NOT NULL 
    AND expires_at <= NOW() 
    AND status IN ('approved', 'pending');
  
  GET DIAGNOSTICS expired_coupons_count = ROW_COUNT;
  
  total_expired := expired_deals_count + expired_coupons_count;
  
  -- Log the expiration activity if any items were expired
  IF total_expired > 0 THEN
    INSERT INTO public.audit_log (
      table_name,
      action,
      old_values,
      new_values,
      user_id,
      created_at
    ) VALUES (
      'system_expiration',
      'bulk_expire',
      jsonb_build_object(
        'expired_deals', expired_deals_count,
        'expired_coupons', expired_coupons_count
      ),
      jsonb_build_object(
        'total_expired', total_expired,
        'timestamp', NOW()
      ),
      NULL, -- System action
      NOW()
    );
    
    -- Also create a system notification for admins
    INSERT INTO public.notifications (
      user_id,
      title,
      message,
      type,
      metadata,
      created_at
    ) 
    SELECT 
      p.id,
      'Items Expired',
      format('System automatically expired %s deals and %s coupons', expired_deals_count, expired_coupons_count),
      'system',
      jsonb_build_object(
        'expired_deals', expired_deals_count,
        'expired_coupons', expired_coupons_count,
        'action', 'auto_expire'
      ),
      NOW()
    FROM public.profiles p
    WHERE p.role = 'admin';
  END IF;
  
  RETURN total_expired;
END;
$$;

-- Drop existing function first to avoid return type conflicts
DROP FUNCTION IF EXISTS get_expiring_soon(INTEGER);

-- Function to get items expiring soon (next 24 hours)
CREATE OR REPLACE FUNCTION get_expiring_soon(hours_ahead INTEGER DEFAULT 24)
RETURNS TABLE(
  item_type TEXT,
  item_id BIGINT,
  title TEXT,
  expires_at TIMESTAMPTZ,
  hours_until_expiry NUMERIC,
  company_name TEXT,
  submitter_handle TEXT
)
LANGUAGE plpgsql
AS $$
DECLARE
  expiry_threshold TIMESTAMPTZ;
BEGIN
  expiry_threshold := NOW() + (hours_ahead || ' hours')::INTERVAL;
  
  RETURN QUERY
  -- Get expiring deals
  SELECT 
    'deal'::TEXT as item_type,
    d.id as item_id,
    d.title,
    d.expires_at,
    EXTRACT(EPOCH FROM (d.expires_at - NOW())) / 3600 as hours_until_expiry,
    COALESCE(c.name, d.merchant) as company_name,
    p.handle as submitter_handle
  FROM public.deals d
  LEFT JOIN public.companies c ON d.company_id = c.id
  LEFT JOIN public.profiles p ON d.submitter_id = p.id
  WHERE 
    d.expires_at IS NOT NULL 
    AND d.expires_at > NOW()
    AND d.expires_at <= expiry_threshold
    AND d.status = 'approved'
  
  UNION ALL
  
  -- Get expiring coupons
  SELECT 
    'coupon'::TEXT as item_type,
    cp.id as item_id,
    cp.title,
    cp.expires_at,
    EXTRACT(EPOCH FROM (cp.expires_at - NOW())) / 3600 as hours_until_expiry,
    c.name as company_name,
    p.handle as submitter_handle
  FROM public.coupons cp
  LEFT JOIN public.companies c ON cp.company_id = c.id
  LEFT JOIN public.profiles p ON cp.submitter_id = p.id
  WHERE 
    cp.expires_at IS NOT NULL 
    AND cp.expires_at > NOW()
    AND cp.expires_at <= expiry_threshold
    AND cp.status = 'approved'
    
  ORDER BY expires_at ASC;
END;
$$;

-- Create a scheduled job to run expiration check (this would typically be handled by a cron job or scheduled task)
-- For now, we create the function that can be called manually or by an external scheduler

-- Drop all versions of cleanup function to avoid conflicts
DROP FUNCTION IF EXISTS cleanup_old_expired_items(INTEGER);
DROP FUNCTION IF EXISTS cleanup_old_expired_items();
DROP FUNCTION IF EXISTS cleanup_old_expired_items CASCADE;

-- Function to clean up very old expired items (optional - removes expired items older than 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_expired_items(days_old INTEGER DEFAULT 30)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  cleanup_threshold TIMESTAMPTZ;
  deleted_deals_count INTEGER := 0;
  deleted_coupons_count INTEGER := 0;
  total_deleted INTEGER := 0;
BEGIN
  cleanup_threshold := NOW() - (days_old || ' days')::INTERVAL;
  
  -- Delete very old expired deals (optional cleanup)
  DELETE FROM public.deals 
  WHERE 
    status = 'expired' 
    AND updated_at <= cleanup_threshold;
  
  GET DIAGNOSTICS deleted_deals_count = ROW_COUNT;
  
  -- Delete very old expired coupons (optional cleanup)
  DELETE FROM public.coupons 
  WHERE 
    status = 'expired' 
    AND updated_at <= cleanup_threshold;
  
  GET DIAGNOSTICS deleted_coupons_count = ROW_COUNT;
  
  total_deleted := deleted_deals_count + deleted_coupons_count;
  
  -- Log cleanup activity
  IF total_deleted > 0 THEN
    INSERT INTO public.audit_log (
      table_name,
      action,
      old_values,
      new_values,
      user_id,
      created_at
    ) VALUES (
      'system_cleanup',
      'bulk_delete',
      jsonb_build_object(
        'deleted_deals', deleted_deals_count,
        'deleted_coupons', deleted_coupons_count,
        'older_than_days', days_old
      ),
      jsonb_build_object(
        'total_deleted', total_deleted,
        'timestamp', NOW()
      ),
      NULL,
      NOW()
    );
  END IF;
  
  RETURN total_deleted;
END;
$$;

-- Update the existing auto_expire_deals function to use the new system
CREATE OR REPLACE FUNCTION auto_expire_deals()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Use the new comprehensive expiration handler
  RETURN handle_expired_items();
END;
$$;

-- Comments for documentation
COMMENT ON FUNCTION handle_expired_items IS 'Automatically marks expired deals and coupons as expired and logs the activity';
COMMENT ON FUNCTION get_expiring_soon IS 'Returns deals and coupons that will expire within the specified hours';
COMMENT ON FUNCTION cleanup_old_expired_items IS 'Permanently removes expired items older than specified days (optional cleanup)';
COMMENT ON FUNCTION auto_expire_deals IS 'Legacy function - now uses handle_expired_items for comprehensive expiration handling';
