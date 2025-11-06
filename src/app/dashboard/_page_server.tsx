import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getPatients } from "@/app/actions/patients"
import DashboardClient from "./_components/DashboardClient"

export default async function DashboardPage() {
  const supabase = await createClient()

  // Get authenticated user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect("/login")
  }

  // Get user profile
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (!profile) {
    redirect("/login")
  }

  // Fetch patients with stats
  const patientsResult = await getPatients()

  return (
    <DashboardClient
      userProfile={profile}
      initialPatients={patientsResult.success ? patientsResult.data || [] : []}
    />
  )
}
