export interface FoodItem {
  id: string;
  dishName: string;
  restaurantName: string;
  image: string;
  originalPrice: number;
  price: number;
  couponCode?: string;
  rating: number;
  reviewsCount?: number;
  etaMinutes: number;
  location: string;
}

export const quickBuyMockFoodData: FoodItem[] = [
  {
    id: "food-1",
    dishName: "Hyderabadi Chicken Dum Biryani",
    restaurantName: "Paradise Biryani",
    image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?q=80&w=800&auto=format&fit=crop",
    originalPrice: 450,
    price: 320,
    couponCode: "WELCOME50",
    rating: 4.8,
    reviewsCount: 1250,
    etaMinutes: 35,
    location: "Home"
  },
  {
    id: "food-2",
    dishName: "Margherita Pizza with Burrata",
    restaurantName: "OvenStory Pizza",
    image: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?q=80&w=800&auto=format&fit=crop",
    originalPrice: 650,
    price: 499,
    couponCode: "CHEESE20",
    rating: 4.5,
    reviewsCount: 840,
    etaMinutes: 40,
    location: "Home"
  },
  {
    id: "food-3",
    dishName: "Spicy Salmon Sushi Roll (8 pcs)",
    restaurantName: "Sushi Express",
    image: "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?q=80&w=800&auto=format&fit=crop",
    originalPrice: 800,
    price: 680,
    couponCode: "SUSHI15",
    rating: 4.9,
    reviewsCount: 320,
    etaMinutes: 45,
    location: "Home"
  },
  {
    id: "food-4",
    dishName: "Classic Butter Chicken & Naan",
    restaurantName: "Punjabi Rasoi",
    image: "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?q=80&w=800&auto=format&fit=crop",
    originalPrice: 400,
    price: 350,
    couponCode: "CRAVINGS",
    rating: 4.6,
    reviewsCount: 2100,
    etaMinutes: 25,
    location: "Home"
  },
  {
    id: "food-5",
    dishName: "Double Truffle Mushroom Burger",
    restaurantName: "Truffles",
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=800&auto=format&fit=crop",
    originalPrice: 380,
    price: 300,
    couponCode: "BURGERFEST",
    rating: 4.7,
    reviewsCount: 4500,
    etaMinutes: 30,
    location: "Home"
  }
];
