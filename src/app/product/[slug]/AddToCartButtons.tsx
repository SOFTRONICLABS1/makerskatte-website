'use client';

import React, { useState } from 'react';
import { useCart, useFavorites } from '@/app/providers';
import { useRouter } from 'next/navigation';
import { isFavorite } from '@/lib/favorites';

export default function AddToCartButtons({ productId, stock, isComingSoon = false }: { productId: string; stock: number; isComingSoon?: boolean }) {
  const cart = useCart();
  const favorites = useFavorites();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const fav = favorites.hydrated ? isFavorite(favorites.state, productId) : false;
  const outOfStock = stock <= 0;

  return (
    <div className="action-btns">
      <button
        className="btn-cart"
        type="button"
        disabled={busy || outOfStock || isComingSoon}
        onClick={() => {
          setBusy(true);
          cart.add(productId, 1, stock);
          setTimeout(() => setBusy(false), 200);
        }}
      >
        {isComingSoon ? 'Coming Soon' : outOfStock ? 'Out of Stock' : 'Add to Cart'}
      </button>
      <button
        className="btn-buy"
        type="button"
        disabled={outOfStock || isComingSoon}
        onClick={() => {
          cart.add(productId, 1, stock);
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
  );
}
