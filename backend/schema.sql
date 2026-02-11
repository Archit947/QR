-- QR Codes Table
CREATE TABLE qr_codes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    machine_name TEXT NOT NULL,
    location TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Training Content Table
CREATE TABLE training_content (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('PDF', 'Video')),
    url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Junction Table: QR <-> Content
CREATE TABLE qr_content_mapping (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    qr_id UUID REFERENCES qr_codes(id) ON DELETE CASCADE,
    content_id UUID REFERENCES training_content(id) ON DELETE CASCADE,
    UNIQUE(qr_id, content_id)
);

-- Users Table (Employees) - Extends Supabase Auth or Standalone
CREATE TABLE profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT,
    department TEXT,
    role TEXT DEFAULT 'employee', -- 'admin' or 'employee'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tracking / Scans
CREATE TABLE scans (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id),
    qr_id UUID REFERENCES qr_codes(id),
    scanned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Training Progress
CREATE TABLE training_progress (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id),
    content_id UUID REFERENCES training_content(id),
    status TEXT DEFAULT 'started', -- 'started', 'completed'
    completed_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(user_id, content_id)
);

-- Certificates
CREATE TABLE certificates (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id),
    course_name TEXT,
    issued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expiry_date TIMESTAMP WITH TIME ZONE
);
