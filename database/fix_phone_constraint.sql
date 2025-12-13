-- Fix phone number format constraint to accept numbers without + prefix
ALTER TABLE user_phones DROP CONSTRAINT phone_number_format;
ALTER TABLE user_phones ADD CONSTRAINT phone_number_format CHECK (normalized_phone ~ '^998[0-9]{9}$');