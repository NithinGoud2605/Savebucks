-- Quick fixes for the immediate API issues

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

-- Success message
SELECT 'Schema fixes applied successfully!' as result;
