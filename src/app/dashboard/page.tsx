"use client"

/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @next/next/no-img-element */

import type React from "react"
import { useState, useEffect } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { getPatients, createPatient, updatePatient, deletePatient } from "@/app/actions/patients"
import { calculateAge, calculateProgressScore, getAgeDisplay } from "@/types/patient.types"
import type { PatientCondition, AutismLevel, LanguageCode, PatientStatus } from "@/types/patient.types"
import type { Profile } from "@/types/database.types"
import {
  Plus,
  Users,
  TrendingUp,
  Edit,
  Trash2,
  UserX,
  UserCheck,
  Calendar,
  MessageSquare,
  Brain,
  Settings,
  Search,
  MoreVertical,
  Play,
  Bell,
  User,
  LogOut,
  ChevronDown,
  Activity,
  X,
  Camera,
  Home,
  BarChart3,
  FileText,
  Menu,
  ChevronRight,
  Gamepad2,
  Star,
  Flame,
  Trophy,
} from "lucide-react"
import PinModal from "@/components/PinModal"
import { ProgressCharts } from "@/components/progress-charts"
import { NotificationCenter } from "@/components/notification-center"
import { NotificationToast } from "@/components/notification-toast"
import { useNotifications } from "@/hooks/use-notifications"
import { ReportsSection } from "@/components/reports-section"
import { PatientCardSkeleton, StatsCardSkeleton } from "@/components/PatientCardSkeleton"

interface Patient {
  id: string
  name: string
  age: number
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
  gamificationStats?: {
    level: number
    totalPoints: number
    dailyStreak: number
    achievementsUnlocked: number
    wordsSpokenTotal: number
  }
}

interface AddPatientFormData {
  name: string
  dateOfBirth: string
  condition: string
  autismLevel?: 1 | 2 | 3
  language: string
  additionalInfo: string
}

export default function Dashboard() {
  const router = useRouter()
  const supabase = createClient()
  const [isLoading, setIsLoading] = useState(true)
  const [userProfile, setUserProfile] = useState<Profile | null>(null)

  const [patients, setPatients] = useState<Patient[]>([])

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [currentView, setCurrentView] = useState("dashboard")
  const [showAddPatient, setShowAddPatient] = useState(false)
  const [selectedAvatarFile, setSelectedAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [editAvatarFile, setEditAvatarFile] = useState<File | null>(null)
  const [editAvatarPreview, setEditAvatarPreview] = useState<string | null>(null)
  const [showEditPatient, setShowEditPatient] = useState(false)
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive" | "needs_attention">("all")
  const [sortBy, setSortBy] = useState<"name" | "progress" | "lastActivity" | "age">("name")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [openPatientMenu, setOpenPatientMenu] = useState<string | null>(null)
  const [showPinModal, setShowPinModal] = useState(false)
  const [selectedPatientForPlay, setSelectedPatientForPlay] = useState<string | null>(null)
  const [pinMode, setPinMode] = useState<"setup" | "verify">("setup")
  const [existingPin, setExistingPin] = useState<string | null>(null)

  // Load real data from database
  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true)

        // Get user profile
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          router.push("/login")
          return
        }

        const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()
        setUserProfile(profile)

        // Get patients
        const result = await getPatients()
        if (result.success && result.data) {
          // Transform database patients to UI format
          const uiPatients = result.data.map((p) => ({
            id: p.id,
            name: p.name,
            age: calculateAge(p.date_of_birth),
            dateOfBirth: p.date_of_birth,
            condition: p.condition,
            autismLevel: p.autism_level ? parseInt(p.autism_level) as 1 | 2 | 3 : undefined,
            language: p.language,
            profileImage: p.avatar_url || undefined,
            lastActivity: p.last_activity || new Date().toISOString().split("T")[0],
            progressScore: calculateProgressScore(
              p.total_sessions,
              p.average_score,
              p.weekly_goal,
              p.sessions_this_week
            ),
            totalSessions: p.total_sessions,
            weeklyGoal: p.weekly_goal,
            completedThisWeek: p.sessions_this_week,
            status: p.status,
            gamificationStats: p.gamification
              ? {
                  level: p.gamification.level,
                  totalPoints: p.gamification.total_points,
                  dailyStreak: p.gamification.current_streak,
                  achievementsUnlocked: p.gamification.achievements?.length || 0,
                  wordsSpokenTotal: p.gamification.words_spoken_total || 0,
                }
              : undefined,
          }))
          setPatients(uiPatients)
        }
      } catch (error) {
        console.error("Error loading dashboard data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [router, supabase])

  const {
    notifications: allNotifications,
    toastNotifications,
    unreadCount: notificationUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    removeToast,
  } = useNotifications()

  const [showNotificationCenter, setShowNotificationCenter] = useState(false)

  const [addPatientForm, setAddPatientForm] = useState<AddPatientFormData>({
    name: "",
    dateOfBirth: "",
    condition: "",
    autismLevel: undefined,
    language: "pt",
    additionalInfo: "",
  })

  const [editPatientForm, setEditPatientForm] = useState<AddPatientFormData>({
    name: "",
    dateOfBirth: "",
    condition: "",
    autismLevel: undefined,
    language: "pt",
    additionalInfo: "",
  })

  const filteredAndSortedPatients = patients
    .filter((patient) => {
      const matchesSearch = patient.name.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesFilter = filterStatus === "all" || patient.status === filterStatus
      return matchesSearch && matchesFilter
    })
    .sort((a, b) => {
      let aValue: string | number | Date
      let bValue: string | number | Date

      switch (sortBy) {
        case "name":
          aValue = a.name.toLowerCase()
          bValue = b.name.toLowerCase()
          break
        case "progress":
          aValue = a.progressScore
          bValue = b.progressScore
          break
        case "lastActivity":
          aValue = new Date(a.lastActivity)
          bValue = new Date(b.lastActivity)
          break
        case "age":
          aValue = a.age
          bValue = b.age
          break
        default:
          return 0
      }

      if (aValue < bValue) return sortOrder === "asc" ? -1 : 1
      if (aValue > bValue) return sortOrder === "asc" ? 1 : -1
      return 0
    })

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedAvatarFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleEditAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setEditAvatarFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setEditAvatarPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleAddPatient = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      let avatarUrl: string | undefined = undefined

      // Upload avatar if selected
      if (selectedAvatarFile) {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (user) {
          const fileExt = selectedAvatarFile.name.split(".").pop()
          const fileName = `${user.id}/patients/${Date.now()}.${fileExt}`

          const { error: uploadError } = await supabase.storage
            .from("avatars")
            .upload(fileName, selectedAvatarFile, { upsert: true })

          if (!uploadError) {
            const {
              data: { publicUrl },
            } = supabase.storage.from("avatars").getPublicUrl(fileName)
            avatarUrl = publicUrl
          }
        }
      }

      // Create patient in database
      const result = await createPatient({
        name: addPatientForm.name,
        date_of_birth: addPatientForm.dateOfBirth,
        condition: addPatientForm.condition as PatientCondition,
        autism_level: addPatientForm.autismLevel?.toString() as AutismLevel,
        language: addPatientForm.language as LanguageCode,
        additional_info: addPatientForm.additionalInfo,
        weekly_goal: 3,
        avatar_url: avatarUrl,
      })

      if (!result.success) {
        alert(result.error || "Erro ao adicionar pessoa")
        return
      }

      // Reload data to show new patient
      const patientsResult = await getPatients()
      if (patientsResult.success && patientsResult.data) {
        const uiPatients = patientsResult.data.map((p) => ({
          id: p.id,
          name: p.name,
          age: calculateAge(p.date_of_birth),
          dateOfBirth: p.date_of_birth,
          condition: p.condition,
          autismLevel: p.autism_level ? parseInt(p.autism_level) as 1 | 2 | 3 : undefined,
          language: p.language,
          profileImage: p.avatar_url || undefined,
          lastActivity: p.last_activity || new Date().toISOString().split("T")[0],
          progressScore: calculateProgressScore(
            p.total_sessions,
            p.average_score,
            p.weekly_goal,
            p.sessions_this_week
          ),
          totalSessions: p.total_sessions,
          weeklyGoal: p.weekly_goal,
          completedThisWeek: p.sessions_this_week,
          status: p.status,
          gamificationStats: p.gamification
            ? {
                level: p.gamification.level,
                totalPoints: p.gamification.total_points,
                dailyStreak: p.gamification.current_streak,
                achievementsUnlocked: p.gamification.achievements?.length || 0,
                wordsSpokenTotal: p.gamification.words_spoken_total || 0,
              }
            : undefined,
        }))
        setPatients(uiPatients)
      }

      setShowAddPatient(false)
      setSelectedAvatarFile(null)
      setAvatarPreview(null)
      setAddPatientForm({
        name: "",
        dateOfBirth: "",
        condition: "",
        autismLevel: undefined,
        language: "pt",
        additionalInfo: "",
      })
    } catch (error) {
      console.error("Error adding patient:", error)
      alert("Erro inesperado ao adicionar pessoa")
    } finally {
      setIsSubmitting(false)
    }
  }

  const getConditionLabel = (condition: string) => {
    switch (condition) {
      case "autism_level_1":
        return "Autismo Nível 1 (Apoio)"
      case "autism_level_2":
        return "Autismo Nível 2 (Apoio Substancial)"
      case "autism_level_3":
        return "Autismo Nível 3 (Apoio Muito Substancial)"
      case "adhd":
        return "TDAH"
      case "communication_disorder":
        return "Perturbação da Comunicação"
      case "intellectual_disability":
        return "Deficiência Intelectual"
      case "other":
        return "Outro"
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "inactive":
        return "bg-gray-100 text-gray-800"
      case "needs_attention":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/login")
  }

  const handleTogglePatientStatus = async (patientId: string, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "inactive" : "active"

    try {
      const result = await updatePatient(patientId, { status: newStatus as PatientStatus })

      if (!result.success) {
        alert(result.error || "Erro ao atualizar estado")
        return
      }

      // Reload patients
      const patientsResult = await getPatients()
      if (patientsResult.success && patientsResult.data) {
        const uiPatients = patientsResult.data.map((p) => ({
          id: p.id,
          name: p.name,
          age: calculateAge(p.date_of_birth),
          dateOfBirth: p.date_of_birth,
          condition: p.condition,
          autismLevel: p.autism_level ? parseInt(p.autism_level) as 1 | 2 | 3 : undefined,
          language: p.language,
          profileImage: p.avatar_url || undefined,
          lastActivity: p.last_activity || new Date().toISOString().split("T")[0],
          progressScore: calculateProgressScore(
            p.total_sessions,
            p.average_score,
            p.weekly_goal,
            p.sessions_this_week
          ),
          totalSessions: p.total_sessions,
          weeklyGoal: p.weekly_goal,
          completedThisWeek: p.sessions_this_week,
          status: p.status,
          gamificationStats: p.gamification
            ? {
                level: p.gamification.level,
                totalPoints: p.gamification.total_points,
                dailyStreak: p.gamification.current_streak,
                achievementsUnlocked: p.gamification.achievements?.length || 0,
                wordsSpokenTotal: p.gamification.words_spoken_total || 0,
              }
            : undefined,
        }))
        setPatients(uiPatients)
      }
      setOpenPatientMenu(null)
    } catch (error) {
      console.error("Error toggling patient status:", error)
      alert("Erro inesperado ao atualizar estado")
    }
  }

  const handleDeletePatient = async (patientId: string, patientName: string) => {
    const confirmDelete = confirm(
      `Tem a certeza que deseja eliminar ${patientName}?\n\nEsta ação não pode ser revertida e todos os dados associados serão perdidos.`
    )

    if (!confirmDelete) return

    try {
      const result = await deletePatient(patientId)

      if (!result.success) {
        alert(result.error || "Erro ao eliminar pessoa")
        return
      }

      // Remove from local state
      setPatients(patients.filter((p) => p.id !== patientId))
      setOpenPatientMenu(null)
    } catch (error) {
      console.error("Error deleting patient:", error)
      alert("Erro inesperado ao eliminar pessoa")
    }
  }

  const handleViewPatientDetails = (patientId: string) => {
    router.push(`/dashboard/patient/${patientId}`)
  }

  const handleOpenEditModal = (patient: Patient) => {
    setEditingPatient(patient)
    setEditPatientForm({
      name: patient.name,
      dateOfBirth: patient.dateOfBirth,
      condition: patient.condition,
      autismLevel: patient.autismLevel,
      language: patient.language,
      additionalInfo: "", // We don't have this in the current Patient interface
    })
    // Set current avatar as preview
    setEditAvatarPreview(patient.profileImage || null)
    setEditAvatarFile(null)
    setShowEditPatient(true)
    setOpenPatientMenu(null)
  }

  const handleUpdatePatient = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingPatient) return

    setIsSubmitting(true)

    try {
      let avatarUrl: string | undefined = undefined

      // Upload new avatar if selected
      if (editAvatarFile) {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (user) {
          const fileExt = editAvatarFile.name.split(".").pop()
          const fileName = `${user.id}/patients/${Date.now()}.${fileExt}`

          const { error: uploadError } = await supabase.storage
            .from("avatars")
            .upload(fileName, editAvatarFile, { upsert: true })

          if (!uploadError) {
            const {
              data: { publicUrl },
            } = supabase.storage.from("avatars").getPublicUrl(fileName)
            avatarUrl = publicUrl
          }
        }
      }

      // Update patient in database
      const updateData: {
        name: string
        date_of_birth: string
        condition: PatientCondition
        autism_level?: AutismLevel
        language: LanguageCode
        additional_info: string
        avatar_url?: string
      } = {
        name: editPatientForm.name,
        date_of_birth: editPatientForm.dateOfBirth,
        condition: editPatientForm.condition as PatientCondition,
        autism_level: editPatientForm.autismLevel?.toString() as AutismLevel,
        language: editPatientForm.language as LanguageCode,
        additional_info: editPatientForm.additionalInfo,
      }

      // Only add avatar_url if a new one was uploaded
      if (avatarUrl) {
        updateData.avatar_url = avatarUrl
      }

      const result = await updatePatient(editingPatient.id, updateData)

      if (!result.success) {
        alert(result.error || "Erro ao atualizar pessoa")
        return
      }

      // Reload data to show updated patient
      const patientsResult = await getPatients()
      if (patientsResult.success && patientsResult.data) {
        const uiPatients = patientsResult.data.map((p) => ({
          id: p.id,
          name: p.name,
          age: calculateAge(p.date_of_birth),
          dateOfBirth: p.date_of_birth,
          condition: p.condition,
          autismLevel: p.autism_level ? parseInt(p.autism_level) as 1 | 2 | 3 : undefined,
          language: p.language,
          profileImage: p.avatar_url || undefined,
          lastActivity: p.last_activity || new Date().toISOString().split("T")[0],
          progressScore: calculateProgressScore(
            p.total_sessions,
            p.average_score,
            p.weekly_goal,
            p.sessions_this_week
          ),
          totalSessions: p.total_sessions,
          weeklyGoal: p.weekly_goal,
          completedThisWeek: p.sessions_this_week,
          status: p.status,
          gamificationStats: p.gamification
            ? {
                level: p.gamification.level,
                totalPoints: p.gamification.total_points,
                dailyStreak: p.gamification.current_streak,
                achievementsUnlocked: p.gamification.achievements?.length || 0,
                wordsSpokenTotal: p.gamification.words_spoken_total || 0,
              }
            : undefined,
        }))
        setPatients(uiPatients)
      }

      setShowEditPatient(false)
      setEditingPatient(null)
      setEditPatientForm({
        name: "",
        dateOfBirth: "",
        condition: "",
        autismLevel: undefined,
        language: "pt",
        additionalInfo: "",
      })
    } catch (error) {
      console.error("Error updating patient:", error)
      alert("Erro inesperado ao atualizar pessoa")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePassToChild = async (patientId: string) => {
    setSelectedPatientForPlay(patientId)

    // Load user profile to check if global PIN exists
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
        setPinMode("verify")
      } else {
        setExistingPin(null)
        setPinMode("setup")
      }
    }

    setShowPinModal(true)
  }

  const handlePinSuccess = async (pin: string) => {
    if (!selectedPatientForPlay) return

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
    sessionStorage.setItem(`child_mode_pin_${selectedPatientForPlay}`, existingPin || pin)
    setShowPinModal(false)
    // Navigate to child mode
    router.push(`/dashboard/patient/${selectedPatientForPlay}/play`)
  }

  const totalPatients = patients.length
  const activePatients = patients.filter((p) => p.status === "active").length
  const needsAttentionCount = patients.filter((p) => p.status === "needs_attention").length
  const averageProgress = Math.round(patients.reduce((acc, p) => acc + p.progressScore, 0) / patients.length) || 0

  const navigationItems = [
    { id: "dashboard", label: "Dashboard", icon: Home, active: currentView === "dashboard" },
    { id: "patients", label: "Pessoas", icon: Users, active: currentView === "patients" },
    { id: "progress", label: "Progresso", icon: BarChart3, active: currentView === "progress" },
    { id: "reports", label: "Relatórios", icon: FileText, active: currentView === "reports" },
  ]

  const progressChartsData = {
    weeklyData: [
      { week: "Sem 1", sessions: 3, progress: 65, goal: 5 },
      { week: "Sem 2", sessions: 4, progress: 70, goal: 5 },
      { week: "Sem 3", sessions: 5, progress: 75, goal: 5 },
      { week: "Sem 4", sessions: 3, progress: 78, goal: 5 },
      { week: "Sem 5", sessions: 4, progress: 82, goal: 5 },
      { week: "Sem 6", sessions: 5, progress: 85, goal: 5 },
    ],
    sessionData: [
      { date: "2025-01-20", score: 75, duration: 25, tool: "AAC" },
      { date: "2025-01-21", score: 78, duration: 30, tool: "AAC" },
      { date: "2025-01-22", score: 82, duration: 28, tool: "AAC" },
      { date: "2025-01-23", score: 79, duration: 32, tool: "AAC" },
      { date: "2025-01-24", score: 85, duration: 27, tool: "AAC" },
      { date: "2025-01-25", score: 88, duration: 35, tool: "AAC" },
      { date: "2025-01-26", score: 83, duration: 29, tool: "AAC" },
      { date: "2025-01-27", score: 87, duration: 31, tool: "AAC" },
    ],
    overallStats: {
      totalSessions: 135,
      averageScore: 82,
      totalTime: 3840, // minutes
      toolUsage: [
        { tool: "Comunicador AAC", sessions: 120, color: "#8B5CF6" },
        { tool: "Jogos de Memória", sessions: 10, color: "#06B6D4" },
        { tool: "Outros Jogos", sessions: 5, color: "#10B981" },
      ],
    },
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
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
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-2 rounded-lg hover:bg-gray-100 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="p-4 space-y-2">
          {navigationItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setCurrentView(item.id)
                setSidebarOpen(false)
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors cursor-pointer ${
                item.active ? "bg-purple-100 text-purple-700 font-medium" : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
              {item.id === "patients" && needsAttentionCount > 0 && (
                <span className="ml-auto bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                  {needsAttentionCount}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-200 mt-auto">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Notificações Recentes</h3>
          <div className="space-y-2">
            {allNotifications.slice(0, 3).map((notification) => {
              const timeAgo = Math.floor((Date.now() - notification.timestamp.getTime()) / (1000 * 60 * 60))
              return (
                <div key={notification.id} className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-700 line-clamp-2">{notification.message}</p>
                  <p className="text-xs text-gray-500 mt-1">há {timeAgo}h</p>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="lg:ml-64 min-h-screen">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur border-b border-gray-100 sticky top-0 z-40">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="h-16 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg hover:bg-gray-100 cursor-pointer">
                  <Menu className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span>Dashboard</span>
                  <ChevronRight className="w-4 h-4" />
                  <span className="font-medium text-gray-900">
                    {navigationItems.find((item) => item.id === currentView)?.label}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                {/* Notification Bell */}
                <button
                  onClick={() => setShowNotificationCenter(true)}
                  className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  <Bell className="w-5 h-5 text-gray-600" />
                  {notificationUnreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                      {notificationUnreadCount > 9 ? "9+" : notificationUnreadCount}
                    </span>
                  )}
                </button>

                {/* User Menu */}
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-purple-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-700 hidden sm:block">
                      {userProfile?.full_name || "Utilizador"}
                    </span>
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  </button>

                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                      <button
                        onClick={() => router.push("/settings")}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
                      >
                        <Settings className="w-4 h-4" />
                        Definições
                      </button>
                      <button
                        onClick={() => setShowNotificationCenter(true)}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
                      >
                        <Bell className="w-4 h-4" />
                        Notificações
                      </button>
                      <hr className="my-1" />
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        Terminar Sessão
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="px-4 sm:px-6 lg:px-8 py-8">
          {/* Conditional rendering for different views */}
          {currentView === "dashboard" && (
            <div>
              {/* Welcome Section */}
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  Bem-vind{userProfile?.full_name?.endsWith("a") ? "a" : "o"} de volta, {userProfile?.full_name || "Utilizador"}! 👋
                </h2>
                <p className="text-gray-600">Aqui está um resumo do progresso das pessoas que acompanha.</p>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {isLoading ? (
                  <>
                    <StatsCardSkeleton />
                    <StatsCardSkeleton />
                    <StatsCardSkeleton />
                    <StatsCardSkeleton />
                  </>
                ) : (
                  <>
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Total de Pessoas</p>
                          <p className="text-3xl font-bold text-gray-900">{totalPatients}</p>
                        </div>
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Users className="w-6 h-6 text-blue-600" />
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Pessoas Ativas</p>
                          <p className="text-3xl font-bold text-green-600">{activePatients}</p>
                        </div>
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                          <Activity className="w-6 h-6 text-green-600" />
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Progresso Médio</p>
                          <p className="text-3xl font-bold text-purple-600">{averageProgress}%</p>
                        </div>
                        <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                          <TrendingUp className="w-6 h-6 text-purple-600" />
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Precisam Atenção</p>
                          <p className="text-3xl font-bold text-red-600">{needsAttentionCount}</p>
                        </div>
                        <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                          <Bell className="w-6 h-6 text-red-600" />
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Main Content */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Patients List */}
                <div className="lg:col-span-2">
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                    <div className="p-6 border-b border-gray-100">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-semibold text-gray-900">Pessoas que Acompanha</h3>
                        <button
                          onClick={() => setShowAddPatient(true)}
                          className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors cursor-pointer"
                        >
                          <Plus className="w-4 h-4" />
                          Adicionar Pessoa
                        </button>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1 relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type="text"
                            placeholder="Procurar por nome..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          />
                        </div>
                        <select
                          value={filterStatus}
                          onChange={(e) => setFilterStatus(e.target.value as "all" | "active" | "inactive" | "needs_attention")}
                          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        >
                          <option value="all">Todos</option>
                          <option value="active">Ativos</option>
                          <option value="inactive">Inativos</option>
                          <option value="needs_attention">Precisam Atenção</option>
                        </select>
                        <select
                          value={`${sortBy}-${sortOrder}`}
                          onChange={(e) => {
                            const [field, order] = e.target.value.split("-")
                            setSortBy(field as "name" | "progress" | "lastActivity" | "age")
                            setSortOrder(order as "asc" | "desc")
                          }}
                          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        >
                          <option value="name-asc">Nome A-Z</option>
                          <option value="name-desc">Nome Z-A</option>
                          <option value="progress-desc">Maior Progresso</option>
                          <option value="progress-asc">Menor Progresso</option>
                          <option value="lastActivity-desc">Atividade Recente</option>
                          <option value="age-asc">Mais Novo</option>
                          <option value="age-desc">Mais Velho</option>
                        </select>
                      </div>
                    </div>

                    <div className="divide-y divide-gray-100">
                      {isLoading ? (
                        <>
                          <PatientCardSkeleton />
                          <PatientCardSkeleton />
                          <PatientCardSkeleton />
                        </>
                      ) : filteredAndSortedPatients.length > 0 ? (
                        filteredAndSortedPatients.map((patient) => (
                        <div key={patient.id} className="p-6 hover:bg-gray-50 transition-colors">
                          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                            {/* Patient Info Section */}
                            <div className="flex items-start gap-4 flex-1 min-w-0">
                              <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
                                {patient.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")
                                  .slice(0, 2)}
                              </div>
                              <div className="min-w-0 flex-1">
                                <h4 className="font-semibold text-gray-900 text-lg mb-2">{patient.name}</h4>
                                <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 mb-2">
                                  <span className="bg-gray-100 px-2 py-1 rounded-md">{getAgeDisplay(patient.dateOfBirth)}</span>
                                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-xs font-medium">
                                    {getConditionLabel(patient.condition)}
                                  </span>
                                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded-md text-xs font-medium">
                                    {getLanguageLabel(patient.language)}
                                  </span>
                                </div>
                                <div className="flex flex-wrap items-center gap-3">
                                  <span className="text-xs text-gray-500">
                                    Última atividade: {new Date(patient.lastActivity).toLocaleDateString("pt-PT")}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Progress Section */}
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 lg:gap-6">
                              <div className="bg-gray-50 rounded-lg p-4 min-w-0 flex-shrink-0">
                                <div className="text-sm font-medium text-gray-900 mb-1">
                                  Progresso: {patient.progressScore}%
                                </div>
                                <div className="text-xs text-gray-600 mb-2">
                                  {patient.completedThisWeek}/{patient.weeklyGoal} sessões esta semana
                                </div>
                                <div className="w-32 h-2 bg-gray-200 rounded-full mb-3">
                                  <div
                                    className="h-full bg-purple-500 rounded-full transition-all"
                                    style={{ width: `${patient.progressScore}%` }}
                                  />
                                </div>
                                {patient.gamificationStats && (
                                  <div className="flex items-center gap-3 mt-3">
                                    <div className="flex items-center gap-1 bg-purple-100 px-2 py-1 rounded-md">
                                      <Star className="w-3 h-3 text-purple-600" />
                                      <span className="text-sm font-semibold text-purple-700">{patient.gamificationStats.totalPoints}</span>
                                    </div>
                                    <div className="flex items-center gap-1 bg-orange-100 px-2 py-1 rounded-md">
                                      <Flame className="w-3 h-3 text-orange-600" />
                                      <span className="text-sm font-semibold text-orange-700">{patient.gamificationStats.dailyStreak}</span>
                                    </div>
                                    <div className="flex items-center gap-1 bg-emerald-100 px-2 py-1 rounded-md">
                                      <Trophy className="w-3 h-3 text-emerald-600" />
                                      <span className="text-sm font-semibold text-emerald-700">{patient.gamificationStats.level}</span>
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Action Buttons */}
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <button
                                  onClick={() => handlePassToChild(patient.id)}
                                  className="p-3 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors border border-purple-200 cursor-pointer"
                                  title="Passar para a Criança"
                                >
                                  <Gamepad2 className="w-5 h-5" />
                                </button>
                                <button
                                  className="p-3 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-blue-200 cursor-pointer"
                                  title="Comunicador AAC - Disponível"
                                  onClick={() => (window.location.href = "/aac")}
                                >
                                  <MessageSquare className="w-5 h-5" />
                                </button>
                                <button
                                  className="p-3 text-green-600 hover:bg-green-50 rounded-lg transition-colors border border-green-200 cursor-pointer"
                                  title="Jogos de Comunicação - Disponível"
                                  onClick={() => (window.location.href = "/games")}
                                >
                                  <Brain className="w-5 h-5" />
                                </button>
                                <button
                                  className="p-3 text-gray-400 bg-gray-50 rounded-lg cursor-not-allowed opacity-60 border border-gray-200"
                                  title="Outros Jogos - Em breve"
                                  disabled
                                >
                                  <Play className="w-5 h-5" />
                                </button>
                                <div className="relative">
                                  <button
                                    onClick={() =>
                                      setOpenPatientMenu(openPatientMenu === patient.id ? null : patient.id)
                                    }
                                    className="p-3 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors border border-gray-200 cursor-pointer"
                                    title="Mais opções"
                                  >
                                    <MoreVertical className="w-5 h-5" />
                                  </button>

                                  {openPatientMenu === patient.id && (
                                    <>
                                      {/* Backdrop to close menu */}
                                      <div
                                        className="fixed inset-0 z-10"
                                        onClick={() => setOpenPatientMenu(null)}
                                      />

                                      {/* Dropdown Menu */}
                                      <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                                        <button
                                          onClick={() => handleViewPatientDetails(patient.id)}
                                          className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                                        >
                                          <User className="w-4 h-4" />
                                          Ver Detalhes
                                        </button>

                                        <button
                                          onClick={() => handleOpenEditModal(patient)}
                                          className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                                        >
                                          <Edit className="w-4 h-4" />
                                          Editar Dados
                                        </button>

                                        <hr className="my-1" />

                                        <button
                                          onClick={() => handleTogglePatientStatus(patient.id, patient.status)}
                                          className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                                        >
                                          {patient.status === "active" ? (
                                            <>
                                              <UserX className="w-4 h-4" />
                                              Desativar Pessoa
                                            </>
                                          ) : (
                                            <>
                                              <UserCheck className="w-4 h-4" />
                                              Ativar Pessoa
                                            </>
                                          )}
                                        </button>

                                        <hr className="my-1" />

                                        <button
                                          onClick={() => handleDeletePatient(patient.id, patient.name)}
                                          className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                          Eliminar Pessoa
                                        </button>
                                      </div>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                      ) : (
                        <div className="p-12 text-center">
                          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma pessoa encontrada</h3>
                          <p className="text-gray-600 mb-4">
                            {searchTerm
                              ? "Tente ajustar os seus critérios de pesquisa."
                              : "Comece por adicionar a primeira pessoa que acompanha."}
                          </p>
                          {!searchTerm && (
                            <button
                              onClick={() => setShowAddPatient(true)}
                              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors cursor-pointer"
                            >
                              Adicionar Primeira Pessoa
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                  {/* Quick Actions */}
                  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Ações Rápidas</h3>
                    <div className="space-y-3">
                      <button
                        className="w-full flex items-center gap-3 p-3 text-left hover:bg-purple-50 rounded-lg transition-colors cursor-pointer"
                        onClick={() => (window.location.href = "/aac")}
                      >
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <MessageSquare className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">Comunicador AAC</div>
                          <div className="text-sm text-gray-600">Ferramenta de comunicação</div>
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
                          <Calendar className="w-5 h-5 text-gray-400" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-500">Agendar Sessão</div>
                          <div className="text-sm text-gray-400">Em breve</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Recent Activity */}
                  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Atividade Recente</h3>
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                        <div>
                          <p className="text-sm text-gray-900">Sofia completou uma sessão de comunicação</p>
                          <p className="text-xs text-gray-500">Há 2 horas</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                        <div>
                          <p className="text-sm text-gray-900">Miguel atingiu um novo marco nos jogos</p>
                          <p className="text-xs text-gray-500">Ontem</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                        <div>
                          <p className="text-sm text-gray-900">Ana Costa precisa de atenção</p>
                          <p className="text-xs text-gray-500">Há 2 dias</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentView === "progress" && (
            <div>
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Análise de Progresso</h2>
                <p className="text-gray-600">Visualizações detalhadas do progresso e desempenho.</p>
              </div>

              <ProgressCharts {...progressChartsData} />
            </div>
          )}

          {currentView === "patients" && (
            <div>
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Gestão de Pessoas</h2>
                <p className="text-gray-600">Gerir todas as pessoas que acompanha.</p>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="p-6 border-b border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold text-gray-900">Pessoas que Acompanha</h3>
                    <button
                      onClick={() => setShowAddPatient(true)}
                      className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      Adicionar Pessoa
                    </button>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Procurar por nome..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value as "all" | "active" | "inactive" | "needs_attention")}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="all">Todos</option>
                      <option value="active">Ativos</option>
                      <option value="inactive">Inativos</option>
                      <option value="needs_attention">Precisam Atenção</option>
                    </select>
                    <select
                      value={`${sortBy}-${sortOrder}`}
                      onChange={(e) => {
                        const [field, order] = e.target.value.split("-")
                        setSortBy(field as "name" | "progress" | "lastActivity" | "age")
                        setSortOrder(order as "asc" | "desc")
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="name-asc">Nome A-Z</option>
                      <option value="name-desc">Nome Z-A</option>
                      <option value="progress-desc">Maior Progresso</option>
                      <option value="progress-asc">Menor Progresso</option>
                      <option value="lastActivity-desc">Atividade Recente</option>
                      <option value="age-asc">Mais Novo</option>
                      <option value="age-desc">Mais Velho</option>
                    </select>
                  </div>
                </div>

                <div className="divide-y divide-gray-100">
                  {isLoading ? (
                    <>
                      <PatientCardSkeleton />
                      <PatientCardSkeleton />
                      <PatientCardSkeleton />
                    </>
                  ) : (
                    filteredAndSortedPatients.map((patient) => (
                    <div key={patient.id} className="p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                        {/* Patient Info Section */}
                        <div className="flex items-start gap-4 flex-1 min-w-0">
                          <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
                            {patient.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .slice(0, 2)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="font-semibold text-gray-900 text-lg mb-2">{patient.name}</h4>
                            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 mb-2">
                              <span className="bg-gray-100 px-2 py-1 rounded-md">{getAgeDisplay(patient.dateOfBirth)}</span>
                              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-xs font-medium">
                                {getConditionLabel(patient.condition)}
                              </span>
                              <span className="bg-green-100 text-green-800 px-2 py-1 rounded-md text-xs font-medium">
                                {getLanguageLabel(patient.language)}
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-3">
                              <span className="text-xs text-gray-500">
                                Última atividade: {new Date(patient.lastActivity).toLocaleDateString("pt-PT")}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Progress Section */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 lg:gap-6">
                          <div className="bg-gray-50 rounded-lg p-4 min-w-0 flex-shrink-0">
                            <div className="text-sm font-medium text-gray-900 mb-1">
                              Progresso: {patient.progressScore}%
                            </div>
                            <div className="text-xs text-gray-600 mb-2">
                              {patient.completedThisWeek}/{patient.weeklyGoal} sessões esta semana
                            </div>
                            <div className="w-32 h-2 bg-gray-200 rounded-full mb-3">
                              <div
                                className="h-full bg-purple-500 rounded-full transition-all"
                                style={{ width: `${patient.progressScore}%` }}
                              />
                            </div>
                            {patient.gamificationStats && (
                              <div className="flex items-center gap-3 mt-3">
                                <div className="flex items-center gap-1 bg-purple-100 px-2 py-1 rounded-md">
                                  <Star className="w-3 h-3 text-purple-600" />
                                  <span className="text-sm font-semibold text-purple-700">{patient.gamificationStats.totalPoints}</span>
                                </div>
                                <div className="flex items-center gap-1 bg-orange-100 px-2 py-1 rounded-md">
                                  <Flame className="w-3 h-3 text-orange-600" />
                                  <span className="text-sm font-semibold text-orange-700">{patient.gamificationStats.dailyStreak}</span>
                                </div>
                                <div className="flex items-center gap-1 bg-emerald-100 px-2 py-1 rounded-md">
                                  <Trophy className="w-3 h-3 text-emerald-600" />
                                  <span className="text-sm font-semibold text-emerald-700">{patient.gamificationStats.level}</span>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <button
                              onClick={() => handlePassToChild(patient.id)}
                              className="p-3 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors border border-purple-200 cursor-pointer"
                              title="Passar para a Criança"
                            >
                              <Gamepad2 className="w-5 h-5" />
                            </button>
                            <button
                              className="p-3 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-blue-200 cursor-pointer"
                              title="Comunicador AAC - Disponível"
                              onClick={() => (window.location.href = "/aac")}
                            >
                              <MessageSquare className="w-5 h-5" />
                            </button>
                            <button
                              className="p-3 text-green-600 hover:bg-green-50 rounded-lg transition-colors border border-green-200 cursor-pointer"
                              title="Jogos de Comunicação - Disponível"
                              onClick={() => (window.location.href = "/games")}
                            >
                              <Brain className="w-5 h-5" />
                            </button>
                            <button
                              className="p-3 text-gray-400 bg-gray-50 rounded-lg cursor-not-allowed opacity-60 border border-gray-200"
                              title="Outros Jogos - Em breve"
                              disabled
                            >
                              <Play className="w-5 h-5" />
                            </button>
                            <div className="relative">
                              <button
                                onClick={() =>
                                  setOpenPatientMenu(openPatientMenu === patient.id ? null : patient.id)
                                }
                                className="p-3 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors border border-gray-200 cursor-pointer"
                                title="Mais opções"
                              >
                                <MoreVertical className="w-5 h-5" />
                              </button>

                              {openPatientMenu === patient.id && (
                                <>
                                  {/* Backdrop to close menu */}
                                  <div
                                    className="fixed inset-0 z-10"
                                    onClick={() => setOpenPatientMenu(null)}
                                  />

                                  {/* Dropdown Menu */}
                                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                                    <button
                                      onClick={() => handleViewPatientDetails(patient.id)}
                                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                                    >
                                      <User className="w-4 h-4" />
                                      Ver Detalhes
                                    </button>

                                    <button
                                      onClick={() => handleOpenEditModal(patient)}
                                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                                    >
                                      <Edit className="w-4 h-4" />
                                      Editar Dados
                                    </button>

                                    <hr className="my-1" />

                                    <button
                                      onClick={() => handleTogglePatientStatus(patient.id, patient.status)}
                                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                                    >
                                      {patient.status === "active" ? (
                                        <>
                                          <UserX className="w-4 h-4" />
                                          Desativar Pessoa
                                        </>
                                      ) : (
                                        <>
                                          <UserCheck className="w-4 h-4" />
                                          Ativar Pessoa
                                        </>
                                      )}
                                    </button>

                                    <hr className="my-1" />

                                    <button
                                      onClick={() => handleDeletePatient(patient.id, patient.name)}
                                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                      Eliminar Pessoa
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                  )}
                </div>
              </div>
            </div>
          )}

          {currentView === "reports" && (
            <div>
              <ReportsSection patients={patients} />
            </div>
          )}
        </main>
      </div>

      {sidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Add Patient Modal */}
      {showAddPatient && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-2xl font-bold text-gray-900">Adicionar Nova Pessoa</h3>
              <button onClick={() => setShowAddPatient(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleAddPatient} className="p-6 space-y-6">
              {/* Avatar Upload */}
              <div className="flex justify-center">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-r from-purple-400 to-pink-400 flex items-center justify-center">
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-12 h-12 text-white" />
                    )}
                  </div>
                  <label
                    htmlFor="avatar-upload"
                    className="absolute bottom-0 right-0 w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-purple-700 transition-colors shadow-lg"
                  >
                    <Camera className="w-4 h-4 text-white" />
                    <input
                      id="avatar-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nome Completo *</label>
                <input
                  type="text"
                  required
                  value={addPatientForm.name}
                  onChange={(e) => setAddPatientForm({ ...addPatientForm, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Ex: Maria Silva"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Data de Nascimento *</label>
                <input
                  type="date"
                  required
                  max={new Date().toISOString().split('T')[0]}
                  value={addPatientForm.dateOfBirth}
                  onChange={(e) => setAddPatientForm({ ...addPatientForm, dateOfBirth: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">A data não pode ser no futuro</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Condição/Diagnóstico *</label>
                <select
                  required
                  value={addPatientForm.condition}
                  onChange={(e) => {
                    const condition = e.target.value
                    setAddPatientForm({
                      ...addPatientForm,
                      condition,
                      autismLevel: condition.startsWith("autism_level_")
                        ? (Number.parseInt(condition.split("_")[2]) as 1 | 2 | 3)
                        : undefined,
                    })
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">Selecione a condição</option>
                  <optgroup label="Perturbação do Espetro do Autismo">
                    <option value="autism_level_1">Autismo Nível 1 (Necessita de apoio)</option>
                    <option value="autism_level_2">Autismo Nível 2 (Necessita de apoio substancial)</option>
                    <option value="autism_level_3">Autismo Nível 3 (Necessita de apoio muito substancial)</option>
                  </optgroup>
                  <optgroup label="Outras Condições">
                    <option value="adhd">TDAH (Perturbação de Hiperatividade e Défice de Atenção)</option>
                    <option value="communication_disorder">Perturbação da Comunicação</option>
                    <option value="intellectual_disability">Deficiência Intelectual</option>
                    <option value="learning_disability">Dificuldades de Aprendizagem</option>
                    <option value="down_syndrome">Síndrome de Down</option>
                    <option value="cerebral_palsy">Paralisia Cerebral</option>
                    <option value="other">Outro</option>
                  </optgroup>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Idioma Principal *</label>
                <select
                  required
                  value={addPatientForm.language}
                  onChange={(e) => setAddPatientForm({ ...addPatientForm, language: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="pt">🇵🇹 Português</option>
                  <option value="en">🇬🇧 Inglês</option>
                  <option value="es">🇪🇸 Espanhol</option>
                  <option value="fr">🇫🇷 Francês</option>
                  <option value="de">🇩🇪 Alemão</option>
                  <option value="it">🇮🇹 Italiano</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Informações Adicionais</label>
                <textarea
                  value={addPatientForm.additionalInfo}
                  onChange={(e) => setAddPatientForm({ ...addPatientForm, additionalInfo: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  rows={4}
                  placeholder="Descreva características específicas, interesses, desafios ou objetivos..."
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddPatient(false)}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "A adicionar..." : "Adicionar Pessoa"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Patient Modal */}
      {showEditPatient && editingPatient && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-2xl font-bold text-gray-900">Editar Dados de {editingPatient.name}</h3>
              <button onClick={() => setShowEditPatient(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleUpdatePatient} className="p-6 space-y-6">
              {/* Avatar Upload */}
              <div className="flex justify-center">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-r from-purple-400 to-pink-400 flex items-center justify-center">
                    {editAvatarPreview ? (
                      <img src={editAvatarPreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-12 h-12 text-white" />
                    )}
                  </div>
                  <label
                    htmlFor="edit-avatar-upload"
                    className="absolute bottom-0 right-0 w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-purple-700 transition-colors shadow-lg"
                  >
                    <Camera className="w-4 h-4 text-white" />
                    <input
                      id="edit-avatar-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleEditAvatarChange}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nome Completo *</label>
                <input
                  type="text"
                  required
                  value={editPatientForm.name}
                  onChange={(e) => setEditPatientForm({ ...editPatientForm, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Ex: Maria Silva"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Data de Nascimento *</label>
                <input
                  type="date"
                  required
                  max={new Date().toISOString().split('T')[0]}
                  value={editPatientForm.dateOfBirth}
                  onChange={(e) => setEditPatientForm({ ...editPatientForm, dateOfBirth: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">A data não pode ser no futuro</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Condição/Diagnóstico *</label>
                <select
                  required
                  value={editPatientForm.condition}
                  onChange={(e) => {
                    const condition = e.target.value
                    setEditPatientForm({
                      ...editPatientForm,
                      condition,
                      autismLevel: condition.startsWith("autism_level_")
                        ? (Number.parseInt(condition.split("_")[2]) as 1 | 2 | 3)
                        : undefined,
                    })
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">Selecione a condição</option>
                  <optgroup label="Perturbação do Espetro do Autismo">
                    <option value="autism_level_1">Autismo Nível 1 (Necessita de apoio)</option>
                    <option value="autism_level_2">Autismo Nível 2 (Necessita de apoio substancial)</option>
                    <option value="autism_level_3">Autismo Nível 3 (Necessita de apoio muito substancial)</option>
                  </optgroup>
                  <optgroup label="Outras Condições">
                    <option value="adhd">TDAH (Perturbação de Hiperatividade e Défice de Atenção)</option>
                    <option value="communication_disorder">Perturbação da Comunicação</option>
                    <option value="intellectual_disability">Deficiência Intelectual</option>
                    <option value="learning_disability">Dificuldades de Aprendizagem</option>
                    <option value="down_syndrome">Síndrome de Down</option>
                    <option value="cerebral_palsy">Paralisia Cerebral</option>
                    <option value="other">Outro</option>
                  </optgroup>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Idioma Principal *</label>
                <select
                  required
                  value={editPatientForm.language}
                  onChange={(e) => setEditPatientForm({ ...editPatientForm, language: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="pt">🇵🇹 Português</option>
                  <option value="en">🇬🇧 Inglês</option>
                  <option value="es">🇪🇸 Espanhol</option>
                  <option value="fr">🇫🇷 Francês</option>
                  <option value="de">🇩🇪 Alemão</option>
                  <option value="it">🇮🇹 Italiano</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Informações Adicionais</label>
                <textarea
                  value={editPatientForm.additionalInfo}
                  onChange={(e) => setEditPatientForm({ ...editPatientForm, additionalInfo: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  rows={4}
                  placeholder="Descreva características específicas, interesses, desafios ou objetivos..."
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditPatient(false)}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "A guardar..." : "Guardar Alterações"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <NotificationCenter
        isOpen={showNotificationCenter}
        onClose={() => setShowNotificationCenter(false)}
        notifications={allNotifications}
        onMarkAsRead={markAsRead}
        onMarkAllAsRead={markAllAsRead}
        onDeleteNotification={deleteNotification}
      />

      <NotificationToast notifications={toastNotifications} onRemove={removeToast} />

      {/* PIN Modal */}
      <PinModal
        isOpen={showPinModal}
        onClose={() => {
          setShowPinModal(false)
          setSelectedPatientForPlay(null)
        }}
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
