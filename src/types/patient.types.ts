/**
 * Patient Types
 * These types match the patient database schema
 */

export type AutismLevel = '1' | '2' | '3'

export type PatientCondition =
  | 'autism_level_1'
  | 'autism_level_2'
  | 'autism_level_3'
  | 'adhd'
  | 'communication_disorder'
  | 'intellectual_disability'
  | 'learning_disability'
  | 'down_syndrome'
  | 'cerebral_palsy'
  | 'other'

export type PatientStatus = 'active' | 'inactive' | 'needs_attention'

export type LanguageCode = 'pt' | 'en' | 'es' | 'fr' | 'de' | 'it'

export interface Patient {
  id: string
  user_id: string
  name: string
  date_of_birth: string // ISO date string
  condition: PatientCondition
  autism_level: AutismLevel | null
  language: LanguageCode
  additional_info: string | null
  avatar_url: string | null
  status: PatientStatus
  weekly_goal: number
  gender: string | null
  emergency_contact_name: string | null
  emergency_contact_phone: string | null
  emergency_contact_relationship: string | null
  medical_notes: string | null
  allergies: string | null
  medications: string | null
  therapy_goals: string | null
  special_interests: string | null
  communication_preferences: string | null
  behavioral_notes: string | null
  school_info: string | null
  created_at: string
  updated_at: string
}

export interface Session {
  id: string
  patient_id: string
  tool_type: string
  duration_minutes: number | null
  score: number | null
  completed: boolean
  session_data: Record<string, unknown> | null
  created_at: string
}

export interface PatientGamification {
  patient_id: string
  level: number
  total_points: number
  current_streak: number
  longest_streak: number
  achievements: string[]
  words_spoken_total?: number
  last_activity_date: string | null
  created_at: string
  updated_at: string
}

export interface PatientWithStats extends Patient {
  total_sessions: number
  average_score: number
  last_activity: string | null
  sessions_this_week: number
  gamification?: PatientGamification
}

export interface CreatePatientData {
  name: string
  date_of_birth: string
  condition: PatientCondition
  autism_level?: AutismLevel
  language: LanguageCode
  additional_info?: string
  weekly_goal?: number
  avatar_url?: string
}

export interface UpdatePatientData {
  name?: string
  date_of_birth?: string
  condition?: PatientCondition
  autism_level?: AutismLevel
  language?: LanguageCode
  additional_info?: string
  status?: PatientStatus
  weekly_goal?: number
  avatar_url?: string
  therapy_goals?: string
}

// Helper function to calculate age from date of birth
export function calculateAge(dateOfBirth: string): number {
  const birthDate = new Date(dateOfBirth)
  const today = new Date()
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }

  return age
}

// Helper function to get age display string (shows days/months for babies < 1 year)
export function getAgeDisplay(dateOfBirth: string): string {
  const birthDate = new Date(dateOfBirth)
  const today = new Date()
  
  let years = today.getFullYear() - birthDate.getFullYear()
  let months = today.getMonth() - birthDate.getMonth()
  
  // Adjust for cases where we haven't reached the birth month/day yet this year
  if (months < 0 || (months === 0 && today.getDate() < birthDate.getDate())) {
    years--
    months += 12
  }
  
  // If less than 1 year, show months or days
  if (years === 0) {
    // Adjust months if we haven't reached the birth day yet this month
    if (today.getDate() < birthDate.getDate()) {
      months--
    }
    
    // If less than 1 month, show days
    if (months <= 0) {
      const timeDiff = today.getTime() - birthDate.getTime()
      const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24))
      
      if (daysDiff <= 0) {
        return 'Recém-nascido'
      } else if (daysDiff === 1) {
        return '1 dia'
      } else {
        return `${daysDiff} dias`
      }
    }
    
    return `${months} ${months === 1 ? 'mês' : 'meses'}`
  }
  
  // If 1 year or more, show years
  return `${years} ${years === 1 ? 'ano' : 'anos'}`
}

// Helper function to get age in months for calculations
export function getAgeInMonths(dateOfBirth: string): number {
  const birthDate = new Date(dateOfBirth)
  const today = new Date()
  
  const years = today.getFullYear() - birthDate.getFullYear()
  const months = today.getMonth() - birthDate.getMonth()
  const days = today.getDate() - birthDate.getDate()
  
  let totalMonths = years * 12 + months
  
  // If we haven't reached the birth day this month, subtract one month
  if (days < 0) {
    totalMonths--
  }
  
  return Math.max(0, totalMonths)
}

// Helper function to calculate progress score (placeholder logic)
export function calculateProgressScore(
  totalSessions: number,
  averageScore: number,
  weeklyGoal: number,
  sessionsThisWeek: number
): number {
  if (totalSessions === 0) return 0

  // Weighted calculation:
  // 50% based on average session score
  // 30% based on weekly goal completion
  // 20% based on total sessions (capped at 100 sessions)

  const scoreComponent = (averageScore / 100) * 50
  const weeklyGoalComponent = (Math.min(sessionsThisWeek, weeklyGoal) / weeklyGoal) * 30
  const sessionComponent = (Math.min(totalSessions, 100) / 100) * 20

  return Math.round(scoreComponent + weeklyGoalComponent + sessionComponent)
}
