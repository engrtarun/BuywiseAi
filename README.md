# BuyWise AI

**Stop searching. Start deciding.**

[![Stack](https://img.shields.io/badge/Stack-Next.js%20%7C%20Supabase%20%7C%20Gemini-blue?style=flat-square)](#tech-stack)
[![Status](https://img.shields.io/badge/Status-MVP-orange?style=flat-square)](#development-roadmap)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](#license)

BuyWise AI is a conversational shopping assistant that replaces the traditional online-shopping workflow — searching multiple platforms, comparing prices, sorting by rating, reading dozens of reviews — with a single natural-language conversation.

The user describes what they need in plain language. The assistant asks clarifying questions, searches real products across multiple retailers, reasons over the results using an LLM-based analysis layer, and returns a short, curated set of recommendations with plain-language explanations for each.

**Repo:** [github.com/engrtarun/BuywiseAi](https://github.com/engrtarun/BuywiseAi)

---

## Table of Contents

- [Overview](#overview)
- [Why It's Different](#why-its-different)
- [Core Features](#core-features)
- [Tech Stack](#tech-stack)
- [System Architecture](#system-architecture)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Project Structure](#project-structure)
- [Current Scope & Limitations](#current-scope--limitations)
- [Development Roadmap](#development-roadmap)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

Online shopping today typically requires repeating the same tedious loop across multiple platforms: searching the same product on two or three sites, comparing prices, comparing star ratings, reading through a large volume of reviews, and still ending up uncertain.

BuyWise AI collapses this workflow into a single chat interface. Instead of returning a list of results for the user to filter and evaluate manually, the system behaves like a knowledgeable friend — asking the right follow-up questions, evaluating real product data, and explaining its reasoning in plain language before presenting a short, deliberately curated set of options.

## Why It's Different

Most shopping tools — including standard affiliate/comparison sites — just sort a database by price or star rating. BuyWise AI's reasoning layer is what does the actual work: it takes vague, unstructured intent from the user, pulls live retail data, and reasons over that data (and where available, review content) to surface options a person would only find after real manual research.

```
Unstructured intent  →  Clarifying conversation  →  Live retail search
        →  AI reasoning pass over results  →  Curated recommendation set
```

The order-placement and checkout mechanics are the easy part. The reasoning layer — turning "I need a 5L pressure cooker" into three genuinely well-justified options — is the part that's hard to replicate with a simple search-and-sort tool.

## Core Features

- **Multi-Mode Chat Interface**
  - **Explore Mode** — for general browsing or low-stakes requests that don't need deep clarification (e.g., "I need a water bottle").
  - **Deep Research Mode** — a guided, multi-turn flow for higher-stakes purchases. Asks clarifying questions (use case and budget) before running deep product research and reasoning over the results.
- **Live Product Search & Reranking** — queries live retail data (via Google Shopping / Serper) to retrieve real-time pricing, ratings, images, and links, then reranks results based on the reasoning pass rather than raw price/rating sort.
- **Dual-AI Engine with Failover**
  - Primary reasoning via **Google Gemini 2.5 Flash** for fast intent classification and analysis.
  - Automatic fallback to **Groq (Llama 3.1 8B Instant)** if the primary LLM hits rate limits or errors.
- **Round-Robin API Key Management** — cycles through multiple API keys for both Gemini and Groq to reduce rate-limit interruptions under load.
- **Structured JSON Output** — enforces strict UI-driven JSON schemas so responses map predictably to interactive UI components (carousels, clarifying forms, deep-dive summaries).
- **Polished UX Details** — typing indicators, an "AI analysis" loading state during processing, and a token usage tracker.
- **Authentication & Persistence** — phone OTP login and data storage via Supabase (PostgreSQL), including order/history logging.

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 14 (App Router), React, Tailwind CSS, shadcn/ui, Lucide Icons |
| **Backend** | Next.js API Routes (`/api/chat`, `/api/recommend`, `/api/products`, `/api/orders`) |
| **Database** | Supabase (PostgreSQL) |
| **Auth** | Supabase Auth (Phone OTP) |
| **AI / LLMs** | `@google/generative-ai` (Gemini), Groq API via `fetch` (Llama 3.1) |
| **Data Source** | Serper API (Google Shopping data) |
| **Language** | TypeScript / JavaScript |

## System Architecture

BuyWise AI is a single Next.js application. Serverless API routes orchestrate LLM calls and external API requests.

1. **Router (`router.ts`)** — a lightweight LLM call that classifies user intent and routes the request to either `explore` or `deep_research` mode.
2. **Search & Normalization** — queries the Serper API for live product data across vendors and normalizes the differing data shapes into a common product schema.
3. **Reasoning / Writer (`writer.ts`)** — the primary LLM prompt. Ingests conversation history, live product data, and (where available) review content to produce structured UI JSON payloads (e.g., `explore_carousel`, `intake_questionnaire`, `deep_research_results`).
4. **Key Manager (`keyManager.ts`)** — handles round-robin distribution of Gemini and Groq API keys to maximize uptime.

```
User query → Router → [Explore | Deep Research] → Retail data search & normalization
    → Reasoning pass (Writer) → Structured JSON → UI
```

## Getting Started

### Prerequisites

- Node.js 18 or later
- npm or yarn
- A Supabase project (for database and auth)
- API keys for Google Gemini, Groq, and Serper

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/engrtarun/BuywiseAi.git
cd BuywiseAi

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env.local
# then fill in .env.local with your keys (see below)

# 4. Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Environment Variables

Create a `.env.local` file in the project root. The Gemini and Groq keys accept **multiple comma-separated values** for automatic round-robin rotation.

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key

# AI API Keys (comma-separated for round-robin)
GEMINI_API_KEYS="key1,key2,key3"
GROQ_API_KEY="key1,key2"

# External APIs
SERPER_API_KEY=your_serper_api_key
```

> **Note:** Never commit `.env.local` to version control. Add it to `.gitignore` and share required keys with collaborators through a secure channel.

## Project Structure

```
BuywiseAi/
├── app/
│   ├── api/
│   │   ├── chat/            # Conversation & routing endpoint
│   │   ├── recommend/       # Reasoning pass / recommendation logic
│   │   ├── products/        # Multi-vendor search & normalization
│   │   └── orders/          # Persisted transaction / history logging
│   └── chat/                # Chat interface UI
├── components/
│   ├── chat/                # Message bubbles, clarifying forms
│   └── products/            # Recommendation carousel / result cards
├── lib/
│   ├── router.ts            # Intent classification / mode routing
│   ├── writer.ts             # Main LLM reasoning prompt
│   ├── keyManager.ts          # Round-robin API key rotation
│   └── normalizeProduct.ts     # Unifies multi-retailer data shapes
├── public/                      # Static assets
├── .env.example
└── README.md
```

## Current Scope & Limitations

To keep iteration fast, the current build draws a clear line between what's fully live and what's simulated:

- **Fully functional:** real-time multi-platform product search, structured AI intent gathering (Explore / Deep Research), reasoning-based reranking, and Supabase-backed order/history logging.
- **Simulated for now:** retailer-side cart/checkout handoff is mocked rather than live, so the team can test the core conversational and reasoning flow without waiting on affiliate/API approval timelines.

## Development Roadmap

- [x] **Phase 1** — Dual-LLM integration (Gemini + Groq fallback)
- [x] **Phase 2** — Advanced UI components and form handling
- [x] **Phase 3** — API key round-robin load balancing
- [x] **Phase 4** — Multi-vendor product normalization and contextual chat engine
- [ ] **Phase 5** — Live order checkout (replacing the current mocked flow)
- [ ] **Phase 6** — Personalized user profiles and purchase history tracking
- [ ] **Phase 7** — Expanded retailer integrations (direct Amazon/Flipkart APIs)

## Contributing

Contributions are welcome. To get started:

1. Fork the repository and create a feature branch (`git checkout -b feature/your-feature`).
2. Confirm which lane your change belongs to — backend/AI (`lib/`, `app/api/`) or frontend (`components/`, `app/chat/`).
3. If you modify the structured JSON prompts in `writer.ts`, make sure the exact keys expected by the frontend components are preserved.
4. Test both the Gemini and Groq fallback paths when altering `writer.ts` or `keyManager.ts`.
5. Open a pull request with a clear description of the change and why it's needed.

Please open an issue first for larger changes so the approach can be discussed before implementation.

## License

This project is licensed under the [MIT License](LICENSE). Replace this section with your own license terms if you intend to distribute the project differently.
