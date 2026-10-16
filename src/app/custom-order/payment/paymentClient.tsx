'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { clearDraft, getDefaultDraft, readDraft, writeDraft, type CustomOrderDraft } from '@/lib/customOrderDraft';

type PricingRow = { id?: string; name: string; price: number };
type PricingResponse = { materials: PricingRow[]; sizes: PricingRow[] };

type PaymentMethod = 'UPI' | 'Card' | 'NetBanking' | 'COD';

function formatAddress(draft: CustomOrderDraft) {
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

export default function CustomOrderPaymentClient() {
  const router = useRouter();
  const [draft, setDraft] = useState<CustomOrderDraft>(() => getDefaultDraft());
  const [hydrated, setHydrated] = useState(false);
  const [pricing, setPricing] = useState<PricingResponse | null>(null);

  const method: PaymentMethod = 'COD';
  const [placing, setPlacing] = useState(false);
  const [status, setStatus] = useState('');

  useEffect(() => {
    const d = readDraft();
    setDraft(d);
    setHydrated(true);
    if (!d.material || !d.size) router.replace('/custom-order');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    writeDraft(draft);
  }, [draft, hydrated]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/custom-order-pricing', { cache: 'no-store' });
        const data = (await res.json()) as PricingResponse;
        if (!cancelled) setPricing(data);
      } catch {
        if (!cancelled) setPricing(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const total = useMemo(() => {
    const materialBase = pricing?.materials?.find((m) => m.name === draft.material)?.price ?? 0;
    const sizePrice = pricing?.sizes?.find((s) => s.name === draft.size)?.price ?? 0;
    const qty = Math.max(1, Math.floor(Number(draft.quantity) || 1));
    return materialBase + sizePrice * qty;
  }, [draft.material, draft.quantity, draft.size, pricing]);

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
              <button className="co-edit-link" type="button" onClick={() => router.push('/custom-order/review')}>
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
          <button className="btn-outline" type="button" onClick={() => router.push('/custom-order/review')} disabled={placing}>
            ← Back
          </button>
          <button
            className="btn-primary"
            type="button"
            disabled={placing}
            onClick={async () => {
              setPlacing(true);
              setStatus('Processing payment…');
              try {
                // Dummy payment: always succeeds after a short delay.
                await new Promise((r) => setTimeout(r, 650));

                const res = await fetch('/api/custom-orders', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    status: 'created',
                    paymentStatus: 'unpaid',
                    paymentMethod: 'COD',
                    name: draft.fullName.trim(),
                    email: draft.email.trim(),
                    phone: draft.mobile.replace(/[^0-9]/g, '') || null,
                    material: draft.material,
                    size: draft.size,
                    quantity: draft.quantity,
                    urgency: null,
                    address: address || null,
                    message: [draft.instructions.trim(), draft.deliveryInstructions.trim()].filter(Boolean).join('\n\n') || null,
                    fileUrls: draft.fileUrls,
                    estimatedTotal: total
                  })
                });
                const data = await res.json().catch(() => ({}));
                if (!res.ok) throw new Error(data?.error || 'Failed to place order.');

                clearDraft();
                setStatus('Payment successful!');
                router.push(`/custom-order/success?orderId=${encodeURIComponent(data.orderId)}&total=${encodeURIComponent(String(total))}`);
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
      </div>

      <div className="order-summary">
        <div className="os-title">Summary</div>
        <div className="os-row">
          <div className="label">Items</div>
          <div className="val">Custom Order</div>
        </div>
        <div className="os-row">
          <div className="label">Material</div>
          <div className="val">{draft.material}</div>
        </div>
        <div className="os-row">
          <div className="label">Size</div>
          <div className="val">{draft.size}</div>
        </div>
        <div className="os-row">
          <div className="label">Quantity</div>
          <div className="val">{draft.quantity}</div>
        </div>
        <div className="os-row free">
          <div className="label">Delivery</div>
          <div className="val">Free</div>
        </div>
        <div className="os-total">
          <div className="label">Order Total</div>
          <div className="val">₹{total}</div>
        </div>
      </div>
    </div>
  );
}
