"use client";

import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search, Menu, Camera, Palette, Check, MoreVertical, Pencil, Ghost, LogOut, Shirt, Sparkles, UserCog, Pin } from "lucide-react";
import { ChatSession, ChatMode } from "@/types/chat";
import { useSidebarResize } from "./useSidebarResize";
import { useTheme } from "@/hooks/useTheme";
import { THEME_PRESETS, generateCustomTheme } from "@/lib/themes";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { SettingsModal } from "./SettingsModal";
import { FoodModeToggle } from "@/components/shared/FoodModeToggle";

/* ── Inline SVG Icons (animatable via CSS) ───────────── */

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <line x1="9" y1="3" x2="9" y2="15" />
      <line x1="3" y1="9" x2="15" y2="9" />
    </svg>
  );
}

function ChatBubbleIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 10a1.333 1.333 0 0 1-1.333 1.333H4.667L2 14V3.333A1.333 1.333 0 0 1 3.333 2h9.334A1.333 1.333 0 0 1 14 3.333V10Z" />
    </svg>
  );
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M1.75 3.5h10.5" />
      <path d="M4.667 3.5V2.333a1.167 1.167 0 0 1 1.166-1.166h2.334a1.167 1.167 0 0 1 1.166 1.166V3.5m1.75 0v8.167a1.167 1.167 0 0 1-1.166 1.166H4.083a1.167 1.167 0 0 1-1.166-1.166V3.5h8.166Z" />
    </svg>
  );
}
function UserIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function SettingsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

function HelpIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <path d="M12 17h.01" />
    </svg>
  );
}

function LogOutIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function BugIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m8 2 1.88 1.88" />
      <path d="M14.12 3.88 16 2" />
      <path d="M9 7.13v-1a3.003 3.003 0 1 1 6 0v1" />
      <path d="M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3c0 3.3-2.7 6-6 6" />
      <path d="M12 20v-9" />
      <path d="M6.53 9C4.6 8.8 3 7.1 3 5" />
      <path d="M17.47 9c1.93-.2 3.53-1.9 3.53-4" />
      <path d="M8 14H4" />
      <path d="M20 14h-4" />
      <path d="M9 18h6" />
    </svg>
  );
}

/* ── Profile Modal ────────────── */
function ProfileModal({ 
  isOpen, 
  onClose, 
  profile,
  onSave
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  profile: any;
  onSave?: (updates: { avatar_url?: string; full_name?: string }) => void;
}) {
  const [avatarPreview, setAvatarPreview] = React.useState<string | null>(null);
  const [fullName, setFullName] = React.useState<string>(profile?.full_name || "");
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Sync state when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setAvatarPreview(null);
      setFullName(profile?.full_name || "");
    }
  }, [isOpen, profile]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert("Please select a valid image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Image size should be under 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setAvatarPreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    if (onSave) {
      // Note: For real persistence across sessions, the base64 avatarPreview 
      // would need to be uploaded to Supabase storage.
      onSave({
        avatar_url: avatarPreview || undefined,
        full_name: fullName !== profile?.full_name ? fullName : undefined
      });
    }
    onClose();
  };

  if (!isOpen || typeof document === 'undefined') return null;

  const currentAvatar = avatarPreview || profile?.avatar_url;

  return createPortal(
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-sidebar-bg border border-line-ondark w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-4 border-b border-line-ondark">
          <h2 className="font-heading font-bold text-lg text-text-ondark">Edit Profile</h2>
          <button 
            onClick={onClose}
            className="p-1 rounded-md text-text-dim-ondark hover:text-text-ondark hover:bg-white/[0.08] transition-all"
          >
            <XIcon />
          </button>
        </div>
        <div className="p-6 flex flex-col gap-6">
          <div className="flex flex-col items-center gap-3">
            <div 
              className="relative group cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              {currentAvatar ? (
                <img 
                  src={currentAvatar} 
                  alt="Avatar" 
                  className="size-20 rounded-full object-cover border-2 border-white/[0.1] group-hover:opacity-80 transition-opacity"
                />
              ) : (
                <div className="size-20 rounded-full bg-marigold/20 border-2 border-marigold/30 flex items-center justify-center group-hover:bg-marigold/30 transition-colors">
                  <span className="text-marigold font-bold text-2xl">
                    {profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : "U"}
                  </span>
                </div>
              )}
              {/* Camera Icon Overlay */}
              <div className="absolute bottom-0 right-0 bg-[#0d2a24] p-1.5 rounded-full border border-line-ondark text-marigold shadow-md group-hover:scale-110 transition-transform">
                <Camera className="size-3.5" />
              </div>
            </div>
            <input 
              type="file" 
              accept="image/*" 
              ref={fileInputRef} 
              className="hidden" 
              onChange={handleFileChange} 
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="text-[12px] font-sans font-semibold text-marigold hover:text-marigold/80 transition-colors"
            >
              Change avatar
            </button>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-sans font-medium text-text-dim-ondark uppercase tracking-wide">
                Display Name
              </label>
              <input 
                type="text" 
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-white/[0.04] border border-white/[0.1] rounded-lg px-3 py-2 text-sm text-text-ondark outline-none focus:border-marigold/50 transition-colors"
                placeholder="Enter your name"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-sans font-medium text-text-dim-ondark uppercase tracking-wide">
                Email / Username
              </label>
              <input 
                type="text" 
                defaultValue={profile?.email || ""}
                disabled
                className="w-full bg-white/[0.02] border border-white/[0.05] rounded-lg px-3 py-2 text-sm text-text-dim-ondark outline-none cursor-not-allowed"
              />
            </div>
          </div>
        </div>
        <div className="p-4 border-t border-line-ondark flex justify-end gap-3 bg-white/[0.02]">
          <button 
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-sans font-medium text-text-ondark bg-white/[0.05] hover:bg-white/[0.1] transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            className="px-4 py-2 rounded-lg text-sm font-sans font-medium text-ink-deeper bg-marigold hover:bg-marigold/90 transition-colors"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ── Tooltip Helper ───────────── */
function Tooltip({ text, children, isCollapsed }: { text: string; children: React.ReactNode; isCollapsed: boolean }) {
  const [isHovered, setIsHovered] = React.useState(false);
  const [rect, setRect] = React.useState<DOMRect | null>(null);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (isHovered && ref.current) {
      setRect(ref.current.getBoundingClientRect());
    }
  }, [isHovered]);

  if (!isCollapsed) return <>{children}</>;

  return (
    <div 
      ref={ref}
      className="relative flex justify-center w-full"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {children}
      {isHovered && typeof window !== 'undefined' && createPortal(
        <div 
          style={{
            position: 'fixed',
            left: (rect?.right ?? 0) + 12,
            top: (rect?.top ?? 0) + (rect?.height ?? 0) / 2,
            transform: 'translateY(-50%)'
          }}
          className="
            px-2.5 py-1.5 rounded-lg
            bg-ink-deep border border-line-ondark text-text-ondark text-xs font-sans whitespace-nowrap
            z-[100] shadow-md animate-in fade-in slide-in-from-left-1 duration-200 pointer-events-none
          "
        >
          {text}
        </div>,
        document.body
      )}
    </div>
  );
}

/* ── Sub-components ───────────────────────────────────── */

interface NewChatButtonProps {
  onClick: () => void;
  isCollapsed: boolean;
}

function NewChatButton({ onClick, isCollapsed }: NewChatButtonProps) {
  return (
    <Tooltip text="New Chat" isCollapsed={isCollapsed}>
      <button
        onClick={onClick}
        className={`
          group flex items-center justify-center gap-2.5
          rounded-xl bg-marigold/10 border border-marigold/20
          text-text-primary-dark font-heading font-bold text-sm
          hover:bg-marigold/20 hover:border-marigold/40
          active:scale-[0.98] transition-all duration-200 touch-manipulation cursor-pointer
          ${isCollapsed ? "size-10 shrink-0" : "w-full px-4 py-3"}
        `}
        aria-label="New Chat"
      >
        <PlusIcon className={`transition-transform duration-300 group-hover:rotate-90 ${isCollapsed ? "size-5" : ""}`} />
        {!isCollapsed && "New Chat"}
      </button>
    </Tooltip>
  );
}

interface SearchFieldProps {
  isCollapsed: boolean;
  onExpand?: () => void;
  value: string;
  onChange: (val: string) => void;
}

function SearchField({ isCollapsed, onExpand, value, onChange }: SearchFieldProps) {
  if (isCollapsed) {
    return (
      <Tooltip text="Search chats" isCollapsed={true}>
        <button
          onClick={onExpand}
          className="
            group flex items-center justify-center size-10 shrink-0 rounded-xl
            bg-white/[0.04] border border-border-dark text-text-primary-dark
            hover:bg-white/[0.08] active:scale-[0.98] transition-all duration-200 cursor-pointer
          "
          aria-label="Search chats"
        >
          <Search className="size-5 text-text-secondary group-hover:text-text-primary-dark transition-colors" />
        </button>
      </Tooltip>
    );
  }

  return (
    <div className="relative w-full">
      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4.5 text-text-secondary" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search chats..."
        className="
          w-full bg-white/[0.04] border border-border-dark rounded-xl
          py-2.5 pl-10 pr-4 text-[13px] font-sans text-text-primary-dark
          placeholder:text-text-secondary outline-none
          focus:border-marigold/40 focus:bg-white/[0.06] transition-all
        "
      />
    </div>
  );
}

interface ChatHistoryItemProps {
  session: ChatSession;
  isActive: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onRename?: (id: string, title: string) => void;
  onTogglePin?: (id: string, pinned: boolean) => void;
}

function ChatHistoryItem({ session, isActive, onSelect, onDelete, onRename, onTogglePin }: ChatHistoryItemProps) {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(false);
  const [editTitle, setEditTitle] = React.useState(session.title);

  React.useEffect(() => {
    setEditTitle(session.title);
  }, [session.title]);

  const handleSave = async () => {
    const trimmed = editTitle.trim();
    if (!trimmed) {
      handleCancel();
      return;
    }

    setIsEditing(false);

    if (trimmed === session.title) return;

    if (onRename) {
      onRename(session.id, trimmed);
    }

    // Call Supabase update
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("chat_sessions")
        .update({ title: trimmed })
        .eq("id", session.id);

      if (error) {
        console.error("Failed to rename chat in Supabase:", error.message);
      }
    } catch (err) {
      console.error("Failed to rename chat:", err);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditTitle(session.title);
  };

  return (
    <div
      onClick={() => {
        if (!isEditing) {
          onSelect(session.id);
        }
      }}
      className={`
         group w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left
         transition-all duration-200 cursor-pointer select-none
         ${isActive
           ? "bg-sidebar-accent text-text-primary-dark"
           : "bg-transparent text-text-primary-dark/70 hover:bg-sidebar-accent/50 hover:text-text-primary-dark"
         }
         `}
    >
      <ChatBubbleIcon
        className={`shrink-0 size-3.5 mr-2.5 transition-all duration-300 ${
          isActive ? "text-text-primary-dark opacity-80" : "text-text-primary-dark opacity-60 group-hover:opacity-100"
        }`}
      />
      
      {isEditing ? (
        <input
          type="text"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleSave();
            } else if (e.key === "Escape") {
              handleCancel();
            }
          }}
          onBlur={handleSave}
          autoFocus
          className="flex-1 bg-bg-input text-text-primary-dark text-[13px] font-sans px-1.5 py-0.5 rounded outline-none border border-brand-accent/50 min-w-0 shadow-inner"
        />
      ) : (
        <span className="flex-1 min-w-0 text-[13px] truncate font-sans leading-tight">
          {session.title}
          {session.pinned && (
            <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-brand-accent/15 px-2 py-0.5 text-[10px] font-semibold text-brand-accent">
              <Pin className="size-3" /> Pinned
            </span>
          )}
        </span>
      )}
      
      {!isEditing && (
        <div className="shrink-0 flex items-center gap-0.5 ml-2">
          {isActive && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsEditing(true);
                setEditTitle(session.title);
              }}
              className="p-1 rounded-md text-text-primary-dark/60 hover:text-text-primary-dark transition-colors"
              aria-label="Rename chat"
            >
              <Pencil className="size-3.5" />
            </button>
          )}

          <div className="relative">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsMenuOpen(!isMenuOpen);
              }}
              className={`
                p-1 rounded-md text-text-primary-dark/60 hover:text-text-primary-dark hover:bg-white/[0.06]
                transition-all duration-200 cursor-pointer
                ${isMenuOpen ? "opacity-100" : "opacity-0 group-hover:opacity-100"}
              `}
              aria-label="Chat actions"
            >
              <MoreVertical className="size-4" />
            </button>

            {isMenuOpen && (
              <>
                <div 
                  className="fixed inset-0 z-[60]" 
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMenuOpen(false);
                  }}
                />
                
                <div className="absolute right-0 mt-1.5 z-[70] bg-dropdown-bg border border-border-light rounded-xl p-1 shadow-xl flex flex-col gap-0.5 min-w-[120px] animate-in fade-in zoom-in-95 duration-100">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsMenuOpen(false);
                      setIsEditing(true);
                      setEditTitle(session.title);
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-sans text-text-primary-dark hover:bg-bg-sidebar transition-all select-none"
                  >
                    Rename
                  </button>
                  {onTogglePin && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsMenuOpen(false);
                        onTogglePin(session.id, !session.pinned);
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-sans text-text-primary-dark hover:bg-bg-sidebar transition-all select-none flex items-center gap-2"
                    >
                      <Pin className="size-3.5" />
                      {session.pinned ? "Unpin" : "Pin"}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsMenuOpen(false);
                      onDelete(session.id);
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-sans text-chili hover:bg-chili/10 transition-all font-semibold select-none"
                  >
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Sidebar content (shared between mobile & desktop) ── */

function SidebarContent({
  chatHistory,
  activeChatId,
  onNewChat,
  onSelectChat,
  onDeleteChat,
  onRenameChat,
  onTogglePin,
  onClose,
  isCollapsed,
  onToggleCollapse,
  isGuest,
}: {
  chatHistory: ChatSession[];
  activeChatId: string | null;
  onNewChat: (mode?: ChatMode) => void;
  onSelectChat: (id: string) => void;
  onDeleteChat: (id: string) => void;
  onRenameChat?: (id: string, title: string) => void;
  onTogglePin?: (id: string, pinned: boolean) => void;
  onClose: () => void;
  isCollapsed: boolean;
  onToggleCollapse?: () => void;
  isGuest?: boolean;
}) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const router = useRouter();
  const supabase = createClient();

  const [profile, setProfile] = React.useState<{
    full_name: string | null;
    avatar_url: string | null;
    email: string | null;
    size: string | null;
    budget: number | null;
  } | null>(null);
  const [loadingProfile, setLoadingProfile] = React.useState(true);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [showProfileModal, setShowProfileModal] = React.useState(false);
  const [showSettingsModal, setShowSettingsModal] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const [menuRect, setMenuRect] = React.useState<DOMRect | null>(null);
  const { theme, setTheme, mode, setMode, customSeedColor, setCustomSeedColor } = useTheme();

  useEffect(() => {
    async function loadUserProfile() {
      if (!supabase) {
        setLoadingProfile(false);
        return;
      }

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setLoadingProfile(false);
          return;
        }

        const { data, error } = await supabase
          .from("profiles")
          .select("full_name, avatar_url, email, size, budget")
          .eq("id", user.id)
          .maybeSingle();

        if (error) {
          console.error("Error fetching profile:", error);
        }

        setProfile({
          full_name: data?.full_name || user.user_metadata?.full_name || user.user_metadata?.name || null,
          avatar_url: data?.avatar_url || user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
          email: data?.email || user.email || null,
          size: data?.size || null,
          budget: typeof data?.budget === "number" ? data.budget : null,
        });
      } catch (err) {
        console.error("Failed to load user profile:", err);
      } finally {
        setLoadingProfile(false);
      }
    }

    loadUserProfile();
  }, [supabase]);

  const calculateCompletion = () => {
    if (!profile) return 0;
    let filled = 0;
    const totalFields = 4;
    
    if (profile.full_name && profile.full_name.trim()) filled++;
    if (profile.avatar_url && profile.avatar_url.trim()) filled++;
    if (profile.size && profile.size.trim()) filled++;
    if (profile.budget !== null && profile.budget !== undefined) filled++;
    
    return Math.round((filled / totalFields) * 100);
  };
  
  const completionPercentage = calculateCompletion();

  const updateMenuRect = React.useCallback(() => {
    if (menuRef.current) {
      setMenuRect(menuRef.current.getBoundingClientRect());
    }
  }, []);

  useEffect(() => {
    if (menuOpen) {
      updateMenuRect();
      window.addEventListener('resize', updateMenuRect);
      return () => window.removeEventListener('resize', updateMenuRect);
    }
  }, [menuOpen, updateMenuRect, isCollapsed]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      const clickedOutsideMenu = menuRef.current && !menuRef.current.contains(target);
      const clickedOutsideDropdown = !dropdownRef.current || !dropdownRef.current.contains(target);
      
      if (clickedOutsideMenu && clickedOutsideDropdown) {
        setMenuOpen(false);
      }
    }
    // Using click instead of mousedown to prevent timing issues with button clicks
    document.addEventListener("click", handleClickOutside, { capture: true });
    return () => {
      document.removeEventListener("click", handleClickOutside, { capture: true });
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const sortedHistory = [...chatHistory].sort((a, b) => {
    if (a.pinned === b.pinned) {
      return b.createdAt - a.createdAt
    }
    return a.pinned ? -1 : 1
  })

  const filteredHistory = sortedHistory.filter((session) =>
    session.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full w-full min-w-0 overflow-hidden">
      {/* Top Section */}
      <div className={`shrink-0 pt-5 pb-4 flex flex-col gap-4 transition-all duration-200 ${isCollapsed ? "px-2 items-center" : "px-4"}`}>
        {/* Brand header & Toggle */}
        <div className={`flex items-center ${isCollapsed ? "justify-center" : "gap-3"}`}>
          <Tooltip text="Expand menu" isCollapsed={isCollapsed}>
            <button 
              onClick={onToggleCollapse}
              className={`
                hidden md:flex items-center justify-center rounded-lg hover:bg-white/[0.08] transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer
                ${isCollapsed ? "size-10" : "size-8 shrink-0"}
              `}
              aria-label="Toggle Sidebar"
            >
              <Menu className={`text-text-primary-dark ${isCollapsed ? "size-5" : "size-4.5"}`} />
            </button>
          </Tooltip>

          {!isCollapsed && (
            <div className="flex items-center gap-2.5 min-w-0 transition-opacity duration-300">
              <div className="size-8 shrink-0 rounded-lg bg-marigold flex items-center justify-center shadow-sm">
                <span className="text-ink-deeper font-heading font-extrabold text-sm">B</span>
              </div>
              <span className="font-heading font-bold text-[15px] text-text-primary-dark tracking-tight truncate">
                BuyWise AI
              </span>
            </div>
          )}
        </div>
        
        {/* Actions */}
        <div className={`flex flex-col gap-2 w-full ${isCollapsed ? "items-center" : ""}`}>
          <NewChatButton onClick={() => { onNewChat(); onClose(); }} isCollapsed={isCollapsed} />
          
          {/* Shopping Tools */}
          <div className="flex flex-col gap-1 w-full mt-2 mb-1">
            {!isCollapsed && (
              <p className="px-2 mb-1 text-[10px] font-mono text-text-secondary uppercase tracking-wider">
                Shopping Tools
              </p>
            )}
            
            <Tooltip text="Quick Buy" isCollapsed={isCollapsed}>
              <button 
                onClick={() => { router.push('/quick-buy'); onClose(); }}
                className={`
                  flex items-center gap-2.5 rounded-xl font-sans text-[13px] text-text-primary-dark hover:bg-white/[0.06] transition-all cursor-pointer group select-none
                  ${isCollapsed ? "size-10 justify-center" : "w-full px-3 py-2.5"}
                `}
              >
                <Sparkles className="size-4 shrink-0 text-brand-accent group-hover:scale-110 transition-transform" />
                {!isCollapsed && <span className="truncate flex-1 text-left">Quick Buy</span>}
              </button>
            </Tooltip>

            <Tooltip text="Virtual Wardrobe" isCollapsed={isCollapsed}>
              <button 
                onClick={() => { router.push('/virtual-wardrobe'); onClose(); }}
                className={`
                  flex items-center gap-2.5 rounded-xl font-sans text-[13px] text-text-primary-dark hover:bg-white/[0.06] transition-all cursor-pointer group select-none
                  ${isCollapsed ? "size-10 justify-center" : "w-full px-3 py-2.5"}
                `}
              >
                <Shirt className="size-4 shrink-0 text-text-secondary group-hover:text-brand-accent group-hover:scale-110 transition-transform" />
                {!isCollapsed && <span className="truncate flex-1 text-left">Virtual Wardrobe</span>}
              </button>
            </Tooltip>
          </div>

          <SearchField 
            isCollapsed={isCollapsed} 
            onExpand={onToggleCollapse}
            value={searchQuery}
            onChange={setSearchQuery}
          />
        </div>
      </div>

      {/* Chat History List (Hidden when collapsed) */}
      <div 
        className={`
          flex-1 min-h-0 min-w-0 flex flex-col transition-opacity duration-200 
          ${isCollapsed ? "opacity-0 hidden" : "opacity-100"}
        `}
      >
        <p className="px-4 mb-2 text-[11px] font-mono text-text-secondary uppercase tracking-wider">
          Recent chats
        </p>
        <ScrollArea className="h-full px-2">
          <div className="flex flex-col gap-0.5">
            {filteredHistory.length === 0 ? (
              <p className="px-3 py-4 text-[12px] text-text-secondary/60 text-center font-sans italic">
                {searchQuery ? "No matching chats." : "No chats yet. Start one!"}
              </p>
            ) : (
              filteredHistory.map((session) => (
                <ChatHistoryItem
                  key={session.id}
                  session={session}
                  isActive={session.id === activeChatId}
                  onSelect={(id) => { onSelectChat(id); onClose(); }}
                  onDelete={onDeleteChat}
                  onRename={onRenameChat}
                  onTogglePin={onTogglePin}
                />
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Bottom User Avatar Section */}
      <div className={`shrink-0 p-3 mt-auto flex flex-col gap-1.5 relative ${isCollapsed ? "items-center" : ""}`} ref={menuRef}>
        {/* Dropdown Menu Popover via Portal */}
        {menuOpen && typeof window !== 'undefined' && createPortal(
          <div 
            ref={dropdownRef}
            style={{
              position: 'fixed',
              left: isCollapsed ? (menuRect?.right ?? 0) + 12 : (menuRect?.left ?? 0),
              bottom: isCollapsed ? window.innerHeight - (menuRect?.bottom ?? 0) : window.innerHeight - (menuRect?.top ?? 0) + 8,
              width: isCollapsed ? 240 : (menuRect?.width ?? 240),
            }}
            className="z-[100] bg-dropdown-bg border border-line-ondark rounded-2xl p-2 shadow-2xl flex flex-col gap-1 animate-in fade-in zoom-in-95 duration-200"
          >
            {/* User Info Header */}
            <div 
              onClick={() => {
                setMenuOpen(false);
                setShowProfileModal(true);
              }}
              className="flex items-center gap-3 px-3 py-3 mb-1 rounded-xl cursor-pointer hover:bg-white/[0.06] transition-all select-none"
            >
              <div className="size-9 rounded-full bg-marigold/20 flex items-center justify-center shrink-0">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} className="size-full rounded-full object-cover" alt="avatar" />
                ) : (
                  <span className="text-marigold font-bold text-sm">
                    {profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : "U"}
                  </span>
                )}
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="font-sans text-[13px] font-bold text-text-primary-dark truncate">
                  {profile?.full_name || "User"}
                </span>
                <span className="font-mono text-[10px] text-text-secondary truncate">
                  {profile?.email || ""}
                </span>
              </div>
            </div>
            
            <div className="h-px bg-border-dark my-1 mx-2" />

            {/* Menu Items */}
            <button 
              type="button"
              onClick={() => {
                setMenuOpen(false);
                router.push("/profile");
              }}
              className="group flex items-center gap-3 w-full text-left px-3 py-2.5 rounded-lg text-[13px] font-sans text-text-primary-dark hover:bg-white/[0.06] transition-all select-none cursor-pointer"
            >
              <UserIcon className="text-text-secondary group-hover:text-marigold group-hover:scale-110 transition-all duration-300" />
              <span>Profile</span>
            </button>
            
            <button 
              type="button"
              onClick={() => {
                setMenuOpen(false);
                setShowSettingsModal(true);
              }}
              className="group flex items-center gap-3 w-full text-left px-3 py-2.5 rounded-lg text-[13px] font-sans text-text-primary-dark hover:bg-white/[0.06] transition-all select-none cursor-pointer"
            >
              <SettingsIcon className="text-text-secondary group-hover:text-marigold group-hover:rotate-45 transition-all duration-300" />
              <span>Settings</span>
            </button>
            
            <div className="h-px bg-border-dark my-1 mx-2" />

            {/* Help with flyout */}
            <div className="group/help relative">
              <button 
                type="button"
                className="group flex items-center justify-between w-full text-left px-3 py-2.5 rounded-lg text-[13px] font-sans text-text-primary-dark hover:bg-white/[0.06] transition-all select-none cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <HelpIcon className="text-text-secondary group-hover:text-marigold group-hover:scale-110 transition-all duration-300" />
                  <span>Help</span>
                </div>
                <ChevronRightIcon className="text-text-secondary group-hover:text-marigold group-hover:translate-x-0.5 transition-all duration-300" />
              </button>
              
              {/* Flyout submenu */}
              {console.log('Help submenu rendered') as any}
              <div className="
                absolute left-full bottom-0 w-48 bg-dropdown-bg border border-line-ondark rounded-xl p-1.5 shadow-xl
                opacity-0 -translate-x-2 pointer-events-none z-50
                group-hover/help:opacity-100 group-hover/help:translate-x-0 group-hover/help:pointer-events-auto
                transition-all duration-200 flex flex-col gap-1
                before:absolute before:content-[''] before:-left-3 before:top-0 before:bottom-0 before:w-3
              ">
                <a 
                  href="#" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  onClick={(e) => {
                    e.preventDefault();
                    console.log('Help center clicked!');
                    // TODO: Replace # with actual help documentation URL
                    setMenuOpen(false);
                  }}
                  className="group/item flex items-center gap-2.5 w-full text-left px-3 py-2 rounded-lg text-[12px] font-sans text-text-primary-dark hover:bg-white/[0.06] transition-all select-none cursor-pointer"
                >
                  <HelpIcon className="size-3.5 text-text-secondary group-hover/item:text-marigold transition-colors" />
                  <span className="select-none">Help center</span>
                </a>
                <a 
                  href="mailto:support@buywiseai.com?subject=Bug Report"
                  onClick={() => {
                    console.log('Report a bug clicked!');
                    // TODO: Update email address or replace with actual bug report form URL
                    setMenuOpen(false);
                  }}
                  className="group/item flex items-center gap-2.5 w-full text-left px-3 py-2 rounded-lg text-[12px] font-sans text-text-primary-dark hover:bg-white/[0.06] transition-all select-none cursor-pointer"
                >
                  <BugIcon className="size-3.5 text-text-secondary group-hover/item:text-marigold transition-colors" />
                  <span className="select-none">Report a bug</span>
                </a>
              </div>
            </div>
            
            <div className="h-px bg-border-dark my-1 mx-2" />

            <button
              type="button"
              onClick={handleLogout}
              className="group flex items-center gap-3 w-full text-left px-3 py-2.5 rounded-lg text-[13px] font-sans text-chili hover:bg-chili/10 transition-all font-semibold select-none cursor-pointer"
            >
              <LogOutIcon className="text-chili/70 group-hover:text-chili group-hover:-translate-x-0.5 transition-all duration-300" />
              <span>Log out</span>
            </button>
          </div>,
          document.body
        )}

        <ProfileModal 
          isOpen={showProfileModal} 
          onClose={() => setShowProfileModal(false)} 
          profile={profile} 
          onSave={(updates) => setProfile(prev => prev ? { ...prev, ...updates } : { full_name: null, avatar_url: null, email: null, size: null, budget: null, ...updates })}
        />

        <SettingsModal
          isOpen={showSettingsModal}
          onClose={() => setShowSettingsModal(false)}
          profile={profile}
          onEditProfile={() => {
            setShowSettingsModal(false);
            setShowProfileModal(true);
          }}
        />

        <Popover>
          <Tooltip text="Change Theme" isCollapsed={isCollapsed}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className={`
                  flex items-center gap-3 rounded-xl hover:bg-white/[0.08] transition-all duration-200 p-2 hover:scale-[1.02] active:scale-[0.98] cursor-pointer text-left
                  ${isCollapsed ? "justify-center size-8 p-0" : "w-full"}
                `}
              >
                <Palette className="size-4 text-text-dim-ondark shrink-0" />
                {!isCollapsed && (
                  <span className="font-sans text-[13px] text-text-ondark flex-1 select-none">
                    Change Theme
                  </span>
                )}
              </button>
            </PopoverTrigger>
          </Tooltip>
          <PopoverContent
            side={isCollapsed ? "right" : "top"}
            align={isCollapsed ? "end" : "start"}
            sideOffset={12}
            className="w-60 bg-dropdown-bg border border-line-ondark rounded-2xl p-2 shadow-2xl flex flex-col gap-1 z-[120]"
          >
            <h3 className="font-sans text-[11px] font-bold text-text-dim-ondark uppercase tracking-wider px-2 py-1 select-none">
              Select Theme
            </h3>
            <div className="flex flex-col gap-1 mt-0.5">
              {THEME_PRESETS.map((preset) => {
                const isActive = theme === preset.id;
                return (
                  <button
                    key={preset.id}
                    onClick={() => setTheme(preset.id)}
                    className={`
                      group flex items-center justify-between w-full p-2 rounded-xl text-left text-[13px] font-sans text-text-ondark hover:bg-white/[0.06] transition-all cursor-pointer select-none
                      ${isActive ? "bg-white/[0.08] border border-white/5" : "border border-transparent"}
                    `}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {/* Color Swatch Preview */}
                      <div
                        className="size-5 rounded-md flex overflow-hidden border border-white/10 shrink-0"
                        style={{ backgroundColor: preset.colors.background }}
                      >
                        <div className="w-1/2 h-full" style={{ backgroundColor: preset.colors.sidebar }} />
                        <div className="w-1/2 h-full" style={{ backgroundColor: preset.colors.primary }} />
                      </div>
                      <span className="truncate font-medium">{preset.name}</span>
                    </div>
                    {isActive && (
                      <Check className="size-3.5 text-marigold shrink-0" />
                    )}
                  </button>
                );
              })}
              
              {/* Custom Theme Option */}
              <button
                onClick={() => setTheme("custom")}
                className={`
                  group flex flex-col w-full p-2 rounded-xl text-left text-[13px] font-sans text-text-ondark hover:bg-white/[0.06] transition-all cursor-pointer select-none
                  ${theme === "custom" ? "bg-white/[0.08] border border-white/5" : "border border-transparent"}
                `}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className="size-5 rounded-md flex overflow-hidden border border-white/10 shrink-0 relative"
                      style={{ 
                        background: "linear-gradient(45deg, red, orange, yellow, green, blue, indigo, violet)"
                      }}
                    />
                    <span className="truncate font-medium">Custom</span>
                  </div>
                  {theme === "custom" && <Check className="size-3.5 text-marigold shrink-0" />}
                </div>

                {/* Custom Color Controls */}
                {theme === "custom" && (
                  <div className="mt-3 flex flex-col gap-2 w-full pr-1" onClick={(e) => e.stopPropagation()}>
                    {/* Presets */}
                    <div className="flex justify-between items-center gap-2">
                      <button 
                        title="Luxury Gold" 
                        onClick={() => setCustomSeedColor("#FFD700")}
                        className="flex-1 h-6 rounded-md bg-[#FFD700] hover:scale-105 transition-transform border border-white/20"
                      />
                      <button 
                        title="Cyber Neon" 
                        onClick={() => setCustomSeedColor("#00FFCC")}
                        className="flex-1 h-6 rounded-md bg-[#00FFCC] hover:scale-105 transition-transform border border-white/20"
                      />
                      <button 
                        title="Eco Mint" 
                        onClick={() => setCustomSeedColor("#98FF98")}
                        className="flex-1 h-6 rounded-md bg-[#98FF98] hover:scale-105 transition-transform border border-white/20"
                      />
                    </div>
                    {/* Native Color Picker */}
                    <div className="flex items-center gap-2 mt-1">
                      <input 
                        type="color" 
                        value={customSeedColor}
                        onChange={(e) => setCustomSeedColor(e.target.value)}
                        className="w-full h-8 rounded-md cursor-pointer bg-transparent border-0 p-0"
                      />
                    </div>
                  </div>
                )}
              </button>
            </div>
          </PopoverContent>
        </Popover>

        <Tooltip text="User Profile" isCollapsed={isCollapsed}>
          <div
            onClick={() => setMenuOpen(!menuOpen)}
            className={`
              flex items-center gap-3 rounded-xl hover:bg-white/[0.08] transition-all duration-200 p-2 hover:scale-[1.02] active:scale-[0.98] cursor-pointer
              ${isCollapsed ? "justify-center w-auto" : "w-full"}
              ${menuOpen ? "bg-white/[0.08]" : ""}
            `}
          >
            {loadingProfile ? (
              <div className="size-8 rounded-full bg-white/[0.08] animate-pulse shrink-0" />
            ) : (
              <div className="relative size-10 flex items-center justify-center shrink-0">
                {/* SVG circular progress ring */}
                <svg className="absolute inset-0 size-full -rotate-90">
                  <circle
                    cx="20"
                    cy="20"
                    r="17"
                    className="stroke-white/[0.08] fill-transparent"
                    strokeWidth="2"
                  />
                  <circle
                    cx="20"
                    cy="20"
                    r="17"
                    className="stroke-marigold fill-transparent transition-all duration-500 ease-out"
                    strokeWidth="2"
                    strokeDasharray="106.8"
                    strokeDashoffset={106.8 - (completionPercentage / 100) * 106.8}
                    strokeLinecap="round"
                  />
                </svg>

                {/* Avatar inside ring */}
                <div className="size-7 rounded-full overflow-hidden flex items-center justify-center bg-white/[0.05]">
                  {profile?.avatar_url ? (
                    <img 
                      src={profile.avatar_url} 
                      alt={profile.full_name || "Avatar"} 
                      className="size-full object-cover"
                    />
                  ) : (
                    <div className="size-full bg-marigold/20 text-marigold text-[10px] font-bold flex items-center justify-center font-sans">
                      {profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : "U"}
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {!isCollapsed && (
              <div className="flex-1 min-w-0 text-left flex items-center justify-between gap-2">
                {loadingProfile ? (
                  <div className="h-4 w-24 bg-white/[0.08] animate-pulse rounded" />
                ) : (
                  <div className="flex-1 min-w-0">
                    <span className="font-sans text-[13px] text-text-primary-dark truncate block font-medium">
                      {profile?.full_name || "Guest User"}
                    </span>
                    <span className="font-sans text-[10px] text-text-secondary block">
                      {completionPercentage}% complete
                    </span>
                  </div>
                )}

                {!loadingProfile && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation(); // prevent opening dropdown menu
                      router.push("/profile");
                    }}
                    className="p-1.5 rounded-lg hover:bg-white/10 text-text-secondary hover:text-marigold transition-colors shrink-0"
                    title="Edit Profile"
                  >
                    <UserCog className="size-4" />
                  </button>
                )}
              </div>
            )}
          </div>
        </Tooltip>
      </div>
    </div>
  );
}

/* ── Main Sidebar ─────────────────────────────────────── */

interface SidebarProps {
  chatHistory: ChatSession[];
  activeChatId: string | null;
  onNewChat: (mode?: ChatMode) => void;
  onSelectChat: (id: string) => void;
  onDeleteChat: (id: string) => void;
  onRenameChat?: (id: string, title: string) => void;
  onTogglePin?: (id: string, pinned: boolean) => void;
  isOpen: boolean;
  onClose: () => void;
  onNewTemporaryChat?: () => void;
  isGuest?: boolean;
}

export function Sidebar({
  chatHistory,
  activeChatId,
  onNewChat,
  onSelectChat,
  onDeleteChat,
  onRenameChat,
  onTogglePin,
  isOpen,
  onClose,
  onNewTemporaryChat,
  isGuest,
}: SidebarProps) {
  const { width, isCollapsed, isDragging, toggleCollapse, handleProps } = useSidebarResize();

  // Lock body scroll when mobile sidebar is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const contentProps = { chatHistory, activeChatId, onNewChat, onSelectChat, onDeleteChat, onRenameChat, onTogglePin, onClose, onNewTemporaryChat, isGuest };

  return (
    <>
      {/* ═══════════════════════════════════════════════════
          MOBILE SIDEBAR (slide-in drawer)
          ═══════════════════════════════════════════════════ */}

      {/* Backdrop */}
      <div
        className={`
          fixed top-[61px] inset-x-0 bottom-0 z-40 bg-black/50 backdrop-blur-sm
          md:hidden
          transition-opacity duration-300
          ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}
        `}
        onClick={onClose}
        aria-hidden={!isOpen}
      />

      {/* Mobile panel */}
      <aside
        className={`
          fixed top-[61px] left-0 bottom-0 z-50
          w-[80vw] max-w-[320px] flex flex-col
          bg-sidebar-bg/95 backdrop-blur-md
          border-r border-line-ondark
          transition-transform duration-300 ease-in-out
          md:hidden
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <SidebarContent {...contentProps} isCollapsed={false} onToggleCollapse={() => {}} />
      </aside>

      {/* ═══════════════════════════════════════════════════
          DESKTOP SIDEBAR (resizable + collapsible icon rail)
          ═══════════════════════════════════════════════════ */}

      <aside
        className="hidden md:flex relative shrink-0"
        style={{
          width,
          transition: isDragging ? "none" : "width 200ms ease-in-out",
        }}
      >
        {/* Sidebar content */}
        <div
          className={`
            h-full flex flex-col overflow-hidden w-full
            bg-sidebar-bg/95 backdrop-blur-md border-r border-line-ondark
          `}
        >
          <SidebarContent 
            {...contentProps} 
            isCollapsed={isCollapsed} 
            onToggleCollapse={toggleCollapse} 
          />
        </div>

        {/* Resize handle */}
        <div
          {...handleProps}
          className={`
            absolute top-0 -right-[6px] bottom-0 w-[12px] z-10
            cursor-col-resize group
          `}
        >
          {/* Visible line */}
          <div
            className={`
              absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-[2px] rounded-full
              transition-all duration-150
              ${isDragging
                ? "bg-marigold shadow-[0_0_8px_rgba(232,163,61,0.4)]"
                : "bg-transparent group-hover:bg-marigold/50"
              }
            `}
          />
        </div>
      </aside>
    </>
  );
}
