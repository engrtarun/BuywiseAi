# BUYWISE AI: EXPLORE MODE ARCHITECTURE & RULES

## 1. Core Philosophy
Explore Mode is the default, all-category shopping assistant mode. It is NOT limited to tech. It handles groceries, clothing, digital goods, and anything purchasable.

## 2. The Strict 20/80 Rule & Mid-Cards
Every response in Explore Mode MUST follow this UI structure:
- 20% Text (Headline): A short, human-friendly intro validating the user's intent.
- Mid-Cards (Carousel): Highly relevant product cards injected in the middle of the response.
- 80% Text (Deep Dive): A detailed, category-specific buying guide below the cards.

## 3. The Data Fallback Contract
Explore mode must NEVER fail. 
It uses a try-catch-finally pipeline. It first attempts to fetch live data from the DB/API. If that fails, times out, or returns empty, it silently falls back to `quickBuyMockData.ts` to ensure the Mid-Cards are always populated.


