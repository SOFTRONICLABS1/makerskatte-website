'use client';

import React, { useEffect, useState } from 'react';
import AdminHeader from '@/app/admin/products/AdminHeader';

type PricingRow = { id?: string; name: string; price: number };
type PricingResponse = { materials: PricingRow[]; sizes: PricingRow[] };

export default function AdminCustomOrderPricingPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('');
  const [deleteIds, setDeleteIds] = useState<string[]>([]);
  const [data, setData] = useState<PricingResponse>({
    materials: [
      { name: 'Wood', price: 0 },
      { name: 'Acrylic', price: 0 },
      { name: 'Leather', price: 0 }
    ],
    sizes: [
      { name: 'A5', price: 0 },
      { name: 'A4', price: 0 },
      { name: 'A3', price: 0 },
      { name: 'A2', price: 0 },
      { name: 'Custom', price: 0 }
    ]
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/custom-order-pricing', { cache: 'no-store' });
        const json = (await res.json()) as PricingResponse;
        if (!cancelled) setData(json);
      } catch {
        // keep defaults
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="admin-shell">
      <AdminHeader subtitle="Set custom order pricing for materials and sizes." />

      <div className="admin-grid">
        <div className="admin-form" style={{ maxWidth: 920 }}>
          <h2>Custom Order Pricing</h2>
          <div className="muted-block">
            Formula used on website:
            <strong> material base price + (size price × quantity)</strong>
          </div>

          {loading ? <div className="muted-block">Loading…</div> : null}

          <h3 style={{ marginTop: 16 }}>Material Base Prices (₹)</h3>
          <div className="admin-pricing-list">
            {data.materials.map((row, idx) => (
              <div key={`${row.id ?? 'new'}-${idx}`} className="admin-pricing-row">
                <input
                  type="text"
                  placeholder="Material name (e.g. Mirror)"
                  value={row.name}
                  onChange={(e) =>
                    setData((prev) => {
                      const next = { ...prev, materials: prev.materials.slice() };
                      next.materials[idx] = { ...next.materials[idx], name: e.target.value };
                      return next;
                    })
                  }
                />
                <input
                  type="number"
                  min={0}
                  value={row.price}
                  onChange={(e) => {
                    const n = Math.max(0, Math.floor(Number(e.target.value) || 0));
                    setData((prev) => {
                      const next = { ...prev, materials: prev.materials.slice() };
                      next.materials[idx] = { ...next.materials[idx], price: n };
                      return next;
                    });
                  }}
                />
                <button
                  type="button"
                  className="btn-danger"
                  onClick={() => {
                    if (data.materials.length <= 1) {
                      setStatus('Keep at least 1 material.');
                      return;
                    }
                    const id = row.id;
                    if (id) setDeleteIds((prev) => [...prev, id]);
                    setData((prev) => ({ ...prev, materials: prev.materials.filter((_, i) => i !== idx) }));
                  }}
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              type="button"
              className="btn-outline"
              onClick={() => setData((prev) => ({ ...prev, materials: [...prev.materials, { name: '', price: 0 }] }))}
            >
              + Add Material
            </button>
          </div>

          <h3 style={{ marginTop: 16 }}>Size Prices Per Quantity (₹)</h3>
          <div className="admin-pricing-list">
            {data.sizes.map((row, idx) => (
              <div key={`${row.id ?? 'new'}-${idx}`} className="admin-pricing-row">
                <input
                  type="text"
                  placeholder="Size name (e.g. A6)"
                  value={row.name}
                  onChange={(e) =>
                    setData((prev) => {
                      const next = { ...prev, sizes: prev.sizes.slice() };
                      next.sizes[idx] = { ...next.sizes[idx], name: e.target.value };
                      return next;
                    })
                  }
                />
                <input
                  type="number"
                  min={0}
                  value={row.price}
                  onChange={(e) => {
                    const n = Math.max(0, Math.floor(Number(e.target.value) || 0));
                    setData((prev) => {
                      const next = { ...prev, sizes: prev.sizes.slice() };
                      next.sizes[idx] = { ...next.sizes[idx], price: n };
                      return next;
                    });
                  }}
                />
                <button
                  type="button"
                  className="btn-danger"
                  onClick={() => {
                    if (data.sizes.length <= 1) {
                      setStatus('Keep at least 1 size.');
                      return;
                    }
                    const id = row.id;
                    if (id) setDeleteIds((prev) => [...prev, id]);
                    setData((prev) => ({ ...prev, sizes: prev.sizes.filter((_, i) => i !== idx) }));
                  }}
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              type="button"
              className="btn-outline"
              onClick={() => setData((prev) => ({ ...prev, sizes: [...prev.sizes, { name: '', price: 0 }] }))}
            >
              + Add Size
            </button>
          </div>

          <button
            className="btn-primary"
            type="button"
            disabled={saving}
            onClick={async () => {
              setSaving(true);
              setStatus('Saving…');
              try {
                const res = await fetch('/api/custom-order-pricing', {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ ...data, deleteIds })
                });
                const json = await res.json().catch(() => ({}));
                if (!res.ok) throw new Error(json?.error || 'Failed to save.');
                setStatus('Saved!');
                setDeleteIds([]);
              } catch (err) {
                setStatus(err instanceof Error ? err.message : 'Failed to save.');
              } finally {
                setSaving(false);
              }
            }}
          >
            {saving ? 'Saving…' : 'Save Pricing'}
          </button>

          {status ? <div className="form-success">{status}</div> : null}
        </div>
      </div>
    </div>
  );
}
