export function getExploreLayoutParts(content: string): { intro: string; deepDive: string } {
  const text = content.trim();
  
  // Strict delimiter parsing
  const topMatch = text.match(/---START_TOP_20---\s*([\s\S]*?)\s*(?:---END_TOP_20---|---START_BOTTOM_80---|$)/);
  const bottomMatch = text.match(/---START_BOTTOM_80---\s*([\s\S]*?)\s*(?:---END_BOTTOM_80---|$)/);
  
  if (topMatch || bottomMatch) {
    let intro = "";
    let deepDive = "";
    if (topMatch) intro = topMatch[1].trim();
    if (bottomMatch) deepDive = bottomMatch[1].trim();
    return { intro, deepDive };
  }

  // Legacy fallback: Try splitting by double newline (paragraph boundary)
  const paragraphs = text.split(/\n\n+/);
  if (paragraphs.length > 1) {
    const intro = paragraphs[0].trim();
    const deepDive = paragraphs.slice(1).join("\n\n").trim();
    return { intro, deepDive };
  }

  // Legacy fallback: Try splitting by single newline
  const lines = text.split(/\n+/);
  if (lines.length > 1) {
    const intro = lines[0].trim();
    const deepDive = lines.slice(1).join("\n").trim();
    return { intro, deepDive };
  }

  // Absolute fallback: everything is intro
  return { intro: text, deepDive: "" };
}
