"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { QuickBuyProfile } from "@/types/quickBuyProfile";

const PROFILES_KEY = "buywise_quickbuy_profiles";
const ACTIVE_PROFILE_KEY = "buywise_quickbuy_active_profile";
const LEGACY_PREFS_KEY = "buywise_quickbuy_prefs";

function generateUUID() {
  if (typeof window !== "undefined" && window.crypto && window.crypto.randomUUID) {
    return window.crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function getAvatarLabel(name: string): string {
  return name
    .split(/\s+/)
    .map(word => word[0])
    .join("")
    .substring(0, 2)
    .toUpperCase() || "?";
}

export function useQuickBuyProfiles() {
  const [profiles, setProfiles] = useState<QuickBuyProfile[]>([]);
  const [activeProfile, setActiveProfile] = useState<QuickBuyProfile | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  // Sync state to local storage when changed
  const saveToLocalStorage = (updatedProfiles: QuickBuyProfile[], activeId: string | null) => {
    localStorage.setItem(PROFILES_KEY, JSON.stringify(updatedProfiles));
    if (activeId) {
      localStorage.setItem(ACTIVE_PROFILE_KEY, activeId);
    } else {
      localStorage.removeItem(ACTIVE_PROFILE_KEY);
    }
  };

  useEffect(() => {
    let isMounted = true;

    async function initialize() {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        // 1. Get default name if user is logged in
        let defaultName = "You";
        if (user) {
          const fullName = user.user_metadata?.full_name || user.user_metadata?.name;
          if (fullName) {
            defaultName = fullName.split(/\s+/)[0];
          } else {
            const { data: profile } = await supabase
              .from("profiles")
              .select("full_name")
              .eq("id", user.id)
              .maybeSingle();
            if (profile?.full_name) {
              defaultName = profile.full_name.split(/\s+/)[0];
            }
          }
        }

        // 2. Read from localStorage
        const storedProfilesRaw = localStorage.getItem(PROFILES_KEY);
        const storedActiveId = localStorage.getItem(ACTIVE_PROFILE_KEY);

        let localProfiles: QuickBuyProfile[] = [];
        let activeId: string | null = storedActiveId;

        if (storedProfilesRaw) {
          try {
            localProfiles = JSON.parse(storedProfilesRaw);
          } catch (e) {
            console.error("Failed to parse quickbuy profiles from localStorage", e);
          }
        } else {
          // Migration check
          const legacyPrefsRaw = localStorage.getItem(LEGACY_PREFS_KEY);
          if (legacyPrefsRaw) {
            try {
              const legacyPrefs = JSON.parse(legacyPrefsRaw);
              if (legacyPrefs && (legacyPrefs.sizes || legacyPrefs.preferredCategories || legacyPrefs.maxBudget)) {
                const migratedDefault: QuickBuyProfile = {
                  id: generateUUID(),
                  name: defaultName,
                  avatarLabel: getAvatarLabel(defaultName),
                  sizes: legacyPrefs.sizes || [],
                  preferredCategories: legacyPrefs.preferredCategories || [],
                  maxBudget: legacyPrefs.maxBudget !== undefined ? legacyPrefs.maxBudget : null,
                  isDefault: true,
                  createdAt: new Date().toISOString()
                };
                localProfiles = [migratedDefault];
                activeId = migratedDefault.id;
                saveToLocalStorage(localProfiles, activeId);
              }
            } catch (e) {
              console.error("Failed to migrate legacy quickbuy preferences", e);
            }
          } else if (user) {
            try {
              const { data: profile } = await supabase
                .from("profiles")
                .select("size, budget, sizes, max_budget, preferred_sizes, preferred_categories, preferences")
                .maybeSingle();
              if (profile) {
                const sizes = Array.isArray(profile.sizes)
                  ? profile.sizes
                  : typeof profile.size === "string"
                    ? profile.size.split(",").map((value: string) => value.trim()).filter(Boolean)
                    : [];
                const preferredCategories = Array.isArray(profile.preferred_categories)
                  ? profile.preferred_categories
                  : Array.isArray(profile.preferences?.preferred_categories)
                    ? profile.preferences.preferred_categories
                    : [];
                const maxBudget = typeof profile.max_budget === "number"
                  ? profile.max_budget
                  : typeof profile.budget === "number"
                    ? profile.budget
                    : null;
                if (sizes.length > 0 || preferredCategories.length > 0 || maxBudget !== null) {
                  const migratedDefault: QuickBuyProfile = {
                    id: generateUUID(),
                    name: defaultName,
                    avatarLabel: getAvatarLabel(defaultName),
                    sizes,
                    preferredCategories,
                    maxBudget,
                    isDefault: true,
                    createdAt: new Date().toISOString()
                  };
                  localProfiles = [migratedDefault];
                  activeId = migratedDefault.id;
                  saveToLocalStorage(localProfiles, activeId);
                }
              }
            } catch (e) {
              console.error("Failed to migrate from generic profiles table:", e);
            }
          }
        }

        // 3. Supabase Synchronization
        if (user) {
          const { data: dbProfilesRaw, error } = await supabase
            .from("quickbuy_profiles")
            .select("*")
            .order("created_at", { ascending: true });

          if (error) {
            console.warn("Failed to load quickbuy profiles from Supabase:", error.message);
          } else if (dbProfilesRaw && dbProfilesRaw.length > 0) {
            // Supabase is the source of truth if rows exist
            const mappedProfiles: QuickBuyProfile[] = dbProfilesRaw.map((row: any) => ({
              id: row.id,
              name: row.name,
              avatarLabel: row.avatar_label,
              sizes: row.sizes,
              preferredCategories: row.preferred_categories,
              maxBudget: row.max_budget,
              isDefault: row.is_default,
              createdAt: row.created_at
            }));

            localProfiles = mappedProfiles;
            
            // Reconcile active ID
            if (!activeId || !mappedProfiles.some(p => p.id === activeId)) {
              const defProfile = mappedProfiles.find(p => p.isDefault) || mappedProfiles[0];
              activeId = defProfile ? defProfile.id : null;
            }
            saveToLocalStorage(localProfiles, activeId);
          } else if (localProfiles.length > 0) {
            // Local profiles exist, but remote has none -> Sync local to remote
            for (const profile of localProfiles) {
              await supabase.from("quickbuy_profiles").insert({
                id: profile.id,
                user_id: user.id,
                name: profile.name,
                avatar_label: profile.avatarLabel,
                sizes: profile.sizes,
                preferred_categories: profile.preferredCategories,
                max_budget: profile.maxBudget,
                is_default: profile.isDefault,
                created_at: profile.createdAt
              });
            }
          }
        }

        if (isMounted) {
          setProfiles(localProfiles);
          const active = localProfiles.find(p => p.id === activeId) || localProfiles[0] || null;
          setActiveProfile(active);
        }
      } catch (err) {
        console.error("Failed initializing quickbuy profiles", err);
      } finally {
        if (isMounted) {
          setIsInitializing(false);
        }
      }
    }

    initialize();

    return () => {
      isMounted = false;
    };
  }, []);

  const createProfile = useCallback(async (input: { 
    name: string; 
    sizes: string[]; 
    preferredCategories: string[]; 
    maxBudget: number | null; 
  }) => {
    if (profiles.length >= 4) {
      throw new Error("Profile limit reached (4/4)");
    }

    // Determine default name if name is empty
    let profileName = input.name.trim();
    if (!profileName) {
      const isFirst = profiles.length === 0;
      if (isFirst) {
        profileName = "You";
      } else {
        throw new Error("Profile name is required");
      }
    }

    const isFirst = profiles.length === 0;
    const newProfile: QuickBuyProfile = {
      id: generateUUID(),
      name: profileName,
      avatarLabel: getAvatarLabel(profileName),
      sizes: input.sizes,
      preferredCategories: input.preferredCategories,
      maxBudget: input.maxBudget,
      isDefault: isFirst,
      createdAt: new Date().toISOString()
    };

    const nextProfiles = [...profiles, newProfile];
    setProfiles(nextProfiles);
    setActiveProfile(newProfile);
    saveToLocalStorage(nextProfiles, newProfile.id);

    // Sync to Supabase (fire-and-forget)
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        void supabase.from("quickbuy_profiles").insert({
          id: newProfile.id,
          user_id: user.id,
          name: newProfile.name,
          avatar_label: newProfile.avatarLabel,
          sizes: newProfile.sizes,
          preferred_categories: newProfile.preferredCategories,
          max_budget: newProfile.maxBudget,
          is_default: newProfile.isDefault,
          created_at: newProfile.createdAt
        }).then(({ error }) => {
          if (error) {
            console.error("Failed to sync created profile to Supabase:", error.message);
          }
        });
      }
    } catch (err) {
      console.error("Error signing in or getting user for Supabase sync:", err);
    }
  }, [profiles]);

  const switchProfile = useCallback((id: string) => {
    const target = profiles.find(p => p.id === id);
    if (target) {
      setActiveProfile(target);
      localStorage.setItem(ACTIVE_PROFILE_KEY, id);
    }
  }, [profiles]);

  const updateProfile = useCallback(async (id: string, input: Partial<{ 
    name: string; 
    sizes: string[]; 
    preferredCategories: string[]; 
    maxBudget: number | null; 
  }>) => {
    const nextProfiles = profiles.map(profile => {
      if (profile.id !== id) return profile;

      const name = input.name !== undefined ? input.name.trim() : profile.name;
      const avatarLabel = input.name !== undefined ? getAvatarLabel(name) : profile.avatarLabel;

      return {
        ...profile,
        name,
        avatarLabel,
        sizes: input.sizes !== undefined ? input.sizes : profile.sizes,
        preferredCategories: input.preferredCategories !== undefined ? input.preferredCategories : profile.preferredCategories,
        maxBudget: input.maxBudget !== undefined ? input.maxBudget : profile.maxBudget,
      };
    });

    setProfiles(nextProfiles);
    const updated = nextProfiles.find(p => p.id === id);
    if (updated && activeProfile?.id === id) {
      setActiveProfile(updated);
    }
    saveToLocalStorage(nextProfiles, activeProfile?.id || null);

    // Sync to Supabase (fire-and-forget)
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const updates: any = {};
        if (input.name !== undefined) {
          updates.name = input.name.trim();
          updates.avatar_label = getAvatarLabel(updates.name);
        }
        if (input.sizes !== undefined) updates.sizes = input.sizes;
        if (input.preferredCategories !== undefined) updates.preferred_categories = input.preferredCategories;
        if (input.maxBudget !== undefined) updates.max_budget = input.maxBudget;
        updates.updated_at = new Date().toISOString();

        void supabase.from("quickbuy_profiles").update(updates).eq("id", id).then(({ error }) => {
          if (error) {
            console.error("Failed to sync updated profile to Supabase:", error.message);
          }
        });
      }
    } catch (err) {
      console.error("Error syncing profile update:", err);
    }
  }, [profiles, activeProfile]);

  const deleteProfile = useCallback(async (id: string) => {
    const target = profiles.find(p => p.id === id);
    if (!target) return;

    if (target.isDefault) {
      console.warn("Cannot delete the default profile.");
      return;
    }

    if (typeof window !== "undefined" && !window.confirm(`Are you sure you want to delete the profile "${target.name}"?`)) {
      return;
    }

    const nextProfiles = profiles.filter(p => p.id !== id);
    setProfiles(nextProfiles);

    let nextActiveId = activeProfile?.id || null;
    if (activeProfile?.id === id) {
      const defaultProf = nextProfiles.find(p => p.isDefault) || nextProfiles[0] || null;
      nextActiveId = defaultProf ? defaultProf.id : null;
      setActiveProfile(defaultProf);
    }

    saveToLocalStorage(nextProfiles, nextActiveId);

    // Sync to Supabase (fire-and-forget)
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        void supabase.from("quickbuy_profiles").delete().eq("id", id).then(({ error }) => {
          if (error) {
            console.error("Failed to sync deleted profile from Supabase:", error.message);
          }
        });
      }
    } catch (err) {
      console.error("Error syncing profile deletion:", err);
    }
  }, [profiles, activeProfile]);

  return {
    profiles,
    activeProfile,
    isInitializing,
    createProfile,
    switchProfile,
    updateProfile,
    deleteProfile
  };
}
