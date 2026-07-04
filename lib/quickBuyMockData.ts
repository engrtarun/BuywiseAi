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
}

export const mockQuickBuyProducts: QuickBuyProduct[] = [
  {
    id: "p1",
    name: "Urban Classic Black Denim Jacket",
    image: "https://images.unsplash.com/photo-1551028719-01c1eb5c8ab4?w=800&q=80",
    price: 1899,
    sizes: ["S", "M", "L"],
    category: "Jackets",
    type: "Streetwear",
    rating: 4.5,
    platform: "Myntra"
  },
  {
    id: "p2",
    name: "Minimalist White Cotton Tee",
    image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80",
    price: 499,
    sizes: ["S", "M", "L", "XL"],
    category: "T-Shirts",
    type: "Casual",
    rating: 4.8,
    platform: "Amazon"
  },
  {
    id: "p3",
    name: "Vintage Wash Relaxed Jeans",
    image: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=800&q=80",
    price: 1450,
    sizes: ["M", "L", "XL"],
    category: "Pants",
    type: "Casual",
    rating: 4.2,
    platform: "Flipkart"
  },
  {
    id: "p4",
    name: "Heavyweight Oversized Hoodie",
    image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800&q=80",
    price: 1299,
    sizes: ["S", "M", "L"],
    category: "Hoodies",
    type: "Winterwear",
    rating: 4.6,
    platform: "Myntra"
  },
  {
    id: "p5",
    name: "Summer Linen Blend Shirt",
    image: "https://images.unsplash.com/photo-1596755094514-f87e32f85e2c?w=800&q=80",
    price: 899,
    sizes: ["M", "L", "XL"],
    category: "Shirts",
    type: "Casual",
    rating: 4.3,
    platform: "Amazon"
  },
  {
    id: "p6",
    name: "Athletic Performance Shorts",
    image: "https://images.unsplash.com/photo-1538805060514-97d9cc17730c?w=800&q=80",
    price: 599,
    sizes: ["S", "M", "L", "XL"],
    category: "Shorts",
    type: "Athletic",
    rating: 4.1,
    platform: "Flipkart"
  },
  {
    id: "p7",
    name: "Classic Beige Trench Coat",
    image: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800&q=80",
    price: 2499,
    sizes: ["M", "L"],
    category: "Jackets",
    type: "Formal",
    rating: 4.7,
    platform: "Myntra"
  },
  {
    id: "p8",
    name: "Casual Checkered Flannel",
    image: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800&q=80",
    price: 799,
    sizes: ["S", "M", "L"],
    category: "Shirts",
    type: "Casual",
    rating: 4.4,
    platform: "Amazon"
  },
  {
    id: "p9",
    name: "Slim Fit Chino Pants",
    image: "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=800&q=80",
    price: 1100,
    sizes: ["M", "L", "XL"],
    category: "Pants",
    type: "Formal",
    rating: 4.2,
    platform: "Flipkart"
  },
  {
    id: "p10",
    name: "Graphic Print Streetwear Tee",
    image: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=800&q=80",
    price: 650,
    sizes: ["S", "M"],
    category: "T-Shirts",
    type: "Streetwear",
    rating: 4.9,
    platform: "Myntra"
  },
  {
    id: "p11",
    name: "Ribbed Knit Turtleneck",
    image: "https://images.unsplash.com/photo-1622470953794-aa9c70b0fb9d?w=800&q=80",
    price: 950,
    sizes: ["S", "M", "L"],
    category: "Shirts",
    type: "Winterwear",
    rating: 4.6,
    platform: "Amazon"
  },
  {
    id: "p12",
    name: "Fleece Lined Joggers",
    image: "https://images.unsplash.com/photo-1580906853203-f493cea9ff28?w=800&q=80",
    price: 850,
    sizes: ["M", "L", "XL"],
    category: "Pants",
    type: "Athletic",
    rating: 4.5,
    platform: "Flipkart"
  }
];
