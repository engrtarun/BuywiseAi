export interface QuickBuyProduct {
  id: string;
  name: string;
  image: string;
  price: number;
  sizes: string[];
  category: string;
  type: string;
  rating: number;
  platform: string;
  originalPrice?: number;
  reviewsCount?: number;
  dealBadge?: string;
}

export const mockQuickBuyProducts: QuickBuyProduct[] = [
  // T-SHIRTS (5 items)
  {
    id: "p1",
    name: "Premium Supima Cotton Crew Neck — Obsidian Black",
    image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80",
    price: 1299,
    sizes: ["S", "M", "L", "XL", "XXL"],
    category: "T-Shirts",
    type: "Casual",
    rating: 4.8,
    platform: "Myntra",
    originalPrice: 2499,
    reviewsCount: 3412,
    dealBadge: "Best Seller"
  },
  {
    id: "p2",
    name: "Oversized Heavyweight Graphic Tee — Vintage Wash",
    image: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=800&q=80",
    price: 1499,
    sizes: ["M", "L", "XL"],
    category: "T-Shirts",
    type: "Streetwear",
    rating: 4.6,
    platform: "Amazon",
    originalPrice: 2999,
    reviewsCount: 1845
  },
  {
    id: "p3",
    name: "Classic Striped Linen Blend Tee — Navy/White",
    image: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800&q=80",
    price: 999,
    sizes: ["S", "M", "L"],
    category: "T-Shirts",
    type: "Casual",
    rating: 4.3,
    platform: "Flipkart",
    originalPrice: 1799,
    reviewsCount: 890
  },
  {
    id: "p4",
    name: "Textured Knit Polo Shirt — Desert Sand",
    image: "https://images.unsplash.com/photo-1596755094514-f87e32f85e2c?w=800&q=80",
    price: 1799,
    sizes: ["M", "L", "XL", "XXL"],
    category: "T-Shirts",
    type: "Smart Casual",
    rating: 4.7,
    platform: "Ajio",
    originalPrice: 3200,
    reviewsCount: 1256,
    dealBadge: "Trending"
  },
  {
    id: "p5",
    name: "Everyday Essential V-Neck — Heather Grey",
    image: "https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=800&q=80",
    price: 599,
    sizes: ["S", "M", "L", "XL"],
    category: "T-Shirts",
    type: "Casual",
    rating: 4.5,
    platform: "Amazon",
    originalPrice: 999,
    reviewsCount: 5621
  },

  // SHIRTS (5 items)
  {
    id: "p6",
    name: "Relaxed Fit Linen Resort Shirt — Sage Green",
    image: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800&q=80",
    price: 2199,
    sizes: ["M", "L", "XL"],
    category: "Shirts",
    type: "Casual",
    rating: 4.6,
    platform: "Myntra",
    originalPrice: 3999,
    reviewsCount: 847,
    dealBadge: "Premium Quality"
  },
  {
    id: "p7",
    name: "Tailored Oxford Button-Down — Crisp White",
    image: "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=800&q=80",
    price: 1899,
    sizes: ["S", "M", "L", "XL", "XXL"],
    category: "Shirts",
    type: "Formal",
    rating: 4.8,
    platform: "Amazon",
    originalPrice: 3499,
    reviewsCount: 4210
  },
  {
    id: "p8",
    name: "Brushed Flannel Checkered Overshirt — Rust/Black",
    image: "https://images.unsplash.com/photo-1596755094514-f87e32f85e2c?w=800&q=80",
    price: 1650,
    sizes: ["M", "L"],
    category: "Shirts",
    type: "Casual",
    rating: 4.4,
    platform: "Flipkart",
    originalPrice: 2899,
    reviewsCount: 1102
  },
  {
    id: "p9",
    name: "Slim Fit Stretch Poplin Shirt — Midnight Blue",
    image: "https://images.unsplash.com/photo-1588359348347-9bc6cbea68cb?w=800&q=80",
    price: 1499,
    sizes: ["S", "M", "L", "XL"],
    category: "Shirts",
    type: "Formal",
    rating: 4.5,
    platform: "Myntra",
    originalPrice: 2499,
    reviewsCount: 2341
  },
  {
    id: "p10",
    name: "Corduroy Utility Shirt — Earthy Brown",
    image: "https://images.unsplash.com/photo-1563630423918-b58f07336ac9?w=800&q=80",
    price: 2499,
    sizes: ["L", "XL", "XXL"],
    category: "Shirts",
    type: "Streetwear",
    rating: 4.7,
    platform: "Ajio",
    originalPrice: 4200,
    reviewsCount: 654,
    dealBadge: "Limited Edition"
  },

  // JEANS / PANTS (5 items)
  {
    id: "p11",
    name: "Slim-Fit Stretch Denim Jeans — Deep Indigo Wash",
    image: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=800&q=80",
    price: 2899,
    sizes: ["30", "32", "34", "36"],
    category: "Pants",
    type: "Casual",
    rating: 4.7,
    platform: "Myntra",
    originalPrice: 4999,
    reviewsCount: 3892
  },
  {
    id: "p12",
    name: "Relaxed Straight-Leg Carpenter Jeans — Faded Black",
    image: "https://images.unsplash.com/photo-1624378439575-d1ead6bb176d?w=800&q=80",
    price: 3200,
    sizes: ["32", "34", "36", "38"],
    category: "Pants",
    type: "Streetwear",
    rating: 4.6,
    platform: "Flipkart",
    originalPrice: 5500,
    reviewsCount: 1420
  },
  {
    id: "p13",
    name: "Tailored Ankle-Length Chinos — Olive Green",
    image: "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=800&q=80",
    price: 1999,
    sizes: ["30", "32", "34"],
    category: "Pants",
    type: "Smart Casual",
    rating: 4.5,
    platform: "Amazon",
    originalPrice: 3499,
    reviewsCount: 2154,
    dealBadge: "Top Rated"
  },
  {
    id: "p14",
    name: "Premium Pleated Wool Trousers — Charcoal Grey",
    image: "https://images.unsplash.com/photo-1594938298598-70f11115b94e?w=800&q=80",
    price: 4500,
    sizes: ["32", "34", "36"],
    category: "Formal Wear",
    type: "Formal",
    rating: 4.9,
    platform: "Ajio",
    originalPrice: 7999,
    reviewsCount: 845
  },
  {
    id: "p15",
    name: "Everyday Stretch Joggers — Stone Beige",
    image: "https://images.unsplash.com/photo-1580906853203-f493cea9ff28?w=800&q=80",
    price: 1299,
    sizes: ["S", "M", "L", "XL"],
    category: "Pants",
    type: "Athletic",
    rating: 4.3,
    platform: "Myntra",
    originalPrice: 2499,
    reviewsCount: 4521
  },

  // HOODIES & SWEATERS (5 items)
  {
    id: "p16",
    name: "Oversized Cotton Terry Hoodie — Charcoal Grey",
    image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800&q=80",
    price: 2499,
    sizes: ["M", "L", "XL"],
    category: "Hoodies",
    type: "Streetwear",
    rating: 4.8,
    platform: "Myntra",
    originalPrice: 4299,
    reviewsCount: 2341,
    dealBadge: "Editor's Pick"
  },
  {
    id: "p17",
    name: "Premium Merino Wool Crew Neck Sweater — Forest Green",
    image: "https://images.unsplash.com/photo-1622470953794-aa9c70b0fb9d?w=800&q=80",
    price: 3899,
    sizes: ["S", "M", "L", "XL"],
    category: "Sweaters",
    type: "Winterwear",
    rating: 4.9,
    platform: "Amazon",
    originalPrice: 6999,
    reviewsCount: 1120
  },
  {
    id: "p18",
    name: "Chunky Cable Knit Cardigan — Oatmeal",
    image: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&q=80",
    price: 2899,
    sizes: ["M", "L", "XL", "XXL"],
    category: "Sweaters",
    type: "Winterwear",
    rating: 4.6,
    platform: "Ajio",
    originalPrice: 4999,
    reviewsCount: 785
  },
  {
    id: "p19",
    name: "Essential Fleece Zip-Up Hoodie — Navy Blue",
    image: "https://images.unsplash.com/photo-1509551388413-e18d0ac5d495?w=800&q=80",
    price: 1599,
    sizes: ["S", "M", "L", "XL"],
    category: "Hoodies",
    type: "Casual",
    rating: 4.4,
    platform: "Flipkart",
    originalPrice: 2999,
    reviewsCount: 5214
  },
  {
    id: "p20",
    name: "Waffle Knit Half-Zip Pullover — Slate Grey",
    image: "https://images.unsplash.com/photo-1614031679243-7f2a188be413?w=800&q=80",
    price: 2199,
    sizes: ["M", "L", "XL"],
    category: "Sweaters",
    type: "Smart Casual",
    rating: 4.7,
    platform: "Myntra",
    originalPrice: 3899,
    reviewsCount: 942
  },

  // JACKETS & OUTERWEAR (5 items)
  {
    id: "p21",
    name: "Vintage Distressed Denim Jacket — Light Wash",
    image: "https://images.unsplash.com/photo-1551028719-01c1eb5c8ab4?w=800&q=80",
    price: 3299,
    sizes: ["M", "L", "XL"],
    category: "Jackets",
    type: "Streetwear",
    rating: 4.6,
    platform: "Flipkart",
    originalPrice: 5999,
    reviewsCount: 1654,
    dealBadge: "Trending"
  },
  {
    id: "p22",
    name: "Classic Faux Leather Biker Jacket — Jet Black",
    image: "https://images.unsplash.com/photo-1520975954732-57dd22299614?w=800&q=80",
    price: 4999,
    sizes: ["S", "M", "L"],
    category: "Jackets",
    type: "Casual",
    rating: 4.8,
    platform: "Myntra",
    originalPrice: 8999,
    reviewsCount: 2108
  },
  {
    id: "p23",
    name: "Water-Resistant Lightweight Windbreaker — Neon Yellow",
    image: "https://images.unsplash.com/photo-1544441893-675973e31985?w=800&q=80",
    price: 1899,
    sizes: ["S", "M", "L", "XL", "XXL"],
    category: "Jackets",
    type: "Athletic",
    rating: 4.5,
    platform: "Amazon",
    originalPrice: 3499,
    reviewsCount: 3241
  },
  {
    id: "p24",
    name: "Premium Double-Breasted Trench Coat — Camel",
    image: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800&q=80",
    price: 5999,
    sizes: ["M", "L", "XL"],
    category: "Jackets",
    type: "Formal",
    rating: 4.9,
    platform: "Ajio",
    originalPrice: 11999,
    reviewsCount: 652
  },
  {
    id: "p25",
    name: "Quilted Puffer Jacket — Matte Olive",
    image: "https://images.unsplash.com/photo-1545594861-3bef4369f647?w=800&q=80",
    price: 3500,
    sizes: ["L", "XL", "XXL"],
    category: "Jackets",
    type: "Winterwear",
    rating: 4.7,
    platform: "Myntra",
    originalPrice: 6500,
    reviewsCount: 1420
  },

  // ACTIVEWEAR & SHORTS (5 items)
  {
    id: "p26",
    name: "Performance Compression T-Shirt — Gunmetal",
    image: "https://images.unsplash.com/photo-1583292650898-7d22cd27ca6f?w=800&q=80",
    price: 899,
    sizes: ["S", "M", "L", "XL"],
    category: "Activewear",
    type: "Athletic",
    rating: 4.5,
    platform: "Amazon",
    originalPrice: 1599,
    reviewsCount: 4210
  },
  {
    id: "p27",
    name: "Quick-Dry Running Shorts 5\" — Cobalt Blue",
    image: "https://images.unsplash.com/photo-1538805060514-97d9cc17730c?w=800&q=80",
    price: 799,
    sizes: ["M", "L", "XL"],
    category: "Activewear",
    type: "Athletic",
    rating: 4.4,
    platform: "Flipkart",
    originalPrice: 1399,
    reviewsCount: 2105
  },
  {
    id: "p28",
    name: "Relaxed Fit Lounge Sweatpants — Heather Ash",
    image: "https://images.unsplash.com/photo-1552902865-b72c031ac5ea?w=800&q=80",
    price: 1199,
    sizes: ["S", "M", "L", "XL", "XXL"],
    category: "Activewear",
    type: "Casual",
    rating: 4.6,
    platform: "Myntra",
    originalPrice: 2200,
    reviewsCount: 3108
  },
  {
    id: "p29",
    name: "Heavyweight French Terry Shorts — Jet Black",
    image: "https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=800&q=80",
    price: 1499,
    sizes: ["M", "L", "XL"],
    category: "Activewear",
    type: "Streetwear",
    rating: 4.7,
    platform: "Ajio",
    originalPrice: 2699,
    reviewsCount: 1145,
    dealBadge: "New Arrival"
  },
  {
    id: "p30",
    name: "Seamless Moisture-Wicking Tank — Neon Coral",
    image: "https://images.unsplash.com/photo-1503341455253-b2e723bb3db8?w=800&q=80",
    price: 699,
    sizes: ["S", "M", "L"],
    category: "Activewear",
    type: "Athletic",
    rating: 4.3,
    platform: "Amazon",
    originalPrice: 1299,
    reviewsCount: 1892
  }
];
