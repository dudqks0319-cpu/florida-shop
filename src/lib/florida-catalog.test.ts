import { describe, expect, it } from "vitest";
import { FLORIDA_PRODUCTS } from "./florida-products";
import { filterAndSortProducts, parseCatalogFilters, toCatalogQueryString } from "./florida-catalog";

describe("florida-catalog", () => {
  it("카테고리 + 검색어 + 가격 필터를 함께 적용한다", () => {
    const result = filterAndSortProducts(FLORIDA_PRODUCTS, {
      category: "영캐주얼",
      searchKeyword: "팬츠",
      sort: "recommend",
      minPrice: 30000,
      maxPrice: 50000,
    });

    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe("v2");
  });

  it("낮은가격순 정렬이 정상 동작한다", () => {
    const result = filterAndSortProducts(FLORIDA_PRODUCTS, {
      category: "전체",
      searchKeyword: "",
      sort: "price_low",
      minPrice: null,
      maxPrice: null,
    });

    expect(result[0]?.price).toBeLessThanOrEqual(result[1]?.price ?? Number.MAX_SAFE_INTEGER);
  });

  it("쿼리 파싱 시 잘못된 값은 기본값으로 정규화한다", () => {
    const parsed = parseCatalogFilters(
      new URLSearchParams({
        category: "알수없음",
        sort: "unknown",
        search: "  <후드>  ",
        minPrice: "30000",
        maxPrice: "10000",
      }),
    );

    expect(parsed.category).toBe("전체");
    expect(parsed.sort).toBe("recommend");
    expect(parsed.searchKeyword).toBe("후드");
    expect(parsed.minPrice).toBe(30000);
    expect(parsed.maxPrice).toBe(30000);
  });

  it("쿼리 문자열 생성 시 기본값은 생략한다", () => {
    const query = toCatalogQueryString({
      category: "전체",
      searchKeyword: "",
      sort: "recommend",
      minPrice: null,
      maxPrice: null,
    });

    expect(query).toBe("");
  });

  it("쿼리 문자열 생성 시 활성 필터만 포함한다", () => {
    const query = toCatalogQueryString({
      category: "잡화",
      searchKeyword: "   키링 ",
      sort: "price_high",
      minPrice: 10000,
      maxPrice: 50000,
    });

    const parsed = new URLSearchParams(query);
    expect(parsed.get("category")).toBe("잡화");
    expect(parsed.get("search")).toBe("키링");
    expect(parsed.get("sort")).toBe("price_high");
    expect(parsed.get("minPrice")).toBe("10000");
    expect(parsed.get("maxPrice")).toBe("50000");
  });
});
