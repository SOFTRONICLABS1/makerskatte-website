'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminHeader from './AdminHeader';
import type { AdminProduct } from './adminUtils';
import { parseImageUrls } from './adminUtils';

export default function ProductsListClient({ initialProducts }: { initialProducts: AdminProduct[] }) {
  const router = useRouter();
  const [products, setProducts] = useState<AdminProduct[]>(initialProducts);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    for (const product of products) {
      const key = product.category?.trim() || 'Uncategorized';
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [products]);

  const visibleProducts = useMemo(() => {
    if (activeCategory === 'all') return products;
    return products.filter((p) => (p.category?.trim() || 'Uncategorized') === activeCategory);
  }, [products, activeCategory]);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this product?')) return;
    setBusyId(id);
    try {
      const response = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      if (response.ok) {
        setProducts((prev) => prev.filter((p) => p.id !== id));
      }
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="admin-shell">
      <AdminHeader subtitle="All products (with primary images)." />

      <div className="admin-category-filter">
        <button
          type="button"
          className={`admin-category-chip ${activeCategory === 'all' ? 'active' : ''}`}
          onClick={() => setActiveCategory('all')}
        >
          All ({products.length})
        </button>
        {categories.map((category) => (
          <button
            key={category.name}
            type="button"
            className={`admin-category-chip ${activeCategory === category.name ? 'active' : ''}`}
            onClick={() => setActiveCategory(category.name)}
          >
            {category.name} ({category.count})
          </button>
        ))}
      </div>

      {visibleProducts.length === 0 ? (
        <div className="admin-empty-state">No products in this category.</div>
      ) : (
        <div className="admin-products-grid">
          {visibleProducts.map((product) => {
          const urls = parseImageUrls(product);
          const primary = urls[0] ?? null;
          return (
            <div key={product.id} className="admin-product-card">
              <div className="admin-product-img">
                {primary ? <img src={primary} alt={product.name} /> : <div className="admin-product-fallback">No image</div>}
              </div>
              <div className="admin-product-body">
                <div className="admin-product-title">{product.name}</div>
                {product.isComingSoon ? <div className="coming-soon-label">Coming Soon</div> : null}
                <div className="admin-product-meta">
                  {product.category ?? 'Uncategorized'}
                  {product.subcategory ? ` / ${product.subcategory}` : ''}
                  {' · '}₹{product.price} · Stock: {product.stock}
                </div>
                <div className="admin-product-actions">
                  <button
                    type="button"
                    className="btn-outline"
                    onClick={() => router.push(`/admin/products/${product.id}/edit`)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="btn-danger"
                    onClick={() => handleDelete(product.id)}
                    disabled={busyId === product.id}
                  >
                    {busyId === product.id ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            </div>
          );
          })}
        </div>
      )}
    </div>
  );
}
