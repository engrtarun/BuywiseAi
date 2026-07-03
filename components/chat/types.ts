export type Role = "assistant" | "user";

export interface Message {
  id: string;
  role: Role;
  content: string;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
}
