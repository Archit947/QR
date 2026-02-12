-- Drop ALL likely conflicting policies to ensure a clean slate
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile." ON profiles;
DROP POLICY IF EXISTS "Users can update own profile." ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles; -- Added this one
DROP POLICY IF EXISTS "Allow individual read access" ON profiles;
DROP POLICY IF EXISTS "Allow individual update access" ON profiles;
DROP POLICY IF EXISTS "Allow admin read access" ON profiles;
DROP POLICY IF EXISTS "Allow admin update access" ON profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON profiles;
DROP POLICY IF EXISTS "Enable update for users based on email" ON profiles;

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 1. Users can view their own profile (SAFE, Non-recursive)
CREATE POLICY "Users can view own profile" 
ON profiles FOR SELECT 
USING (auth.uid() = id);

-- 2. Users can update their own profile
CREATE POLICY "Users can update own profile" 
ON profiles FOR UPDATE 
USING (auth.uid() = id);

-- 3. Users can insert their own profile (often needed for triggers)
CREATE POLICY "Users can insert own profile" 
ON profiles FOR INSERT 
WITH CHECK (auth.uid() = id);
