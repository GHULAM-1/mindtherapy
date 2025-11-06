"use server"

import { createClient } from "@/lib/supabase/server"
import type { UserSituation } from "@/types/database.types"

export interface SignUpData {
  email: string
  password: string
  name: string
  situation: UserSituation | ""
  acceptNewsletter: boolean
}

export interface LoginData {
  email: string
  password: string
}

export interface AuthResult {
  success: boolean
  error?: string
  data?: unknown
}

/**
 * Sign up a new user with email and password
 * Also stores additional metadata (name, situation, newsletter preference)
 */
export async function signUp(data: SignUpData): Promise<AuthResult> {
  const supabase = await createClient()

  try {
    const { data: authData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          name: data.name || "",
          situation: data.situation || null, // null if empty, will be filled in onboarding
          accept_newsletter: data.acceptNewsletter,
        },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/auth/callback`,
      },
    })

    if (error) {
      // Provide user-friendly error messages in Portuguese
      if (error.message.includes("User already registered")) {
        return { success: false, error: "Este email já está registado" }
      }
      return { success: false, error: error.message }
    }

    if (!authData.user) {
      return { success: false, error: "Falha ao criar utilizador" }
    }

    // Check if email confirmation is required
    if (authData.user && !authData.session) {
      return {
        success: true,
        data: {
          requiresEmailConfirmation: true,
          email: data.email,
        },
      }
    }

    return { success: true, data: authData }
  } catch (error) {
    console.error("Signup error:", error)
    return { success: false, error: "Erro inesperado ao criar conta" }
  }
}

/**
 * Sign in an existing user with email and password
 */
export async function signIn(data: LoginData): Promise<AuthResult> {
  const supabase = await createClient()

  try {
    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })

    if (error) {
      // Provide user-friendly error messages
      if (error.message.includes("Invalid login credentials")) {
        return { success: false, error: "Email ou password incorretos" }
      }
      return { success: false, error: error.message }
    }

    return { success: true, data: authData }
  } catch (error) {
    console.error("Sign in error:", error)
    return { success: false, error: "Erro inesperado ao fazer login" }
  }
}

/**
 * Sign out the current user
 */
export async function signOut(): Promise<AuthResult> {
  const supabase = await createClient()

  try {
    const { error } = await supabase.auth.signOut()

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error("Sign out error:", error)
    return { success: false, error: "Erro ao fazer logout" }
  }
}

/**
 * Send a password reset email
 */
export async function resetPassword(email: string): Promise<AuthResult> {
  const supabase = await createClient()

  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/auth/reset-password`,
    })

    if (error) {
      console.error("Reset password error details:", {
        message: error.message,
        status: error.status,
        name: error.name,
        code: error.code,
        fullError: JSON.stringify(error, null, 2)
      })

      // Provide user-friendly error messages in Portuguese
      if (error.status === 504 || error.name === "AuthRetryableFetchError") {
        return {
          success: false,
          error: "O servidor demorou muito tempo a responder. Aguarde 1-2 minutos e tente novamente."
        }
      }

      if (error.message.includes("Error sending recovery email")) {
        return {
          success: false,
          error: `Erro ao enviar email (SMTP). Verifique as configurações SMTP no Supabase ou desative o Custom SMTP temporariamente. Código: ${error.code || 'unknown'}`
        }
      }

      return { success: false, error: error.message || "Erro ao enviar email de recuperação" }
    }

    return { success: true }
  } catch (error) {
    console.error("Reset password error:", error)
    return { success: false, error: "Erro ao enviar email de recuperação" }
  }
}

/**
 * Update the user's password (after clicking reset link)
 */
export async function updatePassword(newPassword: string): Promise<AuthResult> {
  const supabase = await createClient()

  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error("Update password error:", error)
    return { success: false, error: "Erro ao atualizar password" }
  }
}

/**
 * Get the current authenticated user
 */
export async function getCurrentUser() {
  const supabase = await createClient()

  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error) {
      return null
    }

    return user
  } catch (error) {
    console.error("Get current user error:", error)
    return null
  }
}

/**
 * Complete user profile (onboarding)
 */
export async function completeProfile(data: {
  full_name: string
  situation: UserSituation
}): Promise<AuthResult> {
  const supabase = await createClient()

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "User not authenticated" }
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: data.full_name,
        situation: data.situation,
        profile_completed: true,
      })
      .eq("id", user.id)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error("Complete profile error:", error)
    return { success: false, error: "Erro ao completar perfil" }
  }
}
