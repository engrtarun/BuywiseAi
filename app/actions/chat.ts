"use server"

import { createClient } from "@/lib/supabase/server"

export interface ChatSession {
  id: string
  user_id: string
  status: string
  requirements: any
  created_at: string
}

export interface ChatMessage {
  id: string
  session_id: string
  sender: "user" | "ai"
  message: string
  created_at: string
}

/**
 * Creates a new chat session for the logged-in user.
 * Throws an error if the user is not authenticated.
 */
export async function createChatSession(): Promise<string> {
  const supabase = await createClient()

  // Retrieve current logged-in user
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    throw new Error("Authentication failed: User is not logged in.")
  }

  // Insert a new chat session row
  const { data, error } = await supabase
    .from("chat_sessions")
    .insert({
      user_id: user.id,
      status: "active",
      requirements: {},
    })
    .select("id")
    .single()

  if (error) {
    throw new Error(`Failed to create chat session: ${error.message}`)
  }

  if (!data) {
    throw new Error("Failed to retrieve the new chat session ID.")
  }

  return data.id
}

/**
 * Inserts a new chat message into the database.
 */
export async function sendMessage(
  sessionId: string,
  sender: "user" | "ai",
  message: string
): Promise<ChatMessage> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("chat_messages")
    .insert({
      session_id: sessionId,
      sender,
      message,
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to send message: ${error.message}`)
  }

  if (!data) {
    throw new Error("Failed to retrieve the inserted message.")
  }

  return data as ChatMessage
}

/**
 * Fetches the complete message history for a given session ID, ordered by created_at ascending.
 */
export async function getChatHistory(sessionId: string): Promise<ChatMessage[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("chat_messages")
    .select("*")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true })

  if (error) {
    throw new Error(`Failed to fetch chat history: ${error.message}`)
  }

  return (data || []) as ChatMessage[]
}

/**
 * Checks for an existing active chat session for the current logged-in user.
 * If found, returns its ID. Otherwise, creates a new active session and returns its ID.
 */
export async function getOrCreateActiveSession(): Promise<string> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    throw new Error("Authentication failed: User is not logged in.")
  }

  // Check for existing active session
  const { data, error } = await supabase
    .from("chat_sessions")
    .select("id")
    .eq("user_id", user.id)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)

  if (error) {
    throw new Error(`Failed to check for active session: ${error.message}`)
  }

  if (data && data.length > 0) {
    return data[0].id
  }

  // Create a new session if none are active
  return await createChatSession()
}
