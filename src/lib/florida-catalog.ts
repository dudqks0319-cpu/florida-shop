import { FLORIDA_PRODUCTS, type FloridaCategory, type FloridaProduct } from "./florida-products";

export type SortKey = "recommend" | "price_low" | "price_high" | "review";

export const CATEGORY_LIST: FloridaCategory[] = ["전체", "구제", "영캐주얼", "잡화", "모자"];
export const SORT_KEYS: SortKey[] = ["recommend", "price_low", "price_high", "review"];

export type CatalogFilters = {
  category: FloridaCategory;
  searchKeyword: string;
  sort: SortKey;
  minPrice: number | null;
  maxPrice: number | null;
};

export const DEFAULT_CATALOG_FILTERS: CatalogFilters = {
  category: "전체",
  searchKeyword: "",
  sort: "recommend",
  minPrice: null,
  maxPrice: null,
};

function parseInteger(raw: string | null): number | null {
  if (!raw) return null;
  const value = Number.parseInt(raw, 10);
  if (!Number.isFinite(value) || value < 0) return null;
  return value;
}

function queryValue(query: URLSearchParams | Record<string, string | undefined>, key: string): string | null {
  if (query instanceof URLSearchParams) return query.get(key);
  const value = query[key];
  return typeof value === "string" ? value : null;
}

function sanitizeKeyword(raw: string | null): string {
  if (!raw) return "";
  return raw.replace(/[<>]/g, "").replace(/\s+/g, " ").trim().slice(0, 100);
}

export function parseCatalogFilters(query: URLSearchParams | Record<string, string | undefined>): CatalogFilters {
  const categoryRaw = queryValue(query, "category");
  const sortRaw = queryValue(query, "sort");
  const searchRaw = queryValue(query, "search");
  const minPriceRaw = queryValue(query, "minPrice");
  const maxPriceRaw = queryValue(query, "maxPrice");

  const category = CATEGORY_LIST.includes(categoryRaw as FloridaCategory) ? (categoryRaw as FloridaCategory) : DEFAULT_CATALOG_FILTERS.category;
  const sort = SORT_KEYS.includes(sortRaw as SortKey) ? (sortRaw as SortKey) : DEFAULT_CATALOG_FILTERS.sort;
  const minPrice = parseInteger(minPriceRaw);
  const maxPrice = parseInteger(maxPriceRaw);

  const normalizedMinPrice = minPrice;
  const normalizedMaxPrice = minPrice !== null && maxPrice !== null && maxPrice < minPrice ? minPrice : maxPrice;

  return {
    category,
    sort,
    searchKeyword: sanitizeKeyword(searchRaw),
    minPrice: normalizedMinPrice,
    maxPrice: normalizedMaxPrice,
  };
}

export function toCatalogQueryString(filters: CatalogFilters): string {
  const params = new URLSearchParams();

  if (filters.category !== DEFAULT_CATALOG_FILTERS.category) {
    params.set("category", filters.category);
  }
  if (filters.sort !== DEFAULT_CATALOG_FILTERS.sort) {
    params.set("sort", filters.sort);
  }
  if (filters.searchKeyword.trim()) {
    params.set("search", filters.searchKeyword.trim());
  }
  if (filters.minPrice !== null) {
    params.set("minPrice", String(filters.minPrice));
  }
  if (filters.maxPrice !== null) {
    params.set("maxPrice", String(filters.maxPrice));
  }

  return params.toString();
}

export function getProductRating(product: FloridaProduct) {
  return product.reviews.length ? product.reviews.reduce((acc, cur) => acc + cur.rating, 0) / product.reviews.length : 4.7;
}

export function getRecommendScore(product: FloridaProduct) {
  const badgeWeight = product.badge === "오늘출발" ? 5 : product.badge === "인기" ? 4 : product.badge === "재입고" ? 3 : 1;
  const reviewWeight = product.reviews.length;
  const discountWeight = product.discountRate || 0;
  return badgeWeight * 10 + reviewWeight * 2 + discountWeight;
}

export function filterAndSortProducts(products: FloridaProduct[], filters: CatalogFilters) {
  const keyword = filters.searchKeyword.trim().toLowerCase();

  const filtered = products.filter((product) => {
    const byCategory = filters.category === "전체" || product.category === filters.category;
    const byKeyword = !keyword || product.name.toLowerCase().includes(keyword) || product.desc.toLowerCase().includes(keyword);
    const byMinPrice = filters.minPrice === null || product.price >= filters.minPrice;
    const byMaxPrice = filters.maxPrice === null || product.price <= filters.maxPrice;
    return byCategory && byKeyword && byMinPrice && byMaxPrice;
  });

  if (filters.sort === "price_low") return [...filtered].sort((a, b) => a.price - b.price);
  if (filters.sort === "price_high") return [...filtered].sort((a, b) => b.price - a.price);
  if (filters.sort === "review") return [...filtered].sort((a, b) => b.reviews.length - a.reviews.length);

  return [...filtered].sort((a, b) => getRecommendScore(b) - getRecommendScore(a));
}

export function getTopPicks(products = FLORIDA_PRODUCTS, count = 3) {
  return [...products].sort((a, b) => getRecommendScore(b) - getRecommendScore(a)).slice(0, count);
}
