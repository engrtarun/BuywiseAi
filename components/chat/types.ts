export type Role = "assistant" | "user";

export interface Message {
  id: string;
  role: Role;
  content: string;
}
