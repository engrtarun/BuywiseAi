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

    const res = await fetch("https://fakestoreapi.com/products");
    const allClothes = await res.json();

    const formattedProducts = allClothes.map((product: any) => {
      const availableSizes = ['S', 'M', 'L', 'XL'];
      const mockSizes = availableSizes.filter(() => Math.random() > 0.4);
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

    const filteredProducts = formattedProducts.filter((product: any) => {
      let matchesSize = true;
      let matchesBudget = true;
      let matchesCategory = true;

      if (userSizes.length > 0) {
        matchesSize = product.sizes.some((size: string) => userSizes.includes(size));
      }

      if (maxBudget !== null && !Number.isNaN(maxBudget)) {
        matchesBudget = product.price <= maxBudget;
      }

      if (preferredCategories.length > 0) {
        matchesCategory = preferredCategories.includes(product.category);
      }

      return matchesSize && matchesBudget && matchesCategory;
    });

    if (cleanSearchQuery) {
      filteredProducts.sort((a: any, b: any) => {
        const aTitleMatch = a.name.toLowerCase().includes(cleanSearchQuery);
        const aCategoryMatch = a.category.toLowerCase().includes(cleanSearchQuery);
        const bTitleMatch = b.name.toLowerCase().includes(cleanSearchQuery);
        const bCategoryMatch = b.category.toLowerCase().includes(cleanSearchQuery);

        const aScore = (aTitleMatch ? 2 : 0) + (aCategoryMatch ? 1 : 0);
        const bScore = (bTitleMatch ? 2 : 0) + (bCategoryMatch ? 1 : 0);

        return bScore - aScore; // Descending order: highest score comes first
      });
    }

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
