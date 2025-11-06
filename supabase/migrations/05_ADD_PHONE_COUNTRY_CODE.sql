-- Add phone_country_code column to profiles table
-- This will store the country code separately from the phone number

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS phone_country_code text DEFAULT NULL;

COMMENT ON COLUMN public.profiles.phone_country_code IS 'Phone country code (e.g., +351, +49, +1)';

-- Update existing records: extract country code from phone field if it exists
UPDATE public.profiles
SET phone_country_code = CASE
    WHEN phone ~ '^\+\d{1,4}' THEN substring(phone from '^\+\d{1,4}')
    ELSE '+351'
END
WHERE phone IS NOT NULL AND phone != '';

-- Remove country code from phone field (keep only the number)
UPDATE public.profiles
SET phone = regexp_replace(phone, '^\+\d{1,4}\s*', '')
WHERE phone IS NOT NULL AND phone ~ '^\+\d{1,4}';
