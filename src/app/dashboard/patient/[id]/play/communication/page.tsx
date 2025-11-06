"use client"

/* eslint-disable @next/next/no-img-element */

import { useParams, useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { getPatient } from "@/app/actions/patients"
import { ArrowLeft, Trophy, Star, Info, Sparkles, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface Patient {
  id: string
  name: string
  avatar_url?: string
  total_sessions: number
  points?: number
  level?: number
  streak?: number
}

interface Game {
  id: number
  name: string
  icon: string
  coinsReward: number
  pointsReward: number
  route?: string
}

interface AlertNotification {
  type: "info" | "coming-soon"
  message: string
  title: string
}

export default function CommunicationGamesPage() {
  const params = useParams()
  const router = useRouter()
  const patientId = params.id as string
  const [patient, setPatient] = useState<Patient | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [feelEmotionsPoints, setFeelEmotionsPoints] = useState<number>(0)
  const [alertNotification, setAlertNotification] =
    useState<AlertNotification | null>(null)

  useEffect(() => {
    loadPatient()
  }, [patientId])

  async function loadPatient() {
    setIsLoading(true)
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/dashboard")
        return
      }

      // Load patient data
      const result = await getPatient(patientId)
      if (result.success && result.data) {
        const p = result.data

        // Fetch emotion game points
        const { data: emotionStats } = await supabase
          .from('emotion_game_sessions')
          .select('total_score')
          .eq('patient_id', patientId)
          .eq('is_completed', true)

        const totalEmotionPoints = emotionStats?.reduce((sum, session) => sum + (session.total_score || 0), 0) || 0
        setFeelEmotionsPoints(totalEmotionPoints)

        // Fetch patient gamification points for header
        const { data: gamificationData } = await supabase
          .from('patient_gamification')
          .select('total_points')
          .eq('patient_id', patientId)
          .single()

        setPatient({
          id: p.id,
          name: p.name,
          avatar_url: p.avatar_url || undefined,
          total_sessions: p.total_sessions,
          points: gamificationData?.total_points || 0,
          level: 5, // TODO: Calculate from gamification data
          streak: 83, // TODO: Load from gamification table
        })
      } else {
        router.push("/dashboard")
      }
    } catch (error) {
      console.error("Error loading patient:", error)
      router.push("/dashboard")
    } finally {
      setIsLoading(false)
    }
  }

  const showAlert = (
    title: string,
    message: string,
    type: "info" | "coming-soon" = "info"
  ) => {
    setAlertNotification({ title, message, type })
    setTimeout(() => setAlertNotification(null), 5000)
  }

  const games: Game[] = [
    {
      id: 1,
      name: "Feel Emotions",
      icon: "😊",
      coinsReward: feelEmotionsPoints,
      pointsReward: 400,
      route: "emotions",
    },
    {
      id: 2,
      name: "Emotional Story",
      icon: "📖",
      coinsReward: 40,
      pointsReward: 400,
    },
    {
      id: 3,
      name: "Build Connection",
      icon: "🤝",
      coinsReward: 40,
      pointsReward: 400,
    },
  ]

  const handleGameClick = (game: Game) => {
    if (game.route) {
      router.push(`/dashboard/patient/${patientId}/play/${game.route}`)
    } else {
      showAlert(
        "Coming Soon! ✨",
        `${game.name} will be available soon. We're adding the finishing touches!`,
        "coming-soon"
      )
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#E2F7FF] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mb-4"></div>
          <p className="text-xl sm:text-2xl text-purple-600 font-bold">A carregar...</p>
        </div>
      </div>
    )
  }

  if (!patient) {
    return null
  }

  return (
    <div className="min-h-screen bg-[#E2F7FF] relative">
      {/* Alert Notification */}
      {alertNotification && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-lg px-4 animate-in slide-in-from-top-5">
          <div
            className={cn(
              "relative rounded-2xl shadow-2xl border-2 p-6",
              alertNotification.type === "coming-soon"
                ? "bg-gradient-to-br from-purple-100 via-pink-50 to-purple-50 border-purple-300"
                : "bg-gradient-to-br from-blue-100 to-blue-50 border-blue-300"
            )}
          >
            <button
              onClick={() => setAlertNotification(null)}
              className={cn(
                "absolute top-3 right-3 p-1.5 rounded-full transition-colors",
                alertNotification.type === "coming-soon"
                  ? "hover:bg-purple-200/50 text-purple-600"
                  : "hover:bg-blue-200/50 text-blue-600"
              )}
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-start gap-4 pr-8">
              <div
                className={cn(
                  "p-3 rounded-xl flex-shrink-0",
                  alertNotification.type === "coming-soon"
                    ? "bg-gradient-to-br from-purple-400 to-pink-400"
                    : "bg-gradient-to-br from-blue-400 to-blue-500"
                )}
              >
                {alertNotification.type === "coming-soon" ? (
                  <Sparkles className="h-6 w-6 text-white" />
                ) : (
                  <Info className="h-6 w-6 text-white" />
                )}
              </div>

              <div className="flex-1 pt-0.5">
                <h3
                  className={cn(
                    "text-xl font-bold mb-2",
                    alertNotification.type === "coming-soon"
                      ? "text-purple-900"
                      : "text-blue-900"
                  )}
                >
                  {alertNotification.title}
                </h3>
                <p
                  className={cn(
                    "text-base leading-relaxed",
                    alertNotification.type === "coming-soon"
                      ? "text-purple-800"
                      : "text-blue-800"
                  )}
                >
                  {alertNotification.message}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cloud Background - Fixed at top */}
      <div className="fixed top-0 left-0 right-0 z-0 pointer-events-none">
        <img
          src="/gamehub-after.png"
          alt=""
          className="w-full h-auto"
        />
      </div>

      {/* Main Content */}
      <div className="relative z-10">
        {/* Header */}
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12 xl:px-20 pt-4 sm:pt-6 lg:pt-8 pb-6 sm:pb-8 lg:pb-10">
          <div className="bg-white/80 backdrop-blur rounded-2xl sm:rounded-3xl shadow-lg p-4 sm:p-5 lg:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              {/* Left: Back Button + Title */}
              <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-full flex-shrink-0"
                  onClick={() => router.push(`/dashboard/patient/${patientId}/play`)}
                >
                  <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                </Button>
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-xl sm:text-2xl">💬</span>
                  </div>
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 truncate">
                    Communication
                  </h1>
                </div>
              </div>

              {/* Right: Badges */}
              <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 w-full sm:w-auto justify-end">
                <Badge variant="outline" className="gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-amber-50">
                  <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600" />
                  <span className="text-base sm:text-lg font-semibold">{patient.points}</span>
                </Badge>
                <Badge variant="outline" className="gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-50">
                  <Star className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                  <span className="text-base sm:text-lg font-semibold">Lvl {patient.level}</span>
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Games Section */}
        <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12 xl:px-20 pb-12 sm:pb-16">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6 sm:mb-8">
            3 games
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {games.map((game) => (
              <Card
                key={game.id}
                className="relative bg-gradient-to-br from-pink-50 to-purple-50 border-none overflow-hidden cursor-pointer transition-all hover:shadow-xl hover:-translate-y-1 group"
              >
                {/* Shadow circle at bottom */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[300px] sm:w-[400px] h-20 sm:h-24 bg-gradient-to-t from-gray-200/40 to-transparent rounded-full blur-2xl" />

                {/* Game illustration area */}
                <div className="relative h-[200px] sm:h-[240px] lg:h-[280px] flex items-center justify-center p-6 sm:p-8">
                  {/* Game icon */}
                  <div className="relative w-full h-full bg-white/50 rounded-2xl flex items-center justify-center">
                    <span className="text-6xl sm:text-7xl lg:text-8xl">{game.icon}</span>
                  </div>
                </div>

                {/* Game info */}
                <div className="relative px-4 sm:px-6 pb-4 sm:pb-6">
                  {/* Rewards */}
                  <div className="flex items-center justify-center gap-2 sm:gap-3 mb-3 sm:mb-4 flex-wrap">
                    <Badge variant="outline" className="bg-amber-50 border-amber-200 gap-1">
                      <span className="text-base sm:text-lg">🪙</span>
                      <span className="text-xs sm:text-sm font-semibold">+{game.coinsReward} Coins</span>
                    </Badge>
                    <Badge variant="outline" className="bg-yellow-50 border-yellow-200 gap-1">
                      <Star className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-600" />
                      <span className="text-xs sm:text-sm font-semibold">+{game.pointsReward} Points</span>
                    </Badge>
                  </div>

                  {/* Game title */}
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900 text-center mb-3 sm:mb-4">
                    {game.name}
                  </h3>

                  {/* Play button */}
                  <Button
                    className="w-full bg-blue-600 text-white hover:bg-blue-700 text-base sm:text-lg py-5 sm:py-6"
                    onClick={() => handleGameClick(game)}
                  >
                    <span className="mr-2">▶</span>
                    PLAY
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}