-- Fix Duplicate Deals and Prevent Future Duplicates

-- 1. Remove duplicate deals, keeping only the raw latest (highest ID) for each source/external_id pair
-- Note: We only delete where external_id is NOT NULL.
DELETE FROM deals
WHERE id IN (
    SELECT id
    FROM (
        SELECT 
            id,
            ROW_NUMBER() OVER (
                PARTITION BY source, external_id 
                ORDER BY created_at DESC
            ) as rnum
        FROM deals
        WHERE external_id IS NOT NULL
    ) t
    WHERE t.rnum > 1
);

-- 2. Add a UNIQUE constraint to the deals table
-- This will cause the database to reject any future duplicate insertions
ALTER TABLE deals 
ADD CONSTRAINT unique_deal_source_external_id 
UNIQUE (source, external_id);

-- 3. Also clean up any Exact Title + Merchant duplicates (if external_id was null)
DELETE FROM deals
WHERE id IN (
    SELECT id
    FROM (
        SELECT 
            id,
            ROW_NUMBER() OVER (
                PARTITION BY title, merchant 
                ORDER BY created_at DESC
            ) as rnum
        FROM deals
        WHERE title IS NOT NULL AND merchant IS NOT NULL
    ) t
    WHERE t.rnum > 1
);

-- 4. Ensure coupon_code column exists in deals table
ALTER TABLE deals 
ADD COLUMN IF NOT EXISTS coupon_code TEXT;

-- 5. Add index on coupon_code for faster lookups
CREATE INDEX IF NOT EXISTS idx_deals_coupon_code ON deals(coupon_code);
