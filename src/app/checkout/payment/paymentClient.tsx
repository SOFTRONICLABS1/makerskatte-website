'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { clearCheckoutDraft, getDefaultCheckoutDraft, readCheckoutDraft, writeCheckoutDraft, type CheckoutDraft } from '@/lib/checkoutDraft';
import type { CartProduct } from '@/lib/cart';
import { formatPrice } from '@/lib/format';
import { useCart } from '@/app/providers';

type PaymentMethod = 'UPI' | 'Card' | 'NetBanking' | 'COD';

function formatAddress(draft: CheckoutDraft) {
  const parts = [
    draft.flat.trim(),
    draft.area.trim(),
    draft.landmark.trim() ? `Landmark: ${draft.landmark.trim()}` : '',
    `${draft.city.trim()}${draft.state.trim() ? `, ${draft.state.trim()}` : ''}`.trim(),
    draft.pincode.trim(),
    draft.country.trim()
  ].filter(Boolean);
  return parts.join('\n');
}

export default function CheckoutPaymentClient() {
  const router = useRouter();
  const cart = useCart();
  const [draft, setDraft] = useState<CheckoutDraft>(() => getDefaultCheckoutDraft());
  const [hydrated, setHydrated] = useState(false);
  const [products, setProducts] = useState<CartProduct[]>([]);
  const [loading, setLoading] = useState(true);

  const method: PaymentMethod = 'COD';
  const [placing, setPlacing] = useState(false);
  const [status, setStatus] = useState('');

  useEffect(() => {
    const d = readCheckoutDraft();
    setDraft(d);
    setHydrated(true);
    if (!d.items || d.items.length === 0) router.replace('/cart');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    writeCheckoutDraft(draft);
  }, [draft, hydrated]);

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

  const lines = useMemo(() => {
    const map = new Map(products.map((p) => [p.id, p]));
    return (draft.items ?? [])
      .map((it) => {
        const p = map.get(it.productId);
        if (!p) return null;
        return { product: p, quantity: it.quantity, total: p.price * it.quantity };
      })
      .filter((x): x is { product: CartProduct; quantity: number; total: number } => Boolean(x));
  }, [draft.items, products]);

  const subtotal = lines.reduce((s, l) => s + l.total, 0);
  const hasUnavailableItems = lines.some((line) => line.product.isComingSoon) || (hydrated && !loading && lines.length !== (draft.items ?? []).length);
  const shipping = subtotal >= 999 ? 0 : 99;
  const total = subtotal + shipping;

  const address = useMemo(() => formatAddress(draft), [draft]);

  return (
    <div className="checkout-layout" style={{ paddingTop: '2.2rem' }}>
      <div>
        <div className="form-card">
          <div className="co-pay-head">
            <div>
              <h2 style={{ marginTop: 0 }}>Delivering to {draft.fullName || 'Customer'}</h2>
              <div className="muted-block" style={{ whiteSpace: 'pre-wrap', marginTop: 10 }}>
                {address || '—'}
              </div>
              <button className="co-edit-link" type="button" onClick={() => router.push('/checkout/review')}>
                Change
              </button>
            </div>
          </div>
        </div>

        <div className="form-card">
          <h3>Payment method</h3>
          <div className="co-pay-methods">
            <label className="co-pay-opt selected">
              <input type="radio" name="paymethod" checked readOnly />
              <div className="co-pay-opt-body">
                <div className="co-pay-opt-title">Cash on Delivery / Pay on Delivery</div>
                <div className="co-pay-opt-desc">Only COD is currently available.</div>
              </div>
            </label>
          </div>
        </div>

        <div className="co-step-actions" style={{ justifyContent: 'space-between' }}>
          <button className="btn-outline" type="button" onClick={() => router.push('/checkout/review')} disabled={placing}>
            ← Back
          </button>
          <button
            className="btn-primary"
            type="button"
            disabled={placing || !hydrated || loading || lines.length === 0 || hasUnavailableItems}
            onClick={async () => {
              setPlacing(true);
              setStatus('Processing payment…');
              try {
                // Dummy payment: always succeeds after a short delay.
                await new Promise((r) => setTimeout(r, 650));

                const res = await fetch('/api/orders', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    items: draft.items,
                    status: 'created',
                    paymentStatus: 'unpaid',
                    paymentMethod: 'COD',
                    customerName: draft.fullName.trim(),
                    email: draft.email.trim(),
                    phone: draft.mobile.replace(/[^0-9]/g, '') || null,
                    address: address || null,
                    message: draft.deliveryInstructions.trim() || null
                  })
                });
                const data = await res.json().catch(() => ({}));
                if (!res.ok) throw new Error(data?.error || 'Failed to place order.');

                cart.clear();
                clearCheckoutDraft();
                setStatus('Payment successful!');
                router.push(`/checkout/success?orderId=${encodeURIComponent(data.orderId)}&total=${encodeURIComponent(String(total))}`);
              } catch (err) {
                setStatus(err instanceof Error ? err.message : 'Failed to place order.');
              } finally {
                setPlacing(false);
              }
            }}
          >
            {placing ? 'Please wait…' : 'Use this payment method'}
          </button>
        </div>

        {status ? <div className="muted-block">{status}</div> : null}
        {hasUnavailableItems ? <div className="form-error" role="alert">A product is coming soon or unavailable. Return to your cart and remove it.</div> : null}
      </div>

      <div className="order-summary">
        <div className="os-title">Summary</div>
        {loading ? <div className="muted-block">Loading items…</div> : null}
        {lines.map((l) => (
          <div key={l.product.id} className="os-row">
            <div className="label">
              {l.product.name} × {l.quantity}
            </div>
            <div className="val">{formatPrice(l.total)}</div>
          </div>
        ))}
        <div className="os-row">
          <div className="label">Subtotal</div>
          <div className="val">{formatPrice(subtotal)}</div>
        </div>
        <div className="os-row free">
          <div className="label">Shipping</div>
          <div className="val">{shipping === 0 ? 'Free' : formatPrice(shipping)}</div>
        </div>
        <div className="os-total">
          <div className="label">Order Total</div>
          <div className="val">{formatPrice(total)}</div>
        </div>
      </div>
    </div>
  );
}
