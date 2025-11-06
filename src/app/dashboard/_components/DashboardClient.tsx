"use client"

/* eslint-disable @typescript-eslint/no-unused-vars */

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import {
  Users,
  Home,
  BarChart3,
  FileText,
} from "lucide-react"
import { useNotifications } from "@/hooks/use-notifications"
import { createPatient } from "@/app/actions/patients"
import type { PatientWithStats, CreatePatientData } from "@/types/patient.types"
import type { Profile } from "@/types/database.types"
import { calculateAge, calculateProgressScore } from "@/types/patient.types"

interface DashboardClientProps {
  userProfile: Profile
  initialPatients: PatientWithStats[]
}

export default function DashboardClient({ userProfile, initialPatients }: DashboardClientProps) {
  const router = useRouter()
  const supabase = createClient()

  const [patients] = useState<PatientWithStats[]>(initialPatients)
  const [currentView] = useState("dashboard")
  const [showAddPatient, setShowAddPatient] = useState(false)
  const [searchTerm] = useState("")
  const [filterStatus] = useState<"all" | "active" | "inactive" | "needs_attention">("all")
  const [sortBy] = useState<"name" | "progress" | "lastActivity" | "age">("name")
  const [sortOrder] = useState<"asc" | "desc">("asc")
  const [isSubmitting, setIsSubmitting] = useState(false)

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

  const [addPatientForm, setAddPatientForm] = useState<CreatePatientData>({
    name: "",
    date_of_birth: "",
    condition: "autism_level_1",
    language: "pt",
    weekly_goal: 3,
  })

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/login")
  }

  const handleAddPatient = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const result = await createPatient(addPatientForm)

      if (!result.success) {
        alert(result.error || "Erro ao adicionar pessoa")
        return
      }

      // Refresh the page to get updated data
      router.refresh()
      setShowAddPatient(false)
      setAddPatientForm({
        name: "",
        date_of_birth: "",
        condition: "autism_level_1",
        language: "pt",
        weekly_goal: 3,
      })
    } catch (error) {
      console.error("Error adding patient:", error)
      alert("Erro inesperado ao adicionar pessoa")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Calculate patient-level stats
  const patientsWithCalculated = patients.map((patient) => ({
    ...patient,
    age: calculateAge(patient.date_of_birth),
    progressScore: calculateProgressScore(
      patient.total_sessions,
      patient.average_score,
      patient.weekly_goal,
      patient.sessions_this_week
    ),
  }))

  const filteredAndSortedPatients = patientsWithCalculated
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
          aValue = a.last_activity ? new Date(a.last_activity) : new Date(0)
          bValue = b.last_activity ? new Date(b.last_activity) : new Date(0)
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
      case "learning_disability":
        return "Dificuldades de Aprendizagem"
      case "down_syndrome":
        return "Síndrome de Down"
      case "cerebral_palsy":
        return "Paralisia Cerebral"
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
      case "de":
        return "🇩🇪 Alemão"
      case "it":
        return "🇮🇹 Italiano"
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

  const totalPatients = patientsWithCalculated.length
  const activePatients = patientsWithCalculated.filter((p) => p.status === "active").length
  const needsAttentionCount = patientsWithCalculated.filter((p) => p.status === "needs_attention").length
  const averageProgress =
    Math.round(patientsWithCalculated.reduce((acc, p) => acc + p.progressScore, 0) / patientsWithCalculated.length) ||
    0

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
      totalTime: 3840,
      toolUsage: [
        { tool: "Comunicador AAC", sessions: 120, color: "#8B5CF6" },
        { tool: "Jogos de Memória", sessions: 10, color: "#06B6D4" },
        { tool: "Outros Jogos", sessions: 5, color: "#10B981" },
      ],
    },
  }

  // Rest of the JSX from the original dashboard...
  // Due to length, I'll provide a continuation in the next response
  // For now, returning a basic structure

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* Sidebar and main content will be added here */}
      <div>Dashboard Client Component - User: {userProfile.full_name || userProfile.email}</div>
      <div>Total Patients: {totalPatients}</div>
    </div>
  )
}
