import type { Product } from "./types";
import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { fetchProducts, useDebouncedValue } from "./client";
import type { ProductFilters, ProductSearchResult } from "./client";

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

function getFacetValues(facets: any[], field: string): string[] {
  const facet = facets.find((f) => f.field_name === field);
  if (!facet) return [];
  return facet.counts.map((c: any) => c.value).filter(Boolean);
}

function getPriceRanges(
  facets: any[]
): { label: string; min: number; max: number }[] {
  const facet = facets.find((f) => f.field_name === "price");
  if (!facet) return [];
  const values = facet.counts
    .map((c: any) => Number(c.value))
    .filter((v: number) => !isNaN(v));
  if (!values.length) return [];
  const min = Math.min(...values);
  const max = Math.max(...values);
  const ranges = [
    {
      label: `Under $${Math.ceil(min / 50) * 50}`,
      min,
      max: Math.ceil(min / 50) * 50,
    },
    {
      label: `$${Math.ceil(min / 50) * 50} - $${Math.floor(max / 2)}`,
      min: Math.ceil(min / 50) * 50,
      max: Math.floor(max / 2),
    },
    {
      label: `$${Math.floor(max / 2)} - $${Math.ceil(max / 50) * 50}`,
      min: Math.floor(max / 2),
      max: Math.ceil(max / 50) * 50,
    },
    {
      label: `$${Math.ceil(max / 50) * 50}+`,
      min: Math.ceil(max / 50) * 50,
      max: max,
    },
  ];
  return ranges;
}

export function App() {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 250);
  const [products, setProducts] = useState<Product[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [selectedCollections, setSelectedCollections] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedPrice, setSelectedPrice] = useState<{
    min: number;
    max: number;
  } | null>(null);
  const [facets, setFacets] = useState<any[]>([]);
  const loader = useRef<HTMLDivElement | null>(null);

  const filters = useMemo(
    () => ({
      collections: selectedCollections.length ? selectedCollections : undefined,
      tags: selectedTags.length ? selectedTags : undefined,
      price_min: selectedPrice?.min,
      price_max: selectedPrice?.max,
    }),
    [selectedCollections, selectedTags, selectedPrice]
  );

  const loadProducts = useCallback(
    async (reset = false) => {
      setLoading(true);
      const res: ProductSearchResult = await fetchProducts(
        debouncedQuery,
        reset ? 1 : page,
        filters
      );
      setProducts((prev) =>
        reset ? res.documents : [...prev, ...res.documents]
      );
      setHasMore(res.has_more);
      setFacets(res.facets || []);
      setLoading(false);
    },
    [debouncedQuery, page, filters]
  );

  useEffect(() => {
    setPage(1);
    loadProducts(true);
  }, [debouncedQuery, filters]);

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

  function toggleCollection(col: string) {
    setSelectedCollections((prev) =>
      prev.includes(col) ? prev.filter((c) => c !== col) : [...prev, col]
    );
  }
  function toggleTag(tag: string) {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }
  function selectPrice(range: { min: number; max: number } | null) {
    setSelectedPrice(range && selectedPrice !== range ? range : null);
  }

  const availableCollections = getFacetValues(facets, "collections");
  const availableTags = getFacetValues(facets, "tags");
  const priceRanges = getPriceRanges(facets);

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-3xl mx-auto mb-6">
        <input
          className="w-full p-3 rounded border border-gray-300 focus:outline-none focus:ring focus:ring-blue-200"
          placeholder="Search for product"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="flex flex-wrap gap-2 mt-4">
          {availableCollections.map((col) => (
            <button
              key={col}
              className={`px-3 py-1 rounded-full border text-sm ${selectedCollections.includes(col) ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-700 border-gray-300"}`}
              onClick={() => toggleCollection(col)}
            >
              {col}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {availableTags.map((tag) => (
            <button
              key={tag}
              className={`px-3 py-1 rounded-full border text-sm ${selectedTags.includes(tag) ? "bg-green-600 text-white border-green-600" : "bg-white text-gray-700 border-gray-300"}`}
              onClick={() => toggleTag(tag)}
            >
              {tag}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {priceRanges.map((range) => (
            <button
              key={range.label}
              className={`px-3 py-1 rounded-full border text-sm ${selectedPrice === range ? "bg-purple-600 text-white border-purple-600" : "bg-white text-gray-700 border-gray-300"}`}
              onClick={() => selectPrice(range)}
            >
              {range.label}
            </button>
          ))}
        </div>
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
