-- Add missing role column to profiles table
-- This fixes the "column profiles.role does not exist" error

-- First, create the role enum if it doesn't exist
DO $$ BEGIN
  CREATE TYPE role_enum AS ENUM ('user', 'mod', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Add the role column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role role_enum NOT NULL DEFAULT 'user';

-- Create an index on the role column for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- Update the is_admin() function to work properly
CREATE OR REPLACE FUNCTION public.is_admin() RETURNS BOOLEAN
LANGUAGE SQL STABLE AS $$
  SELECT EXISTS(
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  );
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- Success message
SELECT 'Role column added to profiles table successfully!' as status;
