# Branch Status: feature/theme-rebuild

This document provides a non-technical overview of the current status, structure, and features of the BuyWise AI project on this branch.

---

## 1. Overview
This branch contains a unified build of the BuyWise AI platform, combining:
* **Premium Chat Interface:** A sleek, Claude-style dark theme dashboard.
* **Database & Authentication:** Secure logins and user profiles powered by Supabase.
* **Persistent History:** Auto-saving and reloading of chat sessions.
* **AI Auto-Titling:** Automated, smart chat titles generated from your first message.

---

## 2. Key Project Folders & Files
Here is where the relevant parts of the application live:

* **[app/](file:///d:/WEBDEV/nyc%20project/app/) (Routes & Pages)**
  Contains all web pages including Login (`/login`), Signup (`/signup`), Welcome onboard profile wizard (`/welcome`), and the Chat dashboard (`/chat`).
* **[lib/supabase/](file:///d:/WEBDEV/nyc%20project/lib/supabase/) (Database Setup)**
  Configuration for securely connecting the client website and server APIs to the Supabase database.
* **[components/chat/](file:///d:/WEBDEV/nyc%20project/components/chat/) (Visual Parts)**
  All UI components for the chat screen, such as the sidebar history list, input box, and message bubbles.
* **[app/actions/chat.ts](file:///d:/WEBDEV/nyc%20project/app/actions/chat.ts) (Database Actions)**
  The logic for reading, writing, renaming, and deleting chat records directly from Supabase.

---

## 3. What is Implemented & Working
* **User Authentication:** Sign up/in via email or Google, plus security verification codes.
* **Theme & UI:** Sleek, responsive dark mode chat dashboard matching premium design standards.
* **Session Persistence:** All chats are automatically saved in the database; history loads instantly when you refresh the page.
* **Smart Auto-Titling:** Sends the first user message of any new session to Gemini in the background to automatically write a 3–6 word chat title.
* **Chat Management:** Rename (pencil icon) or delete chats from the sidebar; updates sync instantly to the database.
* **Security (RLS):** Row Level Security enabled on Supabase so users can only access their own private chats.
* **QuickBuy Multi-Profile System:** Netflix-style multi-profile management allowing one login to support up to 4 distinct shopper profiles. Each profile manages individual sizes, preferred categories, and budget constraints. Features profile switcher popover, onboarding flow with a skip option leading to a locked empty-state, and automatic syncing to local storage and Supabase database.

---

## 4. What's Still Missing (TODO)
* **Real Product Scraping:** The AI currently simulates shopping recommendations using general training knowledge. Direct integration for live price/link scraping from Amazon, Flipkart, etc., is not yet connected.
* **Checkout Flow:** Placing actual orders and processing payment options.
* **Production Hardening:** Advanced rate-limiting (preventing API abuse) and error monitoring.

---

## 5. Required Environment Variables
To run the project locally, copy `.env.example` to `.env.local` and add values for:
* `NEXT_PUBLIC_SUPABASE_URL` (Supabase connection endpoint)
* `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Supabase public API key)
* `GEMINI_API_KEY` (Google Generative AI credentials)

---

## 6. Known Issues during Testing
* **Gemini API Limits:** The free-tier Gemini API key might hit 429 rate limit errors (quota limit exceeded) if messages are sent too quickly in succession. Error boxes display gracefully to prompt the user to retry.

---

## 7. Two-Mode Chat Experience
This branch introduces a structured two-mode chat redesign, retiring the old free-form conversations:
* **Explore Mode (Default)**: A lightweight, visual, browse-first experience. It displays a short context summary followed by a horizontal, scrollable row of product cards matching the search term.
* **Deep Research**: A guided, interactive shopping assistant flow. It asks 2–3 clarifying questions (budget, use-case, brand preference, etc.) using tappable option chips, a custom input option, and a skip option, then displays a "Best Match" hero product followed by 2–3 secondary backup recommendations.
* **Mode Locking**: The selected mode is locked on the first message sent and cannot be changed mid-conversation. The user must start a new chat to use the other mode.
* **Proactive Suggestions**: The AI can suggest starting a fresh chat in the other mode if a query is complex/simple. Clicking the suggested button opens a new chat session pre-set to that mode.
* **Open Assumption**: The formatting toolbar (Bold/Italic/Spoiler buttons) inside the input container is replaced by the read-only mode badge once the chat mode is active/locked. The product owner should confirm if these formatting tools should be relocated (e.g., inside the "+" menu) rather than fully replaced.
* **Lazy Product Loading Optimization**: To ensure the user interface loads instantly and behaves extremely smoothly:
  * Message parsing runs synchronously on page load, avoiding all blocking HTTP requests.
  * Recommendation products are fetched in parallel client-side from the database API *only when the specific message bubble mounts and is displayed*. A subtle loading spinner appears during fetching, entirely preventing page freezes and loading delay spikes.
