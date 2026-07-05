"use client";

import React, { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Message, Feedback } from "@/types/chat";
import { Product } from "@/types/product";
import { MessageActions } from "./MessageActions";
import { ProductCard } from "./ProductCard";
import { ProductCarousel } from "./ProductCarousel";
import { SpoilerText } from "./SpoilerText";
import { ClarifyingQuestionCard } from "./ClarifyingQuestionCard";
import { ChatMode } from "@/types/chat";
import { Brain, Pencil, ArrowRight, ChevronRight } from "lucide-react";

function getCuratedProductImage(productName: string): string {
  const name = productName.toLowerCase();
  if (name.includes("laptop") || name.includes("macbook") || name.includes("notebook")) {
    return "https://images.unsplash.com/photo-1496181130204-7552cc14f1d0?auto=format&fit=crop&w=500&q=80";
  }
  if (name.includes("phone") || name.includes("pixel") || name.includes("oneplus") || name.includes("smartphone") || name.includes("iphone")) {
    return "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=500&q=80";
  }
  if (name.includes("shirt") || name.includes("tee") || name.includes("t-shirt") || name.includes("clothing")) {
    return "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=500&q=80";
  }
  if (name.includes("shoe") || name.includes("sneaker") || name.includes("boot")) {
    return "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=500&q=80";
  }
  if (name.includes("watch") || name.includes("smartwatch")) {
    return "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=500&q=80";
  }
  if (name.includes("jacket") || name.includes("coat") || name.includes("hoodie")) {
    return "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=500&q=80";
  }
  if (name.includes("headphone") || name.includes("earbud")) {
    return "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=500&q=80";
  }
  return "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=500&q=80";
}

/** Detect if raw markdown contains a GFM table */
function hasTable(content: string): boolean {
  return /\|.+\|/.test(content) && /\|[-:]+\|/.test(content);
}

/* ── Styled Markdown component overrides ──────────────── */

/* ── Styled Markdown component overrides ──────────────── */

interface MarkdownProps {
  children?: React.ReactNode;
  node?: unknown;
  inline?: boolean;
  'data-spoiler'?: string;
  className?: string;
  target?: string;
  rel?: string;
  href?: string;
}

const markdownComponents = {
  span: ({ 'data-spoiler': isSpoiler, children, ...props }: MarkdownProps) => {
    if (isSpoiler === "true") {
      return <SpoilerText>{children}</SpoilerText>;
    }
    return <span {...props}>{children}</span>;
  },
  p: ({ ...props }: MarkdownProps) => <p className="mb-3 last:mb-0" {...props} />,
  a: ({ ...props }: MarkdownProps) => (
    <a
      className="text-brand-accent hover:text-brand-accent/80 hover:underline font-medium transition-colors duration-200"
      target="_blank"
      rel="noopener noreferrer"
      {...props}
    />
  ),
  ul: ({ ...props }: MarkdownProps) => (
    <ul className="list-disc pl-5 mb-3 last:mb-0 space-y-1" {...props} />
  ),
  ol: ({ ...props }: MarkdownProps) => (
    <ol className="list-decimal pl-5 mb-3 last:mb-0 space-y-1" {...props} />
  ),
  li: ({ ...props }: MarkdownProps) => <li className="pl-1" {...props} />,
  h1: ({ ...props }: MarkdownProps) => (
    <h1 className="text-lg font-bold mb-2 mt-4 first:mt-0" {...props} />
  ),
  h2: ({ ...props }: MarkdownProps) => (
    <h2 className="text-base font-bold mb-2 mt-3 first:mt-0" {...props} />
  ),
  h3: ({ ...props }: MarkdownProps) => (
    <h3 className="text-sm font-bold mb-2 mt-3 first:mt-0" {...props} />
  ),
  blockquote: ({ ...props }: MarkdownProps) => (
    <blockquote
      className="border-l-2 border-brand-accent/50 pl-3 italic text-text-secondary mb-3 last:mb-0"
      {...props}
    />
  ),
  pre: ({ ...props }: MarkdownProps) => (
    <pre
      className="bg-bg-input text-text-primary-light p-3 rounded-lg overflow-x-auto mb-3 last:mb-0 border border-border-light text-[13px] shadow-sm"
      {...props}
    />
  ),
  code: ({ inline, ...props }: MarkdownProps) =>
    inline ? (
      <code
        className="bg-[#2f2f2f] text-brand-accent px-1.5 py-0.5 rounded font-mono text-[13px]"
        {...props}
      />
    ) : (
      <code className="font-mono text-[13px] bg-transparent p-0" {...props} />
    ),

  /* ── Premium Comparison Table Styling ────────────── */
  table: ({ ...props }: MarkdownProps) => (
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
  thead: ({ ...props }: MarkdownProps) => (
    <thead className="bg-brand-accent/[0.08] border-b border-brand-accent/20" {...props} />
  ),
  tbody: ({ ...props }: MarkdownProps) => <tbody {...props} />,
  tr: ({ ...props }: MarkdownProps) => (
    <tr
      className="border-b border-border-light last:border-b-0 odd:bg-black/[0.015] transition-colors hover:bg-black/[0.04]"
      {...props}
    />
  ),
  th: ({ ...props }: MarkdownProps) => (
    <th
      className="px-3.5 py-2.5 font-semibold text-brand-accent text-[12px] sm:text-[13px] uppercase tracking-wider whitespace-nowrap border-r border-border-light last:border-r-0"
      {...props}
    />
  ),
  td: ({ ...props }: MarkdownProps) => (
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
  onSend?: (message: string) => void;
  onNewChat?: (mode?: ChatMode) => void;
  setInputText?: (text: string) => void;
}

export function MessageBubble({ message, isLastAiMessage = false, onRegenerate, onFeedback, onSend, onNewChat, setInputText }: MessageBubbleProps) {
  // Local states for custom Questionnaire Card
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customText, setCustomText] = useState("");
  const [hasAnswered, setHasAnswered] = useState(false);

  // Parser Middleware inside component:
  let isQuestionnaire = false;
  let questionnaireThought = "";
  let questionnaireQuestion = "";
  let questionnaireOptions: string[] = [];
  let questionnaireAllowSkip = true;

  let isExploreCarousel = false;
  let exploreHeadline = "";
  let exploreProductsList: Product[] = [];

  try {
    const rawContent = message.content || "";
    const cleaned = rawContent.replace(/^```(?:json)?\s*/i, "").replace(/```$/, "").trim();
    if (cleaned.startsWith("{") && cleaned.endsWith("}")) {
      const parsed = JSON.parse(cleaned);
      if (parsed && typeof parsed === "object") {
        if (parsed.ui_type === "questionnaire") {
          isQuestionnaire = true;
          questionnaireThought = parsed.thought || "";
          questionnaireQuestion = parsed.question || "";
          questionnaireOptions = parsed.options || [];
          questionnaireAllowSkip = parsed.allow_skip !== false;
        } else if (parsed.ui_type === "explore_carousel") {
          isExploreCarousel = true;
          exploreHeadline = parsed.headline || "";
          const items = Array.isArray(parsed.products) ? parsed.products : [];
          exploreProductsList = items.map((p: any) => ({
            id: String(p.id || Math.random()),
            name: String(p.name || "Unknown Product"),
            price: String(p.price || "₹0"),
            rating: typeof p.rating === "number" ? p.rating : 4.0,
            reviewCount: String(p.reviewCount || "42"),
            description: String(p.description || "Recommended product matching your request."),
            platform: p.platform === "Flipkart" ? "Flipkart" : "Amazon",
            image: p.image && !p.image.includes("placeholder.png") ? String(p.image) : getCuratedProductImage(p.name || ""),
            link: String(p.link || "https://amazon.in"),
          }));
        }
      }
    }
  } catch (e) {
    // Non-JSON content
  }

  // Fallback to parsed properties if raw JSON wasn't matched/parsed
  if (!isQuestionnaire && message.clarifyingQuestion) {
    isQuestionnaire = true;
    questionnaireThought = message.clarifyingQuestion.acknowledgement || "";
    questionnaireQuestion = message.clarifyingQuestion.question || "";
    questionnaireOptions = message.clarifyingQuestion.options || [];
    questionnaireAllowSkip = message.clarifyingQuestion.allow_skip;
  }

  if (!isExploreCarousel && message.products && message.products.length > 0 && !message.deepResearchResults && !message.searchTag) {
    isExploreCarousel = true;
    exploreHeadline = message.content;
    exploreProductsList = message.products.map(p => ({
      ...p,
      image: p.image && !p.image.includes("placeholder.png") ? p.image : getCuratedProductImage(p.name || "")
    }));
  }

  const isInteractionDisabled = !isLastAiMessage || hasAnswered;

  const handleOptionClick = (option: string) => {
    if (isInteractionDisabled) return;
    setHasAnswered(true);
    setInputText?.(option);
    onSend?.(option);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isInteractionDisabled || !customText.trim()) return;
    setHasAnswered(true);
    setInputText?.(customText.trim());
    onSend?.(customText.trim());
  };

  const handleSkip = () => {
    if (isInteractionDisabled) return;
    setHasAnswered(true);
    setInputText?.("Skip");
    onSend?.("Skip");
  };

  // Lazy loading state for Deep Research recommendations:
  const dr = message.deepResearchResults;
  const hasDrQueries = !!(dr && (dr.primaryQuery || (dr.backupQueries && dr.backupQueries.length > 0)));
  const isDrAlreadyLoaded = !!(message.deepResearchResults?.primaryProduct || (message.deepResearchResults?.backupProducts && message.deepResearchResults.backupProducts.length > 0));

  const [primaryProduct, setPrimaryProduct] = useState<Product | undefined>(message.deepResearchResults?.primaryProduct);
  const [backupProducts, setBackupProducts] = useState<Product[]>(message.deepResearchResults?.backupProducts || []);
  const [loadingDeepResearch, setLoadingDeepResearch] = useState(hasDrQueries && !isDrAlreadyLoaded);

  // Lazy loading state for Explore Mode:
  const hasSearchTag = !!message.searchTag;
  const isExploreAlreadyLoaded = !!(message.products && message.products.length > 0);

  const [exploreProducts, setExploreProducts] = useState<Product[]>(message.products || []);
  const [loadingExplore, setLoadingExplore] = useState(hasSearchTag && !isExploreAlreadyLoaded);

  // Fetch Deep Research products lazily
  useEffect(() => {
    const activeDr = message.deepResearchResults;
    if (activeDr && (activeDr.primaryQuery || (activeDr.backupQueries && activeDr.backupQueries.length > 0))) {
      // If already resolved, do not fetch again
      if (primaryProduct || backupProducts.length > 0) return;

      let isMounted = true;

      const fetchProducts = async () => {
        let pProd: Product | undefined = undefined;
        const bProds: Product[] = [];

        try {
          if (activeDr.primaryQuery) {
            const res = await fetch(`/api/quick-buy?q=${encodeURIComponent(activeDr.primaryQuery)}`);
            if (res.ok) {
              const pData = await res.json();
              if (pData.success && pData.data && pData.data.length > 0) {
                pProd = pData.data[0];
              }
            }
          }

          if (activeDr.backupQueries && activeDr.backupQueries.length > 0) {
            const promises = activeDr.backupQueries.map(async (q) => {
              try {
                const res = await fetch(`/api/quick-buy?q=${encodeURIComponent(q)}`);
                if (res.ok) {
                  const pData = await res.json();
                  if (pData.success && pData.data && pData.data.length > 0) {
                    return pData.data[0];
                  }
                }
              } catch (e) {
                console.error("Failed to fetch backup product:", q, e);
              }
              return null;
            });
            const resolved = await Promise.all(promises);
            resolved.forEach((item) => {
              if (item) bProds.push(item);
            });
          }

          if (isMounted) {
            setPrimaryProduct(pProd);
            setBackupProducts(bProds);
          }
        } catch (err) {
          console.error("Failed to lazy load products:", err);
        } finally {
          if (isMounted) {
            setLoadingDeepResearch(false);
          }
        }
      };

      fetchProducts();

      return () => {
        isMounted = false;
      };
    }
  }, [message.content, message.deepResearchResults, primaryProduct, backupProducts.length]);

  // Fetch Explore Mode products lazily
  useEffect(() => {
    const searchTag = message.searchTag;
    if (searchTag) {
      if (exploreProducts.length > 0) return;

      let isMounted = true;

      const fetchExplore = async () => {
        try {
          const res = await fetch(`/api/quick-buy?q=${encodeURIComponent(searchTag)}`);
          if (res.ok) {
            const pData = await res.json();
            if (pData.success && pData.data) {
              if (isMounted) {
                setExploreProducts(pData.data);
              }
            }
          }
        } catch (err) {
          console.error("Failed to lazy load explore products:", err);
        } finally {
          if (isMounted) {
            setLoadingExplore(false);
          }
        }
      };

      fetchExplore();

      return () => {
        isMounted = false;
      };
    }
  }, [message.content, message.searchTag, exploreProducts.length]);

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
  
  // Pre-process for spoiler syntax ||text||
  const processedContent = message.content.replace(/\|\|(.*?)\|\|/g, '<span data-spoiler="true">$1</span>');

  // AI Bubble
  return (
    <div
      className={
        containsTable || hasProducts || message.searchTag || message.deepResearchResults || isExploreCarousel
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
          {/* Default AI Bubble (Standard markdown prose) */}
          {!isQuestionnaire && !isExploreCarousel && message.content && (
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
                rehypePlugins={[rehypeRaw]}
                components={markdownComponents}
              >
                {processedContent}
              </ReactMarkdown>
            </div>
          )}

          {/* Case Questionnaire Rendering (Claude-like design) */}
          {isQuestionnaire && (
            <div className="flex flex-col gap-3 w-full animate-in fade-in duration-300">
              {/* Thought process block */}
              {questionnaireThought && (
                <div className="flex flex-col gap-1.5 text-text-dim-ondark mb-2 pl-1">
                  <div className="flex items-center gap-1.5 text-xs font-mono select-none uppercase tracking-wider font-semibold text-text-secondary">
                    <Brain className="size-3.5 text-marigold animate-pulse" /> Thought Process
                  </div>
                  <p className="text-[13px] sm:text-[14px] font-sans italic text-text-secondary pl-4 border-l border-white/10 leading-relaxed">
                    {questionnaireThought}
                  </p>
                </div>
              )}

              {/* Questionnaire Card (Claude style) */}
              <div className="w-full max-w-lg bg-[#222222]/90 border border-white/10 rounded-2xl p-4 sm:p-5 flex flex-col gap-4 shadow-xl backdrop-blur-md">
                <div className="flex justify-between items-center border-b border-white/5 pb-2.5">
                  <h4 className="text-[14px] sm:text-[15px] font-sans font-semibold text-text-primary-light leading-snug">
                    {questionnaireQuestion}
                  </h4>
                </div>

                <div className="flex flex-col gap-2">
                  {questionnaireOptions.map((opt, idx) => (
                    <button
                      key={opt}
                      type="button"
                      disabled={isInteractionDisabled}
                      onClick={() => handleOptionClick(opt)}
                      className={`
                        flex items-center justify-between w-full p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]
                        transition-all duration-200 text-left group
                        ${isInteractionDisabled 
                          ? "opacity-50 cursor-not-allowed" 
                          : "cursor-pointer hover:bg-white/[0.08] hover:border-marigold/40 active:scale-[0.99]"}
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`
                          flex items-center justify-center size-6 rounded-lg bg-white/5 border border-white/10 text-xs font-mono font-bold text-text-secondary
                          ${!isInteractionDisabled && "group-hover:text-marigold group-hover:border-marigold/30 transition-colors"}
                        `}>
                          {idx + 1}
                        </span>
                        <span className={`
                          text-xs sm:text-sm font-sans font-medium text-text-primary-light
                          ${!isInteractionDisabled && "group-hover:text-text-primary-dark transition-colors"}
                        `}>
                          {opt}
                        </span>
                      </div>
                      <ChevronRight className={`
                        size-4 text-text-secondary
                        ${!isInteractionDisabled && "group-hover:text-marigold group-hover:translate-x-0.5 transition-all"}
                      `} />
                    </button>
                  ))}
                </div>

                <div className="flex justify-between items-center mt-1 border-t border-white/5 pt-3">
                  <button
                    type="button"
                    disabled={isInteractionDisabled}
                    onClick={() => setShowCustomInput((prev) => !prev)}
                    className={`
                      flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-sans font-medium
                      bg-white/[0.02] border border-white/[0.06] transition-all duration-200
                      ${showCustomInput 
                        ? "text-marigold border-marigold/40 bg-marigold/5" 
                        : "text-text-secondary"}
                      ${isInteractionDisabled 
                        ? "opacity-50 cursor-not-allowed" 
                        : "cursor-pointer hover:bg-white/[0.06] hover:border-marigold/30"}
                    `}
                  >
                    <Pencil className="size-3 text-marigold" /> Something else
                  </button>

                  {questionnaireAllowSkip && (
                    <button
                      type="button"
                      disabled={isInteractionDisabled}
                      onClick={handleSkip}
                      className={`
                        px-3 py-1.5 rounded-xl text-xs sm:text-sm font-sans font-medium text-text-dim-ondark
                        bg-transparent border border-transparent transition-all duration-200
                        ${isInteractionDisabled 
                          ? "opacity-40 cursor-not-allowed" 
                          : "cursor-pointer hover:bg-white/[0.04] hover:text-text-primary-light"}
                      `}
                    >
                      Skip
                    </button>
                  )}
                </div>

                {/* Inline custom input form */}
                {showCustomInput && !isInteractionDisabled && (
                  <form
                    onSubmit={handleCustomSubmit}
                    className="w-full flex gap-2 pt-2 border-t border-white/5 animate-in fade-in slide-in-from-top-2 duration-200"
                  >
                    <input
                      type="text"
                      value={customText}
                      onChange={(e) => setCustomText(e.target.value)}
                      placeholder="Type your response..."
                      disabled={isInteractionDisabled}
                      className="flex-1 bg-white/[0.04] border border-white/10 rounded-xl px-3.5 py-2 text-xs sm:text-sm outline-none focus:border-marigold/50 transition-colors font-sans text-text-primary-light"
                    />
                    <button
                      type="submit"
                      disabled={isInteractionDisabled || !customText.trim()}
                      className="p-2 rounded-xl bg-marigold text-ink-deeper hover:bg-marigold/90 disabled:opacity-40 transition-colors cursor-pointer flex items-center justify-center animate-in fade-in"
                    >
                      <ArrowRight className="size-4" />
                    </button>
                  </form>
                )}
              </div>
            </div>
          )}

          {/* Case Explore Carousel Rendering */}
          {isExploreCarousel && (
            <div className="flex flex-col gap-4 w-full animate-in fade-in duration-300">
              {/* Upper Portion (~20%) */}
              {exploreHeadline && (
                <div className="text-[14px] sm:text-[15px] leading-relaxed break-words font-sans text-text-primary-light pr-2">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeRaw]}
                    components={markdownComponents}
                  >
                    {exploreHeadline}
                  </ReactMarkdown>
                </div>
              )}

              {/* Lower Portion (~80%) */}
              {exploreProductsList.length > 0 && (
                <div className="ml-[-8px] sm:ml-[-12px] animate-in fade-in duration-500">
                  <ProductCarousel products={exploreProductsList} />
                </div>
              )}
            </div>
          )}

          {/* Clarifying Questions Fallback */}
          {message.clarifyingQuestion && !isQuestionnaire && onSend && (
            <ClarifyingQuestionCard
              question={message.clarifyingQuestion.question}
              options={message.clarifyingQuestion.options}
              allowSkip={message.clarifyingQuestion.allow_skip}
              allowCustom={message.clarifyingQuestion.allow_custom}
              onSelect={onSend}
              disabled={!isLastAiMessage}
            />
          )}

          {/* Deep Research Results */}
          {message.deepResearchResults && (
            <div className="flex flex-col gap-4 mt-2">
              {loadingDeepResearch && (
                <div className="flex items-center gap-2 text-xs text-text-secondary select-none py-2 px-3 bg-white/[0.02] border border-white/[0.05] rounded-xl w-fit">
                  <div className="size-3.5 border-2 border-marigold/20 border-t-marigold rounded-full animate-spin shrink-0" />
                  <span className="font-sans">Finding best matches...</span>
                </div>
              )}
              {!loadingDeepResearch && primaryProduct && (
                <div className="flex flex-col gap-2">
                  <span className="text-[12px] font-mono text-marigold uppercase tracking-wider font-semibold">
                    🏆 Best Match
                  </span>
                  <div className="w-full sm:max-w-[90%] border border-marigold/30 rounded-2xl overflow-hidden shadow-md shadow-marigold/5 bg-white/[0.02]">
                    <ProductCard product={primaryProduct} />
                  </div>
                </div>
              )}
              {!loadingDeepResearch && backupProducts && backupProducts.length > 0 && (
                <div className="flex flex-col gap-2 mt-2">
                  <span className="text-[11px] font-mono text-text-secondary uppercase tracking-wider">
                    Other options to consider
                  </span>
                  <div className="w-full">
                    <ProductCarousel products={backupProducts} />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Explore Mode products carousel */}
          {message.searchTag && (
            <div className="mt-2 min-h-[50px]">
              {loadingExplore && (
                <div className="flex items-center gap-2 text-xs text-text-secondary select-none py-2 px-3 bg-white/[0.02] border border-white/[0.05] rounded-xl w-fit animate-pulse">
                  <div className="size-3.5 border-2 border-marigold/20 border-t-marigold rounded-full animate-spin shrink-0" />
                  <span className="font-sans">Finding products...</span>
                </div>
              )}
              {!loadingExplore && exploreProducts.length > 0 && (
                <div className="ml-[-8px] sm:ml-[-12px]">
                  <ProductCarousel products={exploreProducts} />
                </div>
              )}
            </div>
          )}

          {/* Proactive Mode Suggestion */}
          {message.suggestedMode && (
            <div className="mt-2.5 animate-in fade-in duration-200">
              <button
                type="button"
                onClick={() => onNewChat?.(message.suggestedMode)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-marigold/10 border border-marigold/20 text-marigold hover:bg-marigold/20 transition-all font-semibold text-xs sm:text-sm cursor-pointer shadow-sm active:scale-[0.98]"
              >
                Start fresh chat in {message.suggestedMode === "deep_research" ? "Deep Research 🔬" : "Explore Mode 🧭"}
              </button>
            </div>
          )}

          {/* Product Cards / Carousel Fallback */}
          {hasProducts && !message.deepResearchResults && !message.searchTag && !isExploreCarousel && (
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
