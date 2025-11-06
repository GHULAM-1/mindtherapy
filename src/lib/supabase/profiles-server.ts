import { createClient } from "@/lib/supabase/server"
import type { Profile, UpdateProfileData } from "@/types/database.types"

/**
 * Get the current user's profile (Server-side)
 */
export async function getProfile(): Promise<Profile | null> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (error) {
    console.error("Error fetching profile:", error)
    return null
  }

  return data
}

/**
 * Update the current user's profile (Server-side)
 */
export async function updateProfile(updates: UpdateProfileData): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "User not authenticated" }
  }

  const { error } = await supabase.from("profiles").update(updates).eq("id", user.id)

  if (error) {
    console.error("Error updating profile:", error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

/**
 * Get a profile by user ID (useful for viewing other users' profiles)
 */
export async function getProfileById(userId: string): Promise<Profile | null> {
  const supabase = await createClient()

  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single()

  if (error) {
    console.error("Error fetching profile by ID:", error)
    return null
  }

  return data
}
