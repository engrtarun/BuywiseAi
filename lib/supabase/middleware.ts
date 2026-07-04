import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const isValidUrl = url && url.startsWith("http");

  const supabase = createServerClient(
    isValidUrl ? url : "https://placeholder.supabase.co",
    anonKey || "placeholder",
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session if expired
  const { data: { user } } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // 1. Unauthenticated users:
  // Redirect to /login if trying to access protected paths (root "/" or "/chat" or "/welcome")
  if (!user) {
    if (pathname === "/" || pathname === "/chat" || pathname.startsWith("/chat/") || pathname === "/welcome") {
      const url = request.nextUrl.clone()
      url.pathname = "/login"
      return NextResponse.redirect(url)
    }
  }

  // 2. Authenticated users:
  // Redirect to /chat if trying to access auth pages (/login, /signup)
  // For /welcome, only redirect to /chat if they already have a completed profile (full_name set)
  if (user) {
    if (pathname === "/login" || pathname === "/signup") {
      const url = request.nextUrl.clone()
      url.pathname = "/chat"
      return NextResponse.redirect(url)
    }
    
    if (pathname === "/welcome") {
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .maybeSingle()
        
      if (profile && profile.full_name) {
        const url = request.nextUrl.clone()
        url.pathname = "/chat"
        return NextResponse.redirect(url)
      }
    }
  }

  return supabaseResponse
}
