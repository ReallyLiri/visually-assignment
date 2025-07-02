import type { Product } from "./types";
import { useEffect, useRef, useState, useCallback } from "react";
import { fetchProducts, useDebouncedValue } from "./client";

function getImageSrc(product: Product): string {
  if (product.image?.src) return product.image.src;
  if (product.images && product.images.length > 0) return product.images[0].src;
  if (product.variants && product.variants[0]?.image?.src)
    return product.variants[0].image.src;
  return "https://via.placeholder.com/150?text=No+Image";
}

function getPrice(product: Product): { price: number; compareAt?: number } {
  if (product.variants && product.variants.length > 0) {
    const prices = product.variants.map((v) => v.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    if (min !== max) return { price: min, compareAt: max };
    return { price: min };
  }
  return { price: product.price };
}

const DEBOUNCE_MS = 250;

export function App() {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, DEBOUNCE_MS);
  const [products, setProducts] = useState<Product[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const loader = useRef<HTMLDivElement | null>(null);

  const loadProducts = useCallback(
    async (reset = false) => {
      setLoading(true);
      const res = await fetchProducts(debouncedQuery, reset ? 1 : page);
      setProducts((prev) =>
        reset ? res.documents : [...prev, ...res.documents]
      );
      setHasMore(res.has_more);
      setLoading(false);
    },
    [debouncedQuery, page]
  );

  useEffect(() => {
    setPage(1);
    loadProducts(true);
  }, [debouncedQuery]);

  useEffect(() => {
    if (!hasMore || loading) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setPage((p) => p + 1);
        }
      },
      { threshold: 1 }
    );
    if (loader.current) observer.observe(loader.current);
    return () => {
      if (loader.current) observer.unobserve(loader.current);
    };
  }, [hasMore, loading]);

  useEffect(() => {
    if (page === 1) return;
    loadProducts();
  }, [page]);

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-3xl mx-auto mb-6">
        <input
          className="w-full p-3 rounded border border-gray-300 focus:outline-none focus:ring focus:ring-blue-200"
          placeholder="Search for product"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 max-w-7xl mx-auto">
        {products.map((product) => {
          const imgSrc = getImageSrc(product);
          const { price, compareAt } = getPrice(product);
          const stock = product.inventoryQuantity;
          const color = product.variants?.[0]?.Color;
          return (
            <div
              key={product._id?.$oid || product.id}
              className="bg-white rounded-xl shadow flex flex-col items-center p-4 h-full min-h-[260px]"
            >
              <img
                src={imgSrc}
                alt={product.title}
                className="w-24 h-24 object-contain rounded mb-2 bg-gray-100"
                loading="lazy"
              />
              <div className="font-semibold text-center mb-1 line-clamp-2 min-h-[2.5em]">
                {product.title}
              </div>
              <div className="text-xs text-gray-500 mb-1">{stock} Items</div>
              {color && (
                <div className="text-xs text-gray-500 mb-1">Color: {color}</div>
              )}
              <div className="flex items-center gap-2 mb-1">
                <span className="font-bold text-lg">${price}</span>
                {compareAt && compareAt > price && (
                  <span className="text-gray-400 line-through text-base">
                    ${compareAt}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {loading && (
        <div className="flex justify-center my-6">
          <div className="w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      <div ref={loader} />
    </div>
  );
}
