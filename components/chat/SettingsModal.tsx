"use client";

import React, { useState } from "react";
import { createPortal } from "react-dom";
import { X, Moon, Sun, Bell, User as UserIcon, Lock, Trash2, ArrowRight } from "lucide-react";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: any;
}

export function SettingsModal({ isOpen, onClose, profile }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<"THEME" | "NOTIFICATIONS" | "ACCOUNT">("THEME");

  // Mock states
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [dealNotifs, setDealNotifs] = useState(true);
  
  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-bg-main border border-line-ondark w-full max-w-2xl h-[500px] rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row animate-in zoom-in-95 duration-200">
        
        {/* Sidebar */}
        <div className="w-full md:w-48 bg-white/5 border-b md:border-b-0 md:border-r border-line-ondark flex md:flex-col p-4 gap-2 overflow-x-auto shrink-0">
          <h2 className="font-heading font-bold text-lg text-text-ondark mb-2 hidden md:block px-2">Settings</h2>
          
          <button 
            onClick={() => setActiveTab("THEME")}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-sans transition-colors ${activeTab === "THEME" ? "bg-white/10 text-white font-bold" : "text-text-dim-ondark hover:bg-white/5 hover:text-white"}`}
          >
            <Moon className="size-4" /> Theme
          </button>
          
          <button 
            onClick={() => setActiveTab("NOTIFICATIONS")}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-sans transition-colors ${activeTab === "NOTIFICATIONS" ? "bg-white/10 text-white font-bold" : "text-text-dim-ondark hover:bg-white/5 hover:text-white"}`}
          >
            <Bell className="size-4" /> Notifications
          </button>
          
          <button 
            onClick={() => setActiveTab("ACCOUNT")}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-sans transition-colors ${activeTab === "ACCOUNT" ? "bg-white/10 text-white font-bold" : "text-text-dim-ondark hover:bg-white/5 hover:text-white"}`}
          >
            <UserIcon className="size-4" /> Account
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex items-center justify-between p-4 border-b border-line-ondark">
            <h3 className="font-heading font-bold text-lg text-text-ondark">
              {activeTab === "THEME" && "Appearance"}
              {activeTab === "NOTIFICATIONS" && "Notifications"}
              {activeTab === "ACCOUNT" && "Account Settings"}
            </h3>
            <button 
              onClick={onClose}
              className="p-1.5 rounded-full text-text-dim-ondark hover:text-text-ondark hover:bg-white/10 transition-colors"
            >
              <X className="size-5" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === "THEME" && (
              <div className="space-y-6">
                <div className="flex flex-col gap-2">
                  <span className="text-sm font-bold">Theme Preference</span>
                  <p className="text-xs text-text-dim-ondark mb-2">Select your preferred app appearance.</p>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <button className="flex flex-col items-center gap-3 p-4 rounded-xl border-2 border-brand-accent bg-brand-accent/10">
                      <div className="size-10 rounded-full bg-ink-deeper flex items-center justify-center border border-white/20">
                        <Moon className="size-5 text-brand-accent" />
                      </div>
                      <span className="font-bold text-sm text-brand-accent">Dark Mode</span>
                    </button>
                    
                    <button className="flex flex-col items-center gap-3 p-4 rounded-xl border border-white/10 bg-white/5 opacity-50 cursor-not-allowed group">
                      <div className="size-10 rounded-full bg-white flex items-center justify-center">
                        <Sun className="size-5 text-zinc-900" />
                      </div>
                      <div className="flex flex-col items-center">
                        <span className="font-bold text-sm">Light Mode</span>
                        <span className="text-[10px] text-brand-accent mt-1 group-hover:block">Coming Soon</span>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "NOTIFICATIONS" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
                  <div className="flex flex-col">
                    <span className="font-bold text-sm">Email Notifications</span>
                    <span className="text-xs text-text-dim-ondark">Receive daily summaries of your recommendations.</span>
                  </div>
                  <button 
                    onClick={() => setEmailNotifs(!emailNotifs)}
                    className={`w-12 h-6 rounded-full transition-colors relative ${emailNotifs ? 'bg-brand-accent' : 'bg-white/20'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${emailNotifs ? 'left-7' : 'left-1'}`} />
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
                  <div className="flex flex-col">
                    <span className="font-bold text-sm">Product Deal Alerts</span>
                    <span className="text-xs text-text-dim-ondark">Get notified when saved items go on sale.</span>
                  </div>
                  <button 
                    onClick={() => setDealNotifs(!dealNotifs)}
                    className={`w-12 h-6 rounded-full transition-colors relative ${dealNotifs ? 'bg-brand-accent' : 'bg-white/20'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${dealNotifs ? 'left-7' : 'left-1'}`} />
                  </button>
                </div>
              </div>
            )}

            {activeTab === "ACCOUNT" && (
              <div className="space-y-6">
                <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
                  <div className="size-12 rounded-full bg-brand-accent/20 border border-brand-accent/30 flex items-center justify-center">
                    <span className="text-brand-accent font-bold text-xl">
                      {profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : "U"}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold">{profile?.full_name || "User"}</span>
                    <span className="text-sm text-text-dim-ondark">{profile?.email || "No email"}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-3 pt-4 border-t border-line-ondark">
                  <button className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-left group">
                    <div className="flex items-center gap-3">
                      <Lock className="size-4 text-text-dim-ondark" />
                      <span className="font-bold text-sm">Change Password</span>
                    </div>
                    <ArrowRight className="size-4 text-text-dim-ondark group-hover:translate-x-1 transition-transform" />
                  </button>

                  <button className="flex items-center justify-between p-4 rounded-xl bg-chili/10 border border-chili/20 hover:bg-chili/20 transition-colors text-left group">
                    <div className="flex items-center gap-3">
                      <Trash2 className="size-4 text-chili" />
                      <span className="font-bold text-sm text-chili">Delete Account</span>
                    </div>
                  </button>
                  <p className="text-xs text-text-dim-ondark text-center italic mt-2">* Note: Account actions require backend wiring.</p>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>,
    document.body
  );
}
