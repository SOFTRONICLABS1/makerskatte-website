'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart, useFavorites } from '@/app/providers';
import { isFavorite } from '@/lib/favorites';

export default function ProductPurchase({
  productId,
  stock,
  isComingSoon = false
}: {
  productId: string;
  stock: number;
  isComingSoon?: boolean;
}) {
  const cart = useCart();
  const favorites = useFavorites();
  const router = useRouter();

  const [qty, setQty] = useState(1);
  const [busy, setBusy] = useState(false);

  const safeStock = useMemo(() => {
    const n = typeof stock === 'number' ? stock : Number(stock);
    if (!Number.isFinite(n)) return 0;
    return Math.max(0, Math.floor(n));
  }, [stock]);

  useEffect(() => {
    // If stock drops below current qty, clamp it.
    setQty((q) => {
      if (safeStock <= 0) return 1;
      return Math.min(Math.max(1, q), safeStock);
    });
  }, [safeStock]);

  const outOfStock = safeStock <= 0;
  const cannotBuy = isComingSoon || outOfStock;
  const fav = favorites.hydrated ? isFavorite(favorites.state, productId) : false;

  const dec = () => setQty((q) => Math.max(1, q - 1));
  const inc = () => setQty((q) => Math.min(Math.max(1, safeStock), q + 1));

  return (
    <>
      {isComingSoon ? <div className="coming-soon-notice" role="status">Coming Soon — this product is not available to order yet.</div> : null}
      <div className="qty-row">
        <div className="qty-label">Quantity</div>
        <div className="qty-ctrl">
          <button className="qty-btn" type="button" onClick={dec} disabled={cannotBuy || qty <= 1}>
            −
          </button>
          <div className="qty-val">{outOfStock ? 0 : qty}</div>
          <button className="qty-btn" type="button" onClick={inc} disabled={cannotBuy || qty >= safeStock}>
            +
          </button>
        </div>
      </div>

      <div className="action-btns">
        <button
          className="btn-cart"
          type="button"
          disabled={busy || cannotBuy}
          onClick={() => {
            setBusy(true);
            cart.add(productId, qty, safeStock);
            setTimeout(() => setBusy(false), 200);
          }}
        >
          {isComingSoon ? 'Coming Soon' : outOfStock ? 'Out of Stock' : 'Add to Cart'}
        </button>
        <button
          className="btn-buy"
          type="button"
          disabled={cannotBuy}
          onClick={() => {
            cart.add(productId, qty, safeStock);
            router.push('/cart');
          }}
        >
          {isComingSoon ? 'Coming Soon' : 'Checkout'}
        </button>
        <button
          className="btn-wish"
          type="button"
          aria-label={fav ? 'Remove from favorites' : 'Add to favorites'}
          onClick={() => favorites.toggle(productId)}
        >
          {fav ? '♥' : '♡'}
        </button>
      </div>
    </>
  );
}
