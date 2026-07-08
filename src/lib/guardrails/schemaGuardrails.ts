import { z } from "zod";

// Base fingerprint
export const FingerprintSchema = z.object({
  language: z.string().optional(),
  tone: z.string().optional(),
  verbosity: z.string().optional()
}).catchall(z.unknown()).optional();

// 1. search_intent
export const SearchIntentSchema = z.object({
  ui_type: z.literal("search_intent"),
  query: z.string(),
  fingerprint: FingerprintSchema
}).catchall(z.unknown());

// 2. explore_carousel
export const ExploreCarouselSchema = z.object({
  ui_type: z.literal("explore_carousel"),
  headline: z.string().optional(),
  products: z.array(z.object({
    id: z.string().optional(),
    name: z.string().optional(),
    price: z.string().optional(),
    rating: z.number().optional(),
    image: z.string().optional(),
    reason: z.string().optional(),
    stretch: z.boolean().optional(),
    platform: z.string().optional(),
    link: z.string().optional(),
    reviewCount: z.string().optional(),
    description: z.string().optional(),
    badge: z.string().optional()
  }).catchall(z.unknown())).optional().default([]),
  deep_dive: z.string().optional(),
  fingerprint: FingerprintSchema
}).catchall(z.unknown());

// 3. clarifying_question
export const ClarifyingQuestionSchema = z.object({
  ui_type: z.literal("clarifying_question"),
  thought: z.string().optional(),
  acknowledgement: z.string().optional(),
  question: z.string().optional(),
  options: z.array(z.union([
    z.string(),
    z.object({
      id: z.string().optional(),
      label: z.string().optional(),
      value: z.string().optional()
    }).catchall(z.unknown())
  ])).optional().default([]),
  allow_skip: z.boolean().optional().default(true),
  allow_custom: z.boolean().optional().default(true),
  fingerprint: FingerprintSchema
}).catchall(z.unknown());

// 4. text_response
export const TextResponseSchema = z.object({
  ui_type: z.literal("text_response"),
  text: z.string(),
  fingerprint: FingerprintSchema
}).catchall(z.unknown());

// 5. unrecognized
export const UnrecognizedSchema = z.object({
  ui_type: z.literal("unrecognized"),
  text: z.string().optional(),
  fingerprint: FingerprintSchema
}).catchall(z.unknown());

// 6. intake_questionnaire
export const IntakeQuestionnaireSchema = z.object({
  ui_type: z.literal("intake_questionnaire"),
  confirmed_category: z.string().optional(),
  category: z.string().optional(),
  key_attributes: z.array(z.object({
    name: z.string().optional(),
    question: z.string().optional()
  }).catchall(z.unknown())).optional().default([]),
  fingerprint: FingerprintSchema
}).catchall(z.unknown());

// 7. deep_research_results
export const DeepResearchResultsSchema = z.object({
  ui_type: z.literal("deep_research_results"),
  summary: z.string().optional(),
  final_verdict: z.string().optional(),
  recommended_pick_reason: z.string().optional(),
  recommended_pick_id: z.string().optional(),
  recommended_products: z.array(z.object({
    id: z.string().optional(),
    name: z.string().optional(),
    price: z.string().optional(),
    rating: z.number().optional(),
    reviewCount: z.string().optional(),
    description: z.string().optional(),
    platform: z.string().optional(),
    image: z.string().optional(),
    link: z.string().optional(),
    badge: z.string().optional()
  }).catchall(z.unknown())).optional().default([]),
  fingerprint: FingerprintSchema
}).catchall(z.unknown());


// Universal Schema that attempts to parse any of the expected formats
export const UniversalResponseSchema = z.union([
  SearchIntentSchema,
  ExploreCarouselSchema,
  ClarifyingQuestionSchema,
  TextResponseSchema,
  UnrecognizedSchema,
  IntakeQuestionnaireSchema,
  DeepResearchResultsSchema
]);

/**
 * Hard Guardrail Validation Interceptor
 * Sanitizes and validates the raw JSON string from the LLM.
 */
export function validateAndSanitizeOutput(rawText: string): any {
  // Try to extract JSON if it was wrapped in markdown
  const cleaned = rawText.replace(/^```(?:json)?\s*/i, "").replace(/```$/, "").trim();
  
  let parsedObject: any;
  try {
    parsedObject = JSON.parse(cleaned);
  } catch (err) {
    // FATAL JSON PARSING BREAKDOWN (Chapter 1)
    // Fallback gracefully instead of crashing
    console.error("[HardGuardrail] JSON Parse Error: Token Leakage Detected.", err);
    return {
      ui_type: "text_response",
      text: cleaned.substring(0, 500) // Render raw text as fallback
    };
  }

  // Schema verification
  const validationResult = UniversalResponseSchema.safeParse(parsedObject);
  
  if (!validationResult.success) {
    console.warn("[HardGuardrail] Schema Deviation Detected. Attempting structural recovery.");
    
    // Attempt graceful recovery by injecting a default text response
    // if the model outputted a type but missed fields
    if (parsedObject.ui_type) {
      if (parsedObject.ui_type === 'explore_carousel') {
        return {
          ...parsedObject,
          products: parsedObject.products || [],
          headline: parsedObject.headline || "Here are some options.",
          deep_dive: parsedObject.deep_dive || ""
        };
      }
      if (parsedObject.ui_type === 'deep_research_results') {
         return {
           ...parsedObject,
           recommended_products: parsedObject.recommended_products || [],
           summary: parsedObject.summary || "",
           final_verdict: parsedObject.final_verdict || "",
           recommended_pick_reason: parsedObject.recommended_pick_reason || undefined,
           recommended_pick_id: parsedObject.recommended_pick_id || undefined
         }
      }
      if (parsedObject.ui_type === 'clarifying_question') {
         return {
           ...parsedObject,
           options: parsedObject.options || [],
           question: parsedObject.question || "Could you clarify?"
         }
      }
    }

    return {
      ui_type: "text_response",
      text: "I experienced a structural error while generating my response. Please try your request again."
    };
  }

  return validationResult.data;
}
