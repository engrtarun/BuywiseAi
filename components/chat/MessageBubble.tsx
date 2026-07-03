"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Message } from "./types";

export function MessageBubble({ message }: { message: Message }) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end w-full">
        <div
          dir="auto"
          className="bg-marigold text-ink-deeper rounded-2xl rounded-br-sm px-4 py-3 text-[14px] sm:text-[15px] leading-relaxed whitespace-pre-wrap break-words shadow-sm max-w-[85%] sm:max-w-[75%] md:max-w-[65%] font-sans font-medium"
        >
          {message.content}
        </div>
      </div>
    );
  }

  // AI Bubble
  return (
    <div className="flex items-end gap-2 w-full max-w-[85%] sm:max-w-[75%] md:max-w-[65%]">
      {/* Avatar */}
      <Avatar className="size-7 sm:size-8 shrink-0">
        <AvatarFallback className="bg-marigold text-ink-deeper font-heading font-bold text-[10px] sm:text-xs">
          B
        </AvatarFallback>
      </Avatar>

      <div
        dir="auto"
        className="bg-white/5 backdrop-blur-sm border border-white/10 text-text-ondark rounded-2xl rounded-bl-sm px-4 py-3 text-[14px] sm:text-[15px] leading-relaxed break-words shadow-sm font-sans w-full min-w-0"
      >
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            p: ({ node, ...props }) => <p className="mb-3 last:mb-0" {...props} />,
            a: ({ node, ...props }) => (
              <a
                className="text-marigold hover:text-marigold/80 hover:underline font-medium transition-colors duration-200"
                target="_blank"
                rel="noopener noreferrer"
                {...props}
              />
            ),
            ul: ({ node, ...props }) => (
              <ul className="list-disc pl-5 mb-3 last:mb-0 space-y-1" {...props} />
            ),
            ol: ({ node, ...props }) => (
              <ol className="list-decimal pl-5 mb-3 last:mb-0 space-y-1" {...props} />
            ),
            li: ({ node, ...props }) => <li className="pl-1" {...props} />,
            h1: ({ node, ...props }) => (
              <h1 className="text-lg font-bold mb-2 mt-4 first:mt-0" {...props} />
            ),
            h2: ({ node, ...props }) => (
              <h2 className="text-base font-bold mb-2 mt-3 first:mt-0" {...props} />
            ),
            h3: ({ node, ...props }) => (
              <h3 className="text-sm font-bold mb-2 mt-3 first:mt-0" {...props} />
            ),
            blockquote: ({ node, ...props }) => (
              <blockquote
                className="border-l-2 border-marigold/50 pl-3 italic text-text-dim-ondark mb-3 last:mb-0"
                {...props}
              />
            ),
            pre: ({ node, ...props }) => (
              <pre
                className="bg-ink-deeper/80 text-text-ondark p-3 rounded-lg overflow-x-auto mb-3 last:mb-0 border border-white/5 text-[13px]"
                {...props}
              />
            ),
            code: ({ node, inline, ...props }: any) =>
              inline ? (
                <code
                  className="bg-ink-deeper/60 text-marigold px-1.5 py-0.5 rounded font-mono text-[13px]"
                  {...props}
                />
              ) : (
                <code className="font-mono text-[13px] bg-transparent p-0" {...props} />
              ),
            table: ({ node, ...props }) => (
              <div className="overflow-x-auto mb-3 last:mb-0">
                <table className="w-full text-left border-collapse" {...props} />
              </div>
            ),
            th: ({ node, ...props }) => (
              <th className="border-b border-white/10 px-3 py-2 font-semibold" {...props} />
            ),
            td: ({ node, ...props }) => (
              <td className="border-b border-white/5 px-3 py-2" {...props} />
            ),
          }}
        >
          {message.content}
        </ReactMarkdown>
      </div>
    </div>
  );
}
