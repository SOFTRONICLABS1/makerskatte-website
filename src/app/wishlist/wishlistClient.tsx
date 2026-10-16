'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Breadcrumb from '@/components/Breadcrumb';
import Layout from '@/components/Layout';
import { useCart, useFavorites } from '@/app/providers';
import { formatPrice } from '@/lib/format';
import { isFavorite } from '@/lib/favorites';
import type { CartProduct } from '@/lib/cart';

type Line = {
  product: CartProduct;
};

export default function WishlistClient() {
  const cart = useCart();
  const favorites = useFavorites();
  const [products, setProducts] = useState<CartProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch('/api/products', { cache: 'no-store' });
        const data = (await res.json()) as CartProduct[];
        if (!cancelled) setProducts(data);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const lines = useMemo<Line[]>(() => {
    if (!favorites.hydrated) return [];
    const ids = new Set(favorites.state.productIds);
    return products
      .filter((product) => ids.has(product.id))
      .map((product) => ({ product }));
  }, [favorites.hydrated, favorites.state.productIds, products]);

  return (
    <Layout announcement="🔥 Free shipping above ₹999 | COD Available">
      <Breadcrumb items={[{ label: 'Home', to: '/' }, { label: 'Wishlist' }]} />

      <div className="checkout-layout">
        <div>
          <div className="cart-section">
            <h2>Wishlist ({favorites.count} Items)</h2>

            {!favorites.hydrated || loading ? <div className="muted-block">Loading wishlist...</div> : null}

            {favorites.hydrated && !loading && favorites.count === 0 ? (
              <div className="muted-block">
                Your wishlist is empty. <a href="/shop">Go to Shop</a>
              </div>
            ) : null}

            {lines.map(({ product }) => {
              const fav = favorites.hydrated ? isFavorite(favorites.state, product.id) : false;
              return (
                <div key={product.id} className="cart-item">
                  <div className="ci-img">
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt={product.name} />
                    ) : (
                      <span aria-hidden="true">{product.name?.trim()?.slice(0, 1).toUpperCase() || '•'}</span>
                    )}
                  </div>
                  <div>
                    <div className="ci-name">{product.name}</div>
                    <div className="ci-meta">{product.material ?? 'Premium engraving'}</div>
                    <div className="ci-actions">
                      {product.isComingSoon ? <span className="coming-soon-label">Coming Soon</span> : <button
                        className="btn-primary"
                        type="button"
                        disabled={(product.stock ?? 0) <= 0}
                        onClick={() => {
                          cart.add(product.id, 1, product.stock ?? 0);
                        }}
                      >
                        Add to Cart
                      </button>}
                      <button
                        className="ci-remove"
                        type="button"
                        onClick={() => {
                          favorites.toggle(product.id);
                        }}
                      >
                        {fav ? 'Remove' : 'Add'}
                      </button>
                    </div>
                  </div>
                  <div className="ci-right">
                    <div className="ci-price">{formatPrice(product.price)}</div>
                    {product.originalPrice ? <div className="ci-old">{formatPrice(product.originalPrice)}</div> : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="order-summary">
          <div className="os-title">Wishlist Actions</div>
          <button className="btn-outline" type="button" onClick={() => favorites.clear()} disabled={favorites.count === 0}>
            Clear Wishlist
          </button>
          <div className="secure-note">Saved items are stored locally in this browser.</div>
        </div>
      </div>
    </Layout>
  );
}
