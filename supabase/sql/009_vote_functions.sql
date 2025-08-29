-- Database functions for vote aggregation and deal scoring

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS get_votes_agg();
DROP FUNCTION IF EXISTS get_votes_for_deal(bigint);
DROP FUNCTION IF EXISTS get_user_vote(bigint, uuid);

-- Function to get aggregated votes for all deals
CREATE OR REPLACE FUNCTION get_votes_agg()
RETURNS TABLE (
  deal_id bigint,
  ups bigint,
  downs bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    v.deal_id,
    COALESCE(SUM(CASE WHEN v.value = 1 THEN 1 ELSE 0 END), 0) as ups,
    COALESCE(SUM(CASE WHEN v.value = -1 THEN 1 ELSE 0 END), 0) as downs
  FROM public.votes v
  GROUP BY v.deal_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get votes for a specific deal
CREATE OR REPLACE FUNCTION get_votes_for_deal(p_deal_id bigint)
RETURNS TABLE (
  ups bigint,
  downs bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(CASE WHEN v.value = 1 THEN 1 ELSE 0 END), 0) as ups,
    COALESCE(SUM(CASE WHEN v.value = -1 THEN 1 ELSE 0 END), 0) as downs
  FROM public.votes v
  WHERE v.deal_id = p_deal_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's vote for a deal
CREATE OR REPLACE FUNCTION get_user_vote(p_deal_id bigint, p_user_id uuid)
RETURNS int AS $$
DECLARE
  user_vote int;
BEGIN
  SELECT value INTO user_vote
  FROM public.votes
  WHERE deal_id = p_deal_id AND user_id = p_user_id;
  
  RETURN COALESCE(user_vote, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_votes_agg() TO authenticated;
GRANT EXECUTE ON FUNCTION get_votes_for_deal(bigint) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_vote(bigint, uuid) TO authenticated;

-- Also grant to anon users for public vote viewing
GRANT EXECUTE ON FUNCTION get_votes_agg() TO anon;
GRANT EXECUTE ON FUNCTION get_votes_for_deal(bigint) TO anon;
