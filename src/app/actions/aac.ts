"use server"

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import type {
  AACCategory_DB,
  AACBoardWithData,
  GPTSuggestion,
  GPTSuggestionRequest,
  AACMasterCardsData,
  AACMasterCategoryWithCards,
  CardImpressionStats,
} from "@/types/aac.types"

interface ActionResult<T = void> {
  success: boolean
  data?: T
  error?: string
}

/**
 * Get the active AAC board for the authenticated user
 */
export async function getActiveAACBoard(): Promise<ActionResult<AACBoardWithData>> {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: "Não autenticado" }
    }

    // Get active board with categories and cards
    const { data: board, error: boardError } = await supabase
      .from("aac_boards")
      .select(`
        *,
        categories:aac_categories(
          *,
          cards:aac_cards(*)
        )
      `)
      .eq("user_id", user.id)
      .eq("is_active", true)
      .single()

    if (boardError || !board) {
      // Create default board if none exists
      const defaultBoard = await createDefaultAACBoard()
      if (defaultBoard.success && defaultBoard.data) {
        return { success: true, data: defaultBoard.data }
      }
      return { success: false, error: "Erro ao carregar board de comunicação" }
    }

    // Transform to UI format
    const boardWithData: AACBoardWithData = {
      ...board,
      categories: board.categories.map((cat: any) => ({
        ...cat,
        cards: cat.cards.filter((card: any) => card.is_active).sort((a: any, b: any) => a.order_index - b.order_index)
      })).filter((cat: any) => cat.is_active).sort((a: any, b: any) => a.order_index - b.order_index),
      total_cards: board.categories.reduce((total: number, cat: any) => 
        total + cat.cards.filter((card: any) => card.is_active).length, 0
      )
    }

    return { success: true, data: boardWithData }
  } catch (error) {
    console.error("Unexpected error in getActiveAACBoard:", error)
    return { success: false, error: "Erro inesperado ao carregar board" }
  }
}

/**
 * Create default AAC board with basic categories and cards
 */
export async function createDefaultAACBoard(): Promise<ActionResult<AACBoardWithData>> {
  try {
    const supabase = await createClient()
    
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: "Não autenticado" }
    }

    // Create default board
    const { data: board, error: boardError } = await supabase
      .from("aac_boards")
      .insert({
        user_id: user.id,
        name: "Board Principal",
        description: "Board padrão de comunicação",
        is_active: true
      })
      .select()
      .single()

    if (boardError || !board) {
      return { success: false, error: "Erro ao criar board padrão" }
    }

    // Create default categories
    const defaultCategories = [
      { name: "needs", display_name: "Necessidades", icon: "🙋", color: "bg-red-100 text-red-800", order_index: 0 },
      { name: "emotions", display_name: "Emoções", icon: "😊", color: "bg-yellow-100 text-yellow-800", order_index: 1 },
      { name: "actions", display_name: "Ações", icon: "🏃", color: "bg-blue-100 text-blue-800", order_index: 2 },
      { name: "people", display_name: "Pessoas", icon: "👥", color: "bg-green-100 text-green-800", order_index: 3 },
      { name: "places", display_name: "Lugares", icon: "🏠", color: "bg-purple-100 text-purple-800", order_index: 4 },
      { name: "objects", display_name: "Objetos", icon: "📦", color: "bg-orange-100 text-orange-800", order_index: 5 },
    ]

    const { data: categories, error: categoriesError } = await supabase
      .from("aac_categories")
      .insert(
        defaultCategories.map((cat) => ({
          board_id: board.id,
          ...cat,
          is_active: true
        }))
      )
      .select()

    if (categoriesError || !categories) {
      return { success: false, error: "Erro ao criar categorias padrão" }
    }

    // Create default cards for each category
    const defaultCards = await createDefaultCards(categories)
    
    // Reload the complete board
    return await getActiveAACBoard()
  } catch (error) {
    console.error("Unexpected error in createDefaultAACBoard:", error)
    return { success: false, error: "Erro inesperado ao criar board padrão" }
  }
}

/**
 * Create default cards for categories
 */
async function createDefaultCards(categories: AACCategory_DB[]) {
  const supabase = await createClient()
  
  const cardsByCategory = {
    needs: [
      { text: "Quero", icon: "👆", grammar_type: "verb", difficulty: 1, tags: ["básico", "desejo"] },
      { text: "Preciso", icon: "🙏", grammar_type: "verb", difficulty: 2, tags: ["necessidade"] },
      { text: "Ajuda", icon: "🆘", grammar_type: "object", difficulty: 1, tags: ["ajuda", "socorro"] },
      { text: "Água", icon: "💧", grammar_type: "object", difficulty: 1, tags: ["bebida", "hidratação"] },
      { text: "Comida", icon: "🍽️", grammar_type: "object", difficulty: 1, tags: ["alimento", "fome"] },
    ],
    emotions: [
      { text: "Feliz", icon: "😊", grammar_type: "adjective", difficulty: 1, tags: ["emoção", "positivo"] },
      { text: "Triste", icon: "😢", grammar_type: "adjective", difficulty: 1, tags: ["emoção", "negativo"] },
      { text: "Zangado", icon: "😠", grammar_type: "adjective", difficulty: 2, tags: ["emoção", "raiva"] },
      { text: "Assustado", icon: "😰", grammar_type: "adjective", difficulty: 2, tags: ["emoção", "medo"] },
    ],
    actions: [
      { text: "Ir", icon: "🚶", grammar_type: "verb", difficulty: 1, tags: ["movimento", "ação"] },
      { text: "Vir", icon: "🏃", grammar_type: "verb", difficulty: 1, tags: ["movimento", "ação"] },
      { text: "Comer", icon: "🍴", grammar_type: "verb", difficulty: 1, tags: ["ação", "alimentação"] },
      { text: "Beber", icon: "🥤", grammar_type: "verb", difficulty: 1, tags: ["ação", "hidratação"] },
    ],
    people: [
      { text: "Mamã", icon: "👩", grammar_type: "subject", difficulty: 1, tags: ["família", "pessoa"] },
      { text: "Papá", icon: "👨", grammar_type: "subject", difficulty: 1, tags: ["família", "pessoa"] },
      { text: "Irmão", icon: "👦", grammar_type: "subject", difficulty: 2, tags: ["família", "pessoa"] },
      { text: "Amigo", icon: "👫", grammar_type: "subject", difficulty: 2, tags: ["social", "pessoa"] },
    ],
    places: [
      { text: "Casa", icon: "🏠", grammar_type: "object", difficulty: 1, tags: ["lugar", "habitação"] },
      { text: "Escola", icon: "🏫", grammar_type: "object", difficulty: 1, tags: ["lugar", "educação"] },
      { text: "Parque", icon: "🌳", grammar_type: "object", difficulty: 2, tags: ["lugar", "diversão"] },
    ],
    objects: [
      { text: "Bola", icon: "⚽", grammar_type: "object", difficulty: 1, tags: ["brinquedo", "desporto"] },
      { text: "Livro", icon: "📚", grammar_type: "object", difficulty: 2, tags: ["educação", "leitura"] },
      { text: "Tablet", icon: "📱", grammar_type: "object", difficulty: 2, tags: ["tecnologia"] },
    ]
  }

  for (const category of categories) {
    const categoryCards = cardsByCategory[category.name as keyof typeof cardsByCategory] || []
    
    if (categoryCards.length > 0) {
      await supabase
        .from("aac_cards")
        .insert(
          categoryCards.map((card, index) => ({
            category_id: category.id,
            ...card,
            frequency: 0,
            is_favorite: false,
            order_index: index,
            is_active: true
          }))
        )
    }
  }
}

/**
 * Update card usage statistics
 */
export async function updateCardUsage(cardId: string): Promise<ActionResult> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: "Não autenticado" }
    }

    // Get current card to increment frequency
    const { data: currentCard, error: fetchError } = await supabase
      .from("aac_cards")
      .select("frequency")
      .eq("id", cardId)
      .single()

    if (fetchError) {
      console.error("Error fetching card:", fetchError)
      return { success: false, error: "Erro ao buscar cartão" }
    }

    // Update card frequency and last_used
    const { error: updateError } = await supabase
      .from("aac_cards")
      .update({
        frequency: (currentCard?.frequency || 0) + 1,
        last_used: new Date().toISOString()
      })
      .eq("id", cardId)

    if (updateError) {
      console.error("Error updating card usage:", updateError)
      return { success: false, error: "Erro ao atualizar estatísticas" }
    }

    // Log usage for analytics
    await supabase
      .from("aac_usage_stats")
      .insert({
        user_id: user.id,
        card_id: cardId,
        used_at: new Date().toISOString()
      })

    return { success: true }
  } catch (error) {
    console.error("Unexpected error in updateCardUsage:", error)
    return { success: false, error: "Erro inesperado" }
  }
}

/**
 * Toggle card favorite status
 */
export async function toggleCardFavorite(cardId: string, isFavorite: boolean): Promise<ActionResult> {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from("aac_cards")
      .update({ is_favorite: isFavorite })
      .eq("id", cardId)

    if (error) {
      console.error("Error toggling card favorite:", error)
      return { success: false, error: "Erro ao atualizar favorito" }
    }

    revalidatePath("/aac")
    return { success: true }
  } catch (error) {
    console.error("Unexpected error in toggleCardFavorite:", error)
    return { success: false, error: "Erro inesperado" }
  }
}

/**
 * Get GPT suggestions for AAC cards
 */
export async function getGPTSuggestions(request: GPTSuggestionRequest): Promise<ActionResult<GPTSuggestion[]>> {
  try {
    const openaiApiKey = process.env.OPENAI_API_KEY
    if (!openaiApiKey) {
      console.error("OPENAI_API_KEY is not set")
      console.error("Available env vars:", Object.keys(process.env).filter(k => k.includes('OPENAI')))
      return { success: false, error: "API Key do OpenAI não configurada" }
    }
    console.log("OpenAI API Key exists:", openaiApiKey.substring(0, 10) + "...")

    const prompt = `You are an AAC (Augmentative and Alternative Communication) assistant helping users communicate effectively. 

Context: ${request.context}
User Level: ${request.user_level} (1=beginner, 2=intermediate, 3=advanced)
Current Sentence: ${request.current_sentence?.join(" ") || "empty"}
Preferred Categories: ${request.preferred_categories?.join(", ") || "any"}

Suggest 3-5 relevant AAC cards that would help complete or enhance this communication. For each suggestion, provide:
1. The word/phrase text
2. The category (needs, emotions, actions, people, places, objects)
3. Grammar type (subject, verb, object, adjective, preposition, complete)
4. Difficulty level (1, 2, or 3)
5. Brief reasoning for the suggestion

Respond in JSON format as an array of objects with the structure:
{
  "text": "word/phrase",
  "category": "category_name",
  "grammar_type": "grammar_type",
  "difficulty": difficulty_level,
  "reasoning": "why this suggestion is relevant"
}

Keep suggestions appropriate for the user's difficulty level and context. Focus on practical, commonly used words.`

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("OpenAI API Error:", response.status, errorText)
      return { success: false, error: `Erro ao comunicar com GPT: ${response.status}` }
    }

    const data = await response.json()
    const suggestions = JSON.parse(data.choices[0].message.content) as GPTSuggestion[]

    return { success: true, data: suggestions }
  } catch (error) {
    console.error("Unexpected error in getGPTSuggestions:", error)
    return { success: false, error: "Erro inesperado ao obter sugestões" }
  }
}

// ============================================
// Master AAC Cards Actions
// ============================================

/**
 * Get all master AAC categories with their cards
 */
export async function getMasterAACCards(): Promise<ActionResult<AACMasterCardsData>> {
  try {
    const supabase = await createClient()

    // Get all active categories with their cards
    const { data: categories, error: categoriesError } = await supabase
      .from("aac_master_categories")
      .select(`
        *,
        cards:aac_master_cards(*)
      `)
      .eq("is_active", true)
      .order("order_index", { ascending: true })

    if (categoriesError || !categories) {
      return { success: false, error: "Erro ao carregar categorias" }
    }

    // Transform to UI format
    const categoriesWithCards: AACMasterCategoryWithCards[] = categories.map((cat: any) => ({
      ...cat,
      cards: cat.cards
        .filter((card: any) => card.is_active)
        .sort((a: any, b: any) => a.order_index - b.order_index)
    }))

    const totalCards = categoriesWithCards.reduce((total, cat) => total + cat.cards.length, 0)

    return {
      success: true,
      data: {
        categories: categoriesWithCards,
        total_cards: totalCards
      }
    }
  } catch (error) {
    console.error("Unexpected error in getMasterAACCards:", error)
    return { success: false, error: "Erro inesperado ao carregar cards" }
  }
}

/**
 * Record a card impression (click) for a patient
 */
export async function recordCardImpression(patientId: string, cardId: string, sessionId?: string): Promise<ActionResult> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: "Não autenticado" }
    }

    // Verify patient belongs to user
    const { data: patient, error: patientError } = await supabase
      .from("patients")
      .select("id")
      .eq("id", patientId)
      .eq("user_id", user.id)
      .single()

    if (patientError || !patient) {
      return { success: false, error: "Paciente não encontrado" }
    }

    // Record the impression
    const { error: insertError } = await supabase
      .from("aac_card_impressions")
      .insert({
        patient_id: patientId,
        user_id: user.id,
        card_id: cardId,
        session_id: sessionId,
        clicked_at: new Date().toISOString()
      })

    if (insertError) {
      console.error("Error recording impression:", insertError)
      return { success: false, error: "Erro ao registrar impressão" }
    }

    return { success: true }
  } catch (error) {
    console.error("Unexpected error in recordCardImpression:", error)
    return { success: false, error: "Erro inesperado" }
  }
}

/**
 * Get card impression statistics for a patient
 */
export async function getPatientImpressions(patientId: string): Promise<ActionResult<CardImpressionStats[]>> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: "Não autenticado" }
    }

    // Verify patient belongs to user
    const { data: patient, error: patientError } = await supabase
      .from("patients")
      .select("id")
      .eq("id", patientId)
      .eq("user_id", user.id)
      .single()

    if (patientError || !patient) {
      return { success: false, error: "Paciente não encontrado" }
    }

    // Get impression statistics
    const { data: impressions, error: impressionsError } = await supabase
      .from("aac_card_impressions")
      .select(`
        card_id,
        clicked_at,
        card:aac_master_cards(text)
      `)
      .eq("patient_id", patientId)
      .order("clicked_at", { ascending: false })

    if (impressionsError) {
      console.error("Error fetching impressions:", impressionsError)
      return { success: false, error: "Erro ao buscar impressões" }
    }

    // Aggregate impressions by card
    const statsMap = new Map<string, CardImpressionStats>()

    impressions?.forEach((imp: any) => {
      const cardId = imp.card_id
      const existing = statsMap.get(cardId)

      if (existing) {
        existing.impression_count++
        if (!existing.last_clicked || imp.clicked_at > existing.last_clicked) {
          existing.last_clicked = imp.clicked_at
        }
      } else {
        statsMap.set(cardId, {
          card_id: cardId,
          card_text: imp.card?.text || "Unknown",
          impression_count: 1,
          last_clicked: imp.clicked_at
        })
      }
    })

    const stats = Array.from(statsMap.values())
      .sort((a, b) => b.impression_count - a.impression_count)

    return { success: true, data: stats }
  } catch (error) {
    console.error("Unexpected error in getPatientImpressions:", error)
    return { success: false, error: "Erro inesperado" }
  }
}