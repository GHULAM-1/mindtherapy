-- Add global child mode PIN to profiles table
-- This PIN will be used for all patients of a user, instead of per-patient PINs

-- Add global_child_mode_pin column to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS global_child_mode_pin text;

COMMENT ON COLUMN public.profiles.global_child_mode_pin IS 'Global PIN code (6 digits) used to protect child mode access for all patients';

-- Remove child_mode_pin from patients table (no longer needed)
ALTER TABLE public.patients
DROP COLUMN IF EXISTS child_mode_pin;

COMMENT ON TABLE public.profiles IS 'User profiles with authentication and preferences';
