/**
 * JSON Virtual Repair Layer
 * Normalizes incomplete JSON chunks from streams by appending closing brackets and quotes.
 */
export function repairPartialJson(jsonString: string): string {
  let inString = false;
  let isEscaped = false;
  const stack: ('{' | '[')[] = [];

  for (let i = 0; i < jsonString.length; i++) {
    const char = jsonString[i];

    if (inString) {
      if (isEscaped) {
        isEscaped = false;
      } else if (char === '\\') {
        isEscaped = true;
      } else if (char === '"') {
        inString = false;
      }
    } else {
      if (char === '"') {
        inString = true;
      } else if (char === '{') {
        stack.push('{');
      } else if (char === '[') {
        stack.push('[');
      } else if (char === '}') {
        if (stack.length > 0 && stack[stack.length - 1] === '{') {
          stack.pop();
        }
      } else if (char === ']') {
        if (stack.length > 0 && stack[stack.length - 1] === '[') {
          stack.pop();
        }
      }
    }
  }

  let repaired = jsonString;

  // Auto-close open string
  if (inString) {
    // If the last character was an escape, remove it or handle it, but for simplicity we can just close quotes.
    if (isEscaped) {
      // Remove trailing slash
      repaired = repaired.slice(0, -1);
    }
    repaired += '"';
  }

  // Reverse through the stack and append appropriate closures
  for (let i = stack.length - 1; i >= 0; i--) {
    if (stack[i] === '{') {
      repaired += '}';
    } else if (stack[i] === '[') {
      repaired += ']';
    }
  }

  return repaired;
}

/**
 * Attempts to parse an incomplete JSON string by virtually repairing it first.
 * Returns parsed object or null if it cannot be repaired.
 */
export function parsePartialJson<T = any>(jsonString: string): T | null {
  try {
    const cleaned = jsonString.replace(/^```(?:json)?\s*/i, "").replace(/```$/, "").trim();
    if (!cleaned) return null;
    return JSON.parse(cleaned) as T;
  } catch (e1) {
    try {
      const cleaned = jsonString.replace(/^```(?:json)?\s*/i, "").replace(/```$/, "").trim();
      const repaired = repairPartialJson(cleaned);
      return JSON.parse(repaired) as T;
    } catch (e2) {
      return null; // Silently fail, wait for next chunk
    }
  }
}
