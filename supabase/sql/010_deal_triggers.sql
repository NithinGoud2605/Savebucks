-- Triggers for deal management

-- Function to set submitter_id automatically
CREATE OR REPLACE FUNCTION set_deal_submitter()
RETURNS TRIGGER AS $$
BEGIN
  -- Set submitter_id to the current authenticated user
  NEW.submitter_id = auth.uid();
  
  -- Set created_at if not provided
  IF NEW.created_at IS NULL THEN
    NEW.created_at = NOW();
  END IF;
  
  -- Set updated_at
  NEW.updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to set submitter_id on deal insert
DROP TRIGGER IF EXISTS set_deal_submitter_trigger ON public.deals;
CREATE TRIGGER set_deal_submitter_trigger
  BEFORE INSERT ON public.deals
  FOR EACH ROW
  EXECUTE FUNCTION set_deal_submitter();

-- Function to set user_id for comments
CREATE OR REPLACE FUNCTION set_comment_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Set user_id to the current authenticated user
  NEW.user_id = auth.uid();
  
  -- Set created_at if not provided
  IF NEW.created_at IS NULL THEN
    NEW.created_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to set user_id on comment insert
DROP TRIGGER IF EXISTS set_comment_user_trigger ON public.comments;
CREATE TRIGGER set_comment_user_trigger
  BEFORE INSERT ON public.comments
  FOR EACH ROW
  EXECUTE FUNCTION set_comment_user();

-- Function to set user_id for votes
CREATE OR REPLACE FUNCTION set_vote_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Set user_id to the current authenticated user
  NEW.user_id = auth.uid();
  
  -- Set created_at if not provided
  IF NEW.created_at IS NULL THEN
    NEW.created_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to set user_id on vote insert
DROP TRIGGER IF EXISTS set_vote_user_trigger ON public.votes;
CREATE TRIGGER set_vote_user_trigger
  BEFORE INSERT ON public.votes
  FOR EACH ROW
  EXECUTE FUNCTION set_vote_user();

-- Function to set reporter_id for reports
CREATE OR REPLACE FUNCTION set_report_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Set reporter_id to the current authenticated user
  NEW.reporter_id = auth.uid();
  
  -- Set created_at if not provided
  IF NEW.created_at IS NULL THEN
    NEW.created_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to set reporter_id on report insert
DROP TRIGGER IF EXISTS set_report_user_trigger ON public.reports;
CREATE TRIGGER set_report_user_trigger
  BEFORE INSERT ON public.reports
  FOR EACH ROW
  EXECUTE FUNCTION set_report_user();
