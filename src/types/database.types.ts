/**
 * Database Types
 * These types match the database schema and ENUMs
 */

export type UserSituation =
  | "parent-autism"
  | "parent-other"
  | "caregiver"
  | "professional-psychologist"
  | "professional-therapist"
  | "professional-teacher"
  | "professional-other"
  | "individual-autism"
  | "individual-other"
  | "researcher"
  | "other"

export interface SituationOption {
  value: UserSituation
  label: string
  icon: string
  group: string
}

export const SITUATION_OPTIONS: SituationOption[] = [
  {
    value: "parent-autism",
    label: "Pai/Mãe de pessoa autista",
    icon: "👨‍👩‍👧‍👦",
    group: "Famílias",
  },
  {
    value: "parent-other",
    label: "Pai/Mãe de pessoa neurodivergente (outro)",
    icon: "👨‍👩‍👧‍👦",
    group: "Famílias",
  },
  {
    value: "caregiver",
    label: "Cuidador/familiar",
    icon: "❤️",
    group: "Famílias",
  },
  {
    value: "professional-psychologist",
    label: "Psicólogo(a)",
    icon: "👩‍⚕️",
    group: "Profissionais",
  },
  {
    value: "professional-therapist",
    label: "Terapeuta ocupacional",
    icon: "👩‍⚕️",
    group: "Profissionais",
  },
  {
    value: "professional-teacher",
    label: "Professor(a) de educação especial",
    icon: "👩‍🏫",
    group: "Profissionais",
  },
  {
    value: "professional-other",
    label: "Outro profissional de saúde",
    icon: "👩‍⚕️",
    group: "Profissionais",
  },
  {
    value: "individual-autism",
    label: "Autista",
    icon: "🧠",
    group: "Individuais / Estudo",
  },
  {
    value: "individual-other",
    label: "Neurodivergente (outro)",
    icon: "🧠",
    group: "Individuais / Estudo",
  },
  {
    value: "researcher",
    label: "Investigador/estudante",
    icon: "📚",
    group: "Individuais / Estudo",
  },
  {
    value: "other",
    label: "Outro",
    icon: "🤔",
    group: "Individuais / Estudo",
  },
]

export interface Profile {
  id: string
  email: string
  full_name: string | null
  situation: UserSituation | null
  accept_newsletter: boolean
  avatar_url: string | null
  phone: string | null
  bio: string | null
  organization: string | null
  role: string | null
  notification_preferences: {
    email: boolean
    push: boolean
    sms: boolean
  }
  theme_preference: 'light' | 'dark'
  language_preference: string
  profile_completed: boolean
  created_at: string
  updated_at: string
}

export interface UpdateProfileData {
  full_name?: string
  situation?: UserSituation
  accept_newsletter?: boolean
  avatar_url?: string
  phone?: string
  bio?: string
  organization?: string
  role?: string
  notification_preferences?: {
    email: boolean
    push: boolean
    sms: boolean
  }
  theme_preference?: 'light' | 'dark'
  language_preference?: string
}
