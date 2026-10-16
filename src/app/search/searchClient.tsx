'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Breadcrumb from '@/components/Breadcrumb';
import Layout from '@/components/Layout';
import ShopProductCard from '@/components/ShopProductCard';

type Product = {
  id: string;
  name: string;
  slug: string;
  price: number;
  originalPrice: number | null;
  imageUrl?: string | null;
  material: string | null;
  category?: string | null;
  badge?: string | null;
  rating?: number | null;
  reviews?: number | null;
  stock?: number | null;
  isComingSoon?: boolean;
};

function normalize(text: string) {
  return text.toLowerCase().trim();
}

export default function SearchClient() {
  const params = useSearchParams();
  const q = params.get('q') ?? '';
  const query = normalize(q);

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    setLoading(true);
    setError('');
    async function load() {
      try {
        const res = await fetch('/api/products', { cache: 'no-store', signal: controller.signal });
        if (!res.ok) throw new Error('Products could not be loaded.');
        const data = (await res.json()) as Product[];
        if (!Array.isArray(data)) throw new Error('Invalid product response.');
        if (!cancelled) setProducts(data);
      } catch {
        if (!cancelled) setError('Unable to load products. Please try again.');
      } finally {
        clearTimeout(timeout);
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
      controller.abort();
      clearTimeout(timeout);
    };
  }, [attempt]);

  const results = useMemo(() => {
    if (!query) return [];
    return products.filter((p) => {
      const hay = normalize(
        [p.name, p.material ?? '', p.category ?? '', p.slug].filter(Boolean).join(' ')
      );
      return hay.includes(query);
    });
  }, [products, query]);

  return (
    <Layout announcement="🔥 Free shipping above ₹999 | COD Available">
      <Breadcrumb items={[{ label: 'Home', to: '/' }, { label: 'Search' }]} />

      <div className="page-hero">
        <div className="eyebrow">Search</div>
        <h1>
          Results for <span>{q || '...'}</span>
        </h1>
        <p>{loading ? 'Searching...' : error ? 'Search unavailable' : `${results.length} match(es) found`}</p>
      </div>

      <div style={{ padding: '2rem 5%' }}>
        {error ? <div className="muted-block" role="alert">{error} <button type="button" className="btn-outline" onClick={() => setAttempt((value) => value + 1)}>Try again</button></div> : null}
        {!query ? <div className="muted-block">Type in the search box and press Enter.</div> : null}
        {query && !loading && !error && results.length === 0 ? <div className="muted-block">No products found.</div> : null}

        <div className="products-grid" style={{ marginTop: '1.5rem' }}>
          {results.map((product) => (
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
              imageUrl={product.imageUrl ?? null}
              stock={product.stock ?? 0}
              isComingSoon={product.isComingSoon}
            />
          ))}
        </div>
      </div>
    </Layout>
  );
}
