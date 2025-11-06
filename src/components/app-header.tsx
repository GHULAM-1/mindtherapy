"use client"

import type React from "react"

import { ArrowLeft, Award, Sparkles, Settings } from "lucide-react"
import Image from "next/image"

interface AppHeaderProps {
  title: string
  subtitle?: string
  showBack?: boolean
  onBack?: () => void
  showGamification?: boolean
  gamificationStats?: {
    level: number
    totalPoints: number
    experiencePoints: number
    experienceToNextLevel: number
    dailyStreak: number
  }
  onGamificationClick?: () => void
  onRewardsClick?: () => void
  onSettingsClick?: () => void
  showMascot?: boolean
  customActions?: React.ReactNode
}

export default function AppHeader({
  title,
  subtitle,
  showBack = true,
  onBack,
  showGamification = true,
  gamificationStats,
  onGamificationClick,
  onRewardsClick,
  onSettingsClick,
  showMascot = false,
  customActions,
}: AppHeaderProps) {
  const handleBack = () => {
    if (onBack) {
      onBack()
    } else {
      window.history.back()
    }
  }

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-lg border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-16 flex items-center justify-between gap-4">
          {/* Left Section */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {showBack && (
              <button
                onClick={handleBack}
                className="p-2 hover:bg-purple-50 rounded-lg transition-colors flex-shrink-0"
                aria-label="Voltar"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
            )}

            {showMascot && (
              <div className="w-10 h-10 relative flex-shrink-0 hidden sm:block">
                <Image src="/mascot.png" alt="MindTherapy Mascot" fill className="object-contain" />
              </div>
            )}

            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-bold text-gray-900 truncate">{title}</h1>
              {subtitle && <p className="text-sm text-gray-600 truncate">{subtitle}</p>}
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            {/* Custom Actions */}
            {customActions}

            {/* Gamification Stats */}
            {showGamification && gamificationStats && (
              <>
                {/* Level and Points Display */}
                <div className="hidden md:flex items-center gap-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg px-3 py-2 border border-purple-200">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-sm">
                      {gamificationStats.level}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-gray-900">{gamificationStats.totalPoints} pts</div>
                      <div className="w-16 h-1.5 bg-gray-200 rounded-full">
                        <div
                          className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all"
                          style={{
                            width: `${(gamificationStats.experiencePoints / (gamificationStats.experiencePoints + gamificationStats.experienceToNextLevel)) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Daily Streak */}
                <div className="hidden sm:flex items-center gap-2 bg-gradient-to-r from-orange-100 to-red-100 text-orange-800 px-3 py-2 rounded-lg border border-orange-200">
                  <span className="text-lg">🔥</span>
                  <span className="text-sm font-bold">{gamificationStats.dailyStreak}</span>
                </div>

                {/* Gamification Button */}
                {onGamificationClick && (
                  <button
                    onClick={onGamificationClick}
                    className="p-2 hover:bg-purple-100 rounded-lg transition-colors relative"
                    title="Conquistas e Progresso"
                  >
                    <Award className="w-5 h-5 text-purple-600" />
                  </button>
                )}

                {/* Rewards Button */}
                {onRewardsClick && (
                  <button
                    onClick={onRewardsClick}
                    className="p-2 hover:bg-yellow-100 rounded-lg transition-colors"
                    title="Loja de Recompensas"
                  >
                    <Sparkles className="w-5 h-5 text-yellow-600" />
                  </button>
                )}
              </>
            )}

            {/* Settings */}
            {onSettingsClick && (
              <button
                onClick={onSettingsClick}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Definições"
              >
                <Settings className="w-5 h-5 text-gray-600" />
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
