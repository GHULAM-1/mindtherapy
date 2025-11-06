import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

/**
 * Creates a Supabase client for use in Middleware
 * This automatically refreshes the user's session before loading Server Component routes
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
        },
      },
    },
  )

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // If user is authenticated, check if profile is completed
  if (user) {
    // Public pages that authenticated users can access
    const isPublicPage =
      request.nextUrl.pathname === "/" || // Landing page
      request.nextUrl.pathname.startsWith("/termos") ||
      request.nextUrl.pathname.startsWith("/privacidade")

    // Auth pages
    const isAuthPage =
      request.nextUrl.pathname.startsWith("/login") ||
      request.nextUrl.pathname.startsWith("/signup") ||
      request.nextUrl.pathname.startsWith("/forgot-password") ||
      request.nextUrl.pathname.startsWith("/auth")

    const isOnboarding = request.nextUrl.pathname.startsWith("/onboarding")

    // Allow access to public pages
    if (isPublicPage) {
      return supabaseResponse
    }

    if (!isAuthPage && !isOnboarding) {
      // Check if profile is completed
      const { data: profile } = await supabase.from("profiles").select("profile_completed").eq("id", user.id).single()

      // If profile is not completed, redirect to onboarding
      if (profile && !profile.profile_completed) {
        const url = request.nextUrl.clone()
        url.pathname = "/onboarding"
        return NextResponse.redirect(url)
      }
    }

    // Redirect to dashboard if already authenticated and trying to access auth pages
    if (isAuthPage) {
      // First check if profile is completed
      const { data: profile } = await supabase.from("profiles").select("profile_completed").eq("id", user.id).single()

      const url = request.nextUrl.clone()
      // Redirect to onboarding if profile not completed, otherwise to dashboard
      url.pathname = profile && !profile.profile_completed ? "/onboarding" : "/dashboard"
      return NextResponse.redirect(url)
    }
  }

  // Protected routes - redirect to login if not authenticated
  if (
    !user &&
    !request.nextUrl.pathname.startsWith("/login") &&
    !request.nextUrl.pathname.startsWith("/signup") &&
    !request.nextUrl.pathname.startsWith("/forgot-password") &&
    !request.nextUrl.pathname.startsWith("/auth") &&
    (request.nextUrl.pathname.startsWith("/dashboard") || request.nextUrl.pathname.startsWith("/onboarding"))
  ) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    return NextResponse.redirect(url)
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is. If you're
  // creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse
}
