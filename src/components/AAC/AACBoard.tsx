"use client"

/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @next/next/no-img-element */

import { useState, useEffect } from "react"
import { Volume2, Star, Clock, Search, Grid, List, Settings, AlertTriangle, X, Lightbulb, Sparkles } from "lucide-react"
import { getActiveAACBoard, updateCardUsage, toggleCardFavorite, getGPTSuggestions } from "@/app/actions/aac"
import type { AACBoardWithData, AACCard, GPTSuggestion } from "@/types/aac.types"

interface AACBoardProps {
  userProfile?: {
    preferences: {
      showImages: boolean
      showText: boolean
      gridSize: 2 | 3 | 4 | 6
      autoSpeak: boolean
      voiceSpeed: number
      voicePitch: number
    }
  }
}

export default function AACBoard({ userProfile }: AACBoardProps) {
  const [board, setBoard] = useState<AACBoardWithData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [showImages, _setShowImages] = useState(userProfile?.preferences.showImages ?? true)
  const [showText, _setShowText] = useState(userProfile?.preferences.showText ?? true)
  const [gridSize, _setGridSize] = useState(userProfile?.preferences.gridSize ?? 4)
  const [autoSpeak, _setAutoSpeak] = useState(userProfile?.preferences.autoSpeak ?? true)
  const [voiceSpeed, _setVoiceSpeed] = useState(userProfile?.preferences.voiceSpeed ?? 1)
  const [voicePitch, _setVoicePitch] = useState(userProfile?.preferences.voicePitch ?? 1)
  
  // Communication state
  const [currentSentence, setCurrentSentence] = useState<AACCard[]>([])
  const [showEmergency, setShowEmergency] = useState(false)
  const [_showSettings, setShowSettings] = useState(false)
  const [showGPTSuggestions, setShowGPTSuggestions] = useState(false)
  const [gptSuggestions, setGptSuggestions] = useState<GPTSuggestion[]>([])
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false)

  useEffect(() => {
    loadBoard()
  }, [])

  const loadBoard = async () => {
    setIsLoading(true)
    try {
      const result = await getActiveAACBoard()
      if (result.success && result.data) {
        setBoard(result.data)
      } else {
        console.error("Error loading AAC board:", result.error)
      }
    } catch (error) {
      console.error("Unexpected error loading board:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCardClick = async (card: AACCard) => {
    // Add to current sentence
    setCurrentSentence(prev => [...prev, card])
    
    // Update usage statistics
    await updateCardUsage(card.id)
    
    // Speak the word/phrase if autoSpeak is enabled
    if (autoSpeak && 'speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(card.text)
      utterance.rate = voiceSpeed
      utterance.pitch = voicePitch
      speechSynthesis.speak(utterance)
    }
    
    // Reload board to update usage stats
    await loadBoard()
  }

  const speakSentence = () => {
    const sentence = currentSentence.map(card => card.text).join(" ")
    if (sentence && 'speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(sentence)
      utterance.rate = voiceSpeed
      utterance.pitch = voicePitch
      speechSynthesis.speak(utterance)
    }
  }

  const clearSentence = () => {
    setCurrentSentence([])
  }

  const removeFromSentence = (index: number) => {
    setCurrentSentence(prev => prev.filter((_, i) => i !== index))
  }

  const handleFavorite = async (cardId: string, isFavorite: boolean) => {
    await toggleCardFavorite(cardId, !isFavorite)
    await loadBoard() // Reload to update favorite status
  }

  const getGPTSuggestionsForContext = async () => {
    if (currentSentence.length === 0) return
    
    setIsLoadingSuggestions(true)
    try {
      const result = await getGPTSuggestions({
        context: `User is building a sentence: "${currentSentence.map(c => c.text).join(" ")}"`,
        user_level: 2, // Could be dynamic based on user profile
        current_sentence: currentSentence.map(c => c.text),
        preferred_categories: board?.categories.map(c => c.name as import("@/types/aac.types").AACCategory)
      })
      
      if (result.success && result.data) {
        setGptSuggestions(result.data)
        setShowGPTSuggestions(true)
      }
    } catch (error) {
      console.error("Error getting GPT suggestions:", error)
    } finally {
      setIsLoadingSuggestions(false)
    }
  }

  const getDefaultImage = (_text: string) => {
    // Return the default placeholder image for all cards
    return `/images/aac/default/placeholder.svg`
  }

  const getFilteredCards = () => {
    if (!board) return []
    
    let allCards: AACCard[] = []
    
    if (selectedCategory === "all") {
      allCards = board.categories.flatMap(cat => cat.cards)
    } else if (selectedCategory === "favorites") {
      allCards = board.categories.flatMap(cat => cat.cards.filter(card => card.is_favorite))
    } else {
      const category = board.categories.find(cat => cat.id === selectedCategory)
      allCards = category?.cards || []
    }
    
    if (searchTerm) {
      allCards = allCards.filter(card => 
        card.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
        card.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }
    
    return allCards.sort((a, b) => {
      // Sort by frequency (most used first), then by order_index
      if (a.frequency !== b.frequency) {
        return b.frequency - a.frequency
      }
      return a.order_index - b.order_index
    })
  }

  const emergencyCards = [
    { id: "emergency-1", text: "Ajuda", icon: "🆘" },
    { id: "emergency-2", text: "Dor", icon: "😣" },
    { id: "emergency-3", text: "Médico", icon: "👨‍⚕️" },
    { id: "emergency-4", text: "Casa", icon: "🏠" },
  ]

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
          <p className="text-gray-600">A carregar comunicador...</p>
        </div>
      </div>
    )
  }

  if (!board) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Erro ao carregar comunicador</p>
          <button 
            onClick={loadBoard}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    )
  }

  const filteredCards = getFilteredCards()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Sentence Builder */}
      <div className="bg-white/80 backdrop-blur border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">Comunicador AAC</h1>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowEmergency(true)}
                className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                title="Emergência"
              >
                <AlertTriangle className="w-5 h-5" />
              </button>
              <button
                onClick={() => setShowSettings(true)}
                className="p-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          {/* Current Sentence */}
          <div className="bg-white rounded-xl border-2 border-purple-200 p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-700">Minha Frase:</h3>
              <div className="flex items-center gap-2">
                {currentSentence.length > 0 && (
                  <button
                    onClick={getGPTSuggestionsForContext}
                    disabled={isLoadingSuggestions}
                    className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
                    title="Obter sugestões IA"
                  >
                    {isLoadingSuggestions ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Lightbulb className="w-4 h-4" />
                    )}
                  </button>
                )}
                <button
                  onClick={speakSentence}
                  disabled={currentSentence.length === 0}
                  className="p-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
                <button
                  onClick={clearSentence}
                  disabled={currentSentence.length === 0}
                  className="p-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2 min-h-[3rem]">
              {currentSentence.length > 0 ? (
                currentSentence.map((card, index) => (
                  <button
                    key={`${card.id}-${index}`}
                    onClick={() => removeFromSentence(index)}
                    className="flex items-center gap-2 bg-purple-100 text-purple-700 px-3 py-2 rounded-lg hover:bg-purple-200 transition-colors"
                  >
                    <span>{card.icon}</span>
                    <span className="font-medium">{card.text}</span>
                  </button>
                ))
              ) : (
                <p className="text-gray-400 italic py-2">Clica nas palavras para construir uma frase...</p>
              )}
            </div>
          </div>

          {/* Filters and Search */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="flex items-center gap-2">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="all">Todas as categorias</option>
                <option value="favorites">⭐ Favoritas</option>
                {board.categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.icon} {category.display_name}
                  </option>
                ))}
              </select>

              <div className="flex items-center gap-1 border border-gray-300 rounded-lg">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 ${viewMode === "grid" ? "bg-purple-500 text-white" : "text-gray-600 hover:bg-gray-100"} transition-colors`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 ${viewMode === "list" ? "bg-purple-500 text-white" : "text-gray-600 hover:bg-gray-100"} transition-colors`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Procurar palavras..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      {/* GPT Suggestions Modal */}
      {showGPTSuggestions && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-green-500" />
                Sugestões IA
              </h3>
              <button
                onClick={() => setShowGPTSuggestions(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {gptSuggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => {
                    // Create a temporary card from suggestion
                    const tempCard: AACCard = {
                      id: `gpt-${index}`,
                      category_id: "",
                      text: suggestion.text,
                      grammar_type: suggestion.grammar_type,
                      difficulty: suggestion.difficulty,
                      tags: [],
                      frequency: 0,
                      is_favorite: false,
                      order_index: 0,
                      is_active: true,
                      created_at: new Date().toISOString(),
                      updated_at: new Date().toISOString()
                    }
                    handleCardClick(tempCard)
                    setShowGPTSuggestions(false)
                  }}
                  className="p-3 text-left border border-gray-200 rounded-lg hover:bg-green-50 hover:border-green-300 transition-colors"
                >
                  <div className="font-medium text-gray-900">{suggestion.text}</div>
                  <div className="text-sm text-gray-600 mt-1">{suggestion.reasoning}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className={`grid gap-4 ${
          viewMode === "grid" 
            ? `grid-cols-${gridSize} auto-rows-fr` 
            : "grid-cols-1"
        }`}>
          {filteredCards.map((card) => (
            <div key={card.id} className="group relative">
              <button
                onClick={() => handleCardClick(card)}
                className={`w-full h-full bg-white rounded-xl border-2 border-transparent hover:border-purple-300 hover:shadow-lg transition-all duration-200 overflow-hidden ${
                  viewMode === "grid" ? "aspect-square" : "h-20"
                }`}
              >
                {viewMode === "grid" ? (
                  <>
                    {showImages && card.image_url ? (
                      <>
                        <img
                          src={card.image_url}
                          alt={card.text}
                          onError={(e) => {
                            const img = e.target as HTMLImageElement
                            img.src = getDefaultImage(card.text)
                          }}
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/20" />
                        {showText && (
                          <div className="absolute bottom-2 left-2 right-2 bg-black/70 backdrop-blur-sm text-white px-2 py-1 rounded-lg">
                            <div className="text-xs font-medium text-center leading-tight">{card.text}</div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center p-4 h-full">
                        <div className="text-4xl mb-2">{card.icon}</div>
                        {showText && (
                          <div className="text-sm font-medium text-center leading-tight">{card.text}</div>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex items-center gap-4 p-4">
                    {showImages && card.image_url ? (
                      <img
                        src={card.image_url}
                        alt={card.text}
                        onError={(e) => {
                          const img = e.target as HTMLImageElement
                          img.src = getDefaultImage(card.text)
                        }}
                        className="w-12 h-12 rounded object-cover"
                      />
                    ) : (
                      <div className="text-3xl">{card.icon}</div>
                    )}
                    <div className="flex-1 text-left">
                      <div className="font-medium text-lg">{card.text}</div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="w-3 h-3" />
                        {card.frequency}x usado
                      </div>
                    </div>
                  </div>
                )}
              </button>

              {/* Favorite Toggle */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleFavorite(card.id, card.is_favorite)
                }}
                className={`absolute top-2 right-2 p-1 rounded-full transition-all z-10 ${
                  card.is_favorite
                    ? "bg-yellow-500 text-white"
                    : "bg-black/20 text-white/60 hover:bg-black/40 hover:text-white"
                } opacity-0 group-hover:opacity-100`}
              >
                <Star className="w-3 h-3" />
              </button>

              {/* Difficulty Indicator */}
              <div className="absolute bottom-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                {Array.from({ length: card.difficulty }).map((_, i) => (
                  <div key={i} className="w-1 h-1 bg-white/60 rounded-full" />
                ))}
              </div>
            </div>
          ))}
        </div>

        {filteredCards.length === 0 && (
          <div className="text-center py-12">
            <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma palavra encontrada</h3>
            <p className="text-gray-600">Tenta ajustar os filtros ou termo de pesquisa.</p>
          </div>
        )}
      </div>

      {/* Emergency Modal */}
      {showEmergency && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-red-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-red-600 flex items-center gap-2">
                <AlertTriangle className="w-6 h-6" />
                Emergência
              </h3>
              <button
                onClick={() => setShowEmergency(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {emergencyCards.map((card) => (
                <button
                  key={card.id}
                  onClick={() => {
                    if ('speechSynthesis' in window) {
                      const utterance = new SpeechSynthesisUtterance(card.text)
                      speechSynthesis.speak(utterance)
                    }
                  }}
                  className="flex flex-col items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
                >
                  <div className="text-4xl">{card.icon}</div>
                  <div className="font-medium text-red-700">{card.text}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}