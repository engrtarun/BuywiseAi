import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    // 1. URL se search params nikalna
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get('page')) || 1;
    const limit = Number(searchParams.get('limit')) || 12;
    
    const sizesParam = searchParams.get('sizes');
    const categoriesParam = searchParams.get('categories');
    const budgetParam = searchParams.get('budget');
    
    const userSizes = sizesParam ? sizesParam.split(',') : [];
    const preferredCategories = categoriesParam ? categoriesParam.split(',') : [];
    const maxBudget = budgetParam ? Number(budgetParam) : null;

    // 2. Fetch entire FakeStoreAPI catalog for pagination testing
    // Pagination limits initial load to ~12 items and fetches incrementally as the user swipes, 
    // reducing initial load time and API calls compared to fetching the full catalog upfront on the client.
    const res = await fetch("https://fakestoreapi.com/products");
    const allClothes = await res.json();

    // 3. Data Formatting (USD to INR aur Mock Sizes inject karna)
    const formattedProducts = allClothes.map((product: any) => {
      const availableSizes = ['S', 'M', 'L', 'XL'];
      const mockSizes = availableSizes.filter(() => Math.random() > 0.4); 
      if (mockSizes.length === 0) mockSizes.push('M'); // Safe fallback

      return {
        id: product.id.toString(),
        name: product.title,
        price: Math.round(product.price * 85), // Converting to INR approx
        rating: product.rating?.rate || 4.2,
        image: product.image,
        sizes: mockSizes,
        category: product.category,
        platform: 'FakeStore'
      };
    });

    // 4. Server-side Filtering Logic
    const filteredProducts = formattedProducts.filter((product: any) => {
      let matchesSize = true;
      let matchesBudget = true;
      let matchesCategory = true;
      
      if (userSizes.length > 0) {
        matchesSize = product.sizes.some((s: string) => userSizes.includes(s));
      }
      
      if (maxBudget !== null) {
        matchesBudget = product.price <= maxBudget;
      }

      if (preferredCategories.length > 0) {
        matchesCategory = preferredCategories.includes(product.category);
      }
      
      return matchesSize && matchesBudget && matchesCategory;
    });

    // 5. Pagination
    const totalFiltered = filteredProducts.length;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedProducts = filteredProducts.slice(startIndex, endIndex);
    
    const hasMore = endIndex < totalFiltered;

    return NextResponse.json({ 
      success: true, 
      data: paginatedProducts,
      pagination: {
        page,
        limit,
        totalFiltered,
        hasMore
      }
    });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ success: false, error: 'Failed to fetch products' }, { status: 500 });
  }
}
