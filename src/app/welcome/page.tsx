"use client";

import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { User, Loader2, ShieldAlert, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

export default function WelcomePage(props: { params: Promise<any>; searchParams: Promise<any> }) {
  const params = use(props.params);
  const searchParams = use(props.searchParams);
  const router = useRouter();
  const supabase = createClient();

  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Protect route: Redirect to /login if no active session
  useEffect(() => {
    async function checkSession() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push("/login");
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error("Auth check failed:", err);
        router.push("/login");
      }
    }
    checkSession();
  }, [supabase, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName || submitting) return;

    setSubmitting(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      // Upsert user full_name to profiles table
      const { error } = await supabase
        .from("profiles")
        .upsert({
          id: user.id,
          full_name: trimmedName,
          email: user.email,
        });

      if (error) {
        throw error;
      }

      // Redirect to chat
      router.push('/');
    } catch (err: any) {
      console.error("Failed to save profile name:", err);
      setError(err.message || "Failed to save your name. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-ink-deeper text-text-ondark">
        <Loader2 className="size-8 animate-spin text-marigold" />
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-ink-deeper px-4 py-12 text-text-ondark">
      <div className="w-full max-w-md bg-ink-deep border border-line-ondark rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="font-heading font-extrabold text-2xl tracking-tight text-text-ondark">
            Welcome!
          </h1>
          <h2 className="font-heading font-bold text-lg text-marigold tracking-tight">
            What should we call you?
          </h2>
          <p className="text-sm font-sans text-text-dim-ondark">
            Please enter your name to complete your profile setup.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="relative flex items-center">
            <User className="absolute left-3.5 size-5 text-text-dim-ondark" />
            <Input
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-12 pl-11 bg-ink-deeper/50 border-line-ondark text-text-ondark placeholder:text-text-dim-ondark/60 focus-visible:border-marigold focus-visible:ring-marigold/30"
              disabled={submitting}
              autoFocus
            />
          </div>

          {error && (
            <div className="px-4 py-3 bg-chili/10 border border-chili/30 rounded-xl text-chili text-xs flex items-start gap-2.5 animate-in fade-in duration-300">
              <ShieldAlert className="size-4 shrink-0 mt-0.5" />
              <span className="font-sans leading-relaxed flex-1">{error}</span>
              <button
                type="button"
                onClick={() => setError(null)}
                className="text-chili hover:text-chili/80 font-bold ml-1 text-sm leading-none"
              >
                <X className="size-3.5" />
              </button>
            </div>
          )}

          <Button
            type="submit"
            disabled={submitting || !name.trim()}
            className="w-full h-12 bg-marigold text-ink-deeper hover:bg-marigold-dark rounded-xl font-sans font-bold text-sm tracking-wide transition-all duration-200 shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              "Continue"
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
