import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    // 1. URL se search params (size aur budget) nikalna
    const { searchParams } = new URL(request.url);
    const userSize = searchParams.get('size') || 'M';
    const maxBudget = Number(searchParams.get('budget')) || 5000;

    // 2. FakeStoreAPI se Men's aur Women's clothing parallelly fetch karna
    const [mensRes, womensRes] = await Promise.all([
      fetch("https://fakestoreapi.com/products/category/men's clothing"),
      fetch("https://fakestoreapi.com/products/category/women's clothing")
    ]);

    const mensClothes = await mensRes.json();
    const womensClothes = await womensRes.json();
    const allClothes = [...mensClothes, ...womensClothes];

    // 3. Data Formatting (USD to INR aur Mock Sizes inject karna)
    const formattedProducts = allClothes.map((product: any) => {
      // Demo ke liye har product ko random sizes assign karna
      const availableSizes = ['S', 'M', 'L', 'XL'];
      // Har product ko 2-3 random sizes de dete hain
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

    // 4. Smart Filtering Logic (User ke size aur budget ke mutabiq)
    // Actually, because we have client-side filtering in useQuickBuy, 
    // we can return all products and let the client handle it, OR we can pre-filter here.
    // The text file shows pre-filtering. Let's pre-filter based on query params if they exist,
    // otherwise return all.
    const filteredProducts = formattedProducts.filter((product) => {
      let matchesSize = true;
      let matchesBudget = true;
      
      if (searchParams.has('size')) {
        matchesSize = product.sizes.includes(userSize);
      }
      if (searchParams.has('budget')) {
        matchesBudget = product.price <= maxBudget;
      }
      
      return matchesSize && matchesBudget;
    });

    return NextResponse.json({ success: true, data: filteredProducts });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ success: false, error: 'Failed to fetch clothes' }, { status: 500 });
  }
}
