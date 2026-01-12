-- Fix malformed URLs in deals table
-- Removes HTML artifacts like u003C/a> from URLs

-- Fix URLs with u003C/a> pattern
UPDATE deals 
SET url = REGEXP_REPLACE(url, 'u003C[^>]*>', '', 'gi')
WHERE url LIKE '%u003C%';

-- Fix URLs with HTML tags like </a>, <wbr/>
UPDATE deals 
SET url = REGEXP_REPLACE(url, '<[^>]*>', '', 'g')
WHERE url LIKE '%<%>';

-- Verify the fix
SELECT id, title, url 
FROM deals 
WHERE url LIKE '%u003C%' OR url LIKE '%<%>';
