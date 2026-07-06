import { Product } from "./product";

export type Role = "assistant" | "user";

export type Feedback = "up" | "down" | null;

export type MessageStatus = "ok" | "error";

export type ChatMode = "deep_research" | "explore";

export interface UserFingerprint {
  language: string; // e.g., "Hinglish", "English", "Hindi"
  tone: string; // e.g., "casual", "urgent", "polite", "slang-heavy"
  verbosity: string; // e.g., "concise", "detailed", "bullet-points"
}

export interface BaseAIResponse {
  ui_type: string;
  fingerprint?: UserFingerprint;
  // Allows other arbitrary fields for specific response types
  [key: string]: any;
}

export interface Message {
  id: string;
  role: Role;
  content: string;
  feedback?: Feedback;
  status?: MessageStatus;
  errorType?: "generic" | "rate_limit";
  retryDelay?: number;
  products?: Product[];
  clarifyingQuestion?: {
    question: string;
    options: (string | { id: string; label: string; value: string })[];
    allow_skip: boolean;
    allow_custom: boolean;
    acknowledgement?: string;
  };
  deepResearchResults?: {
    summary?: string;
    finalVerdict?: string;
    comparison?: { aspect: string; winner: string; reason: string }[];
  };
  intakeQuestionnaire?: {
    category: string;
    key_attributes: { name: string; question: string }[];
  };
  suggestedMode?: ChatMode;
  searchTag?: string;
  exploreIntro?: string;
  exploreDeepDive?: string;
  fingerprint?: UserFingerprint;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  isTemporary?: boolean;
  mode?: ChatMode;
  requirements?: Record<string, unknown>;
  pinned?: boolean;
}
