import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * Auth callback handler for email confirmations and OAuth
 * This route is called after the user clicks the confirmation link in their email
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const next = requestUrl.searchParams.get("next") || "/dashboard"

  if (code) {
    const supabase = await createClient()

    // Exchange the code for a session
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Redirect to the desired page
      return NextResponse.redirect(new URL(next, requestUrl.origin))
    }
  }

  // If there's an error or no code, redirect to login with error
  return NextResponse.redirect(new URL("/login?error=auth_callback_error", requestUrl.origin))
}
