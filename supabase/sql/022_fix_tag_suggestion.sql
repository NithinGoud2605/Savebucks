-- Fix for suggest_tags_for_content function to resolve function result type mismatch
-- The issue is that the function expects different return types than what's being returned

CREATE OR REPLACE FUNCTION suggest_tags_for_content(
  title_text TEXT,
  description_text TEXT DEFAULT '',
  max_suggestions INT DEFAULT 10
)
RETURNS TABLE (
  tag_id INT,
  tag_name TEXT,
  tag_slug TEXT,
  relevance_score FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id::INT as tag_id,
    t.name::TEXT as tag_name,
    t.slug::TEXT as tag_slug,
    (
      CASE 
        WHEN LOWER(title_text) LIKE '%' || LOWER(t.name) || '%' THEN 3.0
        WHEN LOWER(description_text) LIKE '%' || LOWER(t.name) || '%' THEN 2.0
        WHEN LOWER(title_text) LIKE '%' || LOWER(SPLIT_PART(t.name, ' ', 1)) || '%' THEN 1.5
        ELSE 0.0
      END
    )::FLOAT as relevance_score
  FROM public.tags t
  WHERE (
    LOWER(title_text) LIKE '%' || LOWER(t.name) || '%'
    OR LOWER(description_text) LIKE '%' || LOWER(t.name) || '%'
    OR LOWER(title_text) LIKE '%' || LOWER(SPLIT_PART(t.name, ' ', 1)) || '%'
  )
  ORDER BY relevance_score DESC, t.is_featured DESC, t.name ASC
  LIMIT max_suggestions;
END;
$$;
