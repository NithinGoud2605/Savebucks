-- =====================================================
-- INGESTION SYSTEM SCHEMA ENHANCEMENTS
-- Adds required columns and tables for automated deal ingestion
-- =====================================================

-- Add ingestion tracking columns to deals table
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'user';
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS external_id TEXT;
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS source_url TEXT;
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS last_verified_at TIMESTAMPTZ;
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS verification_count INT DEFAULT 0;
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS quality_score DECIMAL(3,2) DEFAULT 0.50;

-- Create composite index for deduplication
CREATE INDEX IF NOT EXISTS idx_deals_source_external_id ON public.deals(source, external_id);
CREATE INDEX IF NOT EXISTS idx_deals_expires_at ON public.deals(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_deals_source ON public.deals(source);

-- Add ingestion columns to coupons table
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'user';
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS external_id TEXT;
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS last_verified_at TIMESTAMPTZ;
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS verification_count INT DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_coupons_source_external_id ON public.coupons(source, external_id);
CREATE INDEX IF NOT EXISTS idx_coupons_source ON public.coupons(source);

-- Add status column to companies if missing
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' 
  CHECK (status IN ('pending', 'approved', 'rejected', 'disabled'));

-- =====================================================
-- INGESTION ERRORS TABLE
-- Logs all processing errors for debugging
-- =====================================================

CREATE TABLE IF NOT EXISTS public.ingestion_errors (
  id BIGSERIAL PRIMARY KEY,
  source TEXT NOT NULL,
  error_type TEXT NOT NULL DEFAULT 'processing',
  error_message TEXT NOT NULL,
  error_stack TEXT,
  context JSONB DEFAULT '{}',
  deal_data JSONB,
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ingestion_errors_source ON public.ingestion_errors(source);
CREATE INDEX IF NOT EXISTS idx_ingestion_errors_created ON public.ingestion_errors(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ingestion_errors_unresolved ON public.ingestion_errors(resolved) WHERE resolved = FALSE;

-- =====================================================
-- INGESTION RUNS TABLE
-- Tracks each ingestion job execution
-- =====================================================

CREATE TABLE IF NOT EXISTS public.ingestion_runs (
  id BIGSERIAL PRIMARY KEY,
  source TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed', 'partial')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  duration_ms INT,
  
  -- Statistics
  items_fetched INT DEFAULT 0,
  items_created INT DEFAULT 0,
  items_updated INT DEFAULT 0,
  items_skipped INT DEFAULT 0,
  items_failed INT DEFAULT 0,
  
  -- Error tracking
  error_message TEXT,
  error_stack TEXT,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_ingestion_runs_source ON public.ingestion_runs(source);
CREATE INDEX IF NOT EXISTS idx_ingestion_runs_status ON public.ingestion_runs(status);
CREATE INDEX IF NOT EXISTS idx_ingestion_runs_started ON public.ingestion_runs(started_at DESC);

-- =====================================================
-- INGESTION STATS VIEW
-- Aggregated statistics for monitoring
-- =====================================================

CREATE OR REPLACE VIEW public.ingestion_stats AS
SELECT 
  -- Last 24 hours
  (SELECT COUNT(*) FROM deals WHERE created_at > NOW() - INTERVAL '24 hours' AND source != 'user') AS deals_24h,
  (SELECT COUNT(*) FROM coupons WHERE created_at > NOW() - INTERVAL '24 hours' AND source != 'user') AS coupons_24h,
  
  -- Last 7 days
  (SELECT COUNT(*) FROM deals WHERE created_at > NOW() - INTERVAL '7 days' AND source != 'user') AS deals_7d,
  (SELECT COUNT(*) FROM coupons WHERE created_at > NOW() - INTERVAL '7 days' AND source != 'user') AS coupons_7d,
  
  -- Today's errors
  (SELECT COUNT(*) FROM ingestion_errors WHERE created_at > NOW() - INTERVAL '24 hours') AS errors_24h,
  
  -- Active sources
  (SELECT COUNT(DISTINCT source) FROM deals WHERE created_at > NOW() - INTERVAL '24 hours') AS active_sources,
  
  -- Last run time
  (SELECT MAX(completed_at) FROM ingestion_runs WHERE status = 'completed') AS last_successful_run;

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to get ingestion metrics by source
CREATE OR REPLACE FUNCTION get_ingestion_metrics(days_back INT DEFAULT 7)
RETURNS TABLE (
  source TEXT,
  total_deals BIGINT,
  total_coupons BIGINT,
  avg_daily_deals NUMERIC,
  last_ingestion TIMESTAMPTZ,
  error_count BIGINT
)
LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  WITH deal_stats AS (
    SELECT 
      d.source,
      COUNT(*) as deal_count,
      MAX(d.created_at) as last_deal
    FROM deals d
    WHERE d.created_at > NOW() - (days_back || ' days')::INTERVAL
      AND d.source != 'user'
    GROUP BY d.source
  ),
  coupon_stats AS (
    SELECT 
      c.source,
      COUNT(*) as coupon_count
    FROM coupons c
    WHERE c.created_at > NOW() - (days_back || ' days')::INTERVAL
      AND c.source != 'user'
    GROUP BY c.source
  ),
  error_stats AS (
    SELECT 
      e.source,
      COUNT(*) as err_count
    FROM ingestion_errors e
    WHERE e.created_at > NOW() - (days_back || ' days')::INTERVAL
    GROUP BY e.source
  )
  SELECT 
    COALESCE(ds.source, cs.source, es.source) as source,
    COALESCE(ds.deal_count, 0) as total_deals,
    COALESCE(cs.coupon_count, 0) as total_coupons,
    ROUND(COALESCE(ds.deal_count, 0)::NUMERIC / days_back, 2) as avg_daily_deals,
    ds.last_deal as last_ingestion,
    COALESCE(es.err_count, 0) as error_count
  FROM deal_stats ds
  FULL OUTER JOIN coupon_stats cs ON ds.source = cs.source
  FULL OUTER JOIN error_stats es ON COALESCE(ds.source, cs.source) = es.source
  ORDER BY total_deals DESC;
END;
$$;

-- Function to cleanup old ingestion data
CREATE OR REPLACE FUNCTION cleanup_ingestion_data(days_to_keep INT DEFAULT 30)
RETURNS TABLE (
  errors_deleted BIGINT,
  runs_deleted BIGINT
)
LANGUAGE plpgsql AS $$
DECLARE
  err_count BIGINT;
  run_count BIGINT;
BEGIN
  -- Delete old resolved errors
  DELETE FROM ingestion_errors 
  WHERE resolved = TRUE 
    AND created_at < NOW() - (days_to_keep || ' days')::INTERVAL;
  GET DIAGNOSTICS err_count = ROW_COUNT;
  
  -- Delete old ingestion runs
  DELETE FROM ingestion_runs 
  WHERE created_at < NOW() - (days_to_keep || ' days')::INTERVAL;
  GET DIAGNOSTICS run_count = ROW_COUNT;
  
  RETURN QUERY SELECT err_count, run_count;
END;
$$;

-- RLS Policies
ALTER TABLE public.ingestion_errors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ingestion_runs ENABLE ROW LEVEL SECURITY;

-- Only admins can see ingestion data
CREATE POLICY "Admins can view ingestion errors" ON public.ingestion_errors
  FOR ALL USING (is_admin());

CREATE POLICY "Admins can view ingestion runs" ON public.ingestion_runs
  FOR ALL USING (is_admin());

-- Service role can insert (for worker)
CREATE POLICY "Service role can insert errors" ON public.ingestion_errors
  FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "Service role can manage runs" ON public.ingestion_runs
  FOR ALL USING (TRUE);

-- Success message
SELECT 'Ingestion schema enhancements applied successfully!' AS status;
