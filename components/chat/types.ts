export type Role = "assistant" | "user";

export type Feedback = "up" | "down" | null;

export interface Message {
  id: string;
  role: Role;
  content: string;
  feedback?: Feedback;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
}
