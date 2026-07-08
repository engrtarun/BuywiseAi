"use client";

import React, { useState } from "react";
import { Message, Feedback } from "@/types/chat";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

/* ── Inline SVG Icons ─────────────────────────────────── */

function ThumbUpIcon({ filled, className }: { filled?: boolean; className?: string }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4.667 7.333 7.14 2.39a1.333 1.333 0 0 1 1.194-.724c.736 0 1.333.597 1.333 1.334V5.667h3.047c.39 0 .765.165 1.027.455.262.29.39.678.353 1.067l-.667 7.333a1.333 1.333 0 0 1-1.327 1.145H4.667m0-8.334V14m0-6.667H2.667a1.333 1.333 0 0 0-1.334 1.334V12.667a1.333 1.333 0 0 0 1.334 1.333h2" />
    </svg>
  );
}

function ThumbDownIcon({ filled, className }: { filled?: boolean; className?: string }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ transform: "scaleY(-1)" }}
    >
      <path d="M4.667 7.333 7.14 2.39a1.333 1.333 0 0 1 1.194-.724c.736 0 1.333.597 1.333 1.334V5.667h3.047c.39 0 .765.165 1.027.455.262.29.39.678.353 1.067l-.667 7.333a1.333 1.333 0 0 1-1.327 1.145H4.667m0-8.334V14m0-6.667H2.667a1.333 1.333 0 0 0-1.334 1.334V12.667a1.333 1.333 0 0 0 1.334 1.333h2" />
    </svg>
  );
}

function CopyIcon({ className }: { className?: string }) {
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
      <rect x="5.333" y="5.333" width="9.333" height="9.333" rx="1.333" />
      <path d="M10.667 5.333V2.667A1.333 1.333 0 0 0 9.333 1.333H2.667A1.333 1.333 0 0 0 1.333 2.667v6.666a1.333 1.333 0 0 0 1.334 1.334h2.666" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
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
    >
      <polyline points="13.333 4 6 11.333 2.667 8" />
    </svg>
  );
}

function RegenerateIcon({ className }: { className?: string }) {
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
      <path d="M1.333 2.667v4h4" />
      <path d="M2.34 10a6 6 0 1 0 .54-5.34L1.333 6.667" />
    </svg>
  );
}

function ActionTooltip({ text, children }: { text: string; children: React.ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {children}
      </TooltipTrigger>
      <TooltipContent side="top">{text}</TooltipContent>
    </Tooltip>
  );
}

/* ── Main Component ──────────────────────────────────── */

interface MessageActionsProps {
  message: Message;
  isLastAiMessage: boolean;
  onRegenerate: () => void;
  onFeedback: (id: string, feedback: Feedback) => void;
}

export function MessageActions({ message, isLastAiMessage, onRegenerate, onFeedback }: MessageActionsProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const isCopied = copiedId === message.id;

  const handleCopy = async () => {
    try {
      let copyText = message.content || "";
      
      // Explore Mode pieces
      if (message.exploreIntro || message.exploreDeepDive) {
        copyText = [message.exploreIntro, message.exploreDeepDive].filter(Boolean).join("\n\n");
      }

      // Deep Research pieces
      if (message.deepResearchResults) {
        const dr = message.deepResearchResults;
        const parts = [];
        if (dr.summary) parts.push(dr.summary);
        if (dr.finalVerdict) parts.push("Verdict: " + dr.finalVerdict);
        if (dr.recommendedPickReason) parts.push("Recommendation: " + dr.recommendedPickReason);
        copyText = parts.join("\n\n");
      }

      // Products
      if (message.products && message.products.length > 0) {
        copyText += "\n\nProducts:\n";
        message.products.forEach(p => {
          copyText += `- ${p.name || "Product"} (${p.price}) on ${p.platform}: ${p.link}\n`;
        });
      }

      await navigator.clipboard.writeText(copyText.trim());
      setCopiedId(message.id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleFeedback = (type: "up" | "down") => {
    // Toggle: if already selected, unselect (null)
    const newFeedback = message.feedback === type ? null : type;
    onFeedback(message.id, newFeedback);
  };

  const btnBase =
    "flex items-center justify-center size-8 sm:size-7 rounded-lg transition-all duration-200 touch-manipulation cursor-pointer";

  return (
    <div className="flex items-center gap-0.5 mt-1.5 ml-9 sm:ml-10">
      {/* Thumbs Up */}
      <ActionTooltip text={message.feedback === "up" ? "Thanks for the feedback!" : "Good response"}>
        <button
          onClick={() => handleFeedback("up")}
          className={`${btnBase} ${
            message.feedback === "up"
              ? "text-brand-accent bg-brand-accent/10"
              : "text-muted-foreground hover:text-foreground hover:bg-foreground/10"
          }`}
          aria-label="Good response"
        >
          <ThumbUpIcon filled={message.feedback === "up"} />
        </button>
      </ActionTooltip>

      {/* Thumbs Down */}
      <ActionTooltip text={message.feedback === "down" ? "Thanks for the feedback!" : "Bad response"}>
        <button
          onClick={() => handleFeedback("down")}
          className={`${btnBase} ${
            message.feedback === "down"
              ? "text-destructive bg-destructive/10"
              : "text-muted-foreground hover:text-foreground hover:bg-foreground/10"
          }`}
          aria-label="Bad response"
        >
          <ThumbDownIcon filled={message.feedback === "down"} />
        </button>
      </ActionTooltip>

      {/* Copy */}
      <ActionTooltip text={isCopied ? "Copied!" : "Copy"}>
        <button
          onClick={handleCopy}
          className={`${btnBase} ${
            isCopied
              ? "text-brand-accent bg-brand-accent/10"
              : "text-muted-foreground hover:text-foreground hover:bg-foreground/10"
          }`}
          aria-label="Copy message"
        >
          {isCopied ? <CheckIcon /> : <CopyIcon />}
        </button>
      </ActionTooltip>

      {/* Regenerate — only on last AI message */}
      {isLastAiMessage && (
        <ActionTooltip text="Regenerate response">
          <button
            onClick={onRegenerate}
            className={`${btnBase} text-muted-foreground hover:text-foreground hover:bg-foreground/10`}
            aria-label="Regenerate response"
          >
            <RegenerateIcon className="transition-transform duration-300 hover:rotate-[-180deg]" />
          </button>
        </ActionTooltip>
      )}
    </div>
  );
}
