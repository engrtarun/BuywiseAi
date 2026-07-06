interface FallbackResponse {
  keywords: string[];
  text: string;
}

const fallbackResponses: FallbackResponse[] = [
  {
    keywords: ["headphone", "headphones", "earbuds", "earphone", "anc", "noise"],
    text: `Here are three strong headphone picks I would shortlist:

1. Sony WH-CH720N
Best for: noise cancellation and comfort.
Why it stands out: lightweight build, reliable ANC, long battery life, and a balanced sound profile that works well for calls, music, and travel.

2. JBL Tune 770NC
Best for: punchy bass and everyday use.
Why it stands out: energetic sound, good app controls, multipoint Bluetooth, and solid battery life for the price.

3. OnePlus Buds 3
Best for: compact earbuds with strong value.
Why it stands out: good ANC for the segment, quick charging, low-latency mode, and a cleaner fit for commuting or workouts.

My pick: if you want over-ear comfort, go with Sony WH-CH720N. If you want portable earbuds, OnePlus Buds 3 is the better value choice.`,
  },
  {
    keywords: ["phone", "smartphone", "mobile", "android", "iphone", "camera"],
    text: `For a phone recommendation, I would narrow it down like this:

1. Best overall Android value: OnePlus Nord series
Good performance, fast charging, clean software, and dependable day-to-day speed.

2. Best camera-first option: Google Pixel A-series
Excellent photos, especially portraits and night shots, plus long software support.

3. Best battery-focused option: Samsung Galaxy M-series
Large battery, AMOLED display on many models, and reliable service coverage.

4. Best premium choice: iPhone 15 or Samsung Galaxy S-series
Choose iPhone for video, ecosystem, and longevity. Choose Samsung for display, zoom, and customization.

My quick rule: pick Pixel for photos, OnePlus for speed and charging, Samsung for battery/display, and iPhone for long-term resale value.`,
  },
  {
    keywords: ["laptop", "student", "college", "work", "office", "coding", "programming"],
    text: `For laptops, I would shortlist based on the job:

1. Student / everyday work
Look for: Intel i5 or Ryzen 5, 16GB RAM, 512GB SSD, lightweight body.
Good fit: Lenovo IdeaPad Slim, ASUS Vivobook, HP Pavilion.

2. Coding / engineering
Look for: 16GB RAM minimum, good keyboard, strong thermals, and expandable storage if possible.
Good fit: Lenovo ThinkPad E-series, ASUS Vivobook Pro, Acer Swift.

3. Creative work
Look for: color-accurate display, dedicated GPU if editing video, and 16GB RAM or higher.
Good fit: ASUS Creator series, Lenovo Yoga/Slim Pro, MacBook Air M-series for non-gaming creative work.

My pick for most people: a Ryzen 5 or Intel i5 laptop with 16GB RAM and 512GB SSD. It will feel much better long-term than an 8GB RAM model, even if the processor is similar.`,
  },
  {
    keywords: ["washing machine", "washer", "laundry"],
    text: `For washing machines, I would compare these three categories:

1. Best overall: LG front-load
Great wash quality, efficient water usage, quiet motor, and strong service network.

2. Best value: Samsung front-load
Good features for the price, modern controls, and reliable daily performance.

3. Best budget: Whirlpool or IFB top-load
Lower upfront cost, easier loading, and simpler maintenance.

Recommendation: choose a front-load machine if wash quality, fabric care, and efficiency matter most. Choose top-load if budget and convenience matter more.

Capacity guide: 6-6.5kg for 1-2 people, 7-8kg for a family of 3-4, and 9kg+ for larger households.`,
  },
  {
    keywords: ["gift", "birthday", "present", "anniversary"],
    text: `Here are gift ideas that feel useful rather than generic:

1. For a tech-friendly person
Wireless earbuds, a fast charger, a compact power bank, or a smart speaker.

2. For someone who works or studies a lot
Desk lamp, laptop stand, mechanical keyboard, ergonomic mouse, or noise-cancelling headphones.

3. For fitness or travel
Smart band, insulated bottle, packing cubes, compact backpack, or neck pillow.

4. For a premium but safe choice
Kindle, smartwatch, fragrance discovery set, or a high-quality wallet/card holder.

My safest pick: wireless earbuds or a Kindle. Both feel personal enough, but they are still practical and easy to use every day.`,
  },
  {
    keywords: [],
    text: `Here is how I would approach this purchase:

1. Decide the top priority
Performance, durability, camera/display quality, battery life, after-sales service, or lowest price.

2. Avoid paying extra for features you will not use
For most buyers, the best value is usually one step below the flagship or premium model.

3. Check long-term ownership cost
Warranty, service network, replacement parts, battery health, and software support matter as much as launch specs.

4. Pick the balanced option
I would choose the product that has strong reviews, dependable service, and no major compromise in the feature you care about most.

If you share your budget and the product category, I can narrow this to a clear top 3 with a best overall pick.`,
  },
];

export function getFallbackChatResponse(message: string, history: { role?: string; content?: string }[] = []): string {
  const messagesToCheck = [message];
  
  // Add last 3 messages from history (most recent first)
  const recentHistory = [...history].reverse().slice(0, 3);
  for (const msg of recentHistory) {
    if (msg.content) {
      messagesToCheck.push(msg.content);
    }
  }

  for (const msg of messagesToCheck) {
    const normalizedMessage = msg.toLowerCase();
    const matchedResponse = fallbackResponses.find((response) =>
      response.keywords.some((keyword) => normalizedMessage.includes(keyword))
    );
    
    if (matchedResponse) {
      return matchedResponse.text;
    }
  }

  return fallbackResponses[fallbackResponses.length - 1].text;
}

export { fallbackResponses };
