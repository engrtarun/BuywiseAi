export function getExploreLayoutParts(content: string): { intro: string; deepDive: string } {
  const text = content.trim();
  
  // Try splitting by double newline (paragraph boundary)
  const paragraphs = text.split(/\n\n+/);
  if (paragraphs.length > 1) {
    const intro = paragraphs[0].trim();
    const deepDive = paragraphs.slice(1).join("\n\n").trim();
    return { intro, deepDive };
  }

  // Try splitting by single newline if no double newline exists
  const lines = text.split(/\n+/);
  if (lines.length > 1) {
    const intro = lines[0].trim();
    const deepDive = lines.slice(1).join("\n").trim();
    return { intro, deepDive };
  }

  // Fallback: everything is intro
  return { intro: text, deepDive: "" };
}
