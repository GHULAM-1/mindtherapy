-- Add child_mode_pin column to patients table
-- This PIN is used to protect access to child mode and prevent accidental navigation

ALTER TABLE public.patients
ADD COLUMN IF NOT EXISTS child_mode_pin text;

COMMENT ON COLUMN public.patients.child_mode_pin IS 'PIN code (6 digits) to protect child mode access';
