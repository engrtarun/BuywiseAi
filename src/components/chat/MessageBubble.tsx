"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Message, Feedback } from "@/types/chat";
import { Product } from "@/types/product";
import { MessageActions } from "./MessageActions";
import { ProductCard } from "./ProductCard";
import { ProductCarousel } from "./ProductCarousel";
import { SpoilerText } from "./SpoilerText";
import { ClarifyingQuestionCard } from "./ClarifyingQuestionCard";
import { DeepResearchClarifyingCard, ClarifyingQuestion } from "./DeepResearchClarifyingCard";
import { IntakeQuestionnaireCard } from "./IntakeQuestionnaireCard";
import { ChatMode } from "@/types/chat";
import { Brain, Pencil, ArrowRight, ChevronRight, CheckCircle, Microscope, Compass } from "lucide-react";
import { getExploreLayoutParts } from "@/utils/exploreMode";
import { useUser } from "@/contexts/UserContext";

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
        className="bg-bg-sidebar text-brand-accent px-1.5 py-0.5 rounded font-mono text-[13px] border border-border-light"
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
  mode?: ChatMode | null;
  onProductBuy?: (product: Product) => void;
}

export function MessageBubble({ message, isLastAiMessage = false, onRegenerate, onFeedback, onSend, onNewChat, setInputText, mode, onProductBuy }: MessageBubbleProps) {
  // Local states for custom Questionnaire Card
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customText, setCustomText] = useState("");
  const [hasAnswered, setHasAnswered] = useState(false);
  
  const { profile } = useUser();

  // Lazy loading state for Explore Mode:
  const hasSearchTag = !!message.searchTag;
  const isExploreAlreadyLoaded = !!(message.products && message.products.length > 0);

  const [exploreProducts, setExploreProducts] = useState<Product[]>(message.products || []);
  const [loadingExplore, setLoadingExplore] = useState(hasSearchTag && !isExploreAlreadyLoaded);

  // Parser Middleware inside component:
  let isQuestionnaire = false;
  let questionnaireThought = "";
  let questionnaireQuestion = "";
  let questionnaireOptions: (string | { id: string; label: string; value: string })[] = [];
  let questionnaireAllowSkip = true;
  let questionnaireAllowCustom = true;
  let questionnaireQuestions: ClarifyingQuestion[] = [];

  let isExploreCarousel = false;
  let exploreHeadline = "";
  let exploreProductsList: Product[] = [];
  let exploreDeepDiveText = "";
  let textResponseContent = "";

  try {
    const rawContent = message.content || "";
    
    // Safely extract everything between the first '{' and the last '}'
    const startIndex = rawContent.indexOf("{");
    const endIndex = rawContent.lastIndexOf("}");
    
    if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
      const jsonString = rawContent.substring(startIndex, endIndex + 1);
      const parsed = JSON.parse(jsonString);
      
      if (parsed && typeof parsed === "object") {
        if (parsed.ui_type === "clarifying_question" || parsed.ui_type === "questionnaire" || parsed.ui_type === "intake_questionnaire") {
          isQuestionnaire = true;
          questionnaireThought = parsed.thought || "";
          
          if (Array.isArray(parsed.questions)) {
            questionnaireQuestions = parsed.questions;
          } else if (Array.isArray(parsed.key_attributes)) {
            // Map DEEP_RESEARCH intake_questionnaire format to expected questions array
            questionnaireQuestions = parsed.key_attributes.map((attr: { name?: string; question?: string }) => ({
              id: attr.name,
              question: attr.question,
              options: []
            }));
          } else {
            questionnaireQuestion = parsed.question || "";
            questionnaireOptions = parsed.options || [];
            questionnaireAllowSkip = parsed.allow_skip !== false;
            questionnaireAllowCustom = parsed.allow_custom !== false;
          }
        } else if (parsed.ui_type === "explore_carousel" || parsed.ui_type === "carousel") {
          const PRODUCT_PLATFORMS = [
            "Amazon", "Flipkart", "Meesho", "Myntra", "Ajio", "Nykaa", "Shopify", 
            "Zomato", "Swiggy", "Blinkit", "Zepto", "TataNeu", "Croma", 
            "RelianceDigital", "JioMart", "Lenskart", "Purplle", "Dunzo", 
            "BigBasket", "Snapdeal"
          ];
          
          isExploreCarousel = parsed.ui_type === "explore_carousel";
          exploreHeadline = parsed.headline || "";
          exploreDeepDiveText = parsed.deep_dive || "";
          const items = parsed.products || parsed.items || [];
          exploreProductsList = items.map((p: any) => {
            const productName = String(p.name || p.title || "Unknown Product");
            const pId = String(p.id || Math.random());
            
            // Consistent pseudo-random platform based on ID string
            let hash = 0;
            for (let i = 0; i < pId.length; i++) {
              hash = pId.charCodeAt(i) + ((hash << 5) - hash);
            }
            const platformIndex = Math.abs(hash) % PRODUCT_PLATFORMS.length;
            const fallbackPlatform = PRODUCT_PLATFORMS[platformIndex];

            return {
              id: pId,
              name: productName,
              price: String(p.price || "₹0"),
              rating: typeof p.rating === "number" ? p.rating : 4.0,
              reviewCount: String(p.reviewCount || "42"),
              description: String(p.description || "Recommended product matching your request."),
              platform: String(p.platform || p.store || fallbackPlatform),
              image: p.image && !String(p.image).includes("placeholder.png") ? String(p.image) : getCuratedProductImage(productName),
              link: String(p.link || p.url || `https://${fallbackPlatform.toLowerCase()}.in`),
            };
          });
        } else if (parsed.ui_type === "text_response") {
          textResponseContent = parsed.text || "";
        }
      }
    } else {
      // JSON is incomplete (streaming) or malformed.
      throw new Error("Incomplete JSON");
    }
  } catch (e) {
    // Fallback parsing for incomplete/streaming JSON
    const rawStr = message.content || "";
    if (rawStr.includes('"ui_type"')) {
      if (rawStr.includes('"explore_carousel"') || rawStr.includes('"carousel"')) {
        isExploreCarousel = true;
        
        // Extract headline
        const hlMatch = rawStr.match(/"headline"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)/);
        if (hlMatch && hlMatch[1]) {
          exploreHeadline = hlMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"');
        }
        
        // Extract deep_dive
        const ddMatch = rawStr.match(/"deep_dive"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)/);
        if (ddMatch && ddMatch[1]) {
          exploreDeepDiveText = ddMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"');
        }
        
        // Products will fall back to message.products below
      } else if (rawStr.includes('"text_response"')) {
        const textMatch = rawStr.match(/"text"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)/);
        if (textMatch && textMatch[1]) {
          textResponseContent = textMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"');
        }
      }
    }
  }

  // Fallback to parsed properties if raw JSON wasn't matched/parsed
  if (!isQuestionnaire && (message.clarifyingQuestion || message.intakeQuestionnaire)) {
    isQuestionnaire = true;
    if (message.clarifyingQuestion) {
      questionnaireThought = message.clarifyingQuestion.acknowledgement || "";
      questionnaireQuestion = message.clarifyingQuestion.question || "";
      questionnaireOptions = message.clarifyingQuestion.options || [];
      questionnaireAllowSkip = message.clarifyingQuestion.allow_skip !== false;
      questionnaireAllowCustom = message.clarifyingQuestion.allow_custom !== false;
    }
  }

  if (!isExploreCarousel && message.products && message.products.length > 0 && !message.deepResearchResults && !message.searchTag) {
    isExploreCarousel = true;
    exploreHeadline = message.exploreIntro || message.content;
    exploreDeepDiveText = message.exploreDeepDive || "";
    exploreProductsList = message.products.map(p => ({
      ...p,
      image: p.image && !p.image.includes("placeholder.png") ? p.image : getCuratedProductImage(p.name || "")
    }));
  }

  // Determine Explore layout variables
  const isExploreModeLayout = isExploreCarousel || !!message.searchTag;
  
  const exploreProductsToShow = isExploreCarousel 
    ? exploreProductsList 
    : (message.searchTag ? exploreProducts : []);

  const hasExploreProducts = exploreProductsToShow && exploreProductsToShow.length > 0;
  const shouldRenderSplitLayout = isExploreModeLayout && hasExploreProducts;

  let exploreIntroText = "";
  let exploreDeepDiveTextToRender = "";

  if (shouldRenderSplitLayout) {
    if (isExploreCarousel) {
      exploreIntroText = exploreHeadline;
      exploreDeepDiveTextToRender = exploreDeepDiveText;
      if (!exploreDeepDiveTextToRender && exploreIntroText) {
        const parts = getExploreLayoutParts(exploreIntroText);
        exploreIntroText = parts.intro;
        exploreDeepDiveTextToRender = parts.deepDive;
      }
      
      if (!exploreDeepDiveTextToRender) {
        exploreDeepDiveTextToRender = "Explore these options carefully to find what best fits your needs.";
      }
    } else {
      exploreIntroText = message.exploreIntro || "";
      exploreDeepDiveTextToRender = message.exploreDeepDive || "";
      if (!exploreIntroText) {
        const parts = getExploreLayoutParts(message.content);
        exploreIntroText = parts.intro;
        exploreDeepDiveTextToRender = parts.deepDive;
      }
    }
  }

  const fullTextFallback = isExploreCarousel
    ? `${exploreHeadline}${exploreDeepDiveText ? `\n\n${exploreDeepDiveText}` : ""}`
    : message.content;

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
      <div className="flex justify-end w-full gap-2 overflow-visible">
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 15, rotateX: -25, transformPerspective: 800 }}
          animate={{ opacity: 1, scale: 1, y: 0, rotateX: 0 }}
          transition={{ type: "spring", stiffness: 450, damping: 25, mass: 0.8, duration: 0.4 }}
          style={{ willChange: "transform, opacity", transformOrigin: "bottom right" }}
          dir="auto"
          className="bg-user-bubble-bg text-user-bubble-text rounded-2xl rounded-br-sm px-4 py-3 text-[14px] sm:text-[15px] leading-relaxed whitespace-pre-wrap break-words shadow-sm max-w-[85%] sm:max-w-[75%] md:max-w-[65%] font-user font-medium"
        >
          {message.content}
        </motion.div>
        
        {/* User Avatar */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="self-end mb-[2px]"
        >
          <Avatar className="size-7 sm:size-8 shrink-0">
            {profile?.avatar_url && (
              <AvatarImage src={profile.avatar_url} alt={profile.full_name || "User"} />
            )}
            <AvatarFallback className="bg-brand-accent/20 text-brand-accent border border-brand-accent/30 font-heading font-bold text-[10px] sm:text-xs">
              {profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : "U"}
            </AvatarFallback>
          </Avatar>
        </motion.div>
      </div>
    );
  }

  const containsTable = hasTable(message.content);
  const hasProducts = message.products && message.products.length > 0;
  const isSingleProduct = hasProducts && message.products?.length === 1;
  
  // Use textResponseContent if it was successfully parsed, otherwise fallback to original message.content
  let rawMarkdownContent = textResponseContent || message.content || "";
  
  // If we couldn't parse the JSON but the string seems to be a JSON object, let's extract readable text from it to avoid showing ugly braces to the user.
  if (!textResponseContent && rawMarkdownContent.trim().startsWith('{')) {
    const extractRegex = /"(text|thought|headline|deep_dive|acknowledgement|question|summary)"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)/g;
    const extractedParts = [];
    let match;
    while ((match = extractRegex.exec(rawMarkdownContent)) !== null) {
      extractedParts.push(match[2].replace(/\\n/g, '\n').replace(/\\"/g, '"'));
    }
    
    if (extractedParts.length > 0) {
      rawMarkdownContent = extractedParts.join('\n\n');
    } else {
      // If no recognized keys are found, just strip the JSON syntax roughly
      rawMarkdownContent = rawMarkdownContent.replace(/[{}]/g, '').replace(/"([a-zA-Z_]+)"\s*:/g, '').replace(/\\n/g, '\n').replace(/\\"/g, '"').trim();
    }
  }

  // Pre-process for spoiler syntax ||text||
  const processedContent = rawMarkdownContent.replace(/\|\|(.*?)\|\|/g, '<span data-spoiler="true">$1</span>');

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
          {/* Default AI Bubble (Standard markdown prose / Fallback) */}
          {!isQuestionnaire && (!isExploreModeLayout || !shouldRenderSplitLayout) && !message.deepResearchResults && message.content && (
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
              className="text-[14px] sm:text-[15px] leading-relaxed break-words font-ai w-full min-w-0 inline-block"
            >
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw]}
                components={markdownComponents}
              >
                {isExploreModeLayout ? fullTextFallback : processedContent}
              </ReactMarkdown>
            </div>
          )}

          {/* Deep Research Visual Recommendations Layout */}
          {message.deepResearchResults && (
            <div className="flex flex-col gap-4 w-full animate-in fade-in duration-300">
              {/* 1. Research Summary */}
              {message.deepResearchResults.summary && (
                <div className="bg-zinc-950/80 border border-white/5 rounded-2xl p-4 text-[14px] sm:text-[15px] leading-relaxed break-words font-ai text-zinc-200 shadow-xl backdrop-blur-md">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeRaw]}
                    components={markdownComponents}
                  >
                    {message.deepResearchResults.summary}
                  </ReactMarkdown>
                </div>
              )}

              {/* 2. Comparison Table (Optional) */}
              {message.deepResearchResults.comparison && message.deepResearchResults.comparison.length > 0 && (
                <div className="bg-zinc-950/80 border border-white/5 rounded-2xl p-4 text-[14px] sm:text-[15px] font-ai text-zinc-200 shadow-xl backdrop-blur-md overflow-hidden">
                  <h3 className="font-bold text-marigold mb-3 text-sm uppercase tracking-wider">Feature Comparison</h3>
                  <div className="overflow-x-auto rounded-xl border border-white/10">
                    <table className="w-full text-left text-[13px] border-collapse min-w-[400px]">
                      <thead className="bg-marigold/[0.08] border-b border-marigold/20">
                        <tr>
                          <th className="px-3.5 py-2.5 font-semibold text-marigold uppercase tracking-wider">Aspect</th>
                          <th className="px-3.5 py-2.5 font-semibold text-marigold uppercase tracking-wider">Winner</th>
                          <th className="px-3.5 py-2.5 font-semibold text-marigold uppercase tracking-wider">Reason</th>
                        </tr>
                      </thead>
                      <tbody>
                        {message.deepResearchResults.comparison.map((row: any, idx: number) => (
                          <tr key={idx} className="border-b border-white/5 last:border-b-0 odd:bg-black/[0.02]">
                            <td className="px-3.5 py-2.5 font-medium border-r border-white/5 text-zinc-300 align-top">{row.aspect}</td>
                            <td className="px-3.5 py-2.5 font-bold border-r border-white/5 text-brand-accent align-top">{row.winner}</td>
                            <td className="px-3.5 py-2.5 text-zinc-400 whitespace-normal align-top">{row.reason}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* 3. Final Verdict */}
              {message.deepResearchResults.finalVerdict && (
                <div className="bg-zinc-950/80 border border-white/5 rounded-2xl p-4 text-[14px] sm:text-[15px] leading-relaxed break-words font-ai text-zinc-200 shadow-xl backdrop-blur-md">
                  <div className="flex items-center gap-2 mb-2 text-brand-accent font-bold uppercase tracking-wider text-sm">
                    <CheckCircle className="size-4" /> Final Verdict
                  </div>
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeRaw]}
                    components={markdownComponents}
                  >
                    {message.deepResearchResults.finalVerdict}
                  </ReactMarkdown>
                </div>
              )}

              {/* 4. Recommended Products Carousel */}
              {message.products && message.products.length > 0 && (
                <div className="ml-[-8px] sm:ml-[-12px] p-1 bg-zinc-950/40 rounded-2xl border border-white/5 shadow-inner mt-2">
                  <ProductCarousel products={message.products} onBuyCallback={onProductBuy} />
                </div>
              )}
            </div>
          )}

          {/* Thought process block (as a normal chat bubble just above the card) */}
          {isQuestionnaire && questionnaireThought && (
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
              className="text-[14px] sm:text-[15px] leading-relaxed break-words font-sans w-full min-w-0 inline-block mb-3 animate-in fade-in duration-300"
            >
              <div className="flex items-center gap-1.5 text-xs font-mono select-none uppercase tracking-wider font-semibold opacity-90 mb-1">
                <Brain className="size-3.5 text-brand-accent animate-pulse" /> Thought Process
              </div>
              <p className="whitespace-pre-wrap leading-relaxed">
                {questionnaireThought}
              </p>
            </div>
          )}

          {/* Native Clarifying Question Card */}
          {isQuestionnaire && onSend && (
            mode === "deep_research" ? (
              <DeepResearchClarifyingCard
                questions={questionnaireQuestions.length > 0 ? questionnaireQuestions : [{
                  question: questionnaireQuestion,
                  options: questionnaireOptions,
                  allowSkip: questionnaireAllowSkip,
                  allowCustom: questionnaireAllowCustom
                }]}
                onSelect={(val) => {
                  setInputText?.(val);
                  onSend(val);
                }}
                disabled={!isLastAiMessage}
              />
            ) : (
              <ClarifyingQuestionCard
                question={questionnaireQuestion}
                options={questionnaireOptions}
                allowSkip={questionnaireAllowSkip}
                allowCustom={questionnaireAllowCustom}
                onSelect={(val) => {
                  setInputText?.(val);
                  onSend(val);
                }}
                disabled={!isLastAiMessage}
              />
            )
          )}

          {/* Intake Specialist Questionnaire Card */}
          {message.intakeQuestionnaire && onSend && (
            <IntakeQuestionnaireCard
              category={message.intakeQuestionnaire.category}
              keyAttributes={message.intakeQuestionnaire.key_attributes}
              onSubmit={(val) => {
                onSend(val);
              }}
              disabled={!isLastAiMessage}
            />
          )}

          {/* Case Explore Mode Split Layout Rendering */}
          {shouldRenderSplitLayout && (
            <div className="flex flex-col gap-4 w-full animate-in fade-in duration-300">
              {/* 1. Context 20% (The Hook/Intro) */}
              {exploreIntroText && (
                <div className="bg-bg-sidebar/90 border border-border-light rounded-2xl p-4 text-[14px] sm:text-[15px] leading-relaxed break-words font-sans text-text-primary-light shadow-sm backdrop-blur-md">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeRaw]}
                    components={markdownComponents}
                  >
                    {exploreIntroText}
                  </ReactMarkdown>
                </div>
              )}

              {/* 2. Dynamic Product Shelf */}
              {loadingExplore && exploreProductsToShow.length === 0 ? (
                <div className="flex items-center gap-2 text-xs text-text-secondary select-none py-3 px-4 bg-bg-sidebar/90 border border-border-light rounded-2xl w-fit animate-pulse">
                  <div className="size-3.5 border-2 border-brand-accent/20 border-t-brand-accent rounded-full animate-spin shrink-0" />
                  <span className="font-sans">Finding products...</span>
                </div>
              ) : (
                <div className="ml-[-8px] sm:ml-[-12px] p-1 bg-bg-main/50 rounded-2xl border border-border-light shadow-inner">
                  <ProductCarousel products={exploreProductsToShow} onBuyCallback={onProductBuy} />
                </div>
              )}

              {/* 3. Context 80% (The Deep Dive) */}
              {exploreDeepDiveTextToRender && (
                <div className="bg-bg-sidebar/90 border border-border-light rounded-2xl p-5 text-[14px] sm:text-[15px] leading-relaxed break-words font-sans text-text-primary-light shadow-sm backdrop-blur-md mt-1">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeRaw]}
                    components={markdownComponents}
                  >
                    {exploreDeepDiveTextToRender}
                  </ReactMarkdown>
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
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-accent/10 border border-brand-accent/20 text-brand-accent hover:bg-brand-accent/20 transition-all font-semibold text-xs sm:text-sm cursor-pointer shadow-sm active:scale-[0.98]"
              >
                Start fresh chat in {message.suggestedMode === "deep_research" ? (
                  <span className="flex items-center gap-1.5">Deep Research <Microscope className="size-4" /></span>
                ) : (
                  <span className="flex items-center gap-1.5">Explore Mode <Compass className="size-4" /></span>
                )}
              </button>
            </div>
          )}

          {/* Product Cards / Carousel Fallback */}
          {hasProducts && !message.deepResearchResults && !message.searchTag && !isExploreCarousel && (
            <div className={`${!message.content ? "ml-[-8px] sm:ml-[-12px]" : ""}`}>
              {isSingleProduct ? (
                <div className="w-full sm:max-w-[80%] md:max-w-[70%]">
                  <ProductCard product={message.products![0]} onBuyCallback={onProductBuy} />
                </div>
              ) : (
                <ProductCarousel products={message.products!} onBuyCallback={onProductBuy} />
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
