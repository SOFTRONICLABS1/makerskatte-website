'use client';

import React from 'react';
import Link from 'next/link';
import { formatPrice } from '../lib/format';
import { useCart } from '@/app/providers';

type Props = {
  name: string;
  price: number;
  href?: string;
  productId: string;
  imageUrl?: string | null;
  stock: number;
  isComingSoon?: boolean;
};

export default function RelatedProductCard({ name, price, href, productId, imageUrl, stock, isComingSoon = false }: Props) {
  const cart = useCart();
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
      </div>
      <div className="product-info">
        <div className="p-name">{href ? <Link href={href}>{name}</Link> : name}</div>
        <div className="p-footer">
          <span className="price">{formatPrice(price)}</span>
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
