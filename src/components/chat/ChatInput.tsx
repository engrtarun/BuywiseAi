"use client";

import React, { useRef, useState, useEffect } from "react";
import TextareaAutosize from "react-textarea-autosize";
import { ArrowUp, Square, LogIn, Clock, Bold, Italic, Eye, Plus, Compass, Brain, Sparkles, Shirt } from "lucide-react";
import { QuickAccessMenu } from "./QuickAccessMenu";
import { SoundMuteToggle } from "@/components/shared/SoundMuteToggle";
import { UsageRing } from "@/components/ui/usage-ring";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { ChatMode, Message } from "@/types/chat";
import { usePremium } from "@/contexts/PremiumContext";

const placeholders = [
  "BuyWise anything...",
  "Find best wireless headphones under ₹5,000",
  "Compare top 3 washing machines",
  "Best budget smartphones under ₹15,000",
  "Suggest a gift for a 25-year-old",
  "Compare iPhone vs Samsung flagship",
];

interface ChatInputProps {
  inputText: string;
  setInputText: (text: string) => void;
  onSend: (message: string) => void;
  onStop?: () => void;
  disabled: boolean;
  isGenerating: boolean;
  guestLimitReached?: boolean;
  cooldownUntil?: number | null;
  onLoginClick?: () => void;
  isGuest?: boolean;
  dailyLimitReached?: boolean;
  dailyLimitMessage?: string;
  tokensUsed?: number;
  tokenLimit?: number;
  dailyMessagesRemaining?: number;
  dailyLimit?: number;
  mode?: ChatMode | null;
  isClarifyingActive?: boolean;
  onModeChange?: (mode: ChatMode) => void;
  isModeLocked?: boolean;
  userMessageCount?: number;
  onNewChat?: (mode?: ChatMode) => void;
  messages?: Message[];
}

export function ChatInput({
  inputText,
  setInputText,
  onSend,
  onStop,
  disabled,
  isGenerating,
  guestLimitReached = false,
  cooldownUntil = null,
  onLoginClick,
  isGuest = false,
  dailyLimitReached = false,
  dailyLimitMessage,
  tokensUsed,
  tokenLimit,
  dailyMessagesRemaining,
  dailyLimit,
  mode = "explore",
  isClarifyingActive = false,
  onModeChange,
  isModeLocked = false,
  userMessageCount = 0,
  onNewChat,
  messages = [],
}: ChatInputProps) {
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [isQuickMenuOpen, setIsQuickMenuOpen] = useState(false);
  const plusButtonRef = useRef<HTMLButtonElement>(null);
  const [plusButtonRect, setPlusButtonRect] = useState<DOMRect | null>(null);
  const { openPremium } = usePremium();
  const [showUpgradeToast, setShowUpgradeToast] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // Slash command state
  const [showSlashCommands, setShowSlashCommands] = useState(false);
  const [slashFilter, setSlashFilter] = useState("");
  const [slashSelectedIndex, setSlashSelectedIndex] = useState(0);
  const router = require("next/navigation").useRouter(); // For Quick Buy navigation

  const isDisabled = disabled || dailyLimitReached || isAnalyzing;

  // Rotate placeholder every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % placeholders.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Handle cooldown timer
  const [timeLeft, setTimeLeft] = useState(0);
  useEffect(() => {
    if (!cooldownUntil || cooldownUntil <= Date.now()) {
      Promise.resolve().then(() => {
        setTimeLeft(0);
      });
      return;
    }

    const interval = setInterval(() => {
      const remaining = Math.ceil((cooldownUntil - Date.now()) / 1000);
      if (remaining <= 0) {
        setTimeLeft(0);
        clearInterval(interval);
      } else {
        setTimeLeft(remaining);
      }
    }, 250);

    const initial = Math.ceil((cooldownUntil - Date.now()) / 1000);
    Promise.resolve().then(() => {
      setTimeLeft(initial);
    });

    return () => clearInterval(interval);
  }, [cooldownUntil]);

  const handleSend = () => {
    if (guestLimitReached || dailyLimitReached || isAnalyzing) return;
    if (timeLeft > 0) {
      setShowUpgradeToast(true);
      setTimeout(() => setShowUpgradeToast(false), 5000);
      return;
    }
    const content = inputText.trim();
    if (!content || disabled) return;

    setIsAnalyzing(true);
    onSend(content);
    setInputText("");
    setShowUpgradeToast(false);
    
    setTimeout(() => {
      setIsAnalyzing(false);
    }, 6000);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // 1. History Recall: Up Arrow on empty input
    if (e.key === "ArrowUp" && inputText.length === 0) {
      e.preventDefault();
      const userMsgs = messages.filter((m) => m.role === "user");
      if (userMsgs.length > 0) {
        const lastMsg = userMsgs[userMsgs.length - 1];
        setInputText(lastMsg.content);
        // Move cursor to end
        setTimeout(() => {
          if (inputRef.current) {
            inputRef.current.selectionStart = inputRef.current.value.length;
            inputRef.current.selectionEnd = inputRef.current.value.length;
          }
        }, 0);
      }
      return;
    }

    // 2. Slash Commands Navigation
    if (showSlashCommands) {
      if (e.key === "Escape") {
        e.preventDefault();
        setShowSlashCommands(false);
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSlashSelectedIndex((prev) => (prev + 1) % availableCommands.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSlashSelectedIndex((prev) => (prev - 1 + availableCommands.length) % availableCommands.length);
        return;
      }
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        if (availableCommands[slashSelectedIndex]) {
          executeSlashCommand(availableCommands[slashSelectedIndex]);
        }
        return;
      }
    }

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setInputText(val);

    if (val === "/") {
      setShowSlashCommands(true);
      setSlashFilter("");
      setSlashSelectedIndex(0);
    } else if (val.startsWith("/") && showSlashCommands) {
      setSlashFilter(val.slice(1).toLowerCase());
      setSlashSelectedIndex(0);
    } else {
      setShowSlashCommands(false);
    }
  };

  const slashCommandsList = [
    { id: "explore", label: "Explore Mode", icon: Compass, description: "Discover and browse" },
    { id: "deep_research", label: "Deep Research Mode", icon: Brain, description: "In-depth analysis" },
    { id: "quick_buy", label: "Quick Buy", icon: Sparkles, description: "Fast checkout" },
    { id: "virtual_wardrobe", label: "Virtual Wardrobe", icon: Shirt, description: "Mix & match" }
  ];

  const availableCommands = slashCommandsList.filter(cmd => 
    cmd.label.toLowerCase().includes(slashFilter) || cmd.id.includes(slashFilter)
  );

  const executeSlashCommand = (cmd: typeof slashCommandsList[0]) => {
    setShowSlashCommands(false);
    setInputText("");
    if (cmd.id === "explore" || cmd.id === "deep_research") {
      if (onModeChange) onModeChange(cmd.id as ChatMode);
    } else if (cmd.id === "quick_buy") {
      router.push("/quick-buy");
    } else if (cmd.id === "virtual_wardrobe") {
      router.push("/virtual-wardrobe");
    }
  };

  const applyFormatting = (prefix: string, suffix: string = prefix) => {
    if (!inputRef.current) return;
    const el = inputRef.current;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const text = el.value;

    const before = text.substring(0, start);
    const selected = text.substring(start, end);
    const after = text.substring(end);

    const newText = before + prefix + selected + suffix + after;
    setInputText(newText);

    // Set cursor position after React re-renders
    setTimeout(() => {
      el.focus();
      if (selected.length > 0) {
        el.setSelectionRange(start, start + prefix.length + selected.length + suffix.length);
      } else {
        el.setSelectionRange(start + prefix.length, start + prefix.length);
      }
    }, 0);
  };

  if (guestLimitReached || dailyLimitReached) {
    return (
      <div className="shrink-0 bg-bg-main border-t border-border-light px-3 pt-3 pb-[calc(env(safe-area-inset-bottom,0px)+12px)] sm:px-4 sm:py-4 z-20 transition-opacity duration-300">
        <div className="w-full max-w-3xl mx-auto">
          {guestLimitReached ? (
            <button
              onClick={onLoginClick}
              className="
                w-full flex items-center justify-between gap-3 px-4 py-3.5 
                rounded-2xl bg-white/[0.03] border border-marigold/30 
                text-text-secondary text-[15px] cursor-pointer hover:bg-white/[0.05] 
                transition-colors group
              "
            >
              <span className="font-sans">Log in to continue chatting...</span>
              <div className="size-8 rounded-full bg-brand-accent flex items-center justify-center shrink-0 text-ink-deeper shadow-md shadow-marigold/20 group-hover:scale-105 transition-transform">
                <LogIn className="size-4" />
              </div>
            </button>
          ) : (
            <div className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl bg-marigold/10 border border-marigold/20 text-marigold text-[15px]">
              <Clock className="size-4" />
              <span className="font-sans font-medium">{dailyLimitMessage ?? "You've reached your daily limit of 25 messages. Please come back tomorrow!"}</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (userMessageCount >= 50) {
    return (
      <div className="shrink-0 bg-bg-main border-t border-border-light px-3 pt-3 pb-[calc(env(safe-area-inset-bottom,0px)+12px)] sm:px-4 sm:py-6 z-20 transition-opacity duration-300">
        <div className="w-full max-w-md mx-auto flex flex-col items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <button
            onClick={() => onNewChat && onNewChat(mode || "explore")}
            className="
              relative w-full py-4 px-6 rounded-2xl font-bold text-lg tracking-wide
              text-ink-deeper bg-gradient-to-b from-marigold to-[#e5a00d]
              active:translate-y-1 active:shadow-[0_0px_0_0_#b37b00]
              shadow-[0_6px_0_0_#b37b00,0_12px_24px_-4px_rgba(252,176,14,0.4)]
              transition-all duration-100 ease-out flex items-center justify-center gap-3
              cursor-pointer hover:brightness-110
            "
          >
            <Plus className="size-6 stroke-[3]" />
            START NEW CHAT
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`shrink-0 bg-bg-main border-t border-border-light px-3 pt-3 pb-[calc(env(safe-area-inset-bottom,0px)+12px)] sm:px-4 sm:py-4 z-20 transition-opacity duration-300 ${guestLimitReached ? "opacity-60" : ""}`}>
      <div className="w-full max-w-3xl mx-auto flex flex-col gap-2 relative">
      
        {/* Smart UX Trigger Toast */}
        {showUpgradeToast && (
          <div className="absolute bottom-[calc(100%+12px)] left-0 right-0 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300 pointer-events-none">
            <div className="mx-auto w-fit bg-[#1a1b26]/90 backdrop-blur-md border border-purple-500/50 shadow-[0_0_20px_rgba(168,85,247,0.3)] rounded-2xl px-5 py-3 flex flex-col sm:flex-row items-center gap-3 sm:gap-4 pointer-events-auto">
              <span className="text-white text-[13px] font-medium text-center sm:text-left">
                Tired of waiting? Get Pro for Instant Responses!
              </span>
              <button
                onClick={() => {
                  setShowUpgradeToast(false);
                  openPremium();
                }}
                className="bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:brightness-110 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-[0_0_15px_rgba(168,85,247,0.4)] whitespace-nowrap active:scale-95"
              >
                Upgrade Now
              </button>
            </div>
          </div>
        )}

        {/* Stop Generating button — shown above input while AI is responding */}
        {isGenerating && onStop && (
          <button
            onClick={onStop}
            className="
              self-center flex items-center gap-2 px-4 py-2 rounded-full
              bg-bg-input border border-border-light text-text-primary-light text-[13px] font-sans
              hover:border-brand-accent/50 hover:text-brand-accent active:scale-[0.97]
              transition-all duration-200 touch-manipulation shadow-sm cursor-pointer
              animate-in fade-in slide-in-from-bottom-1 duration-200
            "
          >
            <Square className="size-3.5 fill-current" />
            Stop generating
          </button>
        )}

        <div className="flex flex-col bg-bg-input rounded-3xl border border-border-light focus-within:border-brand-accent/50 transition-colors shadow-sm overflow-hidden">
          {/* Toolbar with Mode Badge and Formatting Options */}
          <div className="flex items-center justify-between px-3 py-1.5 border-b border-border-light bg-black/15 select-none">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-xs font-semibold text-text-primary-light animate-in fade-in duration-200">
              {mode === "deep_research" ? (
                <>
                  <Brain className="size-3 text-marigold" />
                  <span className="text-text-secondary">Deep Research</span>
                </>
              ) : (
                <>
                  <Compass className="size-3 text-marigold" />
                  <span className="text-text-secondary">Explore Mode</span>
                </>
              )}
            </div>

            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => applyFormatting("**")}
                    className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary-light hover:bg-white/10 transition-colors active:scale-95 cursor-pointer"
                    aria-label="Bold (Ctrl+B)"
                  >
                    <Bold className="size-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top">Bold (Ctrl+B)</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => applyFormatting("*")}
                    className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary-light hover:bg-white/10 transition-colors active:scale-95 cursor-pointer"
                    aria-label="Italic (Ctrl+I)"
                  >
                    <Italic className="size-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top">Italic (Ctrl+I)</TooltipContent>
              </Tooltip>
            </div>
          </div>

          <div className="flex items-end gap-2 p-1 pl-2 pr-1.5 pb-1.5">
            {/* Quick Actions + Button */}
            <button
              ref={plusButtonRef}
              disabled={isDisabled}
              onClick={() => {
                if (plusButtonRef.current) {
                  setPlusButtonRect(plusButtonRef.current.getBoundingClientRect());
                }
                setIsQuickMenuOpen(!isQuickMenuOpen);
              }}
              className={`flex items-center justify-center size-10 shrink-0 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-text-secondary hover:text-text-primary-light self-end mb-[2px] ${isDisabled ? "opacity-40 cursor-not-allowed" : ""}`}
              aria-label="Quick Actions"
              data-tour-id="mode-selector"
            >
              <Plus className={`size-5 transition-transform duration-200 ${isQuickMenuOpen ? 'rotate-45' : 'rotate-0'}`} />
            </button>
            <QuickAccessMenu
              isOpen={isQuickMenuOpen}
              onClose={() => setIsQuickMenuOpen(false)}
              anchorRect={plusButtonRect}
              selectedMode={mode || "explore"}
              onModeChange={onModeChange || (() => { })}
              isModeLocked={!!isModeLocked}
            />

            <div className="relative flex-1 flex min-h-[44px] sm:min-h-[48px]" data-tour-id="tour-chat-input">
              {/* Slash Commands Popover */}
              {showSlashCommands && availableCommands.length > 0 && (
                <div className="absolute bottom-full left-0 mb-2 w-64 bg-[#1a1b26]/95 backdrop-blur-md border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200">
                  <div className="px-3 py-2 border-b border-white/10 bg-black/20">
                    <span className="text-[10px] font-sans font-bold text-text-secondary uppercase tracking-wider">Quick Actions</span>
                  </div>
                  <div className="flex flex-col py-1">
                    {availableCommands.map((cmd, idx) => {
                      const Icon = cmd.icon;
                      return (
                        <button
                          key={cmd.id}
                          onClick={() => executeSlashCommand(cmd)}
                          className={`flex items-center gap-3 px-3 py-2 text-left w-full transition-colors ${idx === slashSelectedIndex ? "bg-white/10" : "hover:bg-white/5"}`}
                        >
                          <Icon className={`size-4 ${idx === slashSelectedIndex ? "text-marigold" : "text-text-secondary"}`} />
                          <div className="flex flex-col">
                            <span className={`text-[13px] font-sans font-medium ${idx === slashSelectedIndex ? "text-text-primary-light" : "text-text-primary-light/80"}`}>{cmd.label}</span>
                            <span className="text-[10px] text-text-secondary">{cmd.description}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Custom Animated Placeholder */}
              {!inputText && (
                <div className="absolute inset-0 pointer-events-none px-4 flex items-center overflow-hidden">
                  {isClarifyingActive ? (
                    <span className="absolute left-4 right-4 text-[15px] text-text-secondary font-sans truncate opacity-100">
                      Or reply directly...
                    </span>
                  ) : placeholders.map((text, i) => (
                    <span
                      key={i}
                      className={`
                      absolute left-4 right-4 text-[15px] text-text-secondary font-sans truncate
                      transition-all duration-500 ease-in-out
                      ${i === placeholderIndex
                          ? "opacity-100 translate-y-0"
                          : i === (placeholderIndex - 1 + placeholders.length) % placeholders.length
                            ? "opacity-0 -translate-y-3"
                            : "opacity-0 translate-y-3"
                        }
                    `}
                    >
                      {text}
                    </span>
                  ))}
                </div>
              )}

              {/* AI Deep Analysis Loader Overlay */}
              {isAnalyzing && (
                <div className="absolute inset-0 z-20 flex items-center px-4 bg-bg-input/90 backdrop-blur-sm rounded-lg overflow-hidden animate-in fade-in duration-300">
                  <div className="flex items-center gap-3">
                    <div className="relative flex items-center justify-center size-6">
                      <div className="absolute inset-0 rounded-full border-2 border-brand-accent/20 border-t-brand-accent animate-spin" />
                      <Brain className="size-3.5 text-brand-accent animate-pulse" />
                    </div>
                    <span className="text-[14px] font-medium font-sans text-brand-accent tracking-wide animate-pulse">
                      AI deep analysis in progress...
                    </span>
                  </div>
                </div>
              )}

              <TextareaAutosize
                ref={inputRef}
                dir="auto"
                value={inputText}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder={dailyLimitReached ? (dailyLimitMessage ?? "Daily limit reached — resets at 12:00 AM") : ""}
                minRows={1}
                maxRows={5}
                disabled={guestLimitReached || dailyLimitReached}
                className={`w-full bg-transparent px-4 py-3 sm:py-3.5 text-[15px] text-text-primary-light outline-none font-sans resize-none z-10 self-center scrollbar-hide [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] ${(guestLimitReached || dailyLimitReached) ? "cursor-not-allowed placeholder:text-text-destructive/80" : ""}`}
              />
            </div>



            <button
              type="button"
              onTouchStart={(e) => {
                e.preventDefault();
                if (!isDisabled) handleSend();
              }}
              onClick={(e) => {
                e.preventDefault();
                if (!isDisabled) handleSend();
              }}
              aria-label="Send message"
              disabled={isDisabled || guestLimitReached || timeLeft > 0}
              className={`flex items-center justify-center size-10 shrink-0 rounded-full bg-brand-accent text-white transition-all duration-200 shadow-md touch-manipulation mb-[2px] ${!inputText.trim() || isDisabled || guestLimitReached || timeLeft > 0 ? "opacity-40 cursor-not-allowed" : "hover:scale-105 hover:brightness-110 active:scale-95 cursor-pointer"
                }`}
            >
              {timeLeft > 0 ? (
                <span className="text-sm font-bold font-mono tracking-tighter">
                  {timeLeft}s
                </span>
              ) : (
                <ArrowUp className="size-5 stroke-[2.5]" />
              )}
            </button>
          </div>
        </div>

        {/* AI Disclaimer Text Element */}
        <p className="text-center text-xs text-text-secondary/70 mt-1 px-4 selection:bg-transparent tracking-wide">
          BuywiseAi is an AI and can make mistakes. Please double-check product suggestions.
        </p>
      </div>
    </div>
  );
}
