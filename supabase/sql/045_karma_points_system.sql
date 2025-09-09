-- Karma Points System for Submission Quality
-- Awards karma points based on the amount of information provided in deals/coupons

-- Function to calculate karma points based on submission completeness
CREATE OR REPLACE FUNCTION calculate_submission_karma(
  submission_type TEXT, -- 'deal' or 'coupon'
  submission_data JSONB
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  karma_points INTEGER := 0;
  field_count INTEGER := 0;
  total_possible_fields INTEGER;
BEGIN
  -- Base karma for submission
  karma_points := 3;
  
  -- Count filled fields based on submission type
  IF submission_type = 'deal' THEN
    total_possible_fields := 15; -- Total optional fields for deals
    
    -- Check each optional field
    IF submission_data->>'original_price' IS NOT NULL AND submission_data->>'original_price' != '' THEN
      field_count := field_count + 1;
    END IF;
    
    IF submission_data->>'discount_percentage' IS NOT NULL AND submission_data->>'discount_percentage' != '' THEN
      field_count := field_count + 1;
    END IF;
    
    IF submission_data->>'merchant' IS NOT NULL AND submission_data->>'merchant' != '' THEN
      field_count := field_count + 1;
    END IF;
    
    IF submission_data->>'category_id' IS NOT NULL AND submission_data->>'category_id' != '' THEN
      field_count := field_count + 1;
    END IF;
    
    IF submission_data->>'deal_type' IS NOT NULL AND submission_data->>'deal_type' != 'deal' THEN
      field_count := field_count + 1;
    END IF;
    
    IF submission_data->>'coupon_code' IS NOT NULL AND submission_data->>'coupon_code' != '' THEN
      field_count := field_count + 1;
    END IF;
    
    IF submission_data->>'coupon_type' IS NOT NULL AND submission_data->>'coupon_type' != 'none' THEN
      field_count := field_count + 1;
    END IF;
    
    IF submission_data->>'starts_at' IS NOT NULL AND submission_data->>'starts_at' != '' THEN
      field_count := field_count + 1;
    END IF;
    
    IF submission_data->>'expires_at' IS NOT NULL AND submission_data->>'expires_at' != '' THEN
      field_count := field_count + 1;
    END IF;
    
    IF submission_data->>'stock_status' IS NOT NULL AND submission_data->>'stock_status' != 'unknown' THEN
      field_count := field_count + 1;
    END IF;
    
    IF submission_data->>'stock_quantity' IS NOT NULL AND submission_data->>'stock_quantity' != '' THEN
      field_count := field_count + 1;
    END IF;
    
    IF submission_data->>'tags' IS NOT NULL AND submission_data->>'tags' != '' THEN
      field_count := field_count + 1;
    END IF;
    
    IF submission_data->>'image_url' IS NOT NULL AND submission_data->>'image_url' != '' THEN
      field_count := field_count + 1;
    END IF;
    
    IF submission_data->>'description' IS NOT NULL AND submission_data->>'description' != '' THEN
      field_count := field_count + 1;
    END IF;
    
    IF submission_data->>'terms_conditions' IS NOT NULL AND submission_data->>'terms_conditions' != '' THEN
      field_count := field_count + 1;
    END IF;
    
  ELSIF submission_type = 'coupon' THEN
    total_possible_fields := 10; -- Total optional fields for coupons
    
    -- Check each optional field
    IF submission_data->>'minimum_order_amount' IS NOT NULL AND submission_data->>'minimum_order_amount' != '' THEN
      field_count := field_count + 1;
    END IF;
    
    IF submission_data->>'maximum_discount_amount' IS NOT NULL AND submission_data->>'maximum_discount_amount' != '' THEN
      field_count := field_count + 1;
    END IF;
    
    IF submission_data->>'usage_limit' IS NOT NULL AND submission_data->>'usage_limit' != '' THEN
      field_count := field_count + 1;
    END IF;
    
    IF submission_data->>'usage_limit_per_user' IS NOT NULL AND submission_data->>'usage_limit_per_user' != '' THEN
      field_count := field_count + 1;
    END IF;
    
    IF submission_data->>'starts_at' IS NOT NULL AND submission_data->>'starts_at' != '' THEN
      field_count := field_count + 1;
    END IF;
    
    IF submission_data->>'expires_at' IS NOT NULL AND submission_data->>'expires_at' != '' THEN
      field_count := field_count + 1;
    END IF;
    
    IF submission_data->>'source_url' IS NOT NULL AND submission_data->>'source_url' != '' THEN
      field_count := field_count + 1;
    END IF;
    
    IF submission_data->>'category_id' IS NOT NULL AND submission_data->>'category_id' != '' THEN
      field_count := field_count + 1;
    END IF;
    
    IF submission_data->>'description' IS NOT NULL AND submission_data->>'description' != '' THEN
      field_count := field_count + 1;
    END IF;
    
    IF submission_data->>'terms_conditions' IS NOT NULL AND submission_data->>'terms_conditions' != '' THEN
      field_count := field_count + 1;
    END IF;
  END IF;
  
  -- Calculate karma based on field completion percentage
  IF field_count = 0 THEN
    -- Only required fields (3 points)
    karma_points := 3;
  ELSIF field_count <= total_possible_fields * 0.3 THEN
    -- 30% or less of optional fields (5 points)
    karma_points := 5;
  ELSIF field_count <= total_possible_fields * 0.7 THEN
    -- 30-70% of optional fields (8 points)
    karma_points := 8;
  ELSE
    -- 70%+ of optional fields (10 points)
    karma_points := 10;
  END IF;
  
  RETURN karma_points;
END;
$$;

-- Function to award karma points on approval
CREATE OR REPLACE FUNCTION award_karma_on_approval()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  karma_points INTEGER;
  submission_data JSONB;
BEGIN
  -- Only process when status changes to approved
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') AND NEW.submitter_id IS NOT NULL THEN
    -- Prepare submission data for karma calculation
    submission_data := jsonb_build_object(
      'original_price', NEW.original_price,
      'discount_percentage', NEW.discount_percentage,
      'merchant', NEW.merchant,
      'category_id', NEW.category_id,
      'deal_type', NEW.deal_type,
      'coupon_code', NEW.coupon_code,
      'coupon_type', NEW.coupon_type,
      'starts_at', NEW.starts_at,
      'expires_at', NEW.expires_at,
      'stock_status', NEW.stock_status,
      'stock_quantity', NEW.stock_quantity,
      'tags', NEW.tags,
      'image_url', NEW.image_url,
      'description', NEW.description,
      'terms_conditions', NEW.terms_conditions
    );
    
    -- Calculate karma points
    karma_points := calculate_submission_karma('deal', submission_data);
    
    -- Award karma points
    UPDATE public.profiles 
    SET karma = karma + karma_points
    WHERE id = NEW.submitter_id;
    
    -- Set approved_at timestamp
    NEW.approved_at = COALESCE(NEW.approved_at, NOW());
    
    -- Log the karma award
    INSERT INTO public.xp_events (
      user_id, 
      event_type, 
      event_category, 
      xp_amount, 
      multiplier, 
      final_xp,
      target_type, 
      target_id, 
      description,
      metadata
    ) VALUES (
      NEW.submitter_id,
      'karma_awarded',
      'bonus',
      karma_points,
      1.0,
      karma_points,
      'deal',
      NEW.id,
      'Karma awarded for detailed deal submission',
      jsonb_build_object(
        'submission_type', 'deal',
        'field_completion', submission_data,
        'karma_points', karma_points
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Function to award karma points for coupon approval
CREATE OR REPLACE FUNCTION award_karma_on_coupon_approval()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  karma_points INTEGER;
  submission_data JSONB;
BEGIN
  -- Only process when status changes to approved
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') AND NEW.submitter_id IS NOT NULL THEN
    -- Prepare submission data for karma calculation
    submission_data := jsonb_build_object(
      'minimum_order_amount', NEW.minimum_order_amount,
      'maximum_discount_amount', NEW.maximum_discount_amount,
      'usage_limit', NEW.usage_limit,
      'usage_limit_per_user', NEW.usage_limit_per_user,
      'starts_at', NEW.starts_at,
      'expires_at', NEW.expires_at,
      'source_url', NEW.source_url,
      'category_id', NEW.category_id,
      'description', NEW.description,
      'terms_conditions', NEW.terms_conditions
    );
    
    -- Calculate karma points
    karma_points := calculate_submission_karma('coupon', submission_data);
    
    -- Award karma points
    UPDATE public.profiles 
    SET karma = karma + karma_points
    WHERE id = NEW.submitter_id;
    
    -- Set approved_at timestamp
    NEW.approved_at = COALESCE(NEW.approved_at, NOW());
    
    -- Log the karma award
    INSERT INTO public.xp_events (
      user_id, 
      event_type, 
      event_category, 
      xp_amount, 
      multiplier, 
      final_xp,
      target_type, 
      target_id, 
      description,
      metadata
    ) VALUES (
      NEW.submitter_id,
      'karma_awarded',
      'bonus',
      karma_points,
      1.0,
      karma_points,
      'coupon',
      NEW.id,
      'Karma awarded for detailed coupon submission',
      jsonb_build_object(
        'submission_type', 'coupon',
        'field_completion', submission_data,
        'karma_points', karma_points
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS trg_deals_bump_karma ON public.deals;
DROP TRIGGER IF EXISTS trg_coupons_bump_karma ON public.coupons;

-- Create new triggers for karma awarding
CREATE TRIGGER trg_deals_award_karma
  BEFORE UPDATE ON public.deals
  FOR EACH ROW
  EXECUTE FUNCTION award_karma_on_approval();

CREATE TRIGGER trg_coupons_award_karma
  BEFORE UPDATE ON public.coupons
  FOR EACH ROW
  EXECUTE FUNCTION award_karma_on_coupon_approval();

-- Add karma_awarded to XP config
INSERT INTO public.xp_config (event_type, base_xp, max_daily, description) 
VALUES ('karma_awarded', 0, NULL, 'Karma points awarded for detailed submissions')
ON CONFLICT (event_type) DO NOTHING;

-- Add new achievements for detailed submissions
INSERT INTO public.achievements (name, slug, description, category, criteria_type, criteria_value, xp_reward, badge_icon, badge_color, rarity) 
VALUES 
  ('Detail Oriented', 'detail-oriented', 'Submit a deal with 70%+ optional fields filled', 'posting', 'special', 1, 50, '📋', '#10B981', 'uncommon'),
  ('Comprehensive Contributor', 'comprehensive-contributor', 'Submit 5 deals with 70%+ optional fields', 'posting', 'count', 5, 200, '📊', '#3B82F6', 'rare'),
  ('Information Master', 'information-master', 'Submit 10 deals with 70%+ optional fields', 'posting', 'count', 10, 500, '🎯', '#F59E0B', 'epic')
ON CONFLICT (slug) DO NOTHING;

-- Function to get karma breakdown for a user
CREATE OR REPLACE FUNCTION get_user_karma_breakdown(user_id_param UUID)
RETURNS TABLE (
  total_karma INTEGER,
  deals_approved INTEGER,
  coupons_approved INTEGER,
  avg_karma_per_deal DECIMAL(5,2),
  avg_karma_per_coupon DECIMAL(5,2),
  detailed_submissions INTEGER,
  basic_submissions INTEGER
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.karma as total_karma,
    COALESCE(deal_stats.deals_approved, 0)::INTEGER as deals_approved,
    COALESCE(coupon_stats.coupons_approved, 0)::INTEGER as coupons_approved,
    COALESCE(deal_stats.avg_karma, 0)::DECIMAL(5,2) as avg_karma_per_deal,
    COALESCE(coupon_stats.avg_karma, 0)::DECIMAL(5,2) as avg_karma_per_coupon,
    COALESCE(deal_stats.detailed_submissions, 0)::INTEGER + COALESCE(coupon_stats.detailed_submissions, 0)::INTEGER as detailed_submissions,
    COALESCE(deal_stats.basic_submissions, 0)::INTEGER + COALESCE(coupon_stats.basic_submissions, 0)::INTEGER as basic_submissions
  FROM public.profiles p
  LEFT JOIN (
    SELECT 
      submitter_id,
      COUNT(*) as deals_approved,
      AVG(CAST(xe.metadata->>'karma_points' AS INTEGER)) as avg_karma,
      COUNT(*) FILTER (WHERE CAST(xe.metadata->>'karma_points' AS INTEGER) >= 8) as detailed_submissions,
      COUNT(*) FILTER (WHERE CAST(xe.metadata->>'karma_points' AS INTEGER) < 8) as basic_submissions
    FROM public.deals d
    LEFT JOIN public.xp_events xe ON xe.target_id = d.id AND xe.target_type = 'deal' AND xe.event_type = 'karma_awarded'
    WHERE d.status = 'approved' AND d.submitter_id = user_id_param
    GROUP BY submitter_id
  ) deal_stats ON deal_stats.submitter_id = p.id
  LEFT JOIN (
    SELECT 
      submitter_id,
      COUNT(*) as coupons_approved,
      AVG(CAST(xe.metadata->>'karma_points' AS INTEGER)) as avg_karma,
      COUNT(*) FILTER (WHERE CAST(xe.metadata->>'karma_points' AS INTEGER) >= 8) as detailed_submissions,
      COUNT(*) FILTER (WHERE CAST(xe.metadata->>'karma_points' AS INTEGER) < 8) as basic_submissions
    FROM public.coupons c
    LEFT JOIN public.xp_events xe ON xe.target_id = c.id AND xe.target_type = 'coupon' AND xe.event_type = 'karma_awarded'
    WHERE c.status = 'approved' AND c.submitter_id = user_id_param
    GROUP BY submitter_id
  ) coupon_stats ON coupon_stats.submitter_id = p.id
  WHERE p.id = user_id_param;
END;
$$;

-- Comments
COMMENT ON FUNCTION calculate_submission_karma IS 'Calculates karma points based on submission completeness (3-10 points)';
COMMENT ON FUNCTION award_karma_on_approval IS 'Awards karma points when deals are approved based on information provided';
COMMENT ON FUNCTION award_karma_on_coupon_approval IS 'Awards karma points when coupons are approved based on information provided';
COMMENT ON FUNCTION get_user_karma_breakdown IS 'Returns detailed karma statistics for a user';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '=== KARMA POINTS SYSTEM IMPLEMENTED ===';
  RAISE NOTICE 'Karma Points: 3 (basic), 5 (30% fields), 8 (70% fields), 10 (detailed)';
  RAISE NOTICE 'Automatic karma awarding on deal/coupon approval';
  RAISE NOTICE 'New achievements for detailed submissions';
END $$;
