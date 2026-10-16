'use client';

import MaterialIcon from '@/components/MaterialIcon';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getDefaultDraft, readDraft, writeDraft, type CustomOrderDraft } from '@/lib/customOrderDraft';

type PricingRow = { id?: string; name: string; price: number };
type PricingResponse = { materials: PricingRow[]; sizes: PricingRow[] };

export default function CustomOrderStep1Client() {
  const router = useRouter();
  // Avoid hydration mismatch: server render can't read localStorage.
  const [draft, setDraft] = useState<CustomOrderDraft>(() => getDefaultDraft());
  const [hydrated, setHydrated] = useState(false);
  const [pricing, setPricing] = useState<PricingResponse | null>(null);

  useEffect(() => {
    setDraft(readDraft());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    // keep storage in sync
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

  const materials = pricing?.materials ?? [];
  const sizes = pricing?.sizes ?? [];

  useEffect(() => {
    // If admin removed the currently selected option, fall back to the first available.
    if (materials.length > 0 && !materials.some((m) => m.name === draft.material)) {
      setDraft((prev) => ({ ...prev, material: materials[0].name }));
    }
    if (sizes.length > 0 && !sizes.some((s) => s.name === draft.size)) {
      setDraft((prev) => ({ ...prev, size: sizes[0].name }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pricing]);

  return (
    <div className="custom-layout">
      <div>
        <div className="form-card">
          <h3>Step 1: Choose Material</h3>
          <div className="material-grid">
            {materials.length === 0 ? <div className="muted-block">No materials set yet.</div> : null}
            {materials.map((item) => (
              <button
                key={item.name}
                type="button"
                className={`mat-option${draft.material === item.name ? ' selected' : ''}`}
                onClick={() => setDraft((prev) => ({ ...prev, material: item.name }))}
              >
                <span className="mat-icon">
                  <MaterialIcon name={item.name} />
                </span>
                <div className="mat-name">{item.name}</div>
                <div className="mat-price">Base ₹{item.price}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="form-card">
          <h3>📐 Step 1: Select Size</h3>
          <div className="size-grid">
            {sizes.length === 0 ? <div className="muted-block">No sizes set yet.</div> : null}
            {sizes.map((item) => (
              <button
                key={item.name}
                type="button"
                className={`size-option${draft.size === item.name ? ' selected' : ''}`}
                onClick={() => setDraft((prev) => ({ ...prev, size: item.name }))}
              >
                <div className="size-dim">{item.name}</div>
                <div className="size-cm">{item.name === 'Custom' ? 'Your dimensions' : 'Standard size'}</div>
                <div className="size-add">{item.price > 0 ? `+ ₹${item.price} / qty` : '+ ₹0 / qty'}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="co-step-actions">
          <button
            type="button"
            className="btn-primary"
            onClick={() => {
              writeDraft(draft);
              router.push('/custom-order/upload');
            }}
          >
            Continue →
          </button>
        </div>
      </div>

      <div className="side-summary">
        <div className="ss-card">
          <div className="ss-title">Your Selection</div>
          <div className="ss-row">
            <div className="lbl">Material</div>
            <div className="val">{draft.material}</div>
          </div>
          <div className="ss-row">
            <div className="lbl">Size</div>
            <div className="val">{draft.size}</div>
          </div>
          <div className="muted-block" style={{ marginTop: 12 }}>
            Next: upload your photo/design and add instructions.
          </div>
        </div>
      </div>
    </div>
  );
}
