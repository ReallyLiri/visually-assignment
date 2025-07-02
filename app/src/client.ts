import type { Product } from "./types";
import { useEffect, useState } from "react";

export const PAGE_SIZE = 12;
export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export interface ProductFilters {
  collections?: string[];
  tags?: string[];
  price_min?: number;
  price_max?: number;
}

export interface ProductSearchResult {
  documents: Product[];
  has_more: boolean;
  total: number;
  facets: any[];
}

export function fetchProducts(
  query: string,
  page: number,
  filters: ProductFilters = {}
): Promise<ProductSearchResult> {
  const params = new URLSearchParams({
    q: query,
    page: String(page),
    pageSize: String(PAGE_SIZE),
  });
  if (filters.collections && filters.collections.length > 0) {
    filters.collections.forEach((c) => params.append("collections", c));
  }
  if (filters.tags && filters.tags.length > 0) {
    filters.tags.forEach((t) => params.append("tags", t));
  }
  if (filters.price_min !== undefined) {
    params.append("price_min", String(filters.price_min));
  }
  if (filters.price_max !== undefined) {
    params.append("price_max", String(filters.price_max));
  }
  return fetch(`${BACKEND_URL}/search?${params}`).then((r) => r.json());
}

export function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debounced;
}
