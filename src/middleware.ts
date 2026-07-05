import { type NextRequest } from "next/server"
import { updateSession } from "@/lib/supabase/middleware"

/**
 * Next.js Edge Middleware — runs before every matched request.
 * Handles Supabase session refresh and route-level auth redirects.
 * Previously named `proxy` (in src/proxy.ts) — renamed to `middleware`
 * so Next.js actually picks this up as an edge middleware file.
 */
export async function middleware(request: NextRequest) {
  console.log(`[middleware] ${request.method} ${request.nextUrl.pathname}`);
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - any file with an extension (e.g. svg, png, jpg, jpeg, gif, webp)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
