-- =====================================================
-- EMOTION GAME TABLES MIGRATION
-- Description: Create tables for emotion recognition game
-- Version: 1.0
-- Date: 2025-01-19
-- =====================================================

-- =====================================================
-- TABLE 1: EMOTION_CARDS (Master Data)
-- Stores all emotion types with their visual representation
-- =====================================================

CREATE TABLE IF NOT EXISTS public.emotion_cards (
    -- Primary key
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

    -- Emotion details
    emotion_name TEXT NOT NULL UNIQUE, -- "happy", "sad", "angry", etc.
    emoji_unicode TEXT NOT NULL, -- "😊", "😢", "😠" (fallback)
    emoji_image_url TEXT, -- URL to animated emoji image
    display_label TEXT NOT NULL, -- "Happy", "Sad", "Angry"
    audio_url TEXT, -- URL to pre-generated TTS audio for the emotion label in Supabase Storage

    -- Game mechanics
    difficulty_level INTEGER DEFAULT 1 CHECK (difficulty_level IN (1, 2, 3)),
    color_theme TEXT DEFAULT '#10B981', -- Hex color for UI theming
    is_active BOOLEAN DEFAULT true,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- =====================================================
-- TABLE 2: EMOTION_QUESTIONS (Question Bank)
-- Stores scenarios/questions for the game
-- =====================================================

CREATE TABLE IF NOT EXISTS public.emotion_questions (
    -- Primary key
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

    -- Question content
    correct_emotion_id UUID NOT NULL REFERENCES public.emotion_cards(id) ON DELETE RESTRICT,
    scenario_text TEXT NOT NULL, -- "This person is smiling and feeling good!"
    scenario_emoji_image_url TEXT, -- URL to the big emoji shown in question
    explanation_text TEXT, -- "This person is crying and feeling down." (for wrong answers)
    audio_url TEXT, -- URL to pre-generated TTS audio in Supabase Storage (cache)

    -- Game mechanics
    difficulty_level INTEGER DEFAULT 1 CHECK (difficulty_level IN (1, 2, 3)),
    is_active BOOLEAN DEFAULT true,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- =====================================================
-- TABLE 3: EMOTION_QUESTION_OPTIONS (Many-to-Many)
-- Links questions to their answer options
-- =====================================================

CREATE TABLE IF NOT EXISTS public.emotion_question_options (
    -- Composite primary key
    question_id UUID NOT NULL REFERENCES public.emotion_questions(id) ON DELETE CASCADE,
    emotion_id UUID NOT NULL REFERENCES public.emotion_cards(id) ON DELETE RESTRICT,

    -- Option details
    is_correct BOOLEAN DEFAULT false,
    order_position INTEGER NOT NULL, -- 1, 2, 3, 4 (display order)

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,

    -- Constraints
    PRIMARY KEY (question_id, emotion_id),
    CHECK (order_position >= 1 AND order_position <= 10)
);

-- =====================================================
-- TABLE 4: EMOTION_GAME_SESSIONS (Game Session Tracking)
-- Tracks each game session played by a patient
-- =====================================================

CREATE TABLE IF NOT EXISTS public.emotion_game_sessions (
    -- Primary key
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

    -- Foreign keys
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Session metrics
    total_questions INTEGER DEFAULT 5 NOT NULL,
    questions_answered INTEGER DEFAULT 0 NOT NULL,
    correct_answers INTEGER DEFAULT 0 NOT NULL,
    total_score INTEGER DEFAULT 0 NOT NULL, -- Coins earned

    -- Session timing
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    is_completed BOOLEAN DEFAULT false,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,

    -- Constraints
    CHECK (questions_answered <= total_questions),
    CHECK (correct_answers <= questions_answered),
    CHECK (total_score >= 0),
    CHECK (
        (is_completed = false AND completed_at IS NULL) OR
        (is_completed = true AND completed_at IS NOT NULL)
    )
);

-- =====================================================
-- TABLE 5: EMOTION_GAME_ANSWERS (Click Tracking)
-- Records every answer attempt in the game
-- =====================================================

CREATE TABLE IF NOT EXISTS public.emotion_game_answers (
    -- Primary key
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

    -- Foreign keys
    session_id UUID NOT NULL REFERENCES public.emotion_game_sessions(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES public.emotion_questions(id) ON DELETE RESTRICT,
    selected_emotion_id UUID NOT NULL REFERENCES public.emotion_cards(id) ON DELETE RESTRICT,
    correct_emotion_id UUID NOT NULL REFERENCES public.emotion_cards(id) ON DELETE RESTRICT,

    -- Answer details
    is_correct BOOLEAN NOT NULL,
    coins_earned INTEGER DEFAULT 0 NOT NULL CHECK (coins_earned >= 0),
    response_time_seconds INTEGER CHECK (response_time_seconds >= 0),
    attempt_number INTEGER DEFAULT 1 NOT NULL CHECK (attempt_number >= 1),

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Emotion cards indexes
CREATE INDEX IF NOT EXISTS idx_emotion_cards_difficulty ON public.emotion_cards(difficulty_level);
CREATE INDEX IF NOT EXISTS idx_emotion_cards_active ON public.emotion_cards(is_active);

-- Emotion questions indexes
CREATE INDEX IF NOT EXISTS idx_emotion_questions_difficulty ON public.emotion_questions(difficulty_level);
CREATE INDEX IF NOT EXISTS idx_emotion_questions_active ON public.emotion_questions(is_active);
CREATE INDEX IF NOT EXISTS idx_emotion_questions_emotion ON public.emotion_questions(correct_emotion_id);

-- Question options indexes
CREATE INDEX IF NOT EXISTS idx_question_options_question ON public.emotion_question_options(question_id);
CREATE INDEX IF NOT EXISTS idx_question_options_emotion ON public.emotion_question_options(emotion_id);

-- Game sessions indexes
CREATE INDEX IF NOT EXISTS idx_game_sessions_patient ON public.emotion_game_sessions(patient_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_user ON public.emotion_game_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_completed ON public.emotion_game_sessions(is_completed);
CREATE INDEX IF NOT EXISTS idx_game_sessions_created ON public.emotion_game_sessions(created_at DESC);

-- Game answers indexes
CREATE INDEX IF NOT EXISTS idx_game_answers_session ON public.emotion_game_answers(session_id);
CREATE INDEX IF NOT EXISTS idx_game_answers_question ON public.emotion_game_answers(question_id);
CREATE INDEX IF NOT EXISTS idx_game_answers_created ON public.emotion_game_answers(created_at DESC);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.emotion_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emotion_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emotion_question_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emotion_game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emotion_game_answers ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES: EMOTION_CARDS (Public Read)
-- =====================================================

DROP POLICY IF EXISTS "Anyone can view active emotion cards" ON public.emotion_cards;
CREATE POLICY "Anyone can view active emotion cards"
    ON public.emotion_cards FOR SELECT
    USING (is_active = true);

-- =====================================================
-- RLS POLICIES: EMOTION_QUESTIONS (Public Read)
-- =====================================================

DROP POLICY IF EXISTS "Anyone can view active questions" ON public.emotion_questions;
CREATE POLICY "Anyone can view active questions"
    ON public.emotion_questions FOR SELECT
    USING (is_active = true);

-- =====================================================
-- RLS POLICIES: EMOTION_QUESTION_OPTIONS (Public Read)
-- =====================================================

DROP POLICY IF EXISTS "Anyone can view question options" ON public.emotion_question_options;
CREATE POLICY "Anyone can view question options"
    ON public.emotion_question_options FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.emotion_questions
            WHERE emotion_questions.id = emotion_question_options.question_id
            AND emotion_questions.is_active = true
        )
    );

-- =====================================================
-- RLS POLICIES: EMOTION_GAME_SESSIONS
-- =====================================================

DROP POLICY IF EXISTS "Users can view sessions of own patients" ON public.emotion_game_sessions;
CREATE POLICY "Users can view sessions of own patients"
    ON public.emotion_game_sessions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.patients
            WHERE patients.id = emotion_game_sessions.patient_id
            AND patients.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can insert sessions for own patients" ON public.emotion_game_sessions;
CREATE POLICY "Users can insert sessions for own patients"
    ON public.emotion_game_sessions FOR INSERT
    WITH CHECK (
        auth.uid() = user_id AND
        EXISTS (
            SELECT 1 FROM public.patients
            WHERE patients.id = patient_id
            AND patients.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can update sessions of own patients" ON public.emotion_game_sessions;
CREATE POLICY "Users can update sessions of own patients"
    ON public.emotion_game_sessions FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.patients
            WHERE patients.id = emotion_game_sessions.patient_id
            AND patients.user_id = auth.uid()
        )
    );

-- =====================================================
-- RLS POLICIES: EMOTION_GAME_ANSWERS
-- =====================================================

DROP POLICY IF EXISTS "Users can view answers from own patient sessions" ON public.emotion_game_answers;
CREATE POLICY "Users can view answers from own patient sessions"
    ON public.emotion_game_answers FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.emotion_game_sessions
            JOIN public.patients ON patients.id = emotion_game_sessions.patient_id
            WHERE emotion_game_sessions.id = emotion_game_answers.session_id
            AND patients.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can insert answers for own patient sessions" ON public.emotion_game_answers;
CREATE POLICY "Users can insert answers for own patient sessions"
    ON public.emotion_game_answers FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.emotion_game_sessions
            JOIN public.patients ON patients.id = emotion_game_sessions.patient_id
            WHERE emotion_game_sessions.id = session_id
            AND patients.user_id = auth.uid()
        )
    );

-- =====================================================
-- TRIGGERS FOR AUTO-UPDATE TIMESTAMPS
-- =====================================================

DROP TRIGGER IF EXISTS update_emotion_cards_updated_at ON public.emotion_cards;
CREATE TRIGGER update_emotion_cards_updated_at
    BEFORE UPDATE ON public.emotion_cards
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS update_emotion_questions_updated_at ON public.emotion_questions;
CREATE TRIGGER update_emotion_questions_updated_at
    BEFORE UPDATE ON public.emotion_questions
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- =====================================================
-- COMMENTS (DOCUMENTATION)
-- =====================================================

COMMENT ON TABLE public.emotion_cards IS 'Master data: All emotion types with visual representations';
COMMENT ON TABLE public.emotion_questions IS 'Question bank: Scenarios for emotion recognition game';
COMMENT ON TABLE public.emotion_question_options IS 'Many-to-many: Links questions to answer options';
COMMENT ON TABLE public.emotion_game_sessions IS 'Game sessions: Tracks each game played by a patient';
COMMENT ON TABLE public.emotion_game_answers IS 'Answer tracking: Records every click/answer in the game';

COMMENT ON COLUMN public.emotion_cards.emotion_name IS 'Unique identifier: happy, sad, angry, etc.';
COMMENT ON COLUMN public.emotion_cards.emoji_unicode IS 'Unicode emoji for fallback: 😊, 😢, 😠';
COMMENT ON COLUMN public.emotion_cards.emoji_image_url IS 'URL to animated emoji image';
COMMENT ON COLUMN public.emotion_cards.difficulty_level IS 'Difficulty: 1=easy, 2=medium, 3=hard';

COMMENT ON COLUMN public.emotion_questions.scenario_text IS 'Description shown to user: "This person is smiling..."';
COMMENT ON COLUMN public.emotion_questions.explanation_text IS 'Explanation for wrong answers';

COMMENT ON COLUMN public.emotion_game_sessions.total_score IS 'Total coins earned in this session';
COMMENT ON COLUMN public.emotion_game_sessions.is_completed IS 'Whether the session was finished';

COMMENT ON COLUMN public.emotion_game_answers.coins_earned IS 'Coins earned for this specific answer (usually +20 for correct)';
COMMENT ON COLUMN public.emotion_game_answers.response_time_seconds IS 'How long the child took to answer';
COMMENT ON COLUMN public.emotion_game_answers.attempt_number IS 'Which attempt: 1st, 2nd, 3rd, etc.';

-- =====================================================
-- GRANTS (PERMISSIONS)
-- =====================================================

GRANT ALL ON public.emotion_cards TO authenticated;
GRANT ALL ON public.emotion_questions TO authenticated;
GRANT ALL ON public.emotion_question_options TO authenticated;
GRANT ALL ON public.emotion_game_sessions TO authenticated;
GRANT ALL ON public.emotion_game_answers TO authenticated;

-- =====================================================
-- SAMPLE DATA (SEED EMOTIONS)
-- =====================================================

-- Insert basic emotions
INSERT INTO public.emotion_cards (emotion_name, emoji_unicode, display_label, difficulty_level, color_theme) VALUES
    ('happy', '😊', 'Happy', 1, '#10B981'),
    ('sad', '😢', 'Sad', 1, '#3B82F6'),
    ('angry', '😠', 'Angry', 1, '#EF4444'),
    ('surprised', '😮', 'Surprised', 2, '#F59E0B'),
    ('excited', '🤩', 'Excited', 2, '#8B5CF6'),
    ('tired', '😴', 'Tired', 2, '#6B7280'),
    ('scared', '😨', 'Scared', 2, '#F97316'),
    ('confused', '😕', 'Confused', 3, '#EC4899'),
    ('proud', '😊', 'Proud', 3, '#14B8A6'),
    ('frustrated', '😤', 'Frustrated', 3, '#DC2626')
ON CONFLICT (emotion_name) DO NOTHING;

-- =====================================================
-- ✅ MIGRATION COMPLETE
-- =====================================================

SELECT '🎉 Emotion Game tables created successfully!' as status,
       'Tables: emotion_cards, emotion_questions, emotion_question_options, emotion_game_sessions, emotion_game_answers' as tables_created,
       '10 sample emotions seeded' as seed_data;
