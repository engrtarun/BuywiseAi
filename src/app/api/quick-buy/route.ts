import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const page = Number(searchParams.get('page') ?? '1');
    const limit = Number(searchParams.get('limit') ?? '12');
    const safePage = Number.isFinite(page) && page > 0 ? page : 1;
    const safeLimit = Number.isFinite(limit) && limit > 0 ? limit : 12;

    const sizeParam = searchParams.get('size') || searchParams.get('sizes');
    const categoriesParam = searchParams.get('categories');
    const budgetParam = searchParams.get('budget') || searchParams.get('maxBudget') || searchParams.get('max_budget');

    // Parse explicitly passed query params
    const hasSizesQuery = sizeParam !== null;
    const hasBudgetQuery = budgetParam !== null;

    let userSizes: string[] = [];
    let maxBudget: number | null = null;

    let profileSizes: string[] = [];
    let profileBudget: number | null = null;
    let hasUser = false;

    // Only query Supabase if we actually need the fallback values
    if (!hasSizesQuery || !hasBudgetQuery) {
      try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          hasUser = true;
          const { data: profile } = await supabase
            .from('profiles')
            .select('size, budget, sizes, max_budget')
            .eq('id', user.id)
            .maybeSingle();

          if (profile) {
            if (Array.isArray(profile.sizes)) {
              profileSizes = profile.sizes;
            } else if (typeof profile.sizes === 'string') {
              profileSizes = profile.sizes.split(',').map((s: string) => s.trim()).filter(Boolean);
            } else if (typeof profile.size === 'string') {
              profileSizes = profile.size.split(',').map((s: string) => s.trim()).filter(Boolean);
            }

            if (typeof profile.max_budget === 'number') {
              profileBudget = profile.max_budget;
            } else if (typeof profile.budget === 'number') {
              profileBudget = profile.budget;
            }
          }
        }
      } catch (err) {
        console.error("Failed to fetch user preferences from Supabase profiles:", err);
      }
    }

    // Determine sizes to use
    if (hasSizesQuery) {
      userSizes = sizeParam
        ? sizeParam.split(',').map((value) => value.trim()).filter(Boolean)
        : [];
    } else if (hasUser && profileSizes.length > 0) {
      userSizes = profileSizes;
    } else {
      userSizes = ['M'];
    }

    // Determine budget to use
    if (hasBudgetQuery) {
      maxBudget = budgetParam ? Number(budgetParam) : null;
    } else if (hasUser && profileBudget !== null) {
      maxBudget = profileBudget;
    } else {
      maxBudget = 5000;
    }

    const preferredCategories = categoriesParam ? categoriesParam.split(',').map((value) => value.trim()).filter(Boolean) : [];

    const res = await fetch("https://fakestoreapi.com/products", {
      cache: 'force-cache',
      next: { revalidate: 300 },
    });
    const allClothes = await res.json();

    const formattedProducts = allClothes.map((product: any) => {
      const availableSizes = ['S', 'M', 'L', 'XL'];
      const seed = Number(product.id) + (product.category?.length || 0);
      const mockSizes = availableSizes.filter((_, index) => (seed + index) % 3 !== 0);
      if (mockSizes.length === 0) mockSizes.push('M');

      return {
        id: product.id.toString(),
        name: product.title,
        price: Math.round(product.price * 85),
        rating: product.rating?.rate || 4.2,
        image: product.image,
        sizes: mockSizes,
        category: product.category,
        platform: 'FakeStore'
      };
    });

    const searchQuery = searchParams.get('query') || searchParams.get('q') || '';
    const cleanSearchQuery = searchQuery.toLowerCase().trim();

    const scoredProducts = formattedProducts.map((product: any) => {
      let score = 0;

      // 70% personalization scoring
      if (preferredCategories.length > 0 && preferredCategories.includes(product.category)) {
        score += 50;
      }
      if (maxBudget !== null && !Number.isNaN(maxBudget) && product.price <= maxBudget) {
        score += 30;
      }
      if (userSizes.length > 0 && product.sizes.some((size: string) => userSizes.includes(size))) {
        score += 20;
      }

      // Add a randomized discovery factor (0 to 30 points) to break ties and introduce variety
      const discoveryFactor = (Math.sin(Number(product.id) * 12.9898) * 10000 % 1) * 30;
      score += Math.abs(discoveryFactor);

      if (cleanSearchQuery) {
        const titleMatch = product.name.toLowerCase().includes(cleanSearchQuery);
        const categoryMatch = product.category.toLowerCase().includes(cleanSearchQuery);
        if (titleMatch) score += 200;
        if (categoryMatch) score += 100;
      }

      return { ...product, recommendationScore: score };
    });

    // Sort descending by score
    scoredProducts.sort((a: any, b: any) => b.recommendationScore - a.recommendationScore);

    const filteredProducts = scoredProducts;

    const totalFiltered = filteredProducts.length;
    let paginatedProducts = [];
    let hasMore = false;

    if (totalFiltered > 0) {
      const startGlobalIndex = (safePage - 1) * safeLimit;
      const endGlobalIndex = safePage * safeLimit;

      for (let i = startGlobalIndex; i < endGlobalIndex; i++) {
        const cycle = Math.floor(i / totalFiltered);
        const localIndex = i % totalFiltered;

        const shuffledForCycle = seededShuffle(filteredProducts, cycle);
        const product = shuffledForCycle[localIndex] as any;

        paginatedProducts.push({
          ...product,
          id: `${product.id}_${cycle}`
        });
      }
      hasMore = true;
    }

    return NextResponse.json({
      success: true,
      data: paginatedProducts,
      pagination: {
        page: safePage,
        limit: safeLimit,
        totalFiltered,
        hasMore,
      },
    });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ success: false, error: 'Failed to fetch products' }, { status: 500 });
  }
}

function seededShuffle<T>(array: T[], seed: number): T[] {
  const shuffled = [...array];
  let currentSeed = seed + 123456789;
  const random = () => {
    const x = Math.sin(currentSeed++) * 10000;
    return x - Math.floor(x);
  };

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    const temp = shuffled[i];
    shuffled[i] = shuffled[j];
    shuffled[j] = temp;
  }
  return shuffled;
}
