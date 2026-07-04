"use server"

import { env } from "@/lib/env"
import { createClient } from "@/lib/supabase/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

const DAILY_MESSAGE_LIMIT = 25
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000

export interface ChatSession {
  id: string
  user_id: string
  status: string
  requirements: Record<string, unknown>
  created_at: string
  title?: string
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
  messageCount: number
  dailyLimit: number
  remaining: number
  date: string
}

function getCurrentISTDateString(now = new Date()): string {
  const istTime = new Date(now.getTime() + IST_OFFSET_MS)
  return istTime.toISOString().slice(0, 10)
}

function formatLimitResult(
  messageCount: number,
  date: string,
  allowed: boolean,
  message?: string
): MessageLimitResult {
  return {
    allowed,
    message,
    messageCount,
    dailyLimit: DAILY_MESSAGE_LIMIT,
    remaining: Math.max(0, DAILY_MESSAGE_LIMIT - messageCount),
    date,
  }
}

async function incrementExistingLimitRow(
  supabase: Awaited<ReturnType<typeof createClient>>,
  row: { user_id: string; usage_date: string; message_count: number },
  todayIST: string
): Promise<MessageLimitResult> {
  let currentRow = row

  for (let attempt = 0; attempt < 3; attempt += 1) {
    if (currentRow.message_count >= DAILY_MESSAGE_LIMIT) {
      return formatLimitResult(
        currentRow.message_count,
        todayIST,
        false,
        "You've reached your daily limit of 25 messages. Please come back tomorrow!"
      )
    }

    const nextCount = currentRow.message_count + 1
    const { data, error } = await supabase
      .from("daily_message_limits")
      .update({ message_count: nextCount })
      .eq("user_id", currentRow.user_id)
      .eq("usage_date", currentRow.usage_date)
      .eq("message_count", currentRow.message_count)
      .select("user_id, usage_date, message_count")
      .maybeSingle()

    if (error) {
      throw new Error(`Failed to update daily message limit: ${error.message}`)
    }

    if (data) {
      return formatLimitResult(data.message_count, todayIST, true)
    }

    const { data: refreshedRow, error: refreshError } = await supabase
      .from("daily_message_limits")
      .select("user_id, usage_date, message_count")
      .eq("user_id", currentRow.user_id)
      .eq("usage_date", currentRow.usage_date)
      .single()

    if (refreshError) {
      throw new Error(`Failed to refresh daily message limit: ${refreshError.message}`)
    }

    currentRow = refreshedRow
  }

  throw new Error("Failed to update daily message limit after concurrent changes.")
}

export async function getDailyMessageLimitStatus(): Promise<MessageLimitResult> {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  const todayIST = getCurrentISTDateString()

  if (authError || !user) {
    return formatLimitResult(0, todayIST, true)
  }

  const { data, error } = await supabase
    .from("daily_message_limits")
    .select("message_count")
    .eq("user_id", user.id)
    .eq("usage_date", todayIST)
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to fetch daily message limit: ${error.message}`)
  }

  const messageCount = data?.message_count ?? 0
  return formatLimitResult(
    messageCount,
    todayIST,
    messageCount < DAILY_MESSAGE_LIMIT,
    messageCount >= DAILY_MESSAGE_LIMIT
      ? "You've reached your daily limit of 25 messages. Please come back tomorrow!"
      : undefined
  )
}

export async function checkAndIncrementMessageLimit(): Promise<MessageLimitResult> {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error("Authentication failed: User is not logged in.")
  }

  const todayIST = getCurrentISTDateString()

  const { data: existingRow, error: selectError } = await supabase
    .from("daily_message_limits")
    .select("user_id, usage_date, message_count")
    .eq("user_id", user.id)
    .eq("usage_date", todayIST)
    .maybeSingle()

  if (selectError) {
    throw new Error(`Failed to check daily message limit: ${selectError.message}`)
  }

  if (!existingRow) {
    const { data: insertedRow, error: insertError } = await supabase
      .from("daily_message_limits")
      .insert({
        user_id: user.id,
        usage_date: todayIST,
        message_count: 1,
      })
      .select("message_count")
      .single()

    if (!insertError) {
      return formatLimitResult(insertedRow.message_count, todayIST, true)
    }

    const { data: racedRow, error: racedSelectError } = await supabase
      .from("daily_message_limits")
      .select("user_id, usage_date, message_count")
      .eq("user_id", user.id)
      .eq("usage_date", todayIST)
      .maybeSingle()

    if (racedSelectError || !racedRow) {
      throw new Error(`Failed to create daily message limit: ${insertError.message}`)
    }

    return incrementExistingLimitRow(supabase, racedRow, todayIST)
  }

  return incrementExistingLimitRow(supabase, existingRow, todayIST)
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

/**
 * Fetches all chat sessions for the current logged-in user, ordered by created_at descending.
 */
export async function listChatSessions(): Promise<ChatSession[]> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    throw new Error("Authentication failed: User is not logged in.")
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
  const apiKey = env.GEMINI_API_KEY;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
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
    const text = response.text().trim();
    
    // Clean up any outer quotes or trailing periods
    let title = text.replace(/^["']|["']$/g, "").replace(/\.$/, "").trim();
    if (title.length > 50) {
      title = title.substring(0, 47) + "...";
    }

    return title || fallbackTitle(message);
  } catch (err) {
    console.error("generateChatTitle failed, falling back to truncation:", err);
    return fallbackTitle(message);
  }
}

function fallbackTitle(message: string): string {
  const max = 40;
  const trimmed = message.trim();
  return trimmed.length > max ? trimmed.slice(0, max) + "…" : trimmed;
}
