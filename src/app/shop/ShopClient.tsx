'use client';

import { useMemo, useState } from 'react';
import ShopProductCard from '@/components/ShopProductCard';

type ShopProduct = {
  id: string;
  name: string;
  slug: string;
  badge: string | null;
  material: string | null;
  category: string | null;
  price: number;
  originalPrice: number | null;
  rating: number | null;
  reviews: number | null;
  imageUrl: string | null;
  stock: number;
  isComingSoon: boolean;
};

type CategoryCount = {
  name: string;
  count: number;
};

const ITEMS_PER_PAGE = 12;

function clampPrice(value: number, min: number, max: number) {
  if (Number.isNaN(value)) return min;
  return Math.min(max, Math.max(min, value));
}

export default function ShopClient({ products, categories, initialCategory = null }: { products: ShopProduct[]; categories: CategoryCount[]; initialCategory?: string | null }) {
  const sortedPrices = useMemo(
    () => products.map((p) => p.price).filter((p) => Number.isFinite(p)).sort((a, b) => a - b),
    [products]
  );
  const minProductPrice = sortedPrices.length ? sortedPrices[0] : 0;
  const maxProductPrice = sortedPrices.length ? sortedPrices[sortedPrices.length - 1] : 0;

  const [selectedCategory, setSelectedCategory] = useState<string | null>(initialCategory);
  const [minPrice, setMinPrice] = useState<number>(minProductPrice);
  const [maxPrice, setMaxPrice] = useState<number>(maxProductPrice);
  const [sortBy, setSortBy] = useState<'latest' | 'popular' | 'price-low' | 'price-high'>('latest');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    let next = [...products];
    if (selectedCategory) next = next.filter((p) => (p.category ?? 'Uncategorized') === selectedCategory);
    next = next.filter((p) => p.price >= minPrice && p.price <= maxPrice);

    if (sortBy === 'popular') next.sort((a, b) => (b.reviews ?? 0) - (a.reviews ?? 0));
    if (sortBy === 'price-low') next.sort((a, b) => a.price - b.price);
    if (sortBy === 'price-high') next.sort((a, b) => b.price - a.price);
    return next;
  }, [products, selectedCategory, minPrice, maxPrice, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const safePage = Math.min(page, totalPages);

  const pagedProducts = useMemo(() => {
    const start = (safePage - 1) * ITEMS_PER_PAGE;
    return filtered.slice(start, start + ITEMS_PER_PAGE);
  }, [filtered, safePage]);

  const setCategory = (category: string | null) => {
    setSelectedCategory(category);
    setPage(1);
  };

  const resetFilters = () => {
    setSelectedCategory(null);
    setMinPrice(minProductPrice);
    setMaxPrice(maxProductPrice);
    setPage(1);
  };

  return (
    <div className="shop-layout">
      <aside className="sidebar">
        <div className="filter-section">
          <div className="filter-title">Categories</div>
          <button
            type="button"
            className={`filter-option${selectedCategory === null ? ' checked' : ''}`}
            onClick={() => setCategory(null)}
          >
            <div>
              <div className="fo-check">{selectedCategory === null ? '✓' : ''}</div>
            </div>
            <div className="fo-label">All</div>
            <div className="fo-count">{products.length}</div>
          </button>
          {categories.map((cat) => (
            <button
              key={cat.name}
              type="button"
              className={`filter-option${selectedCategory === cat.name ? ' checked' : ''}`}
              onClick={() => setCategory(cat.name)}
            >
              <div>
                <div className="fo-check">{selectedCategory === cat.name ? '✓' : ''}</div>
              </div>
              <div className="fo-label">{cat.name}</div>
              <div className="fo-count">{cat.count}</div>
            </button>
          ))}
        </div>

        <div className="filter-section">
          <div className="filter-title">Price Range (₹)</div>
          <div className="price-range">
            <div className="price-inputs">
              <input
                type="number"
                value={minPrice}
                min={minProductPrice}
                max={maxPrice}
                onChange={(event) => {
                  const next = clampPrice(Number(event.target.value), minProductPrice, maxPrice);
                  setMinPrice(next);
                  setPage(1);
                }}
                placeholder="Min"
              />
              <input
                type="number"
                value={maxPrice}
                min={minPrice}
                max={maxProductPrice}
                onChange={(event) => {
                  const next = clampPrice(Number(event.target.value), minPrice, maxProductPrice);
                  setMaxPrice(next);
                  setPage(1);
                }}
                placeholder="Max"
              />
            </div>
            <input
              type="range"
              className="range-slider"
              min={minProductPrice}
              max={maxProductPrice}
              value={maxPrice}
              onChange={(event) => {
                const next = clampPrice(Number(event.target.value), minPrice, maxProductPrice);
                setMaxPrice(next);
                setPage(1);
              }}
            />
          </div>
        </div>

      </aside>

      <div className="products-area">
        <div className="shop-toolbar">
          <div className="result-count">
            Showing <strong>{filtered.length}</strong> products
          </div>
          <div className="toolbar-right">
            <select
              className="sort-select"
              value={sortBy}
              onChange={(event) => {
                setSortBy(event.target.value as 'latest' | 'popular' | 'price-low' | 'price-high');
                setPage(1);
              }}
            >
              <option value="popular">Sort: Popularity</option>
              <option value="latest">Sort: Latest</option>
              <option value="price-low">Sort: Price Low to High</option>
              <option value="price-high">Sort: Price High to Low</option>
            </select>
          </div>
        </div>

        <div className="active-filters">
          {selectedCategory ? (
            <div className="filter-tag">
              Category: {selectedCategory}
              <button onClick={() => setCategory(null)}>✕</button>
            </div>
          ) : null}
          {(minPrice !== minProductPrice || maxPrice !== maxProductPrice) && (
            <div className="filter-tag">
              ₹{minPrice} - ₹{maxPrice}
              <button
                onClick={() => {
                  setMinPrice(minProductPrice);
                  setMaxPrice(maxProductPrice);
                  setPage(1);
                }}
              >
                ✕
              </button>
            </div>
          )}
          {selectedCategory || minPrice !== minProductPrice || maxPrice !== maxProductPrice ? (
            <div className="filter-tag">
              Reset
              <button onClick={resetFilters}>↺</button>
            </div>
          ) : (
            <div className="filter-tag">All Products</div>
          )}
        </div>

        <div className="products-grid">
          {pagedProducts.map((product) => (
            <ShopProductCard
              key={product.id}
              badge={product.badge ?? undefined}
              name={product.name}
              material={product.material ?? 'Premium Engraving'}
              price={product.price}
              oldPrice={product.originalPrice}
              rating={product.rating ?? 4.5}
              reviews={product.reviews ?? 0}
              wish
              href={`/product/${product.slug}`}
              productId={product.id}
              imageUrl={product.imageUrl}
              stock={product.stock}
              isComingSoon={product.isComingSoon}
            />
          ))}
        </div>

        {filtered.length === 0 ? <div className="muted-block">No products found with current filters.</div> : null}

        {totalPages > 1 ? (
          <div className="pagination">
            <button type="button" className="pg-btn" onClick={() => setPage((p) => Math.max(1, p - 1))}>
              ‹
            </button>
            {Array.from({ length: totalPages }).map((_, index) => {
              const value = index + 1;
              return (
                <button
                  key={value}
                  type="button"
                  className={`pg-btn${safePage === value ? ' active' : ''}`}
                  onClick={() => setPage(value)}
                >
                  {value}
                </button>
              );
            })}
            <button type="button" className="pg-btn" onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
              ›
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
