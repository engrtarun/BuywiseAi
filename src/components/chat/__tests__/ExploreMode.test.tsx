import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { getExploreLayoutParts } from "@/app/chat/page";
import { MessageBubble } from "../MessageBubble";
import { ProductCarousel } from "../ProductCarousel";
import { ProductCard } from "../ProductCard";
import { Product } from "@/types/product";
import { Message } from "@/types/chat";

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock child components that rely on portals or deep research hooks to keep tests focused
jest.mock("../../checkout/CheckoutFlow", () => ({
  CheckoutFlow: ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => (
    isOpen ? <div data-testid="checkout-flow-modal"><button onClick={onClose}>Close</button></div> : null
  )
}));

jest.mock("../ProductBottomSheet", () => ({
  ProductBottomSheet: ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => (
    isOpen ? <div data-testid="bottom-sheet-modal"><button onClick={onClose}>Close</button></div> : null
  )
}));

const mockProducts: Product[] = [
  {
    id: "prod-1",
    name: "Classic Denim Jacket",
    price: "₹2,499",
    rating: 4.5,
    reviewCount: "128",
    description: "Classic denim jacket in blue.",
    platform: "Amazon",
    image: "https://images.unsplash.com/photo-1551028719-00167b16eac5",
    link: "https://amazon.in/denim-jacket"
  },
  {
    id: "prod-2",
    name: "Regular Fit Cotton Tee",
    price: "₹799",
    rating: 4.2,
    reviewCount: "94",
    description: "Soft combed cotton t-shirt.",
    platform: "Flipkart",
    image: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518",
    link: "https://flipkart.com/cotton-tee"
  }
];

describe("Explore Mode - Response Parsing Tests", () => {
  it("should split content correctly when double newlines exist", () => {
    const text = "Check out these jackets!\n\nThis is the deep dive section. It explains details about durability.";
    const parts = getExploreLayoutParts(text);
    expect(parts.intro).toBe("Check out these jackets!");
    expect(parts.deepDive).toBe("This is the deep dive section. It explains details about durability.");
  });

  it("should split content correctly using single newline if no double newlines exist", () => {
    const text = "Catchy Hook Intro\nDeep Technical breakdown line 1";
    const parts = getExploreLayoutParts(text);
    expect(parts.intro).toBe("Catchy Hook Intro");
    expect(parts.deepDive).toBe("Deep Technical breakdown line 1");
  });

  it("should fallback to entire text as intro and empty deepDive if no splits are found", () => {
    const text = "Single line text summary.";
    const parts = getExploreLayoutParts(text);
    expect(parts.intro).toBe("Single line text summary.");
    expect(parts.deepDive).toBe("");
  });
});

describe("Explore Mode - Component Render & Integration Tests", () => {
  it("should render ProductCarousel and display individual card details correctly", () => {
    render(<ProductCarousel products={mockProducts} />);
    
    // Check Names
    expect(screen.getByText("Classic Denim Jacket")).toBeInTheDocument();
    expect(screen.getByText("Regular Fit Cotton Tee")).toBeInTheDocument();
    
    // Check Prices
    expect(screen.getByText("₹2,499")).toBeInTheDocument();
    expect(screen.getByText("₹799")).toBeInTheDocument();
    
    // Check Ratings
    expect(screen.getByText("(4.5)")).toBeInTheDocument();
    expect(screen.getByText("(4.2)")).toBeInTheDocument();
    
    // Check Add to Cart buttons are present
    const cartButtons = screen.getAllByRole("button", { name: /add to cart/i });
    expect(cartButtons).toHaveLength(2);
  });
});

describe("Explore Mode - State & Interactivity Tests", () => {
  beforeEach(() => {
    mockFetch.mockClear();
    localStorage.clear();
  });

  it("should toggle checked state on checkbox click, write to localStorage, and call API without re-rendering outer message text", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true })
    });

    const mockToggleHandler = jest.fn();
    render(<ProductCard product={mockProducts[0]} onAddToCartToggle={mockToggleHandler} />);
    
    const cartButton = screen.getByRole("button", { name: /add to cart/i });
    expect(cartButton).toBeInTheDocument();

    // Click to add to cart
    fireEvent.click(cartButton);
    
    // Verify local toggle handler is called
    expect(mockToggleHandler).toHaveBeenCalledWith("prod-1", true);
    
    // Verify fetch is dispatched with is_cart: true
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/quick-buy/actions",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          product_id: "prod-1",
          product_name: "Classic Denim Jacket",
          price: 2499,
          image_url: "https://images.unsplash.com/photo-1551028719-00167b16eac5",
          is_cart: true
        })
      })
    );

    // Verify localStorage persistence
    const saved = localStorage.getItem("buywise_quickbuy_saved");
    expect(saved).not.toBeNull();
    expect(JSON.parse(saved!)).toContain("prod-1");

    // Click again to remove from cart
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true })
    });
    
    fireEvent.click(cartButton);
    expect(mockToggleHandler).toHaveBeenCalledWith("prod-1", false);
    expect(JSON.parse(localStorage.getItem("buywise_quickbuy_saved")!)).not.toContain("prod-1");
  });
});

describe("Explore Mode - Edge-Case & Fallback Tests", () => {
  it("should fallback and render only continuous text seamlessly when product array is empty", () => {
    const emptyProductsMessage: Message = {
      id: "msg-empty-prod",
      role: "assistant",
      content: "This is intro paragraph.\n\nThis is deep dive paragraph.",
      products: [],
      searchTag: "jackets"
    };

    render(
      <MessageBubble 
        message={emptyProductsMessage} 
        isLastAiMessage={true}
        onRegenerate={jest.fn()}
        onFeedback={jest.fn()}
      />
    );

    // Should render continuous text inside the standard prose block
    // We expect both intro and deep dive text to render sequentially in a single layout block
    expect(screen.getByText(/This is intro paragraph./i)).toBeInTheDocument();
    expect(screen.getByText(/This is deep dive paragraph./i)).toBeInTheDocument();

    // Product Carousel must not render
    expect(screen.queryByRole("button", { name: /scroll right/i })).not.toBeInTheDocument();
  });
});
