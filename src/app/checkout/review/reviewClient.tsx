'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getDefaultCheckoutDraft, readCheckoutDraft, writeCheckoutDraft, type CheckoutDraft } from '@/lib/checkoutDraft';
import { useCart } from '@/app/providers';
import { formatPrice } from '@/lib/format';
import type { CartProduct } from '@/lib/cart';

type PinLookupResponse = { ok: boolean; city?: string; state?: string; error?: string };

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

export default function CheckoutReviewClient() {
  const router = useRouter();
  const cart = useCart();
  const [draft, setDraft] = useState<CheckoutDraft>(() => getDefaultCheckoutDraft());
  const [hydrated, setHydrated] = useState(false);

  const [products, setProducts] = useState<CartProduct[]>([]);
  const [loading, setLoading] = useState(true);

  const [pinStatus, setPinStatus] = useState('');
  const [pinBusy, setPinBusy] = useState(false);
  const [lastPinLookup, setLastPinLookup] = useState('');
  const [nextError, setNextError] = useState('');

  useEffect(() => {
    const d = readCheckoutDraft();
    const items = d.items.length > 0 ? d.items : cart.state.items;
    const next = { ...d, items };
    setDraft(next);
    setHydrated(true);
    writeCheckoutDraft(next);
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
    return draft.items
      .map((it) => {
        const p = map.get(it.productId);
        if (!p) return null;
        return { product: p, quantity: it.quantity, total: p.price * it.quantity };
      })
      .filter((x): x is { product: CartProduct; quantity: number; total: number } => Boolean(x));
  }, [draft.items, products]);

  const subtotal = lines.reduce((s, l) => s + l.total, 0);
  const hasUnavailableItems = lines.some((line) => line.product.isComingSoon) || (hydrated && !loading && lines.length !== draft.items.length);
  const total = subtotal + (subtotal >= 999 ? 0 : 99);

  const validation = useMemo(() => {
    const email = draft.email.trim();
    const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    const country = (draft.country || 'India').trim();
    const mobileDigits = draft.mobile.replace(/[^0-9]/g, '');
    const isIndia = country.toLowerCase() === 'india';
    const isMobileValid = isIndia ? /^[6-9][0-9]{9}$/.test(mobileDigits) : /^[0-9]{7,15}$/.test(mobileDigits);

    const pin = draft.pincode.replace(/[^0-9]/g, '');
    const isPincodeValid = isIndia ? /^[1-9][0-9]{5}$/.test(pin) : pin.length >= 3;

    const errors: Record<string, string> = {};
    if (draft.items.length === 0) errors.items = 'Your cart is empty.';
    if (!draft.fullName.trim()) errors.fullName = 'Full name is required.';
    if (!email) errors.email = 'Email is required.';
    else if (!isEmailValid) errors.email = 'Enter a valid email address.';
    if (!mobileDigits) errors.mobile = 'Mobile number is required.';
    else if (!isMobileValid) errors.mobile = isIndia ? 'Enter a valid 10-digit Indian mobile number.' : 'Enter a valid phone number.';
    if (!pin) errors.pincode = 'Pincode is required.';
    else if (!isPincodeValid) errors.pincode = isIndia ? 'Enter a valid 6-digit PIN code.' : 'Enter a valid postal code.';
    if (!draft.flat.trim()) errors.flat = 'Flat/House details are required.';
    if (!draft.area.trim()) errors.area = 'Area/Street is required.';
    if (!draft.city.trim()) errors.city = 'City is required.';
    if (!draft.state.trim()) errors.state = 'State is required.';

    return { isValid: Object.keys(errors).length === 0, errors, normalized: { email, country, mobileDigits, pincode: pin } };
  }, [draft]);

  useEffect(() => {
    const country = (draft.country || 'India').trim();
    const isIndia = country.toLowerCase() === 'india';
    const pin = draft.pincode.replace(/[^0-9]/g, '').slice(0, 6);
    if (!isIndia) return;
    if (pin.length !== 6) {
      setPinStatus('');
      setPinBusy(false);
      return;
    }
    if (!/^[1-9][0-9]{5}$/.test(pin)) {
      setPinStatus('Invalid PIN code.');
      setPinBusy(false);
      return;
    }
    if (pin === lastPinLookup) return;

    let cancelled = false;
    setPinBusy(true);
    setPinStatus('Fetching city/state…');
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/pincode-lookup?pincode=${encodeURIComponent(pin)}`, { cache: 'no-store' });
        const data = (await res.json().catch(() => ({}))) as PinLookupResponse;
        if (cancelled) return;
        if (!res.ok || !data.ok || !data.city || !data.state) {
          setPinStatus(data?.error || 'Pincode not found.');
          setPinBusy(false);
          return;
        }
        setLastPinLookup(pin);
        setDraft((prev) => ({ ...prev, city: data.city ?? prev.city, state: data.state ?? prev.state }));
        setPinStatus(`Auto-filled: ${data.city}, ${data.state}`);
        setPinBusy(false);
      } catch {
        if (cancelled) return;
        setPinStatus('Could not fetch city/state. Check internet and try again.');
        setPinBusy(false);
      }
    }, 350);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [draft.country, draft.pincode, lastPinLookup]);

  const addressPreview = useMemo(() => formatAddress(draft), [draft]);

  useEffect(() => {
    if (nextError) setNextError('');
    // Clear "cannot proceed" message as user edits details.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft]);

  return (
    <div className="checkout-layout" style={{ paddingTop: '2.2rem' }}>
      <div>
        <div className="form-card">
          <h3>Delivery Address</h3>

          <div className="form-grid-2">
            <div>
              <label>Country/Region</label>
              <select value={draft.country} onChange={(e) => setDraft((p) => ({ ...p, country: e.target.value }))}>
                <option>India</option>
              </select>
            </div>
            <div />
          </div>

          <label>Full name (First and Last name)</label>
          <input value={draft.fullName} onChange={(e) => setDraft((p) => ({ ...p, fullName: e.target.value }))} />
          {validation.errors.fullName ? <div className="field-err">{validation.errors.fullName}</div> : null}

          <label>Email</label>
          <input type="email" value={draft.email} onChange={(e) => setDraft((p) => ({ ...p, email: e.target.value }))} />
          {validation.errors.email ? <div className="field-err">{validation.errors.email}</div> : null}

          <label>Mobile number</label>
          <input
            type="tel"
            inputMode="numeric"
            value={draft.mobile}
            onChange={(e) =>
              setDraft((p) => {
                const digits = e.target.value.replace(/[^0-9]/g, '');
                const limited = p.country.toLowerCase() === 'india' ? digits.slice(0, 10) : digits.slice(0, 15);
                return { ...p, mobile: limited };
              })
            }
          />
          {validation.errors.mobile ? <div className="field-err">{validation.errors.mobile}</div> : null}

          <label>Pincode</label>
          <input
            type="text"
            inputMode="numeric"
            value={draft.pincode}
            onChange={(e) => setDraft((p) => ({ ...p, pincode: e.target.value.replace(/[^0-9]/g, '').slice(0, 6) }))}
          />
          {validation.errors.pincode ? <div className="field-err">{validation.errors.pincode}</div> : null}
          {pinStatus ? <div className="muted-block">{pinStatus}</div> : null}

          <label>Flat, House no., Building, Company, Apartment</label>
          <input value={draft.flat} onChange={(e) => setDraft((p) => ({ ...p, flat: e.target.value }))} />
          {validation.errors.flat ? <div className="field-err">{validation.errors.flat}</div> : null}

          <label>Area, Street, Sector, Village</label>
          <input value={draft.area} onChange={(e) => setDraft((p) => ({ ...p, area: e.target.value }))} />
          {validation.errors.area ? <div className="field-err">{validation.errors.area}</div> : null}

          <label>Landmark (optional)</label>
          <input value={draft.landmark} onChange={(e) => setDraft((p) => ({ ...p, landmark: e.target.value }))} />

          <div className="form-grid-2">
            <div>
              <label>Town/City</label>
              <input value={draft.city} onChange={(e) => setDraft((p) => ({ ...p, city: e.target.value }))} />
              {validation.errors.city ? <div className="field-err">{validation.errors.city}</div> : null}
            </div>
            <div>
              <label>State</label>
              <input value={draft.state} onChange={(e) => setDraft((p) => ({ ...p, state: e.target.value }))} />
              {validation.errors.state ? <div className="field-err">{validation.errors.state}</div> : null}
            </div>
          </div>

          <label>Delivery instructions (optional)</label>
          <textarea
            placeholder="Add preferences, access code, notes..."
            value={draft.deliveryInstructions}
            onChange={(e) => setDraft((p) => ({ ...p, deliveryInstructions: e.target.value }))}
          />

          <div className="muted-block" style={{ whiteSpace: 'pre-wrap' }}>
            <strong>Address preview</strong>
            {'\n'}
            {addressPreview || '—'}
          </div>

          <div className="co-step-actions" style={{ justifyContent: 'space-between' }}>
            <button className="btn-outline" type="button" onClick={() => router.push('/cart')}>
              ← Back to Cart
            </button>
            <button
              className="btn-primary"
              type="button"
              disabled={!hydrated || loading || hasUnavailableItems}
              onClick={() => {
                if (!validation.isValid) {
                  setNextError('Please complete all required delivery details before proceeding.');
                  return;
                }
                router.push('/checkout/payment');
              }}
            >
              Next →
            </button>
          </div>
          {nextError ? <div className="form-error">{nextError}</div> : null}
          {hasUnavailableItems ? <div className="form-error" role="alert">A product in your cart is coming soon or unavailable. Return to the cart and remove it.</div> : null}
          {validation.errors.items ? <div className="form-error">{validation.errors.items}</div> : null}
        </div>
      </div>

      <div className="order-summary">
        <div className="os-title">Order Summary</div>
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
          <div className="val">{subtotal >= 999 ? 'Free' : formatPrice(99)}</div>
        </div>
        <div className="os-total">
          <div className="label">Total</div>
          <div className="val">{formatPrice(total)}</div>
        </div>
      </div>
    </div>
  );
}
