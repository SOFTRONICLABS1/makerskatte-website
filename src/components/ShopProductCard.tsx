'use client';

import React from 'react';
import Link from 'next/link';
import { formatPrice } from '../lib/format';
import { useCart, useFavorites } from '@/app/providers';
import { isFavorite } from '@/lib/favorites';

type Props = {
  name: string;
  material: string;
  price: number;
  oldPrice?: number | null;
  badge?: string;
  rating: number;
  reviews: number;
  wish?: boolean;
  href?: string;
  productId: string;
  imageUrl?: string | null;
  stock: number;
  isComingSoon?: boolean;
};

export default function ShopProductCard({
  name,
  material,
  price,
  oldPrice,
  badge,
  rating,
  reviews,
  wish,
  href,
  productId,
  imageUrl,
  stock,
  isComingSoon = false
}: Props) {
  const cart = useCart();
  const favorites = useFavorites();
  const stars = rating >= 4.8 ? '★★★★★' : rating >= 4.3 ? '★★★★☆' : rating >= 3.8 ? '★★★☆☆' : '★★☆☆☆';
  const fav = favorites.hydrated ? isFavorite(favorites.state, productId) : false;
  const fallback = name?.trim()?.slice(0, 1).toUpperCase() || '•';
  return (
    <div className="product-card">
      <div className={`product-img${imageUrl ? ' has-image' : ''}`}>
        {imageUrl ? (
          href ? (
            <Link href={href}>
              <img src={imageUrl} alt={name} loading="lazy" />
            </Link>
          ) : (
            <img src={imageUrl} alt={name} loading="lazy" />
          )
        ) : (
          <span className="product-fallback" aria-hidden="true">
            {fallback}
          </span>
        )}
        {isComingSoon ? <div className="p-badge">Coming Soon</div> : badge ? <div className={`p-badge${badge === 'New' ? ' p-new' : ''}`}>{badge}</div> : null}
        {wish ? (
          <button
            type="button"
            className="p-wish"
            aria-label={fav ? 'Remove from favorites' : 'Add to favorites'}
            onClick={() => favorites.toggle(productId)}
          >
            {fav ? '♥' : '♡'}
          </button>
        ) : null}
      </div>
      <div className="product-info">
        <div className="p-rating">
          <span className="stars-s">{stars}</span>
          <span className="rev-count">({reviews})</span>
        </div>
        <div className="p-name">{href ? <Link href={href}>{name}</Link> : name}</div>
        <div className="p-mat">{material}</div>
        <div className="p-footer">
          <div>
            <span className="price">{formatPrice(price)}</span>
            {oldPrice ? <span className="price-old">{formatPrice(oldPrice)}</span> : null}
          </div>
          {isComingSoon ? <span className="coming-soon-label">Coming Soon</span> : <button
            className="add-btn"
            type="button"
            onClick={() => {
              cart.add(productId, 1, stock);
            }}
            aria-label="Add to cart"
            disabled={stock <= 0}
          >
            +
          </button>}
        </div>
      </div>
    </div>
  );
}
