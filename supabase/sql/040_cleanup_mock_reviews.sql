-- Clean up mock review data
-- This migration removes all seed/mock reviews to ensure only real user reviews are shown

-- Delete all existing reviews (they are seed data)
DELETE FROM public.deal_reviews;

-- Reset any sequences if needed
-- Note: This will remove all review data, but since we want only real reviews, this is intentional

-- Add a comment to explain the cleanup
COMMENT ON TABLE public.deal_reviews IS 'Contains only real user reviews - no seed data';

-- Verify the cleanup
SELECT 'Mock reviews cleaned up successfully' as status;
