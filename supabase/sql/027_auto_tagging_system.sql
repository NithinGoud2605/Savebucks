-- Auto-Tagging System for Merchants and Categories
-- Uses heuristics and zero-shot classification to automatically tag deals

-- Merchant detection patterns table
CREATE TABLE IF NOT EXISTS public.merchant_patterns (
  id SERIAL PRIMARY KEY,
  merchant_name TEXT NOT NULL,
  domain_patterns TEXT[] NOT NULL, -- Array of domain patterns to match
  url_patterns TEXT[], -- Additional URL patterns
  title_patterns TEXT[], -- Patterns that might appear in deal titles
  
  -- Merchant metadata
  merchant_id BIGINT REFERENCES public.merchants(id),
  confidence_score DECIMAL(3,2) DEFAULT 0.95 CHECK (confidence_score BETWEEN 0 AND 1),
  
  -- Auto-tagging settings
  auto_apply_tags INTEGER[] DEFAULT '{}', -- Tag IDs to auto-apply
  category_hint TEXT, -- Suggested category for deals from this merchant
  
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(merchant_name, domain_patterns)
);

-- Category detection patterns
CREATE TABLE IF NOT EXISTS public.category_patterns (
  id SERIAL PRIMARY KEY,
  category_name TEXT NOT NULL,
  category_id BIGINT REFERENCES public.categories(id),
  
  -- Pattern matching
  keyword_patterns TEXT[] NOT NULL, -- Keywords that suggest this category
  title_patterns TEXT[], -- Regex patterns for titles
  description_patterns TEXT[], -- Patterns for descriptions
  exclusion_patterns TEXT[], -- Patterns that exclude this category
  
  -- Scoring
  confidence_score DECIMAL(3,2) DEFAULT 0.8 CHECK (confidence_score BETWEEN 0 AND 1),
  priority INTEGER DEFAULT 1, -- Higher priority patterns checked first
  
  -- Auto-tagging
  auto_apply_tags INTEGER[] DEFAULT '{}', -- Tag IDs to auto-apply
  
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-tagging results log
CREATE TABLE IF NOT EXISTS public.auto_tagging_log (
  id BIGSERIAL PRIMARY KEY,
  deal_id BIGINT REFERENCES public.deals(id) ON DELETE CASCADE,
  coupon_id BIGINT REFERENCES public.coupons(id) ON DELETE CASCADE,
  
  -- What was detected
  detected_merchant TEXT,
  detected_category TEXT,
  applied_tags INTEGER[], -- Tag IDs that were applied
  
  -- Confidence scores
  merchant_confidence DECIMAL(3,2),
  category_confidence DECIMAL(3,2),
  
  -- Pattern matching details
  matched_patterns JSONB, -- Details about what patterns matched
  
  -- Status
  status TEXT DEFAULT 'applied' CHECK (status IN ('applied', 'suggested', 'rejected', 'manual_override')),
  reviewed_by UUID REFERENCES public.profiles(id),
  reviewed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_merchant_patterns_active ON public.merchant_patterns(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_category_patterns_active ON public.category_patterns(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_category_patterns_priority ON public.category_patterns(priority DESC, confidence_score DESC);
CREATE INDEX IF NOT EXISTS idx_auto_tagging_log_deal_id ON public.auto_tagging_log(deal_id);
CREATE INDEX IF NOT EXISTS idx_auto_tagging_log_created_at ON public.auto_tagging_log(created_at DESC);

-- Insert default merchant patterns
INSERT INTO public.merchant_patterns (merchant_name, domain_patterns, title_patterns, auto_apply_tags) VALUES
('Amazon', ARRAY['amazon.com', 'amzn.to', 'amazon.ca', 'amazon.co.uk'], ARRAY['amazon'], ARRAY[9]), -- Amazon tag
('Best Buy', ARRAY['bestbuy.com', 'bestbuy.ca'], ARRAY['best buy', 'bestbuy'], ARRAY[1]), -- Electronics tag
('Target', ARRAY['target.com'], ARRAY['target'], ARRAY[]::INTEGER[]),
('Walmart', ARRAY['walmart.com', 'walmart.ca'], ARRAY['walmart'], ARRAY[]::INTEGER[]),
('eBay', ARRAY['ebay.com', 'ebay.ca'], ARRAY['ebay'], ARRAY[]::INTEGER[]),
('Newegg', ARRAY['newegg.com', 'newegg.ca'], ARRAY['newegg'], ARRAY[1]), -- Electronics tag
('Home Depot', ARRAY['homedepot.com', 'homedepot.ca'], ARRAY['home depot'], ARRAY[3]), -- Home & Garden tag
('Lowes', ARRAY['lowes.com', 'lowes.ca'], ARRAY['lowes', 'lowe''s'], ARRAY[3]), -- Home & Garden tag
('Nike', ARRAY['nike.com'], ARRAY['nike'], ARRAY[12, 5]), -- Nike + Sports tags
('Adidas', ARRAY['adidas.com', 'adidas.ca'], ARRAY['adidas'], ARRAY[13, 5]), -- Adidas + Sports tags
('Apple', ARRAY['apple.com'], ARRAY['apple', 'iphone', 'ipad', 'macbook'], ARRAY[10, 1]), -- Apple + Electronics tags
('Samsung', ARRAY['samsung.com'], ARRAY['samsung', 'galaxy'], ARRAY[11, 1]), -- Samsung + Electronics tags
('Steam', ARRAY['store.steampowered.com', 'steam'], ARRAY['steam'], ARRAY[32]), -- Gaming tag if exists
('PlayStation', ARRAY['playstation.com', 'store.playstation.com'], ARRAY['playstation', 'ps4', 'ps5'], ARRAY[32]),
('Xbox', ARRAY['xbox.com', 'microsoft.com'], ARRAY['xbox'], ARRAY[32])
ON CONFLICT (merchant_name, domain_patterns) DO NOTHING;

-- Insert default category patterns
INSERT INTO public.category_patterns (category_name, category_id, keyword_patterns, auto_apply_tags, confidence_score, priority) VALUES
('Electronics', 1, ARRAY['laptop', 'computer', 'phone', 'tablet', 'tv', 'monitor', 'headphones', 'camera', 'smartphone', 'electronics', 'tech', 'gadget'], ARRAY[1], 0.9, 10),
('Fashion', 2, ARRAY['clothing', 'shirt', 'pants', 'dress', 'shoes', 'sneakers', 'fashion', 'apparel', 'wear', 'style'], ARRAY[2], 0.9, 10),
('Home & Garden', 3, ARRAY['furniture', 'home', 'garden', 'kitchen', 'bathroom', 'bedroom', 'living room', 'decor', 'appliance'], ARRAY[3], 0.85, 8),
('Books & Media', 4, ARRAY['book', 'ebook', 'kindle', 'audiobook', 'movie', 'dvd', 'blu-ray', 'game', 'music', 'cd'], ARRAY[4], 0.85, 8),
('Sports & Outdoors', 5, ARRAY['sports', 'outdoor', 'fitness', 'gym', 'exercise', 'camping', 'hiking', 'bike', 'running'], ARRAY[5], 0.85, 8),
('Health & Beauty', 6, ARRAY['health', 'beauty', 'skincare', 'makeup', 'cosmetics', 'supplement', 'vitamin', 'personal care'], ARRAY[6], 0.8, 7),
('Food & Drinks', 7, ARRAY['food', 'drink', 'snack', 'beverage', 'coffee', 'tea', 'restaurant', 'grocery'], ARRAY[7], 0.8, 7),
('Travel', 8, ARRAY['travel', 'flight', 'hotel', 'vacation', 'trip', 'airline', 'booking', 'cruise'], ARRAY[8], 0.8, 7),
('Gaming', NULL, ARRAY['game', 'gaming', 'console', 'pc game', 'video game', 'steam', 'playstation', 'xbox', 'nintendo'], ARRAY[32], 0.85, 9)
ON CONFLICT DO NOTHING;

-- Function to detect merchant from URL/title
CREATE OR REPLACE FUNCTION detect_merchant(
  url_text TEXT,
  title_text TEXT DEFAULT ''
)
RETURNS TABLE (
  merchant_name TEXT,
  confidence DECIMAL(3,2),
  matched_pattern TEXT,
  suggested_tags INTEGER[]
)
LANGUAGE plpgsql
AS $$
DECLARE
  pattern_record public.merchant_patterns%ROWTYPE;
  domain_extracted TEXT;
  best_match_name TEXT;
  best_confidence DECIMAL(3,2) := 0;
  best_tags INTEGER[];
  pattern_matched TEXT;
BEGIN
  -- Extract domain from URL
  domain_extracted := regexp_replace(url_text, '^https?://(?:www\.)?([^/]+).*', '\1', 'i');
  
  -- Check each merchant pattern
  FOR pattern_record IN 
    SELECT * FROM public.merchant_patterns 
    WHERE is_active = TRUE 
    ORDER BY confidence_score DESC
  LOOP
    -- Check domain patterns
    FOR i IN 1..array_length(pattern_record.domain_patterns, 1) LOOP
      IF domain_extracted ILIKE '%' || pattern_record.domain_patterns[i] || '%' THEN
        IF pattern_record.confidence_score > best_confidence THEN
          best_match_name := pattern_record.merchant_name;
          best_confidence := pattern_record.confidence_score;
          best_tags := pattern_record.auto_apply_tags;
          pattern_matched := 'domain: ' || pattern_record.domain_patterns[i];
        END IF;
      END IF;
    END LOOP;
    
    -- Check title patterns if provided
    IF title_text != '' AND pattern_record.title_patterns IS NOT NULL THEN
      FOR i IN 1..array_length(pattern_record.title_patterns, 1) LOOP
        IF LOWER(title_text) LIKE '%' || LOWER(pattern_record.title_patterns[i]) || '%' THEN
          -- Title match gets slightly lower confidence
          IF (pattern_record.confidence_score * 0.9) > best_confidence THEN
            best_match_name := pattern_record.merchant_name;
            best_confidence := pattern_record.confidence_score * 0.9;
            best_tags := pattern_record.auto_apply_tags;
            pattern_matched := 'title: ' || pattern_record.title_patterns[i];
          END IF;
        END IF;
      END LOOP;
    END IF;
  END LOOP;
  
  -- Return best match if found
  IF best_match_name IS NOT NULL THEN
    RETURN QUERY SELECT best_match_name, best_confidence, pattern_matched, best_tags;
  END IF;
END;
$$;

-- Function to detect category from title/description
CREATE OR REPLACE FUNCTION detect_category(
  title_text TEXT,
  description_text TEXT DEFAULT ''
)
RETURNS TABLE (
  category_name TEXT,
  category_id BIGINT,
  confidence DECIMAL(3,2),
  matched_keywords TEXT[],
  suggested_tags INTEGER[]
)
LANGUAGE plpgsql
AS $$
DECLARE
  pattern_record public.category_patterns%ROWTYPE;
  combined_text TEXT;
  matched_words TEXT[] := '{}';
  keyword_matches INTEGER := 0;
  total_keywords INTEGER;
  calculated_confidence DECIMAL(3,2);
  best_match_name TEXT;
  best_match_id BIGINT;
  best_confidence DECIMAL(3,2) := 0;
  best_keywords TEXT[];
  best_tags INTEGER[];
BEGIN
  combined_text := LOWER(title_text || ' ' || description_text);
  
  -- Check each category pattern in priority order
  FOR pattern_record IN 
    SELECT * FROM public.category_patterns 
    WHERE is_active = TRUE 
    ORDER BY priority DESC, confidence_score DESC
  LOOP
    matched_words := '{}';
    keyword_matches := 0;
    total_keywords := array_length(pattern_record.keyword_patterns, 1);
    
    -- Check for keyword matches
    FOR i IN 1..total_keywords LOOP
      IF combined_text LIKE '%' || LOWER(pattern_record.keyword_patterns[i]) || '%' THEN
        matched_words := matched_words || pattern_record.keyword_patterns[i];
        keyword_matches := keyword_matches + 1;
      END IF;
    END LOOP;
    
    -- Check exclusion patterns
    IF pattern_record.exclusion_patterns IS NOT NULL THEN
      FOR i IN 1..array_length(pattern_record.exclusion_patterns, 1) LOOP
        IF combined_text LIKE '%' || LOWER(pattern_record.exclusion_patterns[i]) || '%' THEN
          -- Excluded, skip this category
          keyword_matches := 0;
          EXIT;
        END IF;
      END LOOP;
    END IF;
    
    -- Calculate confidence based on keyword match ratio
    IF keyword_matches > 0 THEN
      calculated_confidence := pattern_record.confidence_score * (keyword_matches::DECIMAL / total_keywords::DECIMAL);
      
      -- Bonus for multiple matches
      IF keyword_matches > 1 THEN
        calculated_confidence := LEAST(calculated_confidence * 1.2, 1.0);
      END IF;
      
      IF calculated_confidence > best_confidence THEN
        best_match_name := pattern_record.category_name;
        best_match_id := pattern_record.category_id;
        best_confidence := calculated_confidence;
        best_keywords := matched_words;
        best_tags := pattern_record.auto_apply_tags;
      END IF;
    END IF;
  END LOOP;
  
  -- Return best match if found
  IF best_match_name IS NOT NULL AND best_confidence >= 0.5 THEN
    RETURN QUERY SELECT best_match_name, best_match_id, best_confidence, best_keywords, best_tags;
  END IF;
END;
$$;

-- Function to auto-tag a deal
CREATE OR REPLACE FUNCTION auto_tag_deal(deal_id_param BIGINT)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  deal_record public.deals%ROWTYPE;
  merchant_result RECORD;
  category_result RECORD;
  all_tags INTEGER[] := '{}';
  unique_tags INTEGER[] := '{}';
  log_data JSONB := '{}';
  result JSONB := '{}';
BEGIN
  -- Get deal record
  SELECT * INTO deal_record FROM public.deals WHERE id = deal_id_param;
  IF NOT FOUND THEN
    RETURN '{"error": "Deal not found"}'::JSONB;
  END IF;
  
  -- Detect merchant
  SELECT * INTO merchant_result 
  FROM detect_merchant(deal_record.url, deal_record.title) 
  LIMIT 1;
  
  IF merchant_result IS NOT NULL THEN
    -- Update deal merchant if not set
    IF deal_record.merchant IS NULL OR deal_record.merchant = '' THEN
      UPDATE public.deals 
      SET merchant = merchant_result.merchant_name, updated_at = NOW()
      WHERE id = deal_id_param;
    END IF;
    
    -- Add merchant tags
    all_tags := all_tags || merchant_result.suggested_tags;
    log_data := log_data || jsonb_build_object(
      'merchant_detected', merchant_result.merchant_name,
      'merchant_confidence', merchant_result.confidence,
      'merchant_pattern', merchant_result.matched_pattern
    );
  END IF;
  
  -- Detect category
  SELECT * INTO category_result 
  FROM detect_category(deal_record.title, deal_record.description) 
  LIMIT 1;
  
  IF category_result IS NOT NULL THEN
    -- Update deal category if not set
    IF deal_record.category_id IS NULL THEN
      UPDATE public.deals 
      SET category_id = category_result.category_id, updated_at = NOW()
      WHERE id = deal_id_param;
    END IF;
    
    -- Add category tags
    all_tags := all_tags || category_result.suggested_tags;
    log_data := log_data || jsonb_build_object(
      'category_detected', category_result.category_name,
      'category_confidence', category_result.confidence,
      'category_keywords', category_result.matched_keywords
    );
  END IF;
  
  -- Remove duplicates and nulls from tags
  SELECT ARRAY_AGG(DISTINCT tag_id ORDER BY tag_id) INTO unique_tags
  FROM UNNEST(all_tags) AS tag_id
  WHERE tag_id IS NOT NULL;
  
  -- Apply tags if any were suggested
  IF unique_tags IS NOT NULL AND array_length(unique_tags, 1) > 0 THEN
    -- Insert tags (ignore duplicates)
    INSERT INTO public.deal_tags (deal_id, tag_id)
    SELECT deal_id_param, UNNEST(unique_tags)
    ON CONFLICT (deal_id, tag_id) DO NOTHING;
  END IF;
  
  -- Log the auto-tagging results
  INSERT INTO public.auto_tagging_log (
    deal_id, 
    detected_merchant, 
    detected_category,
    applied_tags,
    merchant_confidence,
    category_confidence,
    matched_patterns,
    status
  ) VALUES (
    deal_id_param,
    merchant_result.merchant_name,
    category_result.category_name,
    unique_tags,
    merchant_result.confidence,
    category_result.confidence,
    log_data,
    'applied'
  );
  
  -- Build result
  result := jsonb_build_object(
    'deal_id', deal_id_param,
    'merchant_detected', COALESCE(merchant_result.merchant_name, ''),
    'category_detected', COALESCE(category_result.category_name, ''),
    'tags_applied', COALESCE(array_length(unique_tags, 1), 0),
    'tag_ids', COALESCE(unique_tags, '{}'),
    'merchant_confidence', COALESCE(merchant_result.confidence, 0),
    'category_confidence', COALESCE(category_result.confidence, 0)
  );
  
  RETURN result;
END;
$$;

-- Function to auto-tag all untagged deals
CREATE OR REPLACE FUNCTION auto_tag_all_deals(limit_count INTEGER DEFAULT 100)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  deal_id BIGINT;
  processed_count INTEGER := 0;
  success_count INTEGER := 0;
  result JSONB;
  results JSONB[] := '{}';
BEGIN
  -- Process deals that haven't been auto-tagged yet
  FOR deal_id IN 
    SELECT d.id 
    FROM public.deals d
    LEFT JOIN public.auto_tagging_log atl ON d.id = atl.deal_id
    WHERE atl.id IS NULL 
    AND d.status IN ('approved', 'pending')
    ORDER BY d.created_at DESC
    LIMIT limit_count
  LOOP
    BEGIN
      result := auto_tag_deal(deal_id);
      results := results || result;
      
      IF result ? 'tags_applied' AND (result->>'tags_applied')::INTEGER > 0 THEN
        success_count := success_count + 1;
      END IF;
      
      processed_count := processed_count + 1;
    EXCEPTION WHEN OTHERS THEN
      -- Log error but continue processing
      RAISE NOTICE 'Error auto-tagging deal %: %', deal_id, SQLERRM;
    END;
  END LOOP;
  
  RETURN jsonb_build_object(
    'processed_count', processed_count,
    'success_count', success_count,
    'results', results
  );
END;
$$;

-- Trigger to auto-tag new deals
CREATE OR REPLACE FUNCTION trigger_auto_tag_deal()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Auto-tag when deal is inserted or approved
  IF (TG_OP = 'INSERT') OR (NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved')) THEN
    -- Run auto-tagging in background (async)
    PERFORM auto_tag_deal(NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_deals_auto_tag ON public.deals;
CREATE TRIGGER trigger_deals_auto_tag
  AFTER INSERT OR UPDATE ON public.deals
  FOR EACH ROW
  EXECUTE FUNCTION trigger_auto_tag_deal();

-- RLS Policies
ALTER TABLE public.merchant_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.category_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auto_tagging_log ENABLE ROW LEVEL SECURITY;

-- Anyone can view patterns (for transparency)
CREATE POLICY "Anyone can view merchant patterns" ON public.merchant_patterns
  FOR SELECT USING (true);

CREATE POLICY "Anyone can view category patterns" ON public.category_patterns
  FOR SELECT USING (true);

-- Only admins can manage patterns
CREATE POLICY "Admins can manage merchant patterns" ON public.merchant_patterns
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can manage category patterns" ON public.category_patterns
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Anyone can view auto-tagging log (for transparency)
CREATE POLICY "Anyone can view auto-tagging log" ON public.auto_tagging_log
  FOR SELECT USING (true);

-- Only admins can manage auto-tagging log
CREATE POLICY "Admins can manage auto-tagging log" ON public.auto_tagging_log
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Comments
COMMENT ON TABLE public.merchant_patterns IS 'Patterns for automatically detecting merchants from URLs and titles';
COMMENT ON TABLE public.category_patterns IS 'Patterns for automatically categorizing deals based on content';
COMMENT ON TABLE public.auto_tagging_log IS 'Log of automatic tagging results for deals';
COMMENT ON FUNCTION detect_merchant IS 'Detects merchant from URL and title using pattern matching';
COMMENT ON FUNCTION detect_category IS 'Detects category from title and description using keyword matching';
COMMENT ON FUNCTION auto_tag_deal IS 'Automatically tags a deal with merchant and category information';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '=== AUTO-TAGGING SYSTEM IMPLEMENTED ===';
  RAISE NOTICE 'Features: Merchant detection, category classification, automatic tag application';
  RAISE NOTICE 'Zero-shot classification with confidence scoring and pattern matching';
  RAISE NOTICE 'Automatic tagging on deal creation/approval with comprehensive logging';
END $$;
