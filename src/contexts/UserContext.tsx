"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export interface UserProfile {
  id?: string;
  full_name: string | null;
  avatar_url: string | null;
  email: string | null;
  size: string | null;
  budget: number | null;
}

interface UserContextValue {
  profile: UserProfile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
}

const UserContext = createContext<UserContextValue | null>(null);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = async () => {
    const supabase = createClient();
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setProfile(null);
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("full_name, avatar_url, email, size, budget")
        .eq("id", user.id)
        .maybeSingle();

      setProfile({
        id: user.id,
        full_name: data?.full_name || user.user_metadata?.full_name || user.user_metadata?.name || null,
        avatar_url: data?.avatar_url || user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
        email: data?.email || user.email || null,
        size: data?.size || null,
        budget: typeof data?.budget === "number" ? data.budget : null,
      });
    } catch (error) {
      console.error("Failed to load user profile:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshProfile();
  }, []);

  return (
    <UserContext.Provider value={{ profile, loading, refreshProfile }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return ctx;
}
