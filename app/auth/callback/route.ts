import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // Default to "/chat" if no specific redirect page was provided
  const next = searchParams.get("next") ?? "/chat";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      // Exchanged code for session successfully. Check user's profile full_name.
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Query profiles table
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", user.id)
          .maybeSingle();

        if (profileError) {
          console.error("Callback: Profiles query error:", profileError);
        }

        // If full_name is already set (returning Google user), redirect to /chat
        if (profile && profile.full_name) {
          return NextResponse.redirect(`${origin}/chat`);
        } else {
          // If full_name is empty/null (first-time Google signup), redirect to /welcome
          return NextResponse.redirect(`${origin}/welcome`);
        }
      }
    }
  }

  // Redirect to login with error details if verification failed
  return NextResponse.redirect(`${origin}/login?error=auth-code-error`);
}
