import { Product } from "./product";

export type Role = "assistant" | "user";

export type Feedback = "up" | "down" | null;

export type MessageStatus = "ok" | "error";

export interface Message {
  id: string;
  role: Role;
  content: string;
  feedback?: Feedback;
  status?: MessageStatus;
  errorType?: "generic" | "rate_limit";
  retryDelay?: number;
  products?: Product[];
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  isTemporary?: boolean;
}
