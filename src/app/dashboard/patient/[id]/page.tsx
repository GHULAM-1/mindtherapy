"use client"

/* eslint-disable @next/next/no-img-element */
/* eslint-disable react-hooks/exhaustive-deps */

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import { createClient } from "@/lib/supabase/client"
import { getPatient } from "@/app/actions/patients"
import { calculateAge, getAgeDisplay } from "@/types/patient.types"
import {
  ArrowLeft,
  Calendar,
  MessageSquare,
  Brain,
  Play,
  Settings,
  TrendingUp,
  Target,
  Clock,
  Award,
  Activity,
  Edit,
  Save,
  X,
  FileText,
  Gamepad2,
  Star,
  Flame,
} from "lucide-react"
import PatientDocuments from "@/components/PatientDocuments"
import PinModal from "@/components/PinModal"

interface Patient {
  id: string
  name: string
  age: number
  ageDisplay: string
  dateOfBirth: string
  condition: string
  autismLevel?: 1 | 2 | 3
  language: string
  profileImage?: string
  lastActivity: string
  progressScore: number
  totalSessions: number
  weeklyGoal: number
  completedThisWeek: number
  status: "active" | "inactive" | "needs_attention"
  additionalInfo?: string
  goals: string[]
  achievements: Array<{
    id: string
    title: string
    description: string
    date: string
    type: "milestone" | "streak" | "improvement"
  }>
  weeklyProgress: Array<{
    week: string
    sessions: number
    progress: number
  }>
  sessionHistory: Array<{
    id: string
    date: string
    duration: number
    tool: string
    score: number
    notes?: string
  }>
  gamificationStats?: {
    level: number
    totalPoints: number
    dailyStreak: number
    achievementsUnlocked: number
    wordsSpokenTotal: number
  }
}

export default function PatientDetails() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()
  const patientId = params.id as string

  const [patient, setPatient] = useState<Patient | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const [isEditing, setIsEditing] = useState(false)
  const [activeTab, setActiveTab] = useState<"overview" | "documents">("overview")
  const [editForm, setEditForm] = useState({
    weeklyGoal: 3,
    goals: "",
    additionalInfo: "",
  })

  // PIN protection for child mode
  const [showPinModal, setShowPinModal] = useState(false)
  const [pinMode, setPinMode] = useState<"setup" | "verify">("setup")
  const [existingPin, setExistingPin] = useState<string | null>(null)

  useEffect(() => {
    loadPatient()
  }, [patientId])

  async function loadPatient() {
    setIsLoading(true)
    try {
      // Load user profile to get global PIN
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("global_child_mode_pin")
          .eq("id", user.id)
          .single()

        if (profile?.global_child_mode_pin) {
          setExistingPin(profile.global_child_mode_pin)
        }
      }

      const result = await getPatient(patientId)

      if (result.success && result.data) {
        const p = result.data

        // Transform database patient to UI patient
        const uiPatient: Patient = {
          id: p.id,
          name: p.name,
          age: calculateAge(p.date_of_birth),
          ageDisplay: getAgeDisplay(p.date_of_birth),
          dateOfBirth: p.date_of_birth,
          condition: p.condition,
          autismLevel: p.autism_level ? parseInt(p.autism_level) as 1 | 2 | 3 : undefined,
          language: p.language,
          profileImage: p.avatar_url || undefined,
          lastActivity: p.last_activity || new Date().toISOString().split("T")[0],
          progressScore: Math.round(
            (p.sessions_this_week / p.weekly_goal) * 100 + (p.average_score || 0) / 2
          ),
          totalSessions: p.total_sessions,
          weeklyGoal: p.weekly_goal,
          completedThisWeek: p.sessions_this_week,
          status: p.status,
          additionalInfo: p.additional_info || undefined,
          goals: p.therapy_goals ? p.therapy_goals.split("\n").filter(g => g.trim()) : [],
          achievements: [], // TODO: Load from gamification
          weeklyProgress: [], // TODO: Calculate from sessions
          sessionHistory: [], // TODO: Load recent sessions
          gamificationStats: p.gamification
            ? {
                level: p.gamification.level,
                totalPoints: p.gamification.total_points,
                dailyStreak: p.gamification.current_streak,
                achievementsUnlocked: p.gamification.achievements?.length || 0,
                wordsSpokenTotal: p.gamification.words_spoken_total || 0,
              }
            : undefined,
        }

        setPatient(uiPatient)
        setEditForm({
          weeklyGoal: uiPatient.weeklyGoal,
          goals: uiPatient.goals.join("\n"),
          additionalInfo: uiPatient.additionalInfo || "",
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

  const handleSaveEdit = async () => {
    try {
      const { updatePatient } = await import("@/app/actions/patients")

      const result = await updatePatient(patientId, {
        weekly_goal: editForm.weeklyGoal,
        therapy_goals: editForm.goals,
        additional_info: editForm.additionalInfo,
      })

      if (result.success) {
        // Reload patient data
        await loadPatient()
        setIsEditing(false)
      } else {
        alert(result.error || "Erro ao guardar alterações")
      }
    } catch (error) {
      console.error("Error saving edits:", error)
      alert("Erro ao guardar alterações")
    }
  }

  const handlePassToChild = () => {
    // Check if PIN already exists
    if (existingPin) {
      setPinMode("verify")
    } else {
      setPinMode("setup")
    }
    setShowPinModal(true)
  }

  const handlePinSuccess = async (pin: string) => {
    setShowPinModal(false)

    // If creating new PIN, save to profile (global for all patients)
    if (pinMode === "setup") {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (user) {
          const { error } = await supabase
            .from("profiles")
            .update({ global_child_mode_pin: pin })
            .eq("id", user.id)

          if (error) {
            console.error("Error saving PIN:", error)
            alert("Erro ao guardar PIN")
            return
          }

          setExistingPin(pin)
        }
      } catch (error) {
        console.error("Error saving PIN:", error)
        alert("Erro ao guardar PIN")
        return
      }
    }

    // Store PIN in sessionStorage for this browser tab
    sessionStorage.setItem(`child_mode_pin_${patientId}`, existingPin || pin)
    // Navigate to child mode
    router.push(`/dashboard/patient/${patientId}/play`)
  }

  const getConditionLabel = (condition: string) => {
    switch (condition) {
      case "autism_level_1":
        return "Autismo Nível 1 (Apoio)"
      case "autism_level_2":
        return "Autismo Nível 2 (Apoio Substancial)"
      case "autism_level_3":
        return "Autismo Nível 3 (Apoio Muito Substancial)"
      default:
        return condition
    }
  }

  const getLanguageLabel = (lang: string) => {
    switch (lang) {
      case "pt":
        return "🇵🇹 Português"
      case "en":
        return "🇬🇧 Inglês"
      case "es":
        return "🇪🇸 Espanhol"
      case "fr":
        return "🇫🇷 Francês"
      default:
        return lang
    }
  }

  const getAchievementIcon = (type: string) => {
    switch (type) {
      case "milestone":
        return <Target className="w-5 h-5 text-blue-600" />
      case "streak":
        return <Award className="w-5 h-5 text-yellow-600" />
      case "improvement":
        return <TrendingUp className="w-5 h-5 text-green-600" />
      default:
        return <Award className="w-5 h-5 text-gray-600" />
    }
  }

  const getAchievementColor = (type: string) => {
    switch (type) {
      case "milestone":
        return "bg-blue-100 border-blue-200"
      case "streak":
        return "bg-yellow-100 border-yellow-200"
      case "improvement":
        return "bg-green-100 border-green-200"
      default:
        return "bg-gray-100 border-gray-200"
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
          <p className="text-gray-600">A carregar dados do paciente...</p>
        </div>
      </div>
    )
  }

  if (!patient) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Paciente não encontrado</p>
          <button
            onClick={() => router.push("/dashboard")}
            className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Voltar ao Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-16 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => router.push('/dashboard')} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-3">
                <Image
                  src="/logos/mindtherapy.svg"
                  alt="MindTherapy"
                  width={32}
                  height={32}
                  className="h-8 w-auto object-contain"
                  priority
                />
                <div>
                  <h1 className="text-lg font-bold text-gray-900">MindTherapy</h1>
                  <p className="text-sm text-gray-600">Detalhes do Paciente</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isEditing ? (
                <>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                    Cancelar
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    Guardar
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  Editar
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Patient Header */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden mb-8">
          {/* Main Info Section */}
          <div className="p-6 md:p-8 bg-gradient-to-br from-purple-50/50 via-white to-blue-50/50">
            <div className="flex flex-col md:flex-row md:items-center gap-6">
              {/* Avatar & Name */}
              <div className="flex items-center gap-4 md:gap-6">
                <div className="w-20 h-20 md:w-24 md:h-24 bg-gradient-to-r from-purple-400 to-pink-400 rounded-2xl flex items-center justify-center text-white text-2xl md:text-3xl font-bold overflow-hidden flex-shrink-0 shadow-lg">
                  {patient.profileImage ? (
                    <img src={patient.profileImage} alt={patient.name} className="w-full h-full object-cover" />
                  ) : (
                    <span>
                      {patient.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-2xl md:text-4xl font-bold text-gray-900 mb-2">{patient.name}</h2>
                  <div className="flex flex-wrap items-center gap-3 text-sm md:text-base text-gray-600">
                    <span className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg shadow-sm">
                      <Calendar className="w-4 h-4 text-purple-500" />
                      <span className="font-medium">{patient.ageDisplay}</span>
                    </span>
                    <span className="hidden sm:inline bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg font-medium">
                      {getConditionLabel(patient.condition)}
                    </span>
                    <span className="hidden lg:inline bg-green-50 text-green-700 px-3 py-1.5 rounded-lg font-medium">
                      {getLanguageLabel(patient.language)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Status & Activity */}
              <div className="flex flex-col gap-2 md:ml-auto">
                <span
                  className={`px-4 py-2 rounded-lg text-sm font-semibold text-center shadow-sm ${
                    patient.status === "active"
                      ? "bg-green-100 text-green-800"
                      : patient.status === "inactive"
                        ? "bg-gray-100 text-gray-800"
                        : "bg-red-100 text-red-800"
                  }`}
                >
                  {patient.status === "active"
                    ? "✓ Ativo"
                    : patient.status === "inactive"
                      ? "○ Inativo"
                      : "! Precisa Atenção"}
                </span>
                <span className="text-xs text-gray-500 text-center md:text-right">
                  Última atividade: {new Date(patient.lastActivity).toLocaleDateString("pt-PT")}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons Section */}
          <div className="px-6 md:px-8 py-4 bg-gray-50 border-t border-gray-100">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
              <button
                onClick={handlePassToChild}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg hover:shadow-xl hover:scale-105 font-semibold text-sm md:text-base"
              >
                <Gamepad2 className="w-5 h-5" />
                <span>Passar para a Criança</span>
              </button>
              <button className="flex items-center justify-center gap-2 px-5 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-md hover:shadow-lg font-medium text-sm md:text-base">
                <MessageSquare className="w-5 h-5" />
                <span className="hidden sm:inline">Abrir AAC</span>
              </button>
              <button className="p-3 text-gray-600 hover:bg-white rounded-xl transition-all shadow-sm hover:shadow-md">
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-8">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab("overview")}
              className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors relative ${
                activeTab === "overview"
                  ? "text-purple-600 border-b-2 border-purple-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <Activity className="w-5 h-5" />
              Visão Geral
            </button>
            <button
              onClick={() => setActiveTab("documents")}
              className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors relative ${
                activeTab === "documents"
                  ? "text-purple-600 border-b-2 border-purple-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <FileText className="w-5 h-5" />
              Documentos
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === "overview" ? (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Progresso Geral</p>
                <p className="text-3xl font-bold text-purple-600">{patient.progressScore}%</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <div className="w-full h-2 bg-gray-200 rounded-full mt-3">
              <div
                className="h-full bg-purple-500 rounded-full transition-all"
                style={{ width: `${patient.progressScore}%` }}
              />
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Sessões Totais</p>
                <p className="text-3xl font-bold text-blue-600">{patient.totalSessions}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Activity className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Esta Semana</p>
                <p className="text-3xl font-bold text-green-600">
                  {patient.completedThisWeek}/{patient.weeklyGoal}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Target className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div className="w-full h-2 bg-gray-200 rounded-full mt-3">
              <div
                className="h-full bg-green-500 rounded-full transition-all"
                style={{ width: `${(patient.completedThisWeek / patient.weeklyGoal) * 100}%` }}
              />
            </div>
          </div>

          {patient.gamificationStats ? (
            <>
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Pontos</p>
                    <p className="text-3xl font-bold text-purple-600">{patient.gamificationStats.totalPoints}</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Star className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Streak</p>
                    <p className="text-3xl font-bold text-orange-600">{patient.gamificationStats.dailyStreak}</p>
                  </div>
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Flame className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Conquistas</p>
                  <p className="text-3xl font-bold text-orange-600">{patient.achievements.length}</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Award className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Progress Chart */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Progresso Semanal</h3>
              <div className="space-y-4">
                {patient.weeklyProgress.map((week, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <div className="w-16 text-sm font-medium text-gray-600">{week.week}</div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-600">{week.sessions} sessões</span>
                        <span className="text-sm font-medium text-gray-900">{week.progress}%</span>
                      </div>
                      <div className="w-full h-3 bg-gray-200 rounded-full">
                        <div
                          className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full transition-all"
                          style={{ width: `${week.progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Session History */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Histórico de Sessões</h3>
              <div className="space-y-4">
                {patient.sessionHistory.map((session) => (
                  <div key={session.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <MessageSquare className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{session.tool}</h4>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span>{new Date(session.date).toLocaleDateString("pt-PT")}</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {session.duration}min
                          </span>
                        </div>
                        {session.notes && <p className="text-sm text-gray-600 mt-1">{session.notes}</p>}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-gray-900">{session.score}%</div>
                      <div className="text-sm text-gray-600">Score</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Goals */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Objetivos</h3>
              {isEditing ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Objetivo Semanal (sessões)</label>
                  <input
                    type="number"
                    value={editForm.weeklyGoal}
                    onChange={(e) => setEditForm({ ...editForm, weeklyGoal: Number.parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent mb-4"
                  />
                  <label className="block text-sm font-medium text-gray-700 mb-2">Objetivos (um por linha)</label>
                  <textarea
                    value={editForm.goals}
                    onChange={(e) => setEditForm({ ...editForm, goals: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    rows={6}
                  />
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                    <span className="text-sm font-medium text-purple-900">Objetivo Semanal</span>
                    <span className="text-lg font-bold text-purple-600">{patient.weeklyGoal} sessões</span>
                  </div>
                  {patient.goals.map((goal, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                      <span className="text-sm text-gray-700">{goal}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Gamification Stats */}
            {patient.gamificationStats && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Gamificação</h3>
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="bg-purple-50 p-3 rounded-lg text-center">
                    <Star className="w-5 h-5 text-purple-600 mx-auto mb-1" />
                    <div className="text-lg font-bold text-purple-700">{patient.gamificationStats.totalPoints}</div>
                    <div className="text-xs text-purple-600">Pontos</div>
                  </div>
                  <div className="bg-orange-50 p-3 rounded-lg text-center">
                    <Flame className="w-5 h-5 text-orange-600 mx-auto mb-1" />
                    <div className="text-lg font-bold text-orange-700">{patient.gamificationStats.dailyStreak}</div>
                    <div className="text-xs text-orange-600">Streak</div>
                  </div>
                  <div className="bg-emerald-50 p-3 rounded-lg text-center">
                    <div className="w-5 h-5 bg-emerald-600 rounded-full flex items-center justify-center text-white text-xs font-bold mx-auto mb-1">
                      {patient.gamificationStats.level}
                    </div>
                    <div className="text-lg font-bold text-emerald-700">{patient.gamificationStats.level}</div>
                    <div className="text-xs text-emerald-600">Nível</div>
                  </div>
                </div>
                <div className="text-center text-sm text-gray-600">
                  {patient.gamificationStats.achievementsUnlocked} conquistas desbloqueadas
                </div>
              </div>
            )}

            {/* Achievements */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Conquistas Recentes</h3>
              <div className="space-y-3">
                {patient.achievements.slice(0, 3).map((achievement) => (
                  <div
                    key={achievement.id}
                    className={`p-3 rounded-lg border ${getAchievementColor(achievement.type)}`}
                  >
                    <div className="flex items-start gap-3">
                      {getAchievementIcon(achievement.type)}
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 text-sm">{achievement.title}</h4>
                        <p className="text-xs text-gray-600 mt-1">{achievement.description}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(achievement.date).toLocaleDateString("pt-PT")}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Additional Info */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Informações Adicionais</h3>
              {isEditing ? (
                <textarea
                  value={editForm.additionalInfo}
                  onChange={(e) => setEditForm({ ...editForm, additionalInfo: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  rows={4}
                  placeholder="Adicione notas sobre características, interesses, desafios..."
                />
              ) : (
                <p className="text-sm text-gray-700 leading-relaxed">
                  {patient.additionalInfo || "Nenhuma informação adicional disponível."}
                </p>
              )}
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Ações Rápidas</h3>
              <div className="space-y-3">
                <button className="w-full flex items-center gap-3 p-3 text-left hover:bg-blue-50 rounded-lg transition-colors">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">Comunicador AAC</div>
                    <div className="text-sm text-gray-600">Iniciar sessão</div>
                  </div>
                </button>

                <div className="w-full flex items-center gap-3 p-3 bg-gray-50 rounded-lg opacity-60 cursor-not-allowed">
                  <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                    <Brain className="w-5 h-5 text-gray-400" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-500">Jogos de Memória</div>
                    <div className="text-sm text-gray-400">Em breve</div>
                  </div>
                </div>

                <div className="w-full flex items-center gap-3 p-3 bg-gray-50 rounded-lg opacity-60 cursor-not-allowed">
                  <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                    <Play className="w-5 h-5 text-gray-400" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-500">Outros Jogos</div>
                    <div className="text-sm text-gray-400">Em breve</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
          </>
        ) : (
          <PatientDocuments patientId={patientId} patientName={patient.name} />
        )}
      </div>

      {/* PIN Modal */}
      <PinModal
        isOpen={showPinModal}
        onClose={() => setShowPinModal(false)}
        onSuccess={handlePinSuccess}
        mode={pinMode}
        title={pinMode === "setup" ? "Criar PIN de Segurança" : "Verificar PIN"}
        description={
          pinMode === "setup"
            ? "Cria um PIN de 6 dígitos para proteger o acesso à área da criança"
            : "Introduz o PIN para aceder à área da criança"
        }
        storedPin={existingPin || ""}
      />
    </div>
  )
}
