-- =====================================================
-- ROLLBACK: EMOTION GAME TABLES MIGRATION
-- Description: Undo all changes made by 07_CREATE_EMOTION_GAME_TABLES.sql
-- Version: 1.0
-- Date: 2025-01-19
-- =====================================================
--
-- ⚠️  WARNING: This will delete ALL emotion game data!
-- - All game sessions
-- - All answer records
-- - All questions
-- - All emotion cards
--
-- Only run this if you want to completely remove the emotion game feature
-- or need to start fresh with the migration.
--
-- =====================================================

-- =====================================================
-- STEP 1: DROP ALL POLICIES
-- =====================================================

-- Emotion Cards Policies
DROP POLICY IF EXISTS "Anyone can view active emotion cards" ON public.emotion_cards;

-- Emotion Questions Policies
DROP POLICY IF EXISTS "Anyone can view active questions" ON public.emotion_questions;

-- Emotion Question Options Policies
DROP POLICY IF EXISTS "Anyone can view question options" ON public.emotion_question_options;

-- Emotion Game Sessions Policies
DROP POLICY IF EXISTS "Users can view sessions of own patients" ON public.emotion_game_sessions;
DROP POLICY IF EXISTS "Users can insert sessions for own patients" ON public.emotion_game_sessions;
DROP POLICY IF EXISTS "Users can update sessions of own patients" ON public.emotion_game_sessions;

-- Emotion Game Answers Policies
DROP POLICY IF EXISTS "Users can view answers from own patient sessions" ON public.emotion_game_answers;
DROP POLICY IF EXISTS "Users can insert answers for own patient sessions" ON public.emotion_game_answers;

-- =====================================================
-- STEP 2: DROP ALL TRIGGERS
-- =====================================================

DROP TRIGGER IF EXISTS update_emotion_cards_updated_at ON public.emotion_cards;
DROP TRIGGER IF EXISTS update_emotion_questions_updated_at ON public.emotion_questions;

-- =====================================================
-- STEP 3: DROP ALL INDEXES
-- =====================================================

-- Emotion cards indexes
DROP INDEX IF EXISTS public.idx_emotion_cards_difficulty;
DROP INDEX IF EXISTS public.idx_emotion_cards_active;

-- Emotion questions indexes
DROP INDEX IF EXISTS public.idx_emotion_questions_difficulty;
DROP INDEX IF EXISTS public.idx_emotion_questions_active;
DROP INDEX IF EXISTS public.idx_emotion_questions_emotion;

-- Question options indexes
DROP INDEX IF EXISTS public.idx_question_options_question;
DROP INDEX IF EXISTS public.idx_question_options_emotion;

-- Game sessions indexes
DROP INDEX IF EXISTS public.idx_game_sessions_patient;
DROP INDEX IF EXISTS public.idx_game_sessions_user;
DROP INDEX IF EXISTS public.idx_game_sessions_completed;
DROP INDEX IF EXISTS public.idx_game_sessions_created;

-- Game answers indexes
DROP INDEX IF EXISTS public.idx_game_answers_session;
DROP INDEX IF EXISTS public.idx_game_answers_question;
DROP INDEX IF EXISTS public.idx_game_answers_created;

-- =====================================================
-- STEP 4: DROP ALL TABLES (In correct order due to foreign keys)
-- =====================================================

-- Drop in reverse order of dependencies
DROP TABLE IF EXISTS public.emotion_game_answers CASCADE;
DROP TABLE IF EXISTS public.emotion_game_sessions CASCADE;
DROP TABLE IF EXISTS public.emotion_question_options CASCADE;
DROP TABLE IF EXISTS public.emotion_questions CASCADE;
DROP TABLE IF EXISTS public.emotion_cards CASCADE;

-- =====================================================
-- VERIFICATION: Check what's left
-- =====================================================

-- List remaining tables related to emotion game
SELECT 'Checking for remaining emotion game tables...' as info;
SELECT tablename
FROM pg_tables
WHERE schemaname = 'public'
AND tablename LIKE '%emotion%'
ORDER BY tablename;

-- =====================================================
-- ✅ ROLLBACK COMPLETE
-- =====================================================

SELECT '✅ Rollback completed successfully!' as status,
       'All emotion game tables, indexes, triggers, and policies have been removed.' as message,
       'You can now re-run 07_CREATE_EMOTION_GAME_TABLES.sql if needed.' as next_step;
