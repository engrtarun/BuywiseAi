/**
 * Returns a high-resolution, theme-appropriate Unsplash image URL based on the product name.
 * This guarantees a premium visual design and avoids broken/missing placeholders.
 */
export function getCuratedProductImage(productName: string): string {
  const name = (productName || "").toLowerCase();
  
  if (name.includes("laptop") || name.includes("macbook") || name.includes("notebook") || name.includes("computer") || name.includes("pc")) {
    return "https://images.unsplash.com/photo-1496181130204-7552cc14f1d0?auto=format&fit=crop&w=600&q=80";
  }
  if (name.includes("phone") || name.includes("pixel") || name.includes("oneplus") || name.includes("smartphone") || name.includes("iphone") || name.includes("mobile")) {
    return "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=600&q=80";
  }
  if (name.includes("shirt") || name.includes("tee") || name.includes("t-shirt") || name.includes("clothing") || name.includes("apparel") || name.includes("jeans") || name.includes("pants")) {
    return "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=600&q=80";
  }
  if (name.includes("shoe") || name.includes("sneaker") || name.includes("boot") || name.includes("footwear") || name.includes("nike") || name.includes("adidas")) {
    return "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80";
  }
  if (name.includes("watch") || name.includes("smartwatch") || name.includes("wearable")) {
    return "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80";
  }
  if (name.includes("jacket") || name.includes("coat") || name.includes("hoodie") || name.includes("sweater")) {
    return "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=600&q=80";
  }
  if (name.includes("headphone") || name.includes("earbud") || name.includes("audio") || name.includes("speaker") || name.includes("soundbar")) {
    return "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80";
  }
  if (name.includes("chair") || name.includes("desk") || name.includes("table") || name.includes("furniture") || name.includes("seating") || name.includes("sofa") || name.includes("office")) {
    return "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=600&q=80";
  }
  if (name.includes("cooker") || name.includes("pan") || name.includes("oven") || name.includes("fridge") || name.includes("kitchen") || name.includes("appliance") || name.includes("blender")) {
    return "https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=600&q=80";
  }
  if (name.includes("television") || name.includes(" tv ") || name.includes("smart tv") || name.includes("monitor") || name.includes("screen")) {
    return "https://images.unsplash.com/photo-1593305841991-05c297ba4575?auto=format&fit=crop&w=600&q=80";
  }
  
  // High-quality generic fallback
  return "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=600&q=80";
}
