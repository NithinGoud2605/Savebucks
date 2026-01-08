-- Auto-link deals to companies based on merchant name
-- This script will create companies for existing merchants and link deals to them

-- Function to create or get company by merchant name
CREATE OR REPLACE FUNCTION create_or_get_company_by_merchant(merchant_name TEXT)
RETURNS BIGINT
LANGUAGE plpgsql
AS $$
DECLARE
    company_id BIGINT;
    company_slug TEXT;
BEGIN
    -- Return NULL if merchant name is empty
    IF merchant_name IS NULL OR TRIM(merchant_name) = '' THEN
        RETURN NULL;
    END IF;
    
    -- Create slug from merchant name
    company_slug := LOWER(TRIM(merchant_name));
    company_slug := REGEXP_REPLACE(company_slug, '[^a-z0-9\s]', '', 'g');
    company_slug := REGEXP_REPLACE(company_slug, '\s+', '-', 'g');
    company_slug := TRIM(company_slug, '-');
    
    -- Check if company already exists
    SELECT id INTO company_id
    FROM companies
    WHERE LOWER(name) = LOWER(TRIM(merchant_name))
    LIMIT 1;
    
    -- If company exists, return its ID
    IF company_id IS NOT NULL THEN
        RETURN company_id;
    END IF;
    
    -- Create new company
    INSERT INTO companies (name, slug, status, is_verified, created_at, updated_at)
    VALUES (
        TRIM(merchant_name),
        company_slug,
        'approved',
        false,
        NOW(),
        NOW()
    )
    RETURNING id INTO company_id;
    
    RETURN company_id;
END;
$$;

-- Update existing deals to link them to companies
DO $$
DECLARE
    deal_record RECORD;
    company_id BIGINT;
BEGIN
    -- Process deals that have merchant but no company_id
    FOR deal_record IN 
        SELECT id, merchant 
        FROM deals 
        WHERE merchant IS NOT NULL 
        AND TRIM(merchant) != '' 
        AND company_id IS NULL
    LOOP
        -- Get or create company for this merchant
        company_id := create_or_get_company_by_merchant(deal_record.merchant);
        
        -- Update the deal with the company_id
        IF company_id IS NOT NULL THEN
            UPDATE deals 
            SET company_id = company_id
            WHERE id = deal_record.id;
            
            RAISE NOTICE 'Linked deal % to company % (%)', deal_record.id, company_id, deal_record.merchant;
        END IF;
    END LOOP;
END $$;

-- Create trigger function to auto-link deals to companies on insert/update
CREATE OR REPLACE FUNCTION auto_link_deal_to_company()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    company_id BIGINT;
BEGIN
    -- Only process if merchant is provided but company_id is not
    IF NEW.merchant IS NOT NULL AND TRIM(NEW.merchant) != '' AND NEW.company_id IS NULL THEN
        -- Get or create company for this merchant
        company_id := create_or_get_company_by_merchant(NEW.merchant);
        
        -- Set the company_id
        IF company_id IS NOT NULL THEN
            NEW.company_id := company_id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Create trigger for auto-linking deals to companies
DROP TRIGGER IF EXISTS trg_auto_link_deal_to_company ON deals;
CREATE TRIGGER trg_auto_link_deal_to_company
    BEFORE INSERT OR UPDATE ON deals
    FOR EACH ROW
    EXECUTE FUNCTION auto_link_deal_to_company();

-- Update the listDeals function to ensure company data is always included
-- This is handled in the API code, but we can add a comment here for reference

-- Add index for better performance on company lookups
CREATE INDEX IF NOT EXISTS idx_deals_company_id ON deals(company_id);
CREATE INDEX IF NOT EXISTS idx_companies_name_lower ON companies(LOWER(name));

-- Log the completion
DO $$
DECLARE
    linked_count INTEGER;
    total_deals INTEGER;
BEGIN
    SELECT COUNT(*) INTO linked_count FROM deals WHERE company_id IS NOT NULL;
    SELECT COUNT(*) INTO total_deals FROM deals;
    
    RAISE NOTICE 'Auto-linking completed. % out of % deals now have company links.', linked_count, total_deals;
END $$;














