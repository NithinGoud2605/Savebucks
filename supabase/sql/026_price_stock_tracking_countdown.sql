-- Internal Price/Stock Tracking with Countdown System
-- Tracks price changes, stock levels, and provides expiration countdowns

-- Price history tracking table
CREATE TABLE IF NOT EXISTS public.deal_price_history (
  id BIGSERIAL PRIMARY KEY,
  deal_id BIGINT NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  
  -- Price data
  price DECIMAL(10,2),
  original_price DECIMAL(10,2),
  discount_amount DECIMAL(10,2),
  discount_percentage INTEGER,
  currency TEXT DEFAULT 'USD',
  
  -- Stock information
  stock_status TEXT DEFAULT 'unknown' CHECK (stock_status IN ('in_stock', 'low_stock', 'out_of_stock', 'unknown')),
  stock_quantity INTEGER,
  stock_level_text TEXT, -- "Only 3 left", "Limited quantity", etc.
  
  -- Source information
  source TEXT DEFAULT 'manual', -- 'manual', 'api', 'scraper', 'user_report'
  source_url TEXT,
  verified BOOLEAN DEFAULT FALSE,
  
  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES public.profiles(id),
  
  -- Prevent duplicate entries for same timestamp
  UNIQUE(deal_id, created_at)
);

-- Indexes for price history
CREATE INDEX IF NOT EXISTS idx_deal_price_history_deal_id ON public.deal_price_history(deal_id);
CREATE INDEX IF NOT EXISTS idx_deal_price_history_created_at ON public.deal_price_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_deal_price_history_price ON public.deal_price_history(price) WHERE price IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_deal_price_history_stock ON public.deal_price_history(stock_status);

-- Deal status tracking enhancements
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS stock_status TEXT DEFAULT 'unknown' CHECK (stock_status IN ('in_stock', 'low_stock', 'out_of_stock', 'unknown'));
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS stock_quantity INTEGER;
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS last_price_check TIMESTAMPTZ;
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS price_trend TEXT DEFAULT 'stable' CHECK (price_trend IN ('rising', 'falling', 'stable', 'volatile'));
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ; -- When deal expires
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS auto_expire BOOLEAN DEFAULT TRUE; -- Auto-expire when time runs out

-- Price alerts table
CREATE TABLE IF NOT EXISTS public.price_alerts (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  deal_id BIGINT NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  
  -- Alert conditions
  target_price DECIMAL(10,2) NOT NULL,
  alert_type TEXT DEFAULT 'price_drop' CHECK (alert_type IN ('price_drop', 'price_rise', 'back_in_stock', 'low_stock')),
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  triggered_at TIMESTAMPTZ,
  notification_sent BOOLEAN DEFAULT FALSE,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, deal_id, alert_type) -- One alert per user per deal per type
);

-- Indexes for price alerts
CREATE INDEX IF NOT EXISTS idx_price_alerts_user_id ON public.price_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_price_alerts_deal_id ON public.price_alerts(deal_id);
CREATE INDEX IF NOT EXISTS idx_price_alerts_active ON public.price_alerts(is_active) WHERE is_active = TRUE;

-- Function to record price/stock changes
CREATE OR REPLACE FUNCTION record_price_change(
  deal_id_param BIGINT,
  new_price DECIMAL(10,2) DEFAULT NULL,
  new_original_price DECIMAL(10,2) DEFAULT NULL,
  new_stock_status TEXT DEFAULT NULL,
  new_stock_quantity INTEGER DEFAULT NULL,
  source_param TEXT DEFAULT 'manual',
  notes_param TEXT DEFAULT NULL
)
RETURNS BIGINT
LANGUAGE plpgsql
AS $$
DECLARE
  history_id BIGINT;
  current_deal public.deals%ROWTYPE;
  price_changed BOOLEAN := FALSE;
  stock_changed BOOLEAN := FALSE;
  discount_pct INTEGER;
  discount_amt DECIMAL(10,2);
BEGIN
  -- Get current deal data
  SELECT * INTO current_deal FROM public.deals WHERE id = deal_id_param;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Deal with ID % not found', deal_id_param;
  END IF;
  
  -- Check if price changed
  IF new_price IS NOT NULL AND (current_deal.price IS NULL OR current_deal.price != new_price) THEN
    price_changed := TRUE;
  END IF;
  
  -- Check if stock changed
  IF new_stock_status IS NOT NULL AND (current_deal.stock_status IS NULL OR current_deal.stock_status != new_stock_status) THEN
    stock_changed := TRUE;
  END IF;
  
  -- Only record if something changed
  IF price_changed OR stock_changed OR source_param != 'manual' THEN
    -- Calculate discount if we have both prices
    IF new_price IS NOT NULL AND new_original_price IS NOT NULL AND new_original_price > 0 THEN
      discount_amt := new_original_price - new_price;
      discount_pct := ROUND(((new_original_price - new_price) / new_original_price * 100)::NUMERIC);
    END IF;
    
    -- Insert price history record
    INSERT INTO public.deal_price_history (
      deal_id, price, original_price, discount_amount, discount_percentage,
      stock_status, stock_quantity, source, notes, created_by
    ) VALUES (
      deal_id_param, new_price, new_original_price, discount_amt, discount_pct,
      new_stock_status, new_stock_quantity, source_param, notes_param, auth.uid()
    ) RETURNING id INTO history_id;
    
    -- Update deal record with latest data
    UPDATE public.deals SET
      price = COALESCE(new_price, price),
      original_price = COALESCE(new_original_price, original_price),
      discount_percentage = COALESCE(discount_pct, discount_percentage),
      discount_amount = COALESCE(discount_amt, discount_amount),
      stock_status = COALESCE(new_stock_status, stock_status),
      stock_quantity = COALESCE(new_stock_quantity, stock_quantity),
      last_price_check = NOW(),
      updated_at = NOW()
    WHERE id = deal_id_param;
    
    -- Update price trend
    PERFORM update_price_trend(deal_id_param);
    
    -- Check and trigger price alerts
    PERFORM check_price_alerts(deal_id_param);
    
    RETURN history_id;
  END IF;
  
  RETURN NULL;
END;
$$;

-- Function to update price trend analysis
CREATE OR REPLACE FUNCTION update_price_trend(deal_id_param BIGINT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  recent_prices DECIMAL(10,2)[];
  trend TEXT := 'stable';
  price_changes INTEGER := 0;
  avg_change DECIMAL(10,2);
BEGIN
  -- Get last 5 price points
  SELECT ARRAY_AGG(price ORDER BY created_at DESC)
  INTO recent_prices
  FROM public.deal_price_history
  WHERE deal_id = deal_id_param AND price IS NOT NULL
  LIMIT 5;
  
  -- Need at least 2 prices to determine trend
  IF array_length(recent_prices, 1) >= 2 THEN
    -- Count direction changes
    FOR i IN 2..array_length(recent_prices, 1) LOOP
      IF recent_prices[i-1] != recent_prices[i] THEN
        price_changes := price_changes + 1;
      END IF;
    END LOOP;
    
    -- Calculate average change
    avg_change := (recent_prices[1] - recent_prices[array_length(recent_prices, 1)]) / array_length(recent_prices, 1);
    
    -- Determine trend
    IF price_changes >= 3 THEN
      trend := 'volatile';
    ELSIF avg_change > 1 THEN
      trend := 'rising';
    ELSIF avg_change < -1 THEN
      trend := 'falling';
    ELSE
      trend := 'stable';
    END IF;
    
    -- Update deal record
    UPDATE public.deals SET price_trend = trend WHERE id = deal_id_param;
  END IF;
  
  RETURN trend;
END;
$$;

-- Function to check and trigger price alerts
CREATE OR REPLACE FUNCTION check_price_alerts(deal_id_param BIGINT)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  alert_record public.price_alerts%ROWTYPE;
  deal_record public.deals%ROWTYPE;
  alerts_triggered INTEGER := 0;
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
          -- Trigger price drop alert
          UPDATE public.price_alerts SET 
            triggered_at = NOW(),
            is_active = FALSE 
          WHERE id = alert_record.id;
          
          -- Queue notification
          INSERT INTO public.notification_queue (
            user_id, deal_id, notification_type, priority,
            title, message, action_url
          ) VALUES (
            alert_record.user_id, deal_id_param, 'push', 3,
            'Price Drop Alert!',
            deal_record.title || ' is now $' || deal_record.price,
            '/deal/' || deal_id_param
          );
          
          alerts_triggered := alerts_triggered + 1;
        END IF;
        
      WHEN 'back_in_stock' THEN
        IF deal_record.stock_status = 'in_stock' THEN
          -- Trigger back in stock alert
          UPDATE public.price_alerts SET 
            triggered_at = NOW(),
            is_active = FALSE 
          WHERE id = alert_record.id;
          
          -- Queue notification
          INSERT INTO public.notification_queue (
            user_id, deal_id, notification_type, priority,
            title, message, action_url
          ) VALUES (
            alert_record.user_id, deal_id_param, 'push', 4,
            'Back in Stock!',
            deal_record.title || ' is available again',
            '/deal/' || deal_id_param
          );
          
          alerts_triggered := alerts_triggered + 1;
        END IF;
    END CASE;
  END LOOP;
  
  RETURN alerts_triggered;
END;
$$;

-- Function to get price history sparkline data
CREATE OR REPLACE FUNCTION get_price_sparkline(
  deal_id_param BIGINT,
  days_back INTEGER DEFAULT 30
)
RETURNS TABLE (
  "timestamp" TIMESTAMPTZ,
  price DECIMAL(10,2),
  stock_status TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    dph.created_at,
    dph.price,
    dph.stock_status
  FROM public.deal_price_history dph
  WHERE dph.deal_id = deal_id_param 
    AND dph.created_at >= NOW() - (days_back || ' days')::INTERVAL
    AND dph.price IS NOT NULL
  ORDER BY dph.created_at ASC;
END;
$$;

-- Function to get deal countdown information
CREATE OR REPLACE FUNCTION get_deal_countdown(deal_id_param BIGINT)
RETURNS TABLE (
  expires_at TIMESTAMPTZ,
  time_remaining INTERVAL,
  status TEXT,
  urgency_level INTEGER
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

-- Function to auto-expire deals
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
    AND status NOT IN ('expired', 'deleted', 'rejected')
    AND auto_expire = TRUE;
  
  GET DIAGNOSTICS expired_count = ROW_COUNT;
  
  RETURN expired_count;
END;
$$;

-- Trigger to automatically record price changes when deals are updated
CREATE OR REPLACE FUNCTION trigger_record_price_change()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only record if price, stock, or expiration changed
  IF (
    (NEW.price IS DISTINCT FROM OLD.price) OR
    (NEW.original_price IS DISTINCT FROM OLD.original_price) OR
    (NEW.stock_status IS DISTINCT FROM OLD.stock_status) OR
    (NEW.stock_quantity IS DISTINCT FROM OLD.stock_quantity)
  ) THEN
    PERFORM record_price_change(
      NEW.id,
      NEW.price,
      NEW.original_price,
      NEW.stock_status,
      NEW.stock_quantity,
      'trigger',
      'Automatic update from deal modification'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_deals_price_change ON public.deals;
CREATE TRIGGER trigger_deals_price_change
  AFTER UPDATE ON public.deals
  FOR EACH ROW
  EXECUTE FUNCTION trigger_record_price_change();

-- RLS Policies
ALTER TABLE public.deal_price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_alerts ENABLE ROW LEVEL SECURITY;

-- Anyone can view price history
CREATE POLICY "Anyone can view price history" ON public.deal_price_history
  FOR SELECT USING (true);

-- Only admins can manage price history
CREATE POLICY "Admins can manage price history" ON public.deal_price_history
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Users can manage their own price alerts
CREATE POLICY "Users can manage their own price alerts" ON public.price_alerts
  FOR ALL USING (user_id = auth.uid());

-- Comments
COMMENT ON TABLE public.deal_price_history IS 'Historical price and stock tracking for deals';
COMMENT ON TABLE public.price_alerts IS 'User-defined price alerts for deals';
COMMENT ON FUNCTION record_price_change IS 'Records price/stock changes and triggers alerts';
COMMENT ON FUNCTION get_price_sparkline IS 'Returns price history data for sparkline charts';
COMMENT ON FUNCTION get_deal_countdown IS 'Returns countdown information for expiring deals';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '=== PRICE/STOCK TRACKING + COUNTDOWN SYSTEM IMPLEMENTED ===';
  RAISE NOTICE 'Features: Price history, stock tracking, sparkline data, countdown timers, auto-expiration';
  RAISE NOTICE 'Automatic price change detection with trend analysis and user alerts';
END $$;
