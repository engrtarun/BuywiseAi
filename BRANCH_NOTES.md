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
