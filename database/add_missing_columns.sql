-- Add missing columns to user_phones table
ALTER TABLE user_phones 
ADD COLUMN IF NOT EXISTS original_phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS registry_row INTEGER;