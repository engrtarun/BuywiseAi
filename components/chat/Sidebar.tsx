"use client";

import React, { useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
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

/** Chevron icon that rotates based on collapsed state */
function CollapseChevron({ collapsed, className }: { collapsed: boolean; className?: string }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{
        transform: collapsed ? "rotate(180deg)" : "rotate(0deg)",
        transition: "transform 250ms ease-in-out",
      }}
    >
      <polyline points="10 3 5 8 10 13" />
    </svg>
  );
}

/* ── Sub-components ───────────────────────────────────── */

interface NewChatButtonProps {
  onClick: () => void;
}

function NewChatButton({ onClick }: NewChatButtonProps) {
  return (
    <button
      onClick={onClick}
      className="
        group w-full flex items-center justify-center gap-2.5
        px-4 py-3 rounded-xl
        bg-marigold/10 border border-marigold/20
        text-marigold font-heading font-bold text-sm
        hover:bg-marigold/20 hover:border-marigold/40
        active:scale-[0.98]
        transition-all duration-200
        touch-manipulation
      "
    >
      <PlusIcon className="transition-transform duration-300 group-hover:rotate-90" />
      New Chat
    </button>
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
}: {
  chatHistory: ChatSession[];
  activeChatId: string | null;
  onNewChat: () => void;
  onSelectChat: (id: string) => void;
  onDeleteChat: (id: string) => void;
  onClose: () => void;
}) {
  return (
    <>
      {/* Brand header */}
      <div className="shrink-0 px-4 pt-5 pb-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="size-8 rounded-lg bg-marigold flex items-center justify-center">
            <span className="text-ink-deeper font-heading font-extrabold text-sm">B</span>
          </div>
          <span className="font-heading font-bold text-[15px] text-text-ondark tracking-tight">
            BuyWise AI
          </span>
        </div>
        <NewChatButton onClick={() => { onNewChat(); onClose(); }} />
      </div>

      {/* Chat history list */}
      <div className="flex-1 min-h-0 px-2 py-3">
        <p className="px-2 mb-2 text-[11px] font-mono text-text-dim-ondark uppercase tracking-wider">
          Recent chats
        </p>
        <ScrollArea className="h-full">
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
    </>
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
          MOBILE SIDEBAR (slide-in drawer, unchanged)
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
        <SidebarContent {...contentProps} />
      </aside>

      {/* ═══════════════════════════════════════════════════
          DESKTOP SIDEBAR (resizable + collapsible)
          ═══════════════════════════════════════════════════ */}

      <aside
        className="hidden md:flex relative shrink-0"
        style={{
          width: isCollapsed ? 0 : width,
          transition: isDragging ? "none" : "width 200ms ease-in-out",
        }}
      >
        {/* Sidebar content — hidden when collapsed */}
        <div
          className={`
            h-full flex flex-col overflow-hidden
            bg-[#091e1a]/95 backdrop-blur-md border-r border-line-ondark
            ${isCollapsed ? "w-0" : "w-full"}
          `}
        >
          <SidebarContent {...contentProps} />
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

      {/* Desktop collapse/expand toggle — floats at the edge */}
      <button
        onClick={toggleCollapse}
        className={`
          hidden md:flex
          fixed z-30 top-1/2 -translate-y-1/2
          size-7 items-center justify-center
          rounded-full bg-ink-deep border border-line-ondark
          text-text-dim-ondark hover:text-marigold hover:border-marigold/40
          shadow-md transition-all duration-200
          hover:scale-110
        `}
        style={{
          left: isCollapsed ? 4 : width - 4,
          transition: isDragging ? "color 200ms, border-color 200ms" : "all 200ms ease-in-out",
        }}
        aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        <CollapseChevron collapsed={isCollapsed} />
      </button>
    </>
  );
}
