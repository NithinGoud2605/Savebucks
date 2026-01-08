-- Remove auto_expire column and update related functions
-- This migration removes the auto_expire functionality and simplifies expiration handling

-- Drop the auto_expire column from deals table
ALTER TABLE public.deals DROP COLUMN IF EXISTS auto_expire;

-- Update the auto_expire_deals function to remove auto_expire dependency
CREATE OR REPLACE FUNCTION auto_expire_deals()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  expired_count INTEGER := 0;
BEGIN
  -- Update deals that have passed their expiration time
  UPDATE public.deals 
  SET 
    status = 'expired',
    updated_at = NOW()
  WHERE 
    expires_at IS NOT NULL 
    AND expires_at <= NOW() 
    AND status NOT IN ('expired', 'deleted', 'rejected');
  
  GET DIAGNOSTICS expired_count = ROW_COUNT;
  
  RETURN expired_count;
END;
$$;

-- Update the get_deal_expiration_info function to remove auto_expire dependency
CREATE OR REPLACE FUNCTION get_deal_expiration_info(deal_id_param BIGINT)
RETURNS TABLE (
  expires_at TIMESTAMPTZ,
  time_remaining INTERVAL,
  deal_status TEXT,
  urgency INTEGER
)
LANGUAGE plpgsql
AS $$
DECLARE
  deal_expires TIMESTAMPTZ;
  remaining INTERVAL;
  deal_status TEXT;
  urgency INTEGER := 0;
BEGIN
  -- Get expiration time
  SELECT d.expires_at INTO deal_expires
  FROM public.deals d
  WHERE d.id = deal_id_param;
  
  IF deal_expires IS NULL THEN
    -- No expiration set
    RETURN QUERY SELECT NULL::TIMESTAMPTZ, NULL::INTERVAL, 'no_expiration'::TEXT, 0;
    RETURN;
  END IF;
  
  remaining := deal_expires - NOW();
  
  IF remaining <= INTERVAL '0' THEN
    deal_status := 'expired';
    urgency := 0;
  ELSIF remaining <= INTERVAL '1 hour' THEN
    deal_status := 'ending_soon';
    urgency := 5; -- Critical
  ELSIF remaining <= INTERVAL '6 hours' THEN
    deal_status := 'ending_today';
    urgency := 4; -- High
  ELSIF remaining <= INTERVAL '1 day' THEN
    deal_status := 'ending_tomorrow';
    urgency := 3; -- Medium
  ELSIF remaining <= INTERVAL '3 days' THEN
    deal_status := 'ending_this_week';
    urgency := 2; -- Low
  ELSE
    deal_status := 'active';
    urgency := 1; -- Very low
  END IF;
  
  RETURN QUERY SELECT deal_expires, remaining, deal_status, urgency;
END;
$$;

-- Comments
COMMENT ON FUNCTION auto_expire_deals IS 'Automatically expires deals that have passed their expiration time (simplified version without auto_expire column)';
COMMENT ON FUNCTION get_deal_expiration_info IS 'Returns expiration information for a deal including time remaining and urgency level';














