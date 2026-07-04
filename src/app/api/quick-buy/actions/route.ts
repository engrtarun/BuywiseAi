import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    let body;

    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid request: JSON body is malformed or empty." },
        { status: 400 }
      );
    }

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "product_id and product_name are required" },
        { status: 400 }
      );
    }

    const { product_id, product_name, price, image_url, is_cart, action_type } = body;

    if (
      typeof product_id !== "string" ||
      !product_id.trim() ||
      typeof product_name !== "string" ||
      !product_name.trim()
    ) {
      return NextResponse.json(
        { error: "product_id and product_name are required" },
        { status: 400 }
      );
    }

    if (typeof price !== "number" || Number.isNaN(price)) {
      return NextResponse.json(
        { error: "price must be a valid number" },
        { status: 400 }
      );
    }

    if (typeof image_url !== "string" || !image_url.trim()) {
      return NextResponse.json(
        { error: "image_url is required" },
        { status: 400 }
      );
    }

    if (typeof is_cart !== "boolean") {
      return NextResponse.json(
        { error: "is_cart must be a boolean" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized: Please log in to perform this action." },
        { status: 401 }
      );
    }

    if (action_type === "buy") {
      // Investor demo support: log order in the orders table
      const { data, error } = await supabase
        .from("orders")
        .insert({
          user_id: user.id,
          product: {
            id: product_id,
            name: product_name,
            price,
            image_url,
          },
          payment_method: "Quick Buy (Swipe)",
          status: "completed",
        })
        .select()
        .single();

      if (error) {
        return NextResponse.json(
          { error: error.message || "Failed to log order" },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true, data });
    }

    // Default action (save to bookmarks/cart)
    const { data, error } = await supabase
      .from("user_saved_products")
      .insert({
        user_id: user.id,
        product_id,
        product_name,
        price,
        image_url,
        is_cart,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message || "Failed to save product" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
