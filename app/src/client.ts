import type { Product } from "./types";
import { useEffect, useState } from "react";

export const PAGE_SIZE = 12;
export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

type SearchResponse = {
  documents: Product[];
  has_more: boolean;
  total: number;
}

export function fetchProducts(
  query: string,
  page: number
): Promise<SearchResponse> {
  const params = new URLSearchParams({
    q: query,
    page: String(page),
    pageSize: String(PAGE_SIZE),
  });
  return fetch(`${BACKEND_URL}/search?${params}`)
    .then((r) => r.json() as Promise<SearchResponse>);
}

export function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debounced;
}
