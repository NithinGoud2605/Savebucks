-- COMPLETE DATABASE INITIALIZATION
-- Runs all SQL files in the correct order with proper error handling

\echo 'Starting database initialization...'

-- Step 1: Core schema (tables, enums, basic functions)
\echo 'Step 1: Creating core schema...'
\i supabase/sql/001_schema_fixed.sql

-- Step 2: Companies and coupons system
\echo 'Step 2: Creating companies and coupons system...'
\i supabase/sql/002_companies_coupons.sql

-- Step 3: Tags system
\echo 'Step 3: Creating tags system...'
\i supabase/sql/003_tags_system.sql

-- Step 4: Seed data (categories, companies, tags)
\echo 'Step 4: Inserting seed data...'
\i supabase/sql/004_seed_data.sql

-- Step 5: Navbar functions
\echo 'Step 5: Creating navbar functions...'
\i supabase/sql/005_navbar_functions.sql

-- Final success message
\echo 'Database initialization completed successfully!'
SELECT 
  'Database initialized with ' || 
  (SELECT COUNT(*) FROM public.categories) || ' categories, ' ||
  (SELECT COUNT(*) FROM public.companies) || ' companies, and ' ||
  (SELECT COUNT(*) FROM public.tags) || ' tags.' as summary;
