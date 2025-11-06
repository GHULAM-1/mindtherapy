-- AAC (Augmentative and Alternative Communication) Tables Migration
-- Description: Create tables for AAC communication boards, categories, cards and usage tracking

-- 1. AAC Boards Table
CREATE TABLE IF NOT EXISTS aac_boards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. AAC Categories Table
CREATE TABLE IF NOT EXISTS aac_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  board_id UUID REFERENCES aac_boards(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(100) NOT NULL, -- needs, emotions, actions, people, places, objects
  display_name VARCHAR(255) NOT NULL,
  icon VARCHAR(10) NOT NULL,
  color VARCHAR(50) NOT NULL,
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. AAC Cards Table
CREATE TABLE IF NOT EXISTS aac_cards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID REFERENCES aac_categories(id) ON DELETE CASCADE NOT NULL,
  text VARCHAR(255) NOT NULL,
  icon VARCHAR(10),
  image_url TEXT,
  grammar_type VARCHAR(50), -- subject, verb, object, adjective, preposition, complete
  difficulty INTEGER CHECK (difficulty IN (1, 2, 3)) DEFAULT 1,
  tags TEXT[] DEFAULT '{}',
  frequency INTEGER DEFAULT 0,
  last_used TIMESTAMP WITH TIME ZONE,
  is_favorite BOOLEAN DEFAULT false,
  custom_voice TEXT,
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. AAC Usage Statistics Table
CREATE TABLE IF NOT EXISTS aac_usage_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  card_id UUID REFERENCES aac_cards(id) ON DELETE CASCADE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  session_id UUID -- Optional: for grouping usage in sessions
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_aac_boards_user_id ON aac_boards(user_id);
CREATE INDEX IF NOT EXISTS idx_aac_boards_active ON aac_boards(is_active);

CREATE INDEX IF NOT EXISTS idx_aac_categories_board_id ON aac_categories(board_id);
CREATE INDEX IF NOT EXISTS idx_aac_categories_active ON aac_categories(is_active);
CREATE INDEX IF NOT EXISTS idx_aac_categories_order ON aac_categories(order_index);

CREATE INDEX IF NOT EXISTS idx_aac_cards_category_id ON aac_cards(category_id);
CREATE INDEX IF NOT EXISTS idx_aac_cards_active ON aac_cards(is_active);
CREATE INDEX IF NOT EXISTS idx_aac_cards_order ON aac_cards(order_index);
CREATE INDEX IF NOT EXISTS idx_aac_cards_frequency ON aac_cards(frequency);
CREATE INDEX IF NOT EXISTS idx_aac_cards_favorite ON aac_cards(is_favorite);

CREATE INDEX IF NOT EXISTS idx_aac_usage_user_id ON aac_usage_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_aac_usage_card_id ON aac_usage_stats(card_id);
CREATE INDEX IF NOT EXISTS idx_aac_usage_date ON aac_usage_stats(used_at);

-- Enable Row Level Security (RLS)
ALTER TABLE aac_boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE aac_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE aac_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE aac_usage_stats ENABLE ROW LEVEL SECURITY;

-- RLS Policies for AAC Boards
CREATE POLICY "Users can view their own AAC boards" ON aac_boards
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own AAC boards" ON aac_boards
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own AAC boards" ON aac_boards
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own AAC boards" ON aac_boards
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for AAC Categories
CREATE POLICY "Users can view categories from their boards" ON aac_categories
  FOR SELECT USING (
    board_id IN (
      SELECT id FROM aac_boards WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert categories to their boards" ON aac_categories
  FOR INSERT WITH CHECK (
    board_id IN (
      SELECT id FROM aac_boards WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update categories from their boards" ON aac_categories
  FOR UPDATE USING (
    board_id IN (
      SELECT id FROM aac_boards WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete categories from their boards" ON aac_categories
  FOR DELETE USING (
    board_id IN (
      SELECT id FROM aac_boards WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for AAC Cards
CREATE POLICY "Users can view cards from their categories" ON aac_cards
  FOR SELECT USING (
    category_id IN (
      SELECT c.id FROM aac_categories c
      JOIN aac_boards b ON c.board_id = b.id
      WHERE b.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert cards to their categories" ON aac_cards
  FOR INSERT WITH CHECK (
    category_id IN (
      SELECT c.id FROM aac_categories c
      JOIN aac_boards b ON c.board_id = b.id
      WHERE b.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update cards from their categories" ON aac_cards
  FOR UPDATE USING (
    category_id IN (
      SELECT c.id FROM aac_categories c
      JOIN aac_boards b ON c.board_id = b.id
      WHERE b.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete cards from their categories" ON aac_cards
  FOR DELETE USING (
    category_id IN (
      SELECT c.id FROM aac_categories c
      JOIN aac_boards b ON c.board_id = b.id
      WHERE b.user_id = auth.uid()
    )
  );

-- RLS Policies for AAC Usage Stats
CREATE POLICY "Users can view their own usage stats" ON aac_usage_stats
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own usage stats" ON aac_usage_stats
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Function to automatically update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_aac_boards_updated_at BEFORE UPDATE ON aac_boards
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_aac_categories_updated_at BEFORE UPDATE ON aac_categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_aac_cards_updated_at BEFORE UPDATE ON aac_cards
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();