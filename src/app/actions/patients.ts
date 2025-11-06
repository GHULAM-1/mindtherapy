"use server"

/* eslint-disable @typescript-eslint/no-unused-vars */

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import type {
  CreatePatientData,
  UpdatePatientData,
  Patient,
  PatientWithStats,
  Session,
  PatientGamification,
} from "@/types/patient.types"

interface ActionResult<T = void> {
  success: boolean
  data?: T
  error?: string
}

/**
 * Get all patients for the authenticated user
 */
export async function getPatients(): Promise<ActionResult<PatientWithStats[]>> {
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

    // Fetch patients with stats (using working join method)
    const { data: patients, error: patientsError } = await supabase
      .from("patients")
      .select(
        `
        *,
        sessions:sessions(id, score, created_at),
        patient_gamification(*)
      `
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (patientsError) {
      console.error("Error fetching patients:", patientsError)
      return { success: false, error: "Erro ao carregar pessoas" }
    }


    // Calculate stats for each patient
    const patientsWithStats: PatientWithStats[] = (patients || []).map((patientRaw) => {
      const patient = patientRaw as Patient & { sessions?: Session[]; patient_gamification?: PatientGamification[] }
      const sessions = patient.sessions || []
      const totalSessions = sessions.length
      const averageScore =
        sessions.length > 0
          ? Math.round(sessions.reduce((sum: number, s: Session) => sum + (s.score || 0), 0) / sessions.length)
          : 0

      // Get sessions from this week
      const weekStart = new Date()
      weekStart.setDate(weekStart.getDate() - weekStart.getDay())
      weekStart.setHours(0, 0, 0, 0)

      const sessionsThisWeek = sessions.filter((s: Session) => new Date(s.created_at) >= weekStart).length

      // Get last activity
      const lastActivity = sessions.length > 0 ? sessions[0].created_at : null

      // Remove nested sessions from the patient object
      const { sessions: _sessions, patient_gamification, ...patientData } = patient


      // Handle gamification data (could be array or single object)
      const gamData = Array.isArray(patient_gamification)
        ? patient_gamification[0]
        : patient_gamification

      return {
        ...patientData,
        total_sessions: totalSessions,
        average_score: averageScore,
        last_activity: lastActivity,
        sessions_this_week: sessionsThisWeek,
        gamification: gamData || undefined,
      }
    })

    return { success: true, data: patientsWithStats }
  } catch (error) {
    console.error("Unexpected error in getPatients:", error)
    return { success: false, error: "Erro inesperado ao carregar pessoas" }
  }
}

/**
 * Get a single patient by ID
 */
export async function getPatient(patientId: string): Promise<ActionResult<PatientWithStats>> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: "Não autenticado" }
    }

    const { data: patient, error: patientError } = await supabase
      .from("patients")
      .select(
        `
        *,
        sessions:sessions(id, score, created_at),
        gamification:patient_gamification(*)
      `
      )
      .eq("id", patientId)
      .eq("user_id", user.id)
      .single()

    if (patientError || !patient) {
      console.error("Error fetching patient:", patientError)
      return { success: false, error: "Pessoa não encontrada" }
    }

    // Type assertion for the joined data
    const patientWithRelations = patient as unknown as Patient & {
      sessions?: Session[]
      gamification?: PatientGamification[]
    }

    // Calculate stats
    const sessions = patientWithRelations.sessions || []
    const totalSessions = sessions.length
    const averageScore =
      sessions.length > 0
        ? Math.round(sessions.reduce((sum: number, s: Session) => sum + (s.score || 0), 0) / sessions.length)
        : 0

    const weekStart = new Date()
    weekStart.setDate(weekStart.getDate() - weekStart.getDay())
    weekStart.setHours(0, 0, 0, 0)

    const sessionsThisWeek = sessions.filter((s: Session) => new Date(s.created_at) >= weekStart).length
    const lastActivity = sessions.length > 0 ? sessions[0].created_at : null

    const { sessions: _sessions2, gamification, ...patientData } = patientWithRelations

    const patientWithStats: PatientWithStats = {
      ...patientData,
      total_sessions: totalSessions,
      average_score: averageScore,
      last_activity: lastActivity,
      sessions_this_week: sessionsThisWeek,
      gamification: gamification?.[0] || undefined,
    }

    return { success: true, data: patientWithStats }
  } catch (error) {
    console.error("Unexpected error in getPatient:", error)
    return { success: false, error: "Erro inesperado ao carregar pessoa" }
  }
}

/**
 * Create a new patient
 */
export async function createPatient(data: CreatePatientData): Promise<ActionResult<Patient>> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: "Não autenticado" }
    }

    // Validate required fields
    if (!data.name || !data.date_of_birth || !data.condition) {
      return { success: false, error: "Dados obrigatórios em falta" }
    }

    // Validate date of birth is not in the future
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const birthDate = new Date(data.date_of_birth)
    birthDate.setHours(0, 0, 0, 0)

    if (birthDate > today) {
      return { success: false, error: "A data de nascimento não pode ser no futuro" }
    }

    // Create patient
    const { data: patient, error: createError } = await supabase
      .from("patients")
      .insert({
        user_id: user.id,
        name: data.name,
        date_of_birth: data.date_of_birth,
        condition: data.condition,
        autism_level: data.autism_level || null,
        language: data.language || "pt",
        additional_info: data.additional_info || null,
        weekly_goal: data.weekly_goal || 3,
        avatar_url: data.avatar_url || null,
        status: "active",
      })
      .select()
      .single()

    if (createError) {
      console.error("Error creating patient:", createError)
      return { success: false, error: "Erro ao criar pessoa" }
    }

    revalidatePath("/dashboard")
    return { success: true, data: patient }
  } catch (error) {
    console.error("Unexpected error in createPatient:", error)
    return { success: false, error: "Erro inesperado ao criar pessoa" }
  }
}

/**
 * Update an existing patient
 */
export async function updatePatient(
  patientId: string,
  data: UpdatePatientData
): Promise<ActionResult<Patient>> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: "Não autenticado" }
    }

    // Validate date of birth is not in the future (if provided)
    if (data.date_of_birth) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const birthDate = new Date(data.date_of_birth)
      birthDate.setHours(0, 0, 0, 0)

      if (birthDate > today) {
        return { success: false, error: "A data de nascimento não pode ser no futuro" }
      }
    }

    // Update patient
    const { data: patient, error: updateError } = await supabase
      .from("patients")
      .update(data)
      .eq("id", patientId)
      .eq("user_id", user.id)
      .select()
      .single()

    if (updateError) {
      console.error("Error updating patient:", updateError)
      return { success: false, error: "Erro ao atualizar pessoa" }
    }

    revalidatePath("/dashboard")
    revalidatePath(`/dashboard/patient/${patientId}`)
    return { success: true, data: patient }
  } catch (error) {
    console.error("Unexpected error in updatePatient:", error)
    return { success: false, error: "Erro inesperado ao atualizar pessoa" }
  }
}

/**
 * Delete a patient
 */
export async function deletePatient(patientId: string): Promise<ActionResult> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: "Não autenticado" }
    }

    const { error: deleteError } = await supabase
      .from("patients")
      .delete()
      .eq("id", patientId)
      .eq("user_id", user.id)

    if (deleteError) {
      console.error("Error deleting patient:", deleteError)
      return { success: false, error: "Erro ao eliminar pessoa" }
    }

    revalidatePath("/dashboard")
    return { success: true }
  } catch (error) {
    console.error("Unexpected error in deletePatient:", error)
    return { success: false, error: "Erro inesperado ao eliminar pessoa" }
  }
}
