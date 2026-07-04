# Branch Notes: Supabase & Chat Integration

This branch (`feature/supabase-db`) contains the complete wiring for Supabase SSR and database-backed chat persistence.

---

## 1. Relevant File Structure

```text
├── proxy.ts                     # Root request interceptor (formerly middleware)
├── app/
│   ├── page.tsx                 # Main chat user interface & state integration
│   ├── actions/
│   │   └── chat.ts              # Server actions for sessions and messages
│   └── globals.css              # Custom styling definitions
├── lib/
│   └── supabase/
│       ├── client.ts            # Client builder for browser components
│       ├── server.ts            # Client builder for server-side actions
│       └── middleware.ts        # Helper to refresh session cookies in proxy
└── components/ui/               # Reusable UI primitives (avatar, badge, input, etc.)
```

---

## 2. File Explanations

* **`proxy.ts`**
  * Intercepts incoming traffic to check session cookies before page render.
* **`app/page.tsx`**
  * The front-end view for the chat application. Manages state, loading indicators, auto-scroll, and message sending.
* **`app/actions/chat.ts`**
  * Database operations for creating chat sessions, fetching history, and saving messages.
* **`lib/supabase/client.ts`**
  * Supabase initializer for client-side components.
* **`lib/supabase/server.ts`**
  * Supabase initializer for server actions (uses async cookies).
* **`lib/supabase/middleware.ts`**
  * Helper to automatically refresh expired user sessions in the background.

---

## 3. Implemented vs. Missing Features

### Implemented ✅
* Database persistence for active chat sessions and individual chat messages.
* Automatic loading and mapping of past chat messages on page load.
* Full Supabase SSR session-refresh flow using cookies.
* Typing animations and skeleton loader UIs.
* Basic unauthorized redirect to `/login`.

### Missing / TODO ⏳
* **Real AI Responses**: Messages are currently populated using a pre-defined array of mockup responses.
* **Authentication Pages**: The `/login` page itself is not yet implemented on this branch.
* **Extra Database Operations**: Support for updating chat session requirements (e.g. `requirements` JSONB column) is not yet exposed.

---

## 4. Environment Variables Required

Make sure the following variables are set up in your local environment file:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```
