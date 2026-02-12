-- 1. DROP ALL EXISTING POLICIES on 'profiles' dynamically
-- This is necessary because we might not know the exact names of the conflicting policies.
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'profiles') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON profiles';
    END LOOP;
END $$;

-- 2. Enable RLS (just in case it was disabled)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 3. Create simple, non-recursive policies

-- Allow users to view their own profile
CREATE POLICY "Users can view own profile" 
ON profiles FOR SELECT 
USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile" 
ON profiles FOR UPDATE 
USING (auth.uid() = id);

-- Allow users to insert their own profile
CREATE POLICY "Users can insert own profile" 
ON profiles FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Allow public read access to basic profile info (optional, helps with avatars/names if widely needed)
-- NOTE: If you strictly want privacy, keep this commented out. 
-- But for many apps, knowing "Name" and "Avatar" of others is fine.
-- CREATE POLICY "Public profiles are viewable by everyone"
-- ON profiles FOR SELECT
-- USING (true);
