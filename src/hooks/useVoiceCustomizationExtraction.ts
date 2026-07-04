/**
 * MOCK IMPLEMENTATION:
 * For production, route this text through the DeepSeek/Gemini API 
 * for robust NLP-based extraction of modifiers and requests.
 */
export function useVoiceCustomizationExtraction() {
  const extractCustomizations = (text: string): string[] => {
    if (!text) return [];
    
    const keywords = [
      "spicy", "extra", "without", "no", "less", "more", 
      "vegan", "gluten-free", "sweet", "hot", "cold", "mild"
    ];
    
    const extracted: string[] = [];
    const lowerText = text.toLowerCase();
    
    keywords.forEach(keyword => {
      if (lowerText.includes(keyword)) {
        // If it's a modifier like "extra", try to grab the next word
        if (["extra", "without", "no", "less", "more"].includes(keyword)) {
          const regex = new RegExp(`\\b${keyword}\\s+([\\w\\-]+)`, 'i');
          const match = lowerText.match(regex);
          if (match && match[1]) {
            extracted.push(`${keyword.charAt(0).toUpperCase() + keyword.slice(1)} ${match[1].charAt(0).toUpperCase() + match[1].slice(1)}`);
          } else {
            extracted.push(keyword.charAt(0).toUpperCase() + keyword.slice(1));
          }
        } else {
          extracted.push(keyword.charAt(0).toUpperCase() + keyword.slice(1));
        }
      }
    });
    
    // Deduplicate
    return Array.from(new Set(extracted));
  };
  
  return { extractCustomizations };
}
