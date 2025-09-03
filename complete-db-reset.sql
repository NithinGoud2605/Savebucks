-- COMPLETE DATABASE RESET AND CLEANUP
-- This script will completely wipe and reset the database

-- Disable all triggers and constraints temporarily
SET session_replication_role = replica;

-- Drop all views first (they depend on tables)
DROP VIEW IF EXISTS public.notification_queue_with_details CASCADE;
DROP VIEW IF EXISTS public.active_deals CASCADE;
DROP VIEW IF EXISTS public.active_coupons CASCADE;

-- Drop all custom functions (they might be used by triggers)
DROP FUNCTION IF EXISTS public.get_votes_agg() CASCADE;
DROP FUNCTION IF EXISTS public.get_coupon_votes_agg() CASCADE;
DROP FUNCTION IF EXISTS public.calculate_level_from_xp(integer) CASCADE;
DROP FUNCTION IF EXISTS public.award_xp(uuid, text, text, bigint, decimal, text) CASCADE;
DROP FUNCTION IF EXISTS public.check_user_achievements(uuid, text, text, bigint) CASCADE;
DROP FUNCTION IF EXISTS public.check_level_achievements(uuid, integer) CASCADE;
DROP FUNCTION IF EXISTS public.trigger_award_xp_deal() CASCADE;
DROP FUNCTION IF EXISTS public.trigger_award_xp_comment() CASCADE;
DROP FUNCTION IF EXISTS public.trigger_award_xp_vote() CASCADE;
DROP FUNCTION IF EXISTS public.get_trending_categories() CASCADE;
DROP FUNCTION IF EXISTS public.get_navbar_stats() CASCADE;
DROP FUNCTION IF EXISTS public.get_trending_categories_with_counts() CASCADE;
DROP FUNCTION IF EXISTS public.update_user_session(uuid, text, inet, text) CASCADE;
DROP FUNCTION IF EXISTS public.cleanup_old_sessions() CASCADE;
DROP FUNCTION IF EXISTS public.increment_deal_views(bigint) CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS public.check_deal_matches_search(deals, saved_searches) CASCADE;
DROP FUNCTION IF EXISTS public.get_deal_report_count(bigint) CASCADE;
DROP FUNCTION IF EXISTS public.audit_deals_update() CASCADE;
DROP FUNCTION IF EXISTS public.track_coupon_usage(bigint, uuid, decimal, boolean) CASCADE;
DROP FUNCTION IF EXISTS public.get_popular_tags(text, integer) CASCADE;
DROP FUNCTION IF EXISTS public.suggest_tags_for_deal(bigint, integer) CASCADE;
DROP FUNCTION IF EXISTS public.auto_tag_deal(bigint) CASCADE;
DROP FUNCTION IF EXISTS public.categorize_deal(text, text) CASCADE;
DROP FUNCTION IF EXISTS public.extract_merchant_from_deal(text, text) CASCADE;

-- Drop all tables in reverse dependency order
DROP TABLE IF EXISTS public.xp_events CASCADE;
DROP TABLE IF EXISTS public.user_badges CASCADE;
DROP TABLE IF EXISTS public.badges CASCADE;
DROP TABLE IF EXISTS public.achievements CASCADE;
DROP TABLE IF EXISTS public.user_achievements CASCADE;
DROP TABLE IF EXISTS public.leaderboard_snapshots CASCADE;
DROP TABLE IF EXISTS public.leaderboard_entries CASCADE;
DROP TABLE IF EXISTS public.leaderboard_periods CASCADE;
DROP TABLE IF EXISTS public.rewards CASCADE;
DROP TABLE IF EXISTS public.user_notification_preferences CASCADE;
DROP TABLE IF EXISTS public.notification_queue CASCADE;
DROP TABLE IF EXISTS public.saved_searches CASCADE;
DROP TABLE IF EXISTS public.follows CASCADE;
DROP TABLE IF EXISTS public.user_follows CASCADE;
DROP TABLE IF EXISTS public.user_sessions CASCADE;
DROP TABLE IF EXISTS public.saved_deals CASCADE;
DROP TABLE IF EXISTS public.price_alerts CASCADE;
DROP TABLE IF EXISTS public.deal_price_history CASCADE;
DROP TABLE IF EXISTS public.coupon_usage CASCADE;
DROP TABLE IF EXISTS public.coupon_votes CASCADE;
DROP TABLE IF EXISTS public.coupon_comments CASCADE;
DROP TABLE IF EXISTS public.coupon_tags CASCADE;
DROP TABLE IF EXISTS public.coupons CASCADE;
DROP TABLE IF EXISTS public.deal_tags CASCADE;
DROP TABLE IF EXISTS public.deal_tag_relations CASCADE;
DROP TABLE IF EXISTS public.tags CASCADE;
DROP TABLE IF EXISTS public.affiliate_clicks CASCADE;
DROP TABLE IF EXISTS public.conversions CASCADE;
DROP TABLE IF EXISTS public.comments CASCADE;
DROP TABLE IF EXISTS public.votes CASCADE;
DROP TABLE IF EXISTS public.reports CASCADE;
DROP TABLE IF EXISTS public.deals CASCADE;
DROP TABLE IF EXISTS public.companies CASCADE;
DROP TABLE IF EXISTS public.merchants CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;
DROP TABLE IF EXISTS public.collections CASCADE;
DROP TABLE IF EXISTS public.collection_items CASCADE;
DROP TABLE IF EXISTS public.banners CASCADE;
DROP TABLE IF EXISTS public.images CASCADE;
DROP TABLE IF EXISTS public.user_activities CASCADE;
DROP TABLE IF EXISTS public.audit_log CASCADE;
DROP TABLE IF EXISTS public.xp_config CASCADE;
DROP TABLE IF EXISTS public.merchant_patterns CASCADE;
DROP TABLE IF EXISTS public.category_patterns CASCADE;
DROP TABLE IF EXISTS public.auto_tagging_log CASCADE;

-- Drop custom types
DROP TYPE IF EXISTS public.deal_status CASCADE;
DROP TYPE IF EXISTS public.report_reason CASCADE;
DROP TYPE IF EXISTS public.user_role CASCADE;
DROP TYPE IF EXISTS public.notification_type CASCADE;
DROP TYPE IF EXISTS public.search_type CASCADE;
DROP TYPE IF EXISTS public.alert_frequency CASCADE;
DROP TYPE IF EXISTS public.badge_type CASCADE;
DROP TYPE IF EXISTS public.achievement_type CASCADE;
DROP TYPE IF EXISTS public.xp_event_category CASCADE;

-- Clean up profiles table (keep the table but reset custom columns)
ALTER TABLE IF EXISTS public.profiles DROP COLUMN IF EXISTS karma CASCADE;
ALTER TABLE IF EXISTS public.profiles DROP COLUMN IF EXISTS role CASCADE;
ALTER TABLE IF EXISTS public.profiles DROP COLUMN IF EXISTS is_shadow_banned CASCADE;
ALTER TABLE IF EXISTS public.profiles DROP COLUMN IF EXISTS shadow_ban_reason CASCADE;
ALTER TABLE IF EXISTS public.profiles DROP COLUMN IF EXISTS total_posts CASCADE;
ALTER TABLE IF EXISTS public.profiles DROP COLUMN IF EXISTS total_comments CASCADE;
ALTER TABLE IF EXISTS public.profiles DROP COLUMN IF EXISTS deals_approved CASCADE;
ALTER TABLE IF EXISTS public.profiles DROP COLUMN IF EXISTS votes_received CASCADE;
ALTER TABLE IF EXISTS public.profiles DROP COLUMN IF EXISTS streak_days CASCADE;
ALTER TABLE IF EXISTS public.profiles DROP COLUMN IF EXISTS last_active CASCADE;
ALTER TABLE IF EXISTS public.profiles DROP COLUMN IF EXISTS total_xp CASCADE;
ALTER TABLE IF EXISTS public.profiles DROP COLUMN IF EXISTS current_level CASCADE;
ALTER TABLE IF EXISTS public.profiles DROP COLUMN IF EXISTS xp_to_next_level CASCADE;
ALTER TABLE IF EXISTS public.profiles DROP COLUMN IF EXISTS bio CASCADE;
ALTER TABLE IF EXISTS public.profiles DROP COLUMN IF EXISTS website CASCADE;
ALTER TABLE IF EXISTS public.profiles DROP COLUMN IF EXISTS location CASCADE;
ALTER TABLE IF EXISTS public.profiles DROP COLUMN IF EXISTS joined_at CASCADE;
ALTER TABLE IF EXISTS public.profiles DROP COLUMN IF EXISTS total_votes_received CASCADE;
ALTER TABLE IF EXISTS public.profiles DROP COLUMN IF EXISTS weekly_points CASCADE;
ALTER TABLE IF EXISTS public.profiles DROP COLUMN IF EXISTS monthly_points CASCADE;
ALTER TABLE IF EXISTS public.profiles DROP COLUMN IF EXISTS all_time_points CASCADE;
ALTER TABLE IF EXISTS public.profiles DROP COLUMN IF EXISTS longest_streak CASCADE;
ALTER TABLE IF EXISTS public.profiles DROP COLUMN IF EXISTS last_activity_date CASCADE;
ALTER TABLE IF EXISTS public.profiles DROP COLUMN IF EXISTS comments_received CASCADE;
ALTER TABLE IF EXISTS public.profiles DROP COLUMN IF EXISTS badges_earned CASCADE;

-- Remove all RLS policies
DROP POLICY IF EXISTS "Users can view their own achievements" ON public.user_achievements;
DROP POLICY IF EXISTS "Everyone can view leaderboard periods" ON public.leaderboard_periods;
DROP POLICY IF EXISTS "Everyone can view leaderboard entries" ON public.leaderboard_entries;
DROP POLICY IF EXISTS "collections_read_all" ON public.collections;
DROP POLICY IF EXISTS "collections_admin_write" ON public.collections;
DROP POLICY IF EXISTS "collection_items_read_all" ON public.collection_items;
DROP POLICY IF EXISTS "collection_items_admin_write" ON public.collection_items;
DROP POLICY IF EXISTS "banners_read_active" ON public.banners;
DROP POLICY IF EXISTS "banners_admin_write" ON public.banners;
DROP POLICY IF EXISTS "deal_tag_relations_read_all" ON public.deal_tag_relations;
DROP POLICY IF EXISTS "deal_tag_relations_admin_write" ON public.deal_tag_relations;
DROP POLICY IF EXISTS "Anyone can view price history" ON public.deal_price_history;
DROP POLICY IF EXISTS "Anyone can view merchant patterns" ON public.merchant_patterns;
DROP POLICY IF EXISTS "Anyone can view category patterns" ON public.category_patterns;
DROP POLICY IF EXISTS "Anyone can view auto-tagging log" ON public.auto_tagging_log;
DROP POLICY IF EXISTS "Authenticated users can upload images" ON storage.objects;

-- Re-enable triggers
SET session_replication_role = DEFAULT;

-- Success message
SELECT 'Database completely reset! All custom tables, functions, types, and policies removed.' as status;
