export interface Product {
  id: string;
  name: string;
  price: string;
  originalPrice?: string;
  discountBadge?: string;
  rating: number;
  reviewCount: string;
  description: string;
  platform: "Amazon" | "Flipkart";
  image: string;
  link: string;
}
