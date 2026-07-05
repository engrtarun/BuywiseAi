"use client";

import React, { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { QuickBuyProfile } from "@/types/quickBuyProfile";
import { Plus, Trash2, ChevronDown, Settings2 } from "lucide-react";

interface ProfileSwitcherProps {
  profiles: QuickBuyProfile[];
  activeProfile: QuickBuyProfile;
  switchProfile: (id: string) => void;
  deleteProfile: (id: string) => void;
  onAddProfile: () => void;
  onEditProfile: () => void;
}

const PALETTE = [
  "bg-amber-500 text-slate-950",
  "bg-purple-500 text-white",
  "bg-emerald-500 text-slate-950",
  "bg-pink-500 text-white",
  "bg-cyan-500 text-slate-950"
];

export function getProfilePaletteClass(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % PALETTE.length;
  return PALETTE[index];
}

export function ProfileSwitcher({
  profiles,
  activeProfile,
  switchProfile,
  deleteProfile,
  onAddProfile,
  onEditProfile
}: ProfileSwitcherProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 transition-colors active:scale-95 cursor-pointer select-none">
          <div className={`size-5 rounded-full flex items-center justify-center text-[10px] font-bold ${getProfilePaletteClass(activeProfile.id)}`}>
            {activeProfile.avatarLabel}
          </div>
          <span className="text-xs sm:text-sm font-semibold text-text-primary-light truncate max-w-[70px] sm:max-w-[90px]">
            {activeProfile.name}
          </span>
          <ChevronDown className="size-3 text-text-secondary" />
        </button>
      </PopoverTrigger>
      
      <PopoverContent className="w-64 bg-slate-900 border border-white/10 rounded-2xl p-2.5 shadow-2xl relative z-[150] focus:outline-none">
        <div className="text-[11px] font-bold text-text-secondary px-2.5 py-1.5 uppercase tracking-wider">
          Shopper Profiles
        </div>
        
        <div className="flex flex-col gap-1 max-h-60 overflow-y-auto">
          {profiles.map((p) => {
            const isActive = p.id === activeProfile.id;
            return (
              <div
                key={p.id}
                className={`group flex items-center justify-between p-2 rounded-xl transition-all cursor-pointer ${
                  isActive ? "bg-white/10 ring-1 ring-brand-accent/30" : "hover:bg-white/5"
                }`}
                onClick={() => {
                  if (!isActive) {
                    switchProfile(p.id);
                  } else {
                    onEditProfile();
                  }
                  setOpen(false);
                }}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`size-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${getProfilePaletteClass(p.id)}`}>
                    {p.avatarLabel}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[13px] font-bold text-text-primary-light truncate">
                      {p.name}
                    </span>
                    {p.isDefault && (
                      <span className="text-[9px] text-brand-accent font-semibold">
                        Default Profile
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-0.5">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (!isActive) switchProfile(p.id);
                      onEditProfile();
                      setOpen(false);
                    }}
                    className="p-1.5 rounded-lg text-text-secondary hover:text-brand-accent hover:bg-white/5 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 active:scale-90"
                    title="Edit Profile Settings"
                  >
                    <Settings2 className="size-3.5" />
                  </button>
                  {!p.isDefault && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        deleteProfile(p.id);
                      }}
                      className="p-1.5 rounded-lg text-text-secondary hover:text-red-400 hover:bg-white/5 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 active:scale-90"
                      title="Delete Profile"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="border-t border-white/5 pt-2 mt-1.5">
          {profiles.length < 4 ? (
            <button
              onClick={() => {
                onAddProfile();
                setOpen(false);
              }}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-dashed border-white/15 hover:border-brand-accent/40 hover:bg-white/5 text-[12px] font-bold text-text-primary-light transition-all cursor-pointer active:scale-95"
            >
              <Plus className="size-3.5" />
              Add Profile
            </button>
          ) : (
            <div className="text-center py-1.5 text-[11px] text-text-secondary font-medium select-none">
              Profile limit reached (4/4)
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
