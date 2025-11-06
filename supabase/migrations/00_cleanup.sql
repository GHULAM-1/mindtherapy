-- =====================================================
-- CLEANUP SCRIPT - Reset Database
-- USE WITH CAUTION: This will delete ALL data
-- =====================================================

-- WARNING: This script will remove:
-- - All tables (profiles, patients, sessions, documents, etc.)
-- - All storage buckets and files
-- - All custom types (ENUMs)
-- - All functions and triggers
-- You will lose ALL DATA in these tables!
--
-- Only run this if you want to start fresh with migrations

-- =====================================================
-- STEP 1: Drop all tables (in correct order due to foreign keys)
-- =====================================================

DROP TABLE IF EXISTS public.document_category_assignments CASCADE;
DROP TABLE IF EXISTS public.document_categories CASCADE;
DROP TABLE IF EXISTS public.patient_documents CASCADE;
DROP TABLE IF EXISTS public.patient_gamification CASCADE;
DROP TABLE IF EXISTS public.sessions CASCADE;
DROP TABLE IF EXISTS public.patients CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- =====================================================
-- STEP 2: Drop views
-- =====================================================

DROP VIEW IF EXISTS document_stats CASCADE;

-- =====================================================
-- STEP 3: Drop custom types (ENUMs)
-- =====================================================

DROP TYPE IF EXISTS document_type CASCADE;
DROP TYPE IF EXISTS patient_status CASCADE;
DROP TYPE IF EXISTS language_code CASCADE;
DROP TYPE IF EXISTS autism_level CASCADE;
DROP TYPE IF EXISTS patient_condition CASCADE;

-- =====================================================
-- STEP 4: Drop functions
-- =====================================================

DROP FUNCTION IF EXISTS public.handle_new_patient() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.handle_updated_at() CASCADE;

-- =====================================================
-- STEP 5: Clean storage buckets (IMPORTANT!)
-- =====================================================

-- Delete all files from avatars bucket
DELETE FROM storage.objects WHERE bucket_id = 'avatars';

-- Delete all files from patient-documents bucket
DELETE FROM storage.objects WHERE bucket_id = 'patient-documents';

-- Delete the buckets themselves
DELETE FROM storage.buckets WHERE id = 'avatars';
DELETE FROM storage.buckets WHERE id = 'patient-documents';

-- =====================================================
-- VERIFICATION: Check what's left
-- =====================================================

-- List remaining tables
SELECT 'Remaining tables:' as info;
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;

-- List remaining types
SELECT 'Remaining types:' as info;
SELECT typname FROM pg_type WHERE typnamespace = 'public'::regnamespace ORDER BY typname;

-- List remaining buckets
SELECT 'Remaining buckets:' as info;
SELECT * FROM storage.buckets;

-- =====================================================
-- CLEANUP COMPLETE
-- =====================================================

SELECT '✅ Cleanup completed! You can now run APPLY_ALL_MIGRATIONS.sql' as status;
