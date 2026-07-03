"use client";

import React, { useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search, Menu } from "lucide-react";
import { ChatSession } from "./types";
import { useSidebarResize } from "./useSidebarResize";

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

/* ── Tooltip Helper ───────────── */
function Tooltip({ text, children, isCollapsed }: { text: string; children: React.ReactNode; isCollapsed: boolean }) {
  if (!isCollapsed) return <>{children}</>;

  return (
    <div className="relative group/tooltip flex justify-center w-full">
      {children}
      <div className="
        absolute left-[110%] top-1/2 -translate-y-1/2 ml-2 px-2.5 py-1.5 rounded-lg
        bg-ink-deep border border-line-ondark text-text-ondark text-xs font-sans whitespace-nowrap
        opacity-0 -translate-x-2 pointer-events-none z-50 shadow-md
        group-hover/tooltip:opacity-100 group-hover/tooltip:translate-x-0
        transition-all duration-200 ease-out
      ">
        {text}
      </div>
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
          text-marigold font-heading font-bold text-sm
          hover:bg-marigold/20 hover:border-marigold/40
          active:scale-[0.98] transition-all duration-200 touch-manipulation
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

function SearchButton({ isCollapsed }: { isCollapsed: boolean }) {
  return (
    <Tooltip text="Search chats" isCollapsed={isCollapsed}>
      <button
        className={`
          group flex items-center gap-2.5 rounded-xl
          bg-white/[0.04] border border-white/[0.08] text-text-ondark
          hover:bg-white/[0.08] active:scale-[0.98] transition-all duration-200
          ${isCollapsed ? "size-10 justify-center shrink-0" : "w-full px-4 py-2.5 justify-start"}
        `}
        aria-label="Search chats"
      >
        <Search className={`text-text-dim-ondark group-hover:text-text-ondark transition-colors ${isCollapsed ? "size-5" : "size-4.5"}`} />
        {!isCollapsed && <span className="text-[13px] font-sans">Search chats</span>}
      </button>
    </Tooltip>
  );
}

interface ChatHistoryItemProps {
  session: ChatSession;
  isActive: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}

function ChatHistoryItem({ session, isActive, onSelect, onDelete }: ChatHistoryItemProps) {
  return (
    <button
      onClick={() => onSelect(session.id)}
      className={`
        group w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left
        transition-all duration-200 relative
        ${isActive
          ? "bg-white/[0.08] border-l-2 border-l-marigold text-text-ondark"
          : "bg-transparent border-l-2 border-l-transparent text-text-dim-ondark hover:bg-white/[0.04] hover:text-text-ondark"
        }
      `}
    >
      <ChatBubbleIcon
        className={`shrink-0 transition-all duration-300 ${
          isActive ? "text-marigold scale-110" : "text-text-dim-ondark group-hover:text-marigold/70"
        }`}
      />
      <span className="flex-1 text-[13px] truncate font-sans leading-tight">
        {session.title}
      </span>
      <span
        onClick={(e) => {
          e.stopPropagation();
          onDelete(session.id);
        }}
        className="
          opacity-0 group-hover:opacity-100
          shrink-0 p-1 rounded-md
          text-text-dim-ondark hover:text-chili hover:bg-white/[0.06]
          transition-all duration-200
          cursor-pointer
        "
        aria-label="Delete chat"
      >
        <TrashIcon className="transition-transform duration-200 hover:scale-110" />
      </span>
    </button>
  );
}

/* ── Sidebar content (shared between mobile & desktop) ── */

function SidebarContent({
  chatHistory,
  activeChatId,
  onNewChat,
  onSelectChat,
  onDeleteChat,
  onClose,
  isCollapsed,
  onToggleCollapse,
}: {
  chatHistory: ChatSession[];
  activeChatId: string | null;
  onNewChat: () => void;
  onSelectChat: (id: string) => void;
  onDeleteChat: (id: string) => void;
  onClose: () => void;
  isCollapsed: boolean;
  onToggleCollapse?: () => void;
}) {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Top Section */}
      <div className={`shrink-0 pt-5 pb-4 flex flex-col gap-4 transition-all duration-200 ${isCollapsed ? "px-2 items-center" : "px-4"}`}>
        {/* Brand header & Toggle */}
        <div className={`flex items-center ${isCollapsed ? "justify-center" : "gap-3"}`}>
          <Tooltip text="Expand menu" isCollapsed={isCollapsed}>
            <button 
              onClick={onToggleCollapse}
              className={`
                flex items-center justify-center rounded-lg hover:bg-white/[0.08] transition-colors
                ${isCollapsed ? "size-10" : "size-8 shrink-0"}
              `}
              aria-label="Toggle Sidebar"
            >
              <Menu className={`text-text-ondark ${isCollapsed ? "size-5" : "size-4.5"}`} />
            </button>
          </Tooltip>

          {!isCollapsed && (
            <div className="flex items-center gap-2.5 min-w-0 transition-opacity duration-300">
              <div className="size-8 shrink-0 rounded-lg bg-marigold flex items-center justify-center shadow-sm">
                <span className="text-ink-deeper font-heading font-extrabold text-sm">B</span>
              </div>
              <span className="font-heading font-bold text-[15px] text-text-ondark tracking-tight truncate">
                BuyWise AI
              </span>
            </div>
          )}
        </div>
        
        {/* Actions */}
        <div className={`flex flex-col gap-2 w-full ${isCollapsed ? "items-center" : ""}`}>
          <NewChatButton onClick={() => { onNewChat(); onClose(); }} isCollapsed={isCollapsed} />
          <SearchButton isCollapsed={isCollapsed} />
        </div>
      </div>

      {/* Chat History List (Hidden when collapsed) */}
      <div 
        className={`
          flex-1 min-h-0 flex flex-col transition-opacity duration-200 
          ${isCollapsed ? "opacity-0 hidden" : "opacity-100"}
        `}
      >
        <p className="px-4 mb-2 text-[11px] font-mono text-text-dim-ondark uppercase tracking-wider">
          Recent chats
        </p>
        <ScrollArea className="h-full px-2">
          <div className="flex flex-col gap-0.5">
            {chatHistory.length === 0 ? (
              <p className="px-3 py-4 text-[12px] text-text-dim-ondark/60 text-center font-sans italic">
                No chats yet. Start one!
              </p>
            ) : (
              chatHistory.map((session) => (
                <ChatHistoryItem
                  key={session.id}
                  session={session}
                  isActive={session.id === activeChatId}
                  onSelect={(id) => { onSelectChat(id); onClose(); }}
                  onDelete={onDeleteChat}
                />
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Bottom User Avatar Section */}
      <div className={`shrink-0 p-3 mt-auto ${isCollapsed ? "flex justify-center" : ""}`}>
        <Tooltip text="User Profile" isCollapsed={isCollapsed}>
          <button className={`
            flex items-center gap-3 rounded-xl hover:bg-white/[0.06] transition-colors p-2
            ${isCollapsed ? "justify-center w-auto" : "w-full"}
          `}>
            <Avatar className="size-8 shrink-0">
              <AvatarFallback className="bg-marigold/20 text-marigold text-xs font-bold">U</AvatarFallback>
            </Avatar>
            {!isCollapsed && (
              <span className="font-sans text-[13px] text-text-ondark truncate">
                Guest User
              </span>
            )}
          </button>
        </Tooltip>
      </div>
    </div>
  );
}

/* ── Main Sidebar ─────────────────────────────────────── */

interface SidebarProps {
  chatHistory: ChatSession[];
  activeChatId: string | null;
  onNewChat: () => void;
  onSelectChat: (id: string) => void;
  onDeleteChat: (id: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({
  chatHistory,
  activeChatId,
  onNewChat,
  onSelectChat,
  onDeleteChat,
  isOpen,
  onClose,
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

  const contentProps = { chatHistory, activeChatId, onNewChat, onSelectChat, onDeleteChat, onClose };

  return (
    <>
      {/* ═══════════════════════════════════════════════════
          MOBILE SIDEBAR (slide-in drawer)
          ═══════════════════════════════════════════════════ */}

      {/* Backdrop */}
      <div
        className={`
          fixed inset-0 z-40 bg-black/50 backdrop-blur-sm
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
          fixed top-0 left-0 bottom-0 z-50
          w-[80vw] max-w-[320px] flex flex-col
          bg-[#091e1a]/95 backdrop-blur-md
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
            bg-[#091e1a]/95 backdrop-blur-md border-r border-line-ondark
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
            absolute top-0 -right-[3px] bottom-0 w-[6px] z-10
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
