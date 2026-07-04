"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Message, Feedback, Product } from "./types";
import { MessageActions } from "./MessageActions";
import { ProductCard } from "./ProductCard";
import { ProductCarousel } from "./ProductCarousel";

/** Detect if raw markdown contains a GFM table */
function hasTable(content: string): boolean {
  return /\|.+\|/.test(content) && /\|[-:]+\|/.test(content);
}

/* ── Styled Markdown component overrides ──────────────── */

const markdownComponents = {
  p: ({ node, ...props }: any) => <p className="mb-3 last:mb-0" {...props} />,
  a: ({ node, ...props }: any) => (
    <a
      className="text-brand-accent hover:text-brand-accent/80 hover:underline font-medium transition-colors duration-200"
      target="_blank"
      rel="noopener noreferrer"
      {...props}
    />
  ),
  ul: ({ node, ...props }: any) => (
    <ul className="list-disc pl-5 mb-3 last:mb-0 space-y-1" {...props} />
  ),
  ol: ({ node, ...props }: any) => (
    <ol className="list-decimal pl-5 mb-3 last:mb-0 space-y-1" {...props} />
  ),
  li: ({ node, ...props }: any) => <li className="pl-1" {...props} />,
  h1: ({ node, ...props }: any) => (
    <h1 className="text-lg font-bold mb-2 mt-4 first:mt-0" {...props} />
  ),
  h2: ({ node, ...props }: any) => (
    <h2 className="text-base font-bold mb-2 mt-3 first:mt-0" {...props} />
  ),
  h3: ({ node, ...props }: any) => (
    <h3 className="text-sm font-bold mb-2 mt-3 first:mt-0" {...props} />
  ),
  blockquote: ({ node, ...props }: any) => (
    <blockquote
      className="border-l-2 border-brand-accent/50 pl-3 italic text-text-secondary mb-3 last:mb-0"
      {...props}
    />
  ),
  pre: ({ node, ...props }: any) => (
    <pre
      className="bg-bg-input text-text-primary-light p-3 rounded-lg overflow-x-auto mb-3 last:mb-0 border border-border-light text-[13px] shadow-sm"
      {...props}
    />
  ),
  code: ({ node, inline, ...props }: any) =>
    inline ? (
      <code
        className="bg-[#2f2f2f] text-brand-accent px-1.5 py-0.5 rounded font-mono text-[13px]"
        {...props}
      />
    ) : (
      <code className="font-mono text-[13px] bg-transparent p-0" {...props} />
    ),

  /* ── Premium Comparison Table Styling ────────────── */
  table: ({ node, ...props }: any) => (
    <div className="relative mb-3 last:mb-0 -mx-1 group/scroll">
      <div className="overflow-x-auto rounded-xl border border-border-light scrollbar-thin scrollbar-track-transparent scrollbar-thumb-black/10">
        <table
          className="w-full text-left text-[13px] sm:text-[14px] border-collapse"
          {...props}
        />
      </div>
      {/* Scroll hint gradient on the right edge */}
      <div className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-black/[0.02] to-transparent pointer-events-none rounded-r-xl opacity-0 group-hover/scroll:opacity-100 transition-opacity" />
    </div>
  ),
  thead: ({ node, ...props }: any) => (
    <thead className="bg-brand-accent/[0.08] border-b border-brand-accent/20" {...props} />
  ),
  tbody: ({ node, ...props }: any) => <tbody {...props} />,
  tr: ({ node, ...props }: any) => (
    <tr
      className="border-b border-border-light last:border-b-0 odd:bg-black/[0.015] transition-colors hover:bg-black/[0.04]"
      {...props}
    />
  ),
  th: ({ node, ...props }: any) => (
    <th
      className="px-3.5 py-2.5 font-semibold text-brand-accent text-[12px] sm:text-[13px] uppercase tracking-wider whitespace-nowrap border-r border-border-light last:border-r-0"
      {...props}
    />
  ),
  td: ({ node, ...props }: any) => (
    <td
      className="px-3.5 py-2.5 text-text-primary-light border-r border-border-light last:border-r-0 whitespace-nowrap"
      {...props}
    />
  ),
};

/* ── MessageBubble ────────────────────────────────────── */

interface MessageBubbleProps {
  message: Message;
  isLastAiMessage?: boolean;
  onRegenerate?: () => void;
  onFeedback?: (id: string, feedback: Feedback) => void;
}

export function MessageBubble({ message, isLastAiMessage = false, onRegenerate, onFeedback }: MessageBubbleProps) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end w-full">
        <div
          dir="auto"
          className="bg-user-bubble-bg text-user-bubble-text rounded-2xl rounded-br-sm px-4 py-3 text-[14px] sm:text-[15px] leading-relaxed whitespace-pre-wrap break-words shadow-sm max-w-[85%] sm:max-w-[75%] md:max-w-[65%] font-sans font-medium"
        >
          {message.content}
        </div>
      </div>
    );
  }

  const containsTable = hasTable(message.content);
  const hasProducts = message.products && message.products.length > 0;
  const isSingleProduct = hasProducts && message.products?.length === 1;

  // AI Bubble
  return (
    <div
      className={
        containsTable || hasProducts
          ? "w-full max-w-[95%] sm:max-w-[90%] md:max-w-[85%]"
          : "w-full max-w-[85%] sm:max-w-[75%] md:max-w-[65%]"
      }
    >
      <div className="flex items-end gap-2 w-full">
        {/* Avatar */}
        <Avatar className="size-7 sm:size-8 shrink-0">
          <AvatarFallback className="bg-marigold text-ink-deeper font-heading font-bold text-[10px] sm:text-xs">
            B
          </AvatarFallback>
        </Avatar>

        <div className="flex flex-col gap-2 w-full min-w-0">
          {message.content && (
            <div
              dir="auto"
              style={{
                backgroundColor: "var(--ai-bubble-bg)",
                color: "var(--ai-text)",
                padding: "var(--ai-bubble-padding)",
                borderRadius: "var(--ai-bubble-radius)",
                borderBottomLeftRadius: "var(--ai-bubble-radius-bl, var(--ai-bubble-radius))",
                boxShadow: "var(--ai-bubble-shadow)",
              }}
              className="text-[14px] sm:text-[15px] leading-relaxed break-words font-sans w-full min-w-0 inline-block"
            >
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={markdownComponents}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          )}

          {/* Product Cards / Carousel */}
          {hasProducts && (
            <div className={`${!message.content ? "ml-[-8px] sm:ml-[-12px]" : ""}`}>
              {isSingleProduct ? (
                <div className="w-full sm:max-w-[80%] md:max-w-[70%]">
                  <ProductCard product={message.products![0]} />
                </div>
              ) : (
                <ProductCarousel products={message.products!} />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Action row — only for AI messages */}
      {onFeedback && onRegenerate && (
        <MessageActions
          message={message}
          isLastAiMessage={isLastAiMessage}
          onRegenerate={onRegenerate}
          onFeedback={onFeedback}
        />
      )}
    </div>
  );
}
