# BuyWise AI

**Stop searching. Start deciding.**

BuyWise AI is a conversational shopping assistant that replaces the traditional online-shopping workflow — searching multiple platforms, comparing prices, sorting by rating, reading dozens of reviews — with a single natural-language conversation. The user describes what they need in plain language, the assistant asks clarifying questions, searches real products across multiple retailers, analyzes actual review content, and returns exactly three well-reasoned recommendations. The user selects one, confirms delivery details, and the order is placed.

---

## Table of Contents

- [Overview](#overview)
- [The Problem](#the-problem)
- [Target Users](#target-users)
- [Core Differentiator](#core-differentiator)
- [How It Works](#how-it-works)
- [MVP Scope](#mvp-scope)
- [Tech Stack](#tech-stack)
- [System Architecture](#system-architecture)
- [Database Schema](#database-schema)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Development Roadmap](#development-roadmap)
- [Team & Work Division](#team--work-division)
- [Known Limitations](#known-limitations)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

Online shopping today typically requires a user to repeat the same tedious loop across multiple platforms: search the same product on two or three sites, compare prices, compare star ratings, read through a large volume of reviews, and still end up uncertain about which option is genuinely the right choice.

BuyWise AI collapses this entire workflow into a single chat interface. Instead of returning a list of search results for the user to filter and evaluate manually, the system behaves like a knowledgeable friend: it asks the right follow-up questions, evaluates real product data and real review content, and explains its reasoning in plain language before presenting a short, deliberately curated set of options.

## The Problem

Comparison shopping is time-consuming and cognitively demanding. It requires cross-referencing multiple platforms, interpreting inconsistent rating systems, and reading through large volumes of user-generated review content to separate genuine signal from noise. This burden falls disproportionately on users who are not confident, experienced comparison shoppers, many of whom resort to asking a more tech-savvy friend or family member to make the decision for them.

## Target Users

- Parents and elderly users who find comparing products across multiple sites overwhelming
- Busy professionals who want a fast, confident decision without spending time on research
- First-time online shoppers unfamiliar with how to critically evaluate product listings
- Any user who prefers to skip manual research in favor of a clear, well-reasoned recommendation

## Core Differentiator

The order-placement step is intentionally the least interesting part of this system. The actual engineering challenge — and the part that makes this product worth building — is the reasoning layer: the system's ability to interpret a vague, natural-language need, evaluate products the way an informed human would, and articulate *why* a given product is being recommended, rather than simply sorting a result set by star rating or price.

This reasoning-and-explanation layer, grounded in actual review content rather than generic summarization, is the central technical problem this project solves.

## How It Works

The end-to-end user journey proceeds as follows:

1. The user opens the application and is greeted with a conversational prompt: *"What would you like to buy today?"*
2. The user responds with an unstructured, natural-language request (for example, *"I need a 5 litre pressure cooker."*) — no forms, no filters, no dropdowns.
3. The assistant asks clarifying questions one at a time — budget, brand preference, delivery urgency, any special requirements — until it has sufficient information to search with confidence.
4. The conversation is internally converted into structured requirements: product type, budget, brand preference, and any other stated constraints.
5. The system queries real product listings from multiple retailers (Amazon and Flipkart at MVP stage), retrieving name, price, rating, review data, store, delivery estimate, and product image.
6. Rather than ranking purely by star rating, the assistant reads through the available review content for each candidate product and extracts recurring praise and recurring complaints — the analytical work a human would otherwise perform manually.
7. The assistant presents exactly three curated options:
   - **Best Value** — the strongest balance of price and quality
   - **Budget Pick** — the lowest-cost option that still satisfies the stated requirements
   - **Premium Pick** — a higher-quality option with additional benefits

   Each recommendation includes a plain-language justification grounded in actual review content.
8. The user selects an option (for example, *"I want Option 2."*).
9. The assistant collects delivery address and phone number, and confirms cash-on-delivery as the payment method.
10. The order is confirmed and persisted. The user is shown an order confirmation screen with estimated delivery, store name, and order summary. Past conversations and past orders remain accessible for future reference.

## MVP Scope

The table below clarifies which parts of the system are fully functional at MVP stage and which are intentionally simulated.

| Component                              | Status                                                                                   |
|-----------------------------------------|-------------------------------------------------------------------------------------------|
| Product search (Amazon + Flipkart)      | Real — live product data retrieved via a third-party retail-data API                     |
| Conversation & follow-up questions      | Real — powered by an AI language model                                                   |
| Review analysis                         | Real — reasoning performed over actual review text                                       |
| Order storage, address, confirmation    | Real — persisted to a production database                                                |
| Final checkout with the retailer        | Simulated — placing a live order on Amazon/Flipkart requires seller/affiliate API access not available at MVP stage |
| Payment                                 | Cash on delivery only; no payment gateway integration                                    |

This boundary is a deliberate and clearly communicated design decision rather than a shortcut. Every step up to and including order placement in the application's own database is fully functional. Only the final handoff to the retailer's own checkout system is mocked, since that integration requires an affiliate or seller account approval process that falls outside the MVP timeline.

## Tech Stack

| Layer          | Technology                                                                                   |
|-----------------|-----------------------------------------------------------------------------------------------|
| Frontend        | Next.js (App Router), Tailwind CSS, shadcn/ui                                                |
| Backend         | Next.js API routes (no separate backend server)                                              |
| Database        | Supabase (PostgreSQL)                                                                        |
| Authentication  | Supabase Auth, phone number OTP login                                                        |
| AI / LLM        | Gemini API, used for both conversation management and review analysis                        |
| Product data    | Third-party retail-data API (via RapidAPI) for Amazon and Flipkart listings                  |
| Hosting         | Vercel                                                                                        |
| Language        | Plain JavaScript (TypeScript intentionally deferred to keep MVP scope manageable)             |

## System Architecture

BuyWise AI is built as a single Next.js application, with API routes serving as the backend layer rather than a separate service. The system is composed of four cooperating layers:

1. **Conversation layer** — Manages the multi-turn chat exchange with the user, issuing structured follow-up questions and tracking accumulated requirements until enough information has been gathered to proceed to product search.
2. **Product data layer** — Queries Amazon and Flipkart listings through a unified retail-data API and normalizes the heterogeneous response formats into a single internal shape.
3. **Recommendation layer** — Combines normalized product data with review content and performs a second AI reasoning pass to select and justify exactly three tiered recommendations.
4. **Order layer** — Captures delivery details, writes the confirmed order to the database, and renders the confirmation experience.

The conversation and recommendation layers communicate with the frontend exclusively through structured JSON payloads rather than free-form text, so that the client can reliably determine when to advance between conversational states (for example, from information-gathering to product search).

## Database Schema

```
users            (id, name, phone, address)
chat_sessions    (id, user_id, status, requirements jsonb)
chat_messages    (id, session_id, sender, message)
orders           (id, session_id, user_id, product jsonb, payment_method, status)
```

The `requirements` field on `chat_sessions` and the `product` field on `orders` are stored as flexible JSON rather than fixed relational columns, since the shape of both is expected to evolve as the AI prompts are iterated on.

## Project Structure

A representative structure for the Next.js App Router implementation:

```
buywise-ai/
├── app/
│   ├── api/
│   │   ├── chat/            # Conversation engine endpoint
│   │   ├── recommend/       # Recommendation logic endpoint
│   │   ├── products/        # Product search / normalization endpoint
│   │   └── orders/          # Order creation endpoint
│   ├── chat/                # Chat interface route
│   ├── orders/               # Order history route
│   └── layout.js
├── components/
│   ├── chat/                # Message bubbles, typing indicator, input bar
│   ├── products/            # Product cards, recommendation tiers
│   └── ui/                  # shadcn/ui primitives
├── lib/
│   ├── supabase.js          # Supabase client
│   ├── gemini.js             # AI model client
│   ├── normalizeProduct.js  # Amazon/Flipkart field normalizer
│   └── prompts/              # Structured prompt templates
├── public/
├── .env.local
├── next.config.js
├── package.json
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 18 or later
- A Supabase project
- A Gemini API key
- A RapidAPI key with access to an Amazon/Flipkart retail-data endpoint

### Installation

```bash
npx create-next-app@latest buywise-ai --tailwind --app
cd buywise-ai
npx shadcn@latest init
npx shadcn@latest add button card input badge avatar skeleton scroll-area
npm install @supabase/supabase-js @google/generative-ai axios
```

### Running Locally

```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

## Environment Variables

Create a `.env.local` file in the project root with the following values:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GEMINI_API_KEY=
RAPIDAPI_KEY=
```

## Development Roadmap

The build is organized into nine sequential phases. Time estimates assume a small team working in parallel where noted.

| Phase | Name                          | Estimate | Notes                                                                 |
|-------|-------------------------------|----------|------------------------------------------------------------------------|
| 1     | Project setup                 | ~30 min  | Scaffold Next.js, Tailwind, shadcn/ui, Supabase connection, test AI call |
| 2     | Database design                | ~45 min  | Define and validate all four core tables                              |
| 3     | Authentication                 | ~1 hr    | Phone OTP login; tag sessions and orders with a real user ID          |
| 4     | Product data layer             | ~1 hr    | Build and validate Amazon + Flipkart search in isolation              |
| 5     | Chat UI shell                  | ~1.5 hr  | Build against hardcoded messages; can run in parallel with earlier phases |
| 6     | Conversation engine            | ~2 hrs   | The most complex phase; structured JSON output for reply/status/requirements |
| 7     | Recommendation logic           | ~1.5 hrs | Select and justify three tiered options from real product and review data |
| 8     | Confirmation & order flow      | ~1 hr    | The one phase requiring both frontend and backend simultaneously      |
| 9     | Polish & deployment            | ~1.5 hrs | Order history, loading states, error handling, deployment, demo rehearsal |

### Phase Details

**Phase 1 — Project Setup**
Scaffold the Next.js project, install the UI toolkit, connect Supabase, and confirm a working test call to the AI model. Done when the app runs locally without errors and a test API route successfully returns a model response.

**Phase 2 — Database Design**
Design all tables before any feature code is written, since every subsequent phase depends on this schema. Done when all four tables exist and a test row can be written and read back successfully.

**Phase 3 — Authentication**
Without authentication, there is no way to associate a chat session or order with a specific user. Phone-number OTP login fits the conversational, WhatsApp-like product experience. Done when a test phone number can log in and new sessions/orders are correctly tagged with that user's ID.

**Phase 4 — Product Data Layer**
Build and test the Amazon and Flipkart product search in isolation before integrating it with the AI layer, since this is the riskiest external dependency in the system. Amazon and Flipkart responses will not share field names — a single normalizer function should map both sources into one consistent shape (`title`, `price`, `rating`, `reviewCount`, `image`, `store`, `url`) before this data touches any other part of the codebase. Done when a test search returns real, normalized data from both sources.

**Phase 5 — Chat UI Shell**
Build the chat interface against fake, hardcoded messages, independent of the backend, so that frontend work can proceed in parallel with earlier backend phases. Done when a typed message appears on screen, the layout works at mobile width, and a typing indicator displays while a response is pending.

**Phase 6 — Conversation Engine**
This is the core of the product and the most technically demanding phase. The model must ask follow-up questions and clearly signal when it has gathered sufficient information to proceed to product search. Responses must be constrained to structured JSON — a user-facing message plus a machine-readable status — rather than free text, so the frontend has a reliable signal for state transitions:

```json
{
  "reply": "Got it — what will you mainly use it for?",
  "status": "collecting",
  "requirements": { "product": "laptop", "budget": null }
}
```

Done when a full conversation — from a vague initial request through several follow-ups to a `ready_to_search` status — works end to end, with every response being valid JSON.

**Phase 7 — Recommendation Logic**
Once requirements are complete, fetch real product data (Phase 4) and issue a second AI call to select exactly three tiered options, each justified using specific review content rather than price and rating alone. Done when a realistic product list reliably returns three correctly tiered options with reasoning grounded in actual review content.

**Phase 8 — Confirmation & Order Flow**
The user selects a recommendation, a form collects address and phone number, cash-on-delivery is confirmed, and a real order row is written to the database. The final "place order with the retailer" call is simulated; everything preceding it is fully functional. This is the only phase where frontend and backend work must be integrated simultaneously. Done when the full path — select option, enter address, confirm, view success screen — works end to end and the order appears correctly in the database.

**Phase 9 — Polish & Deployment**
Build the order history page, add loading states to every asynchronous action (AI and product-data calls take several seconds, and a frozen-looking screen reads as broken to a user), implement friendly error handling, and deploy. Done when the application is deployed, tested on a mobile device, and a demo path has been rehearsed with a backup screen recording available in case of a live network failure.

## Team & Work Division

The project divides cleanly into two lanes that rarely touch the same files, which makes it well suited to a small team working in parallel.

| Lane            | Scope                                                                                  |
|------------------|------------------------------------------------------------------------------------------|
| Backend / AI     | Database schema, authentication, product-data integration, conversation logic, recommendation logic |
| Frontend         | Chat interface, product cards, confirmation screen, all styling                        |

Order confirmation (Phase 8) is the single point where both lanes intersect, since it simultaneously requires a functioning form on the frontend and real order-writing logic on the backend.

## Known Limitations

- Final checkout is simulated; no live order is placed with the retailer at MVP stage.
- Payment is limited to cash on delivery; no payment gateway is integrated.
- Product data depends on a third-party retail-data API rather than official Amazon/Flipkart affiliate APIs, which were not accessible within the MVP timeline.
- The codebase is written in plain JavaScript rather than TypeScript, a deliberate simplification for a team building the stack from the ground up.

## Contributing

Contributions are organized around the phase structure described above. Before starting work:

1. Confirm which lane (backend/AI or frontend) your change belongs to.
2. Check the relevant phase's "done when" criteria before opening a pull request.
3. Keep AI-facing prompt changes isolated from unrelated logic changes to simplify review.
4. Ensure any change to the product-data normalizer preserves the shared shape consumed by the recommendation layer.

## License

This project is currently unlicensed. Add a license file appropriate to your intended distribution model before public release.
