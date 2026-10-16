'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Layout from '@/components/Layout';
import Breadcrumb from '@/components/Breadcrumb';
import { useCart } from '@/app/providers';
import { formatPrice } from '@/lib/format';
import type { CartProduct } from '@/lib/cart';
import { readCheckoutDraft, writeCheckoutDraft } from '@/lib/checkoutDraft';
import { useRouter } from 'next/navigation';

type Line = {
  product: CartProduct;
  quantity: number;
  total: number;
};

export default function CartClient() {
  const cart = useCart();
  const router = useRouter();
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
    const map = new Map(products.map((p) => [p.id, p]));
    return cart.state.items
      .map((item) => {
        const product = map.get(item.productId);
        if (!product) return null;
        return { product, quantity: item.quantity, total: product.price * item.quantity };
      })
      .filter((line): line is Line => Boolean(line));
  }, [cart.state.items, products]);

  const subtotal = lines.reduce((sum, line) => sum + line.total, 0);
  const unavailableLines = lines.filter((line) => line.product.isComingSoon);
  const missingProducts = cart.state.items.length !== lines.length;

  return (
    <Layout announcement="🔥 Free shipping above ₹999 | COD Available">
      <Breadcrumb items={[{ label: 'Home', to: '/' }, { label: 'Shop', to: '/shop' }, { label: 'Cart' }]} />

      <div className="checkout-layout">
        <div>
          <div className="cart-section">
            <h2>Your Cart ({cart.count} Items)</h2>

            {!cart.hydrated || loading ? <div className="muted-block">Loading cart...</div> : null}

            {cart.hydrated && !loading && cart.count === 0 ? (
              <div className="muted-block">
                Your cart is empty. <a href="/shop">Go to Shop</a>
              </div>
            ) : null}

            {lines.map((line) => (
              <div key={line.product.id} className="cart-item">
                <div className="ci-img">
                  {line.product.imageUrl ? (
                    <img src={line.product.imageUrl} alt={line.product.name} />
                  ) : (
                    <span aria-hidden="true">{line.product.name?.trim()?.slice(0, 1).toUpperCase() || '•'}</span>
                  )}
                </div>
                <div>
                  <div className="ci-name">{line.product.name}</div>
                  {line.product.isComingSoon ? <div className="coming-soon-label">Coming Soon — remove this item to check out.</div> : null}
                  <div className="ci-meta">{line.product.material ?? 'Premium engraving'}</div>
                  <div className="ci-actions">
                    <div className="qty-ctrl">
                      <button
                        className="qty-btn"
                        type="button"
                        onClick={() => cart.setQuantity(line.product.id, Math.max(1, line.quantity - 1), line.product.stock ?? 0)}
                      >
                        −
                      </button>
                      <div className="qty-num">{line.quantity}</div>
                      <button
                        className="qty-btn"
                        type="button"
                        disabled={(line.product.stock ?? 0) > 0 ? line.quantity >= (line.product.stock ?? 0) : true}
                        onClick={() => cart.setQuantity(line.product.id, line.quantity + 1, line.product.stock ?? 0)}
                      >
                        +
                      </button>
                    </div>
                    <button className="ci-remove" type="button" onClick={() => cart.remove(line.product.id)}>
                      Remove
                    </button>
                  </div>
                  {typeof line.product.stock === 'number' ? (
                    <div className="ci-meta">Stock available: {line.product.stock}</div>
                  ) : null}
                </div>
                <div className="ci-right">
                  <div className="ci-price">{formatPrice(line.product.price)}</div>
                  {line.product.originalPrice ? <div className="ci-old">{formatPrice(line.product.originalPrice)}</div> : null}
                  <div className="ci-save">Line total: {formatPrice(line.total)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="order-summary">
          <div className="os-title">Order Summary</div>
          <div className="os-row">
            <div className="label">Subtotal</div>
            <div className="val">{formatPrice(subtotal)}</div>
          </div>
          <div className="os-row free">
            <div className="label">Shipping</div>
            <div className="val">{subtotal >= 999 ? 'Free' : formatPrice(99)}</div>
          </div>
          <div className="os-total">
            <div className="label">Total</div>
            <div className="val">{formatPrice(subtotal + (subtotal >= 999 ? 0 : 99))}</div>
          </div>
          <button
            className="place-order-btn"
            type="button"
            disabled={cart.count === 0 || loading || unavailableLines.length > 0 || missingProducts}
            onClick={async () => {
              // Persist snapshot of items for the checkout flow.
              const draft = readCheckoutDraft();
              writeCheckoutDraft({ ...draft, items: cart.state.items });
              router.push('/checkout/review');
            }}
          >
            Place Order
          </button>
          {!loading && unavailableLines.length > 0 ? <div className="form-error" role="alert">Coming Soon products cannot be ordered. Remove them from your cart to continue.</div> : null}
          <button className="btn-outline" type="button" onClick={() => cart.clear()} disabled={cart.count === 0}>
            Clear Cart
          </button>
        </div>
      </div>
    </Layout>
  );
}
