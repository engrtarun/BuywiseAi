import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get("mode") || "clothes"; // Default fallback context remains clothes

    if (mode === "food") {
      // Execute retrieval targeting our dedicated food records instead of apparel tables
      const foodItemsMock = [
        {
          item_name: "Premium Truffle Burger",
          price: 499,
          restaurant_name: "The Urban Gourmet",
          delivery_time: "25 mins",
          calories_or_type: "Veg",
          image_url: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500"
        }
      ];
      return NextResponse.json({ success: true, data: foodItemsMock });
    }

    // Existing apparel default processing fallback pipeline goes here...
    return NextResponse.json({ success: true, mode, data: [] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
