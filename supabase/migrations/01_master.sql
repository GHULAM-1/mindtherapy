-- =====================================================
-- MINDTHERAPY - MASTER MIGRATION V1
-- Complete database schema setup
-- Run this ONCE on a fresh Supabase project
-- =====================================================

-- =====================================================
-- SECTION 1: CUSTOM TYPES (ENUMS)
-- =====================================================

-- User situation types
DO $$ BEGIN
    CREATE TYPE user_situation AS ENUM (
        'parent-autism',
        'parent-other',
        'caregiver',
        'professional-psychologist',
        'professional-therapist',
        'professional-teacher',
        'professional-other',
        'individual-autism',
        'individual-other',
        'researcher',
        'other'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Patient condition types
DO $$ BEGIN
    CREATE TYPE patient_condition AS ENUM (
        'autism_level_1',
        'autism_level_2',
        'autism_level_3',
        'adhd',
        'communication_disorder',
        'intellectual_disability',
        'learning_disability',
        'down_syndrome',
        'cerebral_palsy',
        'other'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Autism support levels
DO $$ BEGIN
    CREATE TYPE autism_level AS ENUM ('1', '2', '3');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Language codes
DO $$ BEGIN
    CREATE TYPE language_code AS ENUM ('pt', 'en', 'es', 'fr', 'de', 'it');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Patient status
DO $$ BEGIN
    CREATE TYPE patient_status AS ENUM ('active', 'inactive', 'needs_attention');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Document types
DO $$ BEGIN
    CREATE TYPE document_type AS ENUM (
        'medical_report',
        'therapy_report',
        'exam_result',
        'prescription',
        'diagnosis',
        'progress_note',
        'school_report',
        'assessment',
        'photo',
        'video',
        'other'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =====================================================
-- SECTION 2: UTILITY FUNCTIONS
-- =====================================================

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- SECTION 3: PROFILES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.profiles (
    -- Primary key
    id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,

    -- Basic info
    email text UNIQUE NOT NULL,
    full_name text,
    situation user_situation,
    accept_newsletter boolean DEFAULT false,

    -- Avatar
    avatar_url text,

    -- Contact & professional info
    phone text,
    bio text,
    organization text,
    role text,

    -- Preferences
    notification_preferences jsonb DEFAULT '{"email": true, "push": true, "sms": false}'::jsonb,
    theme_preference text DEFAULT 'light',
    language_preference text DEFAULT 'pt',

    -- Onboarding
    profile_completed boolean DEFAULT false,

    -- Timestamps
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS on_profile_updated ON public.profiles;
CREATE TRIGGER on_profile_updated
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =====================================================
-- SECTION 4: AUTO-CREATE PROFILE ON SIGNUP
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'name')
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- SECTION 5: PATIENTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.patients (
    -- Primary key
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,

    -- Basic info
    name text NOT NULL,
    date_of_birth date NOT NULL,
    gender text,
    avatar_url text,

    -- Medical/condition info
    condition patient_condition NOT NULL,
    autism_level autism_level,

    -- Settings
    language language_code DEFAULT 'pt' NOT NULL,
    status patient_status DEFAULT 'active' NOT NULL,
    weekly_goal integer DEFAULT 3 NOT NULL,

    -- Additional info
    additional_info text,

    -- Medical details
    medical_notes text,
    allergies text,
    medications text,
    therapy_goals text,

    -- Personal info
    special_interests text,
    communication_preferences text,
    behavioral_notes text,
    school_info text,

    -- Emergency contact
    emergency_contact_name text,
    emergency_contact_phone text,
    emergency_contact_relationship text,

    -- Timestamps
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view own patients" ON public.patients;
CREATE POLICY "Users can view own patients"
    ON public.patients FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own patients" ON public.patients;
CREATE POLICY "Users can insert own patients"
    ON public.patients FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own patients" ON public.patients;
CREATE POLICY "Users can update own patients"
    ON public.patients FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own patients" ON public.patients;
CREATE POLICY "Users can delete own patients"
    ON public.patients FOR DELETE
    USING (auth.uid() = user_id);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS on_patient_updated ON public.patients;
CREATE TRIGGER on_patient_updated
    BEFORE UPDATE ON public.patients
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Indexes
CREATE INDEX IF NOT EXISTS patients_user_id_idx ON public.patients (user_id);
CREATE INDEX IF NOT EXISTS patients_status_idx ON public.patients (status);
CREATE INDEX IF NOT EXISTS patients_created_at_idx ON public.patients (created_at DESC);

-- =====================================================
-- SECTION 6: SESSIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.sessions (
    -- Primary key
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id uuid REFERENCES public.patients ON DELETE CASCADE NOT NULL,
    user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,

    -- Session info
    tool_name text NOT NULL,
    duration_minutes integer NOT NULL,
    score integer CHECK (score >= 0 AND score <= 100),
    notes text,

    -- Timestamps
    session_date timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view sessions of own patients" ON public.sessions;
CREATE POLICY "Users can view sessions of own patients"
    ON public.sessions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.patients
            WHERE patients.id = sessions.patient_id
            AND patients.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can insert sessions for own patients" ON public.sessions;
CREATE POLICY "Users can insert sessions for own patients"
    ON public.sessions FOR INSERT
    WITH CHECK (
        auth.uid() = user_id AND
        EXISTS (
            SELECT 1 FROM public.patients
            WHERE patients.id = patient_id
            AND patients.user_id = auth.uid()
        )
    );

-- Indexes
CREATE INDEX IF NOT EXISTS sessions_patient_id_idx ON public.sessions (patient_id);
CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON public.sessions (user_id);
CREATE INDEX IF NOT EXISTS sessions_date_idx ON public.sessions (session_date DESC);

-- =====================================================
-- SECTION 7: GAMIFICATION TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.patient_gamification (
    -- Primary key
    patient_id uuid REFERENCES public.patients ON DELETE CASCADE PRIMARY KEY,

    -- Gamification data
    level integer DEFAULT 1 NOT NULL,
    total_points integer DEFAULT 0 NOT NULL,
    current_streak integer DEFAULT 0 NOT NULL,
    longest_streak integer DEFAULT 0 NOT NULL,
    achievements jsonb DEFAULT '[]'::jsonb,
    last_activity_date date,

    -- Timestamps
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.patient_gamification ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view gamification of own patients" ON public.patient_gamification;
CREATE POLICY "Users can view gamification of own patients"
    ON public.patient_gamification FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.patients
            WHERE patients.id = patient_gamification.patient_id
            AND patients.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can update gamification of own patients" ON public.patient_gamification;
CREATE POLICY "Users can update gamification of own patients"
    ON public.patient_gamification FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.patients
            WHERE patients.id = patient_gamification.patient_id
            AND patients.user_id = auth.uid()
        )
    );

-- Trigger for updated_at
DROP TRIGGER IF EXISTS on_gamification_updated ON public.patient_gamification;
CREATE TRIGGER on_gamification_updated
    BEFORE UPDATE ON public.patient_gamification
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Auto-create gamification record when patient is created
CREATE OR REPLACE FUNCTION public.handle_new_patient()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.patient_gamification (patient_id)
    VALUES (NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_patient_created ON public.patients;
CREATE TRIGGER on_patient_created
    AFTER INSERT ON public.patients
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_patient();

-- =====================================================
-- SECTION 8: DOCUMENTS TABLES
-- =====================================================

-- Main documents table
CREATE TABLE IF NOT EXISTS public.patient_documents (
    -- Primary key
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id uuid REFERENCES public.patients ON DELETE CASCADE NOT NULL,
    user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,

    -- Document info
    title text NOT NULL,
    description text,
    document_type document_type NOT NULL,

    -- File info
    file_name text NOT NULL,
    file_path text NOT NULL,
    file_size bigint NOT NULL,
    mime_type text NOT NULL,

    -- Metadata
    document_date date,
    tags text[],
    is_favorite boolean DEFAULT false,

    -- Timestamps
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Document categories table
CREATE TABLE IF NOT EXISTS public.document_categories (
    -- Primary key
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,

    -- Category info
    name text NOT NULL,
    color text DEFAULT '#8B5CF6',
    icon text,

    -- Timestamps
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,

    -- Unique constraint
    UNIQUE(user_id, name)
);

-- Document-category junction table (many-to-many)
CREATE TABLE IF NOT EXISTS public.document_category_assignments (
    document_id uuid REFERENCES public.patient_documents ON DELETE CASCADE NOT NULL,
    category_id uuid REFERENCES public.document_categories ON DELETE CASCADE NOT NULL,
    PRIMARY KEY (document_id, category_id)
);

-- Enable RLS
ALTER TABLE public.patient_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_category_assignments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for documents
DROP POLICY IF EXISTS "Users can view documents of their patients" ON public.patient_documents;
CREATE POLICY "Users can view documents of their patients"
    ON public.patient_documents FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.patients
            WHERE patients.id = patient_documents.patient_id
            AND patients.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can insert documents for their patients" ON public.patient_documents;
CREATE POLICY "Users can insert documents for their patients"
    ON public.patient_documents FOR INSERT
    WITH CHECK (
        auth.uid() = user_id AND
        EXISTS (
            SELECT 1 FROM public.patients
            WHERE patients.id = patient_id
            AND patients.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can update documents of their patients" ON public.patient_documents;
CREATE POLICY "Users can update documents of their patients"
    ON public.patient_documents FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.patients
            WHERE patients.id = patient_documents.patient_id
            AND patients.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can delete documents of their patients" ON public.patient_documents;
CREATE POLICY "Users can delete documents of their patients"
    ON public.patient_documents FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.patients
            WHERE patients.id = patient_documents.patient_id
            AND patients.user_id = auth.uid()
        )
    );

-- RLS Policies for categories
DROP POLICY IF EXISTS "Users can view their own categories" ON public.document_categories;
CREATE POLICY "Users can view their own categories"
    ON public.document_categories FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own categories" ON public.document_categories;
CREATE POLICY "Users can insert their own categories"
    ON public.document_categories FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own categories" ON public.document_categories;
CREATE POLICY "Users can update their own categories"
    ON public.document_categories FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own categories" ON public.document_categories;
CREATE POLICY "Users can delete their own categories"
    ON public.document_categories FOR DELETE
    USING (auth.uid() = user_id);

-- RLS Policies for category assignments
DROP POLICY IF EXISTS "Users can manage category assignments" ON public.document_category_assignments;
CREATE POLICY "Users can manage category assignments"
    ON public.document_category_assignments FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.patient_documents pd
            JOIN public.patients p ON p.id = pd.patient_id
            WHERE pd.id = document_category_assignments.document_id
            AND p.user_id = auth.uid()
        )
    );

-- Trigger for updated_at on documents
DROP TRIGGER IF EXISTS on_document_updated ON public.patient_documents;
CREATE TRIGGER on_document_updated
    BEFORE UPDATE ON public.patient_documents
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Indexes for documents
CREATE INDEX IF NOT EXISTS documents_patient_id_idx ON public.patient_documents (patient_id);
CREATE INDEX IF NOT EXISTS documents_user_id_idx ON public.patient_documents (user_id);
CREATE INDEX IF NOT EXISTS documents_type_idx ON public.patient_documents (document_type);
CREATE INDEX IF NOT EXISTS documents_created_at_idx ON public.patient_documents (created_at DESC);
CREATE INDEX IF NOT EXISTS documents_tags_idx ON public.patient_documents USING gin(tags);
CREATE INDEX IF NOT EXISTS document_categories_user_id_idx ON public.document_categories (user_id);

-- =====================================================
-- SECTION 9: STORAGE BUCKETS
-- =====================================================

-- Avatars bucket (public)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Patient documents bucket (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('patient-documents', 'patient-documents', false)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- SECTION 10: STORAGE POLICIES
-- =====================================================

-- Avatars storage policies
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
CREATE POLICY "Users can upload their own avatar"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'avatars' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
CREATE POLICY "Users can update their own avatar"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (
        bucket_id = 'avatars' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
CREATE POLICY "Users can delete their own avatar"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'avatars' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
CREATE POLICY "Avatar images are publicly accessible"
    ON storage.objects FOR SELECT
    TO public
    USING (bucket_id = 'avatars');

-- Documents storage policies
DROP POLICY IF EXISTS "Users can upload documents for their patients" ON storage.objects;
CREATE POLICY "Users can upload documents for their patients"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'patient-documents' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

DROP POLICY IF EXISTS "Users can view documents of their patients" ON storage.objects;
CREATE POLICY "Users can view documents of their patients"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (
        bucket_id = 'patient-documents' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

DROP POLICY IF EXISTS "Users can update documents of their patients" ON storage.objects;
CREATE POLICY "Users can update documents of their patients"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (
        bucket_id = 'patient-documents' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

DROP POLICY IF EXISTS "Users can delete documents of their patients" ON storage.objects;
CREATE POLICY "Users can delete documents of their patients"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'patient-documents' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

-- =====================================================
-- SECTION 11: VIEWS
-- =====================================================

-- Document statistics view
CREATE OR REPLACE VIEW document_stats AS
SELECT
    p.id as patient_id,
    p.user_id,
    COUNT(pd.id) as total_documents,
    COUNT(CASE WHEN pd.document_type = 'medical_report' THEN 1 END) as medical_reports,
    COUNT(CASE WHEN pd.document_type = 'exam_result' THEN 1 END) as exam_results,
    COUNT(CASE WHEN pd.document_type = 'photo' THEN 1 END) as photos,
    COUNT(CASE WHEN pd.document_type = 'video' THEN 1 END) as videos,
    COALESCE(SUM(pd.file_size), 0) as total_storage_bytes,
    MAX(pd.created_at) as last_upload_date
FROM public.patients p
LEFT JOIN public.patient_documents pd ON pd.patient_id = p.id
GROUP BY p.id, p.user_id;

-- =====================================================
-- SECTION 12: GRANTS
-- =====================================================

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.patients TO authenticated;
GRANT ALL ON public.sessions TO authenticated;
GRANT ALL ON public.patient_gamification TO authenticated;
GRANT ALL ON public.patient_documents TO authenticated;
GRANT ALL ON public.document_categories TO authenticated;
GRANT ALL ON public.document_category_assignments TO authenticated;
GRANT SELECT ON document_stats TO authenticated;

-- =====================================================
-- SECTION 13: COMMENTS (DOCUMENTATION)
-- =====================================================

COMMENT ON TABLE public.profiles IS 'User profiles with caregiver/professional information';
COMMENT ON TABLE public.patients IS 'Patients being cared for by users';
COMMENT ON TABLE public.sessions IS 'Therapy/activity sessions for patients';
COMMENT ON TABLE public.patient_gamification IS 'Gamification data (levels, points, achievements) for patients';
COMMENT ON TABLE public.patient_documents IS 'Medical reports, exams, and other documents for patients';
COMMENT ON TABLE public.document_categories IS 'User-defined categories for organizing documents';
COMMENT ON TABLE public.document_category_assignments IS 'Many-to-many relationship between documents and categories';

COMMENT ON COLUMN public.patients.avatar_url IS 'URL to patient avatar image in storage';
COMMENT ON COLUMN public.patients.condition IS 'Medical condition or diagnosis';
COMMENT ON COLUMN public.patients.autism_level IS 'For autism: support level 1, 2, or 3';
COMMENT ON COLUMN public.patients.weekly_goal IS 'Target number of therapy sessions per week';

COMMENT ON COLUMN public.patient_documents.file_size IS 'File size in bytes';
COMMENT ON COLUMN public.patient_documents.tags IS 'Array of tags for filtering and search';
COMMENT ON COLUMN public.patient_documents.is_favorite IS 'Mark important documents as favorites';
COMMENT ON COLUMN public.patient_documents.document_date IS 'Date of the document content (e.g., exam date, report date)';

-- =====================================================
-- ✅ MIGRATION COMPLETE
-- =====================================================

SELECT '🎉 MindTherapy database initialized successfully!' as status,
       'All tables, policies, and storage buckets are ready.' as message;
