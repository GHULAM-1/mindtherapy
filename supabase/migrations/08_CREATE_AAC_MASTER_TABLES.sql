-- =====================================================
-- AAC MASTER TABLES MIGRATION
-- Description: Create global AAC master tables for categories and cards
-- Version: 1.0
-- Date: 2025-01-26
-- =====================================================

-- =====================================================
-- TABLE 1: AAC_MASTER_CATEGORIES (Master Data)
-- Stores global AAC categories (same for all users)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.aac_master_categories (
    -- Primary key
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

    -- Category details
    name VARCHAR(100) NOT NULL UNIQUE, -- "food", "activities", "emotions", "people", "objects"
    display_name VARCHAR(255) NOT NULL, -- "Food", "Activities", "Emotions", "People", "Objects"
    icon VARCHAR(10) NOT NULL, -- Emoji icon for category
    description TEXT, -- Optional description

    -- Display order
    order_index INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- =====================================================
-- TABLE 2: AAC_MASTER_CARDS (Master Card Library)
-- Stores global AAC cards (same for all users)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.aac_master_cards (
    -- Primary key
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

    -- Foreign key
    category_id UUID NOT NULL REFERENCES public.aac_master_categories(id) ON DELETE CASCADE,

    -- Card content
    text VARCHAR(255) NOT NULL, -- One-word description (e.g., "happy", "pizza", "run")
    image_url TEXT NOT NULL, -- URL to card image in Supabase Storage or external URL

    -- Optional metadata
    tags TEXT[] DEFAULT '{}', -- Optional tags for filtering

    -- Display order
    order_index INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- =====================================================
-- TABLE 3: AAC_CARD_IMPRESSIONS (Per-Patient Click Tracking)
-- Records every time a patient clicks on a card
-- =====================================================

CREATE TABLE IF NOT EXISTS public.aac_card_impressions (
    -- Primary key
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

    -- Foreign keys
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    card_id UUID NOT NULL REFERENCES public.aac_master_cards(id) ON DELETE RESTRICT,

    -- Session tracking (optional)
    session_id UUID, -- Optional: for grouping clicks in sessions

    -- Timestamp
    clicked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Master categories indexes
CREATE INDEX IF NOT EXISTS idx_aac_master_categories_active ON public.aac_master_categories(is_active);
CREATE INDEX IF NOT EXISTS idx_aac_master_categories_order ON public.aac_master_categories(order_index);

-- Master cards indexes
CREATE INDEX IF NOT EXISTS idx_aac_master_cards_category ON public.aac_master_cards(category_id);
CREATE INDEX IF NOT EXISTS idx_aac_master_cards_active ON public.aac_master_cards(is_active);
CREATE INDEX IF NOT EXISTS idx_aac_master_cards_order ON public.aac_master_cards(order_index);

-- Card impressions indexes
CREATE INDEX IF NOT EXISTS idx_aac_impressions_patient ON public.aac_card_impressions(patient_id);
CREATE INDEX IF NOT EXISTS idx_aac_impressions_card ON public.aac_card_impressions(card_id);
CREATE INDEX IF NOT EXISTS idx_aac_impressions_user ON public.aac_card_impressions(user_id);
CREATE INDEX IF NOT EXISTS idx_aac_impressions_clicked ON public.aac_card_impressions(clicked_at DESC);
CREATE INDEX IF NOT EXISTS idx_aac_impressions_session ON public.aac_card_impressions(session_id);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.aac_master_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aac_master_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aac_card_impressions ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES: AAC_MASTER_CATEGORIES (Public Read, Authenticated Write)
-- =====================================================

DROP POLICY IF EXISTS "Anyone can view active categories" ON public.aac_master_categories;
CREATE POLICY "Anyone can view active categories"
    ON public.aac_master_categories FOR SELECT
    USING (is_active = true);

DROP POLICY IF EXISTS "Authenticated users can insert categories" ON public.aac_master_categories;
CREATE POLICY "Authenticated users can insert categories"
    ON public.aac_master_categories FOR INSERT
    TO authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can update categories" ON public.aac_master_categories;
CREATE POLICY "Authenticated users can update categories"
    ON public.aac_master_categories FOR UPDATE
    TO authenticated
    USING (true);

-- =====================================================
-- RLS POLICIES: AAC_MASTER_CARDS (Public Read)
-- =====================================================

DROP POLICY IF EXISTS "Anyone can view active cards" ON public.aac_master_cards;
CREATE POLICY "Anyone can view active cards"
    ON public.aac_master_cards FOR SELECT
    USING (is_active = true);

-- =====================================================
-- RLS POLICIES: AAC_CARD_IMPRESSIONS
-- =====================================================

DROP POLICY IF EXISTS "Users can view impressions of own patients" ON public.aac_card_impressions;
CREATE POLICY "Users can view impressions of own patients"
    ON public.aac_card_impressions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.patients
            WHERE patients.id = aac_card_impressions.patient_id
            AND patients.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can insert impressions for own patients" ON public.aac_card_impressions;
CREATE POLICY "Users can insert impressions for own patients"
    ON public.aac_card_impressions FOR INSERT
    WITH CHECK (
        auth.uid() = user_id AND
        EXISTS (
            SELECT 1 FROM public.patients
            WHERE patients.id = patient_id
            AND patients.user_id = auth.uid()
        )
    );

-- =====================================================
-- TRIGGERS FOR AUTO-UPDATE TIMESTAMPS
-- =====================================================

DROP TRIGGER IF EXISTS update_aac_master_categories_updated_at ON public.aac_master_categories;
CREATE TRIGGER update_aac_master_categories_updated_at
    BEFORE UPDATE ON public.aac_master_categories
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS update_aac_master_cards_updated_at ON public.aac_master_cards;
CREATE TRIGGER update_aac_master_cards_updated_at
    BEFORE UPDATE ON public.aac_master_cards
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- =====================================================
-- COMMENTS (DOCUMENTATION)
-- =====================================================

COMMENT ON TABLE public.aac_master_categories IS 'Master data: Global AAC categories (same for all users)';
COMMENT ON TABLE public.aac_master_cards IS 'Master data: Global AAC cards library (same for all users)';
COMMENT ON TABLE public.aac_card_impressions IS 'Click tracking: Records every card click per patient';

COMMENT ON COLUMN public.aac_master_cards.text IS 'One-word description shown on card (e.g., "happy", "pizza", "run")';
COMMENT ON COLUMN public.aac_master_cards.image_url IS 'URL to card image in Supabase Storage or external URL';
COMMENT ON COLUMN public.aac_card_impressions.clicked_at IS 'Timestamp when patient clicked the card';

-- =====================================================
-- GRANTS (PERMISSIONS)
-- =====================================================

GRANT ALL ON public.aac_master_categories TO authenticated;
GRANT ALL ON public.aac_master_cards TO authenticated;
GRANT ALL ON public.aac_card_impressions TO authenticated;

-- =====================================================
-- ✅ MIGRATION COMPLETE
-- =====================================================
-- Tables created: aac_master_categories, aac_master_cards, aac_card_impressions
-- Note: Use scripts/generate-aac-images.js to populate cards with AI-generated images
