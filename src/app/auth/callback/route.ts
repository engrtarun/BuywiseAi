import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // Default to "/chat" if no specific redirect page was provided
  const next = searchParams.get("next") ?? "/chat";

  console.log("[Auth Callback] Request received. Code present:", !!code);

  if (!code) {
    console.error("[Auth Callback] No code parameter found in the request URL.");
    return NextResponse.redirect(`${origin}/login?error=no-code`);
  }

  try {
    console.log("[Auth Callback] Initializing Supabase server client...");
    const supabase = await createClient();
    
    console.log("[Auth Callback] Exchanging code for session...");
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (error) {
      console.error("[Auth Callback] Code exchange failed:", error.message, error);
      return NextResponse.redirect(`${origin}/login?error=auth-code-error`);
    }

    console.log("[Auth Callback] Fetching authenticated user...");
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error("[Auth Callback] Failed to fetch authenticated user:", userError?.message || "User is null");
      return NextResponse.redirect(`${origin}/login?error=user-fetch-error`);
    }

    console.log("[Auth Callback] Authenticated user fetched:", user.email);
    console.log("[Auth Callback] Querying user profile from DB...");
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .maybeSingle();

    console.log("[Auth Callback] Profile query complete. Profile:", profile, "Error:", profileError ? profileError.message : "None");

    if (profileError) {
      console.error("[Auth Callback] Profiles query error:", profileError);
    }

    // If full_name is already set (returning Google user), redirect to /chat
    if (profile && profile.full_name) {
      console.log("[Auth Callback] Profile has name. Redirecting to /chat...");
      return NextResponse.redirect(`${origin}/chat`);
    } else {
      // If full_name is empty/null (first-time Google signup), redirect to /welcome
      console.log("[Auth Callback] Profile name missing. Redirecting to /welcome...");
      return NextResponse.redirect(`${origin}/welcome`);
    }
  } catch (err: any) {
    console.error("[Auth Callback] Unexpected error during authentication callback:", err);
    return NextResponse.redirect(`${origin}/login?error=unexpected-error`);
  }
}
