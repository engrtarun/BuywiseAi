"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, User, Mail, DollarSign, Tag, Loader2, Upload, CheckCircle, Zap } from "lucide-react";
import { usePremium } from "@/contexts/PremiumContext";

export default function ProfilePage() {
  const router = useRouter();
  const supabase = createClient();
  const { openPremium } = usePremium();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState({
    full_name: "",
    email: "",
    avatar_url: "",
    size: "M",
    budget: 5000,
  });

  useEffect(() => {
    async function loadProfile() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push("/login");
          return;
        }
        setUser(user);

        const { data, error } = await supabase
          .from("profiles")
          .select("full_name, avatar_url, email, size, budget")
          .eq("id", user.id)
          .maybeSingle();

        if (error) {
          console.error("Error loading profile:", error);
        }

        setProfile({
          full_name: data?.full_name || user.user_metadata?.full_name || user.user_metadata?.name || "",
          email: data?.email || user.email || "",
          avatar_url: data?.avatar_url || user.user_metadata?.avatar_url || user.user_metadata?.picture || "",
          size: data?.size || "M",
          budget: typeof data?.budget === "number" ? data.budget : 5000,
        });
      } catch (err: any) {
        setErrorMsg("Failed to load profile details.");
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [router, supabase]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg(null);
    setSuccess(false);

    try {
      const { error } = await supabase
        .from("profiles")
        .upsert({
          id: user.id,
          full_name: profile.full_name,
          email: profile.email,
          avatar_url: profile.avatar_url,
          size: profile.size,
          budget: Number(profile.budget),
        });

      if (error) throw error;
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setErrorMsg(null);

    try {
      // 1. Ensure avatars bucket exists
      const { data: buckets } = await supabase.storage.listBuckets();
      const hasAvatars = buckets?.some((b: { name: string }) => b.name === "avatars");

      if (!hasAvatars) {
        // Attempt to create bucket
        const { error: bucketError } = await supabase.storage.createBucket("avatars", {
          public: true,
          allowedMimeTypes: ["image/*"],
          fileSizeLimit: 2097152, // 2MB
        });
        if (bucketError) {
          console.warn("Storage bucket 'avatars' could not be created or already exists:", bucketError.message);
        }
      }

      // 2. Upload file
      const fileExt = file.name.split(".").pop();
      const filePath = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // 3. Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      // 4. Update local state and profiles table
      setProfile((prev) => ({ ...prev, avatar_url: publicUrl }));
      
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", user.id);

      if (updateError) throw updateError;

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || "Avatar upload failed.");
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-main flex items-center justify-center text-text-primary-light">
        <Loader2 className="size-8 animate-spin text-brand-accent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-main text-text-primary-light font-sans flex flex-col items-center p-4 sm:p-8">
      <div className="w-full max-w-lg bg-white/[0.03] border border-white/[0.08] rounded-3xl p-6 sm:p-8 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300">
        
        {/* Back Button */}
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-2 text-text-secondary hover:text-text-primary-light transition-colors mb-6 cursor-pointer animate-in duration-200"
        >
          <ArrowLeft className="size-4" />
          <span>Back to Chat</span>
        </button>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-heading font-bold text-text-primary-light mb-1">
              Your Profile
            </h1>
            <p className="text-text-secondary text-sm">
              Manage your personal shopping preferences and details.
            </p>
          </div>
          
          <div className="flex flex-col items-end gap-1">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-white/70">
              Account Status: Free Explorer
            </span>
            <button
              onClick={openPremium}
              className="text-xs font-bold text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1 group"
            >
              (Upgrade Now) <Zap className="size-3 group-hover:scale-110 transition-transform" />
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="bg-chili/10 border border-chili/20 text-chili px-4 py-3 rounded-2xl mb-6 text-sm">
            {errorMsg}
          </div>
        )}

        {success && (
          <div className="bg-green-500/10 border border-green-500/20 text-green-400 px-4 py-3 rounded-2xl mb-6 text-sm flex items-center gap-2">
            <CheckCircle className="size-4 shrink-0" />
            <span>Profile saved successfully!</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          {/* Avatar Upload */}
          <div className="flex flex-col items-center gap-4 pb-4 border-b border-white/5">
            <div className="relative size-24 rounded-full overflow-hidden border border-white/10 bg-white/5 flex items-center justify-center shrink-0">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt="Avatar"
                  className="size-full object-cover"
                />
              ) : (
                <User className="size-10 text-text-secondary" />
              )}
              {uploading && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <Loader2 className="size-5 animate-spin text-brand-accent" />
                </div>
              )}
            </div>

            <label className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-text-secondary hover:text-text-primary-light transition-all border border-white/5 text-sm cursor-pointer select-none">
              <Upload className="size-4" />
              <span>Change Photo</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                disabled={uploading}
                className="hidden"
              />
            </label>
          </div>

          {/* Full Name */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider">
              Full Name
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary">
                <User className="size-4" />
              </span>
              <input
                type="text"
                value={profile.full_name}
                onChange={(e) => setProfile((prev) => ({ ...prev, full_name: e.target.value }))}
                placeholder="Enter your name"
                className="w-full pl-12 pr-4 py-3 rounded-2xl bg-white/[0.02] border border-white/[0.08] focus:border-brand-accent/50 outline-none text-[15px] transition-colors"
                required
              />
            </div>
          </div>

          {/* Email (Read Only) */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary">
                <Mail className="size-4" />
              </span>
              <input
                type="email"
                value={profile.email}
                disabled
                className="w-full pl-12 pr-4 py-3 rounded-2xl bg-white/[0.01] border border-white/[0.04] text-text-secondary outline-none text-[15px] cursor-not-allowed"
              />
            </div>
          </div>

          {/* Preferences Section */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
            {/* Preferred Size */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider">
                Preferred Size
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary">
                  <Tag className="size-4" />
                </span>
                <select
                  value={profile.size}
                  onChange={(e) => setProfile((prev) => ({ ...prev, size: e.target.value }))}
                  className="w-full pl-12 pr-4 py-3 rounded-2xl bg-white/[0.02] border border-white/[0.08] focus:border-brand-accent/50 outline-none text-[15px] transition-colors appearance-none cursor-pointer"
                >
                  <option value="S">S</option>
                  <option value="M">M</option>
                  <option value="L">L</option>
                  <option value="XL">XL</option>
                </select>
              </div>
            </div>

            {/* Max Budget */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider">
                Max Budget (INR)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary">
                  <DollarSign className="size-4" />
                </span>
                <input
                  type="number"
                  value={profile.budget}
                  onChange={(e) => setProfile((prev) => ({ ...prev, budget: Number(e.target.value) }))}
                  placeholder="Budget"
                  className="w-full pl-12 pr-4 py-3 rounded-2xl bg-white/[0.02] border border-white/[0.08] focus:border-brand-accent/50 outline-none text-[15px] transition-colors"
                  required
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={saving}
            className="w-full py-4 rounded-2xl bg-brand-accent hover:brightness-110 text-bg-main font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-brand-accent/20"
          >
            {saving ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              <span>Save Profile</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
