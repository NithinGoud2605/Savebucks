-- Add name fields to profiles table
-- This allows users to have first name, last name, and display name

-- Add name fields to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS display_name TEXT;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_first_name ON public.profiles(first_name);
CREATE INDEX IF NOT EXISTS idx_profiles_last_name ON public.profiles(last_name);
CREATE INDEX IF NOT EXISTS idx_profiles_display_name ON public.profiles(display_name);

-- Success message
SELECT 'Name fields added to profiles table successfully!' as status;
