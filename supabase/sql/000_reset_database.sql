-- ============================================
-- DATABASE RESET SCRIPT
-- Clears ALL data from the SaveBucks database
-- ============================================
-- WARNING: This will DELETE ALL DATA including users, deals, companies, etc.
-- Run this script only when you want a fresh start.

BEGIN;

-- Disable triggers temporarily for faster truncation
SET session_replication_role = 'replica';

-- ============================================
-- TRUNCATE TABLES (in dependency order)
-- Using DO block to handle tables that may not exist
-- ============================================

DO $$
DECLARE
    tables_to_truncate TEXT[] := ARRAY[
        'ai_conversation_messages',
        'ai_conversations',
        'coupon_usage',
        'coupon_votes', 
        'coupon_comments',
        'deal_tags',
        'deal_reactions',
        'review_votes',
        'reviews',
        'votes',
        'comments',
        'reports',
        'affiliate_clicks',
        'conversions',
        'saved_searches',
        'follows',
        'user_badges',
        'user_preferences',
        'karma_transactions',
        'rewards',
        'leaderboard_snapshots',
        'price_history',
        'stock_alerts',
        'coupons',
        'deals',
        'companies',
        'merchants',
        'tags',
        'profiles'
    ];
    t TEXT;
BEGIN
    FOREACH t IN ARRAY tables_to_truncate
    LOOP
        IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = t) THEN
            EXECUTE format('TRUNCATE TABLE public.%I CASCADE', t);
            RAISE NOTICE 'Truncated table: %', t;
        ELSE
            RAISE NOTICE 'Table does not exist, skipping: %', t;
        END IF;
    END LOOP;
END $$;

-- Re-enable triggers
SET session_replication_role = 'origin';

-- ============================================
-- RESET SEQUENCES
-- ============================================
DO $$
DECLARE
    seq_record RECORD;
BEGIN
    FOR seq_record IN 
        SELECT sequence_name 
        FROM information_schema.sequences 
        WHERE sequence_schema = 'public'
    LOOP
        EXECUTE format('ALTER SEQUENCE public.%I RESTART WITH 1', seq_record.sequence_name);
    END LOOP;
END $$;

-- ============================================
-- DELETE AUTH USERS (Supabase specific)
-- ============================================
DELETE FROM auth.users;

COMMIT;

-- Success message
SELECT 'Database reset complete! All data has been cleared.' as status;
