-- Create user_phones table for telegram phone registration system
CREATE TABLE IF NOT EXISTS user_phones (
    id BIGSERIAL PRIMARY KEY,
    telegram_id BIGINT UNIQUE NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    normalized_phone VARCHAR(20) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    username VARCHAR(100),
    language_code VARCHAR(10) DEFAULT 'uz',
    is_registered BOOLEAN DEFAULT true,
    registered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT unique_telegram_phone UNIQUE(telegram_id, phone_number),
    CONSTRAINT phone_number_format CHECK (normalized_phone ~ '^\+998[0-9]{9}$')
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_phones_telegram_id ON user_phones(telegram_id);
CREATE INDEX IF NOT EXISTS idx_user_phones_phone_number ON user_phones(normalized_phone);
CREATE INDEX IF NOT EXISTS idx_user_phones_registered ON user_phones(is_registered);

-- Add RLS policies if using Supabase
ALTER TABLE user_phones ENABLE ROW LEVEL SECURITY;

-- Policy to allow all operations for the service role (for bot operations)
CREATE POLICY IF NOT EXISTS "Allow all for service role" ON user_phones
    FOR ALL USING (true);