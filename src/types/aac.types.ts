/**
 * AAC (Augmentative and Alternative Communication) Types
 */

export type AACCategory = "needs" | "emotions" | "actions" | "people" | "places" | "objects"
export type GrammarType = "subject" | "verb" | "object" | "adjective" | "preposition" | "complete"
export type DifficultyLevel = 1 | 2 | 3

export interface AACBoard {
  id: string
  user_id: string
  name: string
  description?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface AACCategory_DB {
  id: string
  board_id: string
  name: string
  display_name: string
  icon: string
  color: string
  order_index: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface AACCard {
  id: string
  category_id: string
  text: string
  icon?: string
  image_url?: string
  grammar_type?: GrammarType
  difficulty: DifficultyLevel
  tags: string[]
  frequency: number
  last_used?: string
  is_favorite: boolean
  custom_voice?: string
  order_index: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface AACUsageStats {
  id: string
  user_id: string
  card_id: string
  used_at: string
  session_id?: string
}

// UI Types
export interface AACCategoryWithCards extends AACCategory_DB {
  cards: AACCard[]
}

export interface AACBoardWithData extends AACBoard {
  categories: AACCategoryWithCards[]
  total_cards: number
}

// GPT Integration Types
export interface GPTSuggestion {
  text: string
  category: AACCategory
  grammar_type: GrammarType
  difficulty: DifficultyLevel
  reasoning: string
}

export interface GPTSuggestionRequest {
  context: string
  user_level: DifficultyLevel
  preferred_categories?: AACCategory[]
  current_sentence?: string[]
}

// ============================================
// Master AAC Tables (Global Cards)
// ============================================

export interface AACMasterCategory {
  id: string
  name: string
  display_name: string
  icon: string
  color: string
  description?: string
  order_index: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface AACMasterCard {
  id: string
  category_id: string
  text: string
  image_url: string
  tags: string[]
  order_index: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface AACCardImpression {
  id: string
  patient_id: string
  user_id: string
  card_id: string
  session_id?: string
  clicked_at: string
}

// UI Types for Master Cards
export interface AACMasterCategoryWithCards extends AACMasterCategory {
  cards: AACMasterCard[]
}

export interface AACMasterCardsData {
  categories: AACMasterCategoryWithCards[]
  total_cards: number
}

// Card impression stats
export interface CardImpressionStats {
  card_id: string
  card_text: string
  impression_count: number
  last_clicked?: string
}