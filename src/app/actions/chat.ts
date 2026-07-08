"use server"

import { env } from "@/lib/env"
import { createClient } from "@/lib/supabase/server"
import { executeWithGeminiFailover } from "@/lib/agents/keyManager"

const DAILY_TOKEN_LIMIT = 20000
const TOKENS_PER_MESSAGE = 1000
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000

function getISTDateString(date: Date | string | number): string {
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date
  const istTime = new Date(d.getTime() + IST_OFFSET_MS)
  return istTime.toISOString().slice(0, 10)
}

function getCurrentISTDateString(now = new Date()): string {
  return getISTDateString(now)
}

export interface ChatSession {
  id: string
  user_id: string
  status: string
  requirements: Record<string, unknown>
  created_at: string
  title?: string
  mode: "deep_research" | "explore"
  pinned?: boolean
}

export interface ChatMessage {
  id: string
  session_id: string
  sender: "user" | "ai"
  message: string
  created_at: string
}

export interface MessageLimitResult {
  allowed: boolean
  message?: string
  tokensUsed?: number
  tokenLimit?: number
  remaining: number
  date: string
  // Legacy fields for backward compatibility
  messageCount: number
  dailyLimit: number
}

async function getAuthenticatedUser(
  supabase: Awaited<ReturnType<typeof createClient>>
) {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return null
  }

  return user
}

function getGuestSessionId(): string {
  return `guest-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

export async function getDailyMessageLimitStatus(): Promise<MessageLimitResult> {
  const supabase = await createClient()
  const user = await getAuthenticatedUser(supabase)

  const todayIST = getCurrentISTDateString()

  if (!user) {
    return {
      allowed: true,
      tokensUsed: 0,
      tokenLimit: DAILY_TOKEN_LIMIT,
      remaining: DAILY_TOKEN_LIMIT,
      date: todayIST,
      messageCount: 0,
      dailyLimit: DAILY_TOKEN_LIMIT
    }
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("tokens_used, last_reset_at")
    .eq("id", user.id)
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to fetch daily token limit: ${error.message}`)
  }

  let tokensUsed = profile?.tokens_used ?? 0
  const lastResetAt = profile?.last_reset_at

  // Check if it's a new calendar day
  if (lastResetAt) {
    const lastResetIST = getISTDateString(lastResetAt)
    if (lastResetIST !== todayIST) {
      tokensUsed = 0
    }
  }

  return {
    allowed: true,
    tokensUsed,
    tokenLimit: DAILY_TOKEN_LIMIT,
    remaining: DAILY_TOKEN_LIMIT,
    date: todayIST,
    messageCount: tokensUsed,
    dailyLimit: DAILY_TOKEN_LIMIT,
    message: undefined
  }
}

export async function checkAndIncrementMessageLimit(): Promise<MessageLimitResult> {
  const supabase = await createClient()
  const user = await getAuthenticatedUser(supabase)

  const todayIST = getCurrentISTDateString()

  if (!user) {
    return {
      allowed: true,
      tokensUsed: 0,
      tokenLimit: DAILY_TOKEN_LIMIT,
      remaining: DAILY_TOKEN_LIMIT,
      date: todayIST,
      messageCount: 0,
      dailyLimit: DAILY_TOKEN_LIMIT
    }
  }

  // Fetch the profile
  const { data: profile, error: selectError } = await supabase
    .from("profiles")
    .select("tokens_used, last_reset_at")
    .eq("id", user.id)
    .maybeSingle()

  if (selectError) {
    throw new Error(`Failed to check daily message limit: ${selectError.message}`)
  }

  const tokensUsed = profile?.tokens_used ?? 0
  const lastResetAt = profile?.last_reset_at
  let isNewDay = false

  if (!lastResetAt) {
    isNewDay = true
  } else {
    const lastResetIST = getISTDateString(lastResetAt)
    if (lastResetIST !== todayIST) {
      isNewDay = true
    }
  }

  let nextTokensUsed = tokensUsed + TOKENS_PER_MESSAGE
  let nextResetAt = lastResetAt || new Date().toISOString()

  if (isNewDay) {
    nextTokensUsed = TOKENS_PER_MESSAGE
    nextResetAt = new Date().toISOString()
  }

  // Bypassed limit check to allow unlimited messages
  if (false && nextTokensUsed > DAILY_TOKEN_LIMIT) {
    return {
      allowed: false,
      message: "Daily limit reached — resets at 12:00 AM",
      tokensUsed,
      tokenLimit: DAILY_TOKEN_LIMIT,
      remaining: Math.max(0, DAILY_TOKEN_LIMIT - tokensUsed),
      date: todayIST,
      messageCount: tokensUsed,
      dailyLimit: DAILY_TOKEN_LIMIT
    }
  }

  // Update profile using insert/update depending on existence to avoid upsert RLS issues
  let updateError;
  if (!profile) {
    const { error } = await supabase
      .from("profiles")
      .insert({
        id: user.id,
        tokens_used: nextTokensUsed,
        last_reset_at: nextResetAt
      });
    updateError = error;
  } else {
    const { error } = await supabase
      .from("profiles")
      .update({
        tokens_used: nextTokensUsed,
        last_reset_at: nextResetAt
      })
      .eq("id", user.id);
    updateError = error;
  }

  if (updateError) {
    throw new Error(`Failed to update profile tokens: ${updateError.message}`)
  }

  return {
    allowed: true,
    tokensUsed: nextTokensUsed,
    tokenLimit: DAILY_TOKEN_LIMIT,
    remaining: Math.max(0, DAILY_TOKEN_LIMIT - nextTokensUsed),
    date: todayIST,
    messageCount: nextTokensUsed,
    dailyLimit: DAILY_TOKEN_LIMIT
  }
}

/**
 * Creates a new chat session for the logged-in user.
 * Throws an error if the user is not authenticated.
 */
export async function createChatSession(mode?: "deep_research" | "explore"): Promise<string> {
  const supabase = await createClient()

  const user = await getAuthenticatedUser(supabase)
  if (!user) {
    return getGuestSessionId()
  }

  // Try to insert with mode first
  let { data, error } = await supabase
    .from("chat_sessions")
    .insert({
      user_id: user.id,
      status: "active",
      requirements: {},
      mode: mode || "explore",
      pinned: false,
    })
    .select("id")
    .single()

  // Graceful fallback if the remote database is missing a newer column
  if (error && (error.message.includes("'mode' column") || error.message.includes("'pinned' column"))) {
    console.warn("Graceful fallback: some chat_sessions columns missing in remote Supabase, inserting without them.");
    
    // Retry without the new columns when the DB schema is older.
    const fallbackResult = await supabase
      .from("chat_sessions")
      .insert({
        user_id: user.id,
        status: "active",
        requirements: {},
      })
      .select("id")
      .single()
      
    data = fallbackResult.data;
    error = fallbackResult.error;
  }

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
  const user = await getAuthenticatedUser(supabase)

  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(sessionId);

  if (!user || !isUUID) {
    return {
      id: getGuestSessionId(),
      session_id: sessionId,
      sender,
      message,
      created_at: new Date().toISOString(),
    }
  }

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
  const user = await getAuthenticatedUser(supabase)

  if (!user) {
    return []
  }

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

  const user = await getAuthenticatedUser(supabase)
  if (!user) {
    return getGuestSessionId()
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

/**
 * Fetches all chat sessions for the current logged-in user, ordered by created_at descending.
 */
export async function listChatSessions(): Promise<ChatSession[]> {
  const supabase = await createClient()

  const user = await getAuthenticatedUser(supabase)
  if (!user) {
    return []
  }

  const { data, error } = await supabase
    .from("chat_sessions")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  if (error) {
    throw new Error(`Failed to list chat sessions: ${error.message}`)
  }

  return (data || []) as ChatSession[]
}

/**
 * Deletes a chat session by ID.
 */
export async function deleteChatSession(sessionId: string): Promise<void> {
  const supabase = await createClient()
  const user = await getAuthenticatedUser(supabase)

  if (!user || sessionId.startsWith("guest-")) {
    return
  }

  // Delete all messages associated with the session first to avoid foreign key constraints
  const { error: messagesError } = await supabase
    .from("chat_messages")
    .delete()
    .eq("session_id", sessionId)

  if (messagesError) {
    throw new Error(`Failed to delete chat messages: ${messagesError.message}`)
  }

  const { error } = await supabase
    .from("chat_sessions")
    .delete()
    .eq("id", sessionId)

  if (error) {
    throw new Error(`Failed to delete chat session: ${error.message}`)
  }
}

/**
 * Generates a concise 3-6 word chat title using the Gemini API.
 * Falls back to truncating the first message if the call fails or times out.
 */
export async function generateChatTitle(message: string): Promise<string> {
  try {
    const text = await executeWithGeminiFailover(async (genAI) => {
      // Use gemini-2.5-flash which is the fastest and cheapest model
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      const prompt = `Summarize the following user message into a concise 3-6 word chat title. Return only the title text, no punctuation at the end, no quotes, no explanation.\n\nUser Message: "${message}"`;

      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          maxOutputTokens: 20,
        }
      });

      const response = await result.response;
      return response.text().trim();
    });
    
    // Clean up any outer quotes or trailing periods
    let title = text.replace(/^["']|["']$/g, "").replace(/\.$/, "").trim();
    if (title.length > 50) {
      title = title.substring(0, 47) + "...";
    }

    return title || fallbackTitle(message);
  } catch (err) {
    console.error("generateChatTitle failed completely across all Gemini keys, falling back to truncation:", err);
    return fallbackTitle(message);
  }
}

function fallbackTitle(message: string): string {
  const max = 40;
  const trimmed = message.trim();
  return trimmed.length > max ? trimmed.slice(0, max) + "…" : trimmed;
}

/**
 * Updates the requirements for a chat session.
 */
export async function updateSessionRequirements(sessionId: string, requirements: Record<string, unknown>): Promise<void> {
  const supabase = await createClient()
  const user = await getAuthenticatedUser(supabase)

  if (!user || sessionId.startsWith("guest-")) {
    return
  }

  const { error } = await supabase
    .from("chat_sessions")
    .update({ requirements })
    .eq("id", sessionId)

  if (error) {
    throw new Error(`Failed to update session requirements: ${error.message}`)
  }
}

export async function updateChatSessionPinned(sessionId: string, pinned: boolean): Promise<void> {
  const supabase = await createClient()
  const user = await getAuthenticatedUser(supabase)

  if (!user || sessionId.startsWith("guest-")) {
    return
  }

  const { error } = await supabase
    .from("chat_sessions")
    .update({ pinned })
    .eq("id", sessionId)

  if (error) {
    throw new Error(`Failed to update chat session pin status: ${error.message}`)
  }
}

/**
 * Gets the requirements for a chat session.
 */
export async function getSessionRequirements(sessionId: string): Promise<Record<string, unknown>> {
  const supabase = await createClient()
  const user = await getAuthenticatedUser(supabase)

  if (!user || sessionId.startsWith("guest-")) {
    return {}
  }

  const { data, error } = await supabase
    .from("chat_sessions")
    .select("requirements")
    .eq("id", sessionId)
    .single()

  if (error) {
    console.error(`Failed to get session requirements: ${error.message}`)
    return {}
  }

  return data?.requirements || {}
}
