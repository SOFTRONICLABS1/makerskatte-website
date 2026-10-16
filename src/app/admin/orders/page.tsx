'use client';

import React, { useEffect, useMemo, useState } from 'react';
import AdminHeader from '@/app/admin/products/AdminHeader';
import { formatPrice } from '@/lib/format';

type OrderItemRow = {
  id: string;
  quantity: number;
  priceAtPurchase: number;
  product: { id: string; name: string; slug: string; imageUrl: string | null };
};

type OrderRow = {
  id: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string | null;
  customerName: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  message: string | null;
  total: number;
  createdAt: string;
  items: OrderItemRow[];
};

const statusOptions = ['created', 'paid', 'processing', 'dispatched', 'delivered', 'cancelled'] as const;

export default function AdminOrdersPage() {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [status, setStatus] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  async function load() {
    setLoading(true);
    setStatus('');
    try {
      const res = await fetch('/api/admin/orders', { cache: 'no-store' });
      const data = (await res.json()) as OrderRow[];
      if (!res.ok) throw new Error((data as any)?.error || 'Failed to load.');
      setOrders(data);
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Failed to load.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const totals = useMemo(() => {
    const open = orders.filter((o) => o.status !== 'delivered' && o.status !== 'cancelled').length;
    const paid = orders.filter((o) => o.paymentStatus === 'paid').length;
    return { open, paid, total: orders.length };
  }, [orders]);

  const filtered = useMemo(() => {
    const from = dateFrom ? new Date(`${dateFrom}T00:00:00`) : null;
    const to = dateTo ? new Date(`${dateTo}T23:59:59`) : null;
    return orders.filter((o) => {
      const d = new Date(o.createdAt);
      if (from && d < from) return false;
      if (to && d > to) return false;
      return true;
    });
  }, [orders, dateFrom, dateTo]);

  return (
    <div className="admin-shell">
      <AdminHeader subtitle="Track shop orders and update dispatch status." />

      <div className="admin-grid">
        <div className="admin-form" style={{ maxWidth: 1100 }}>
          <h2>Shop Orders</h2>
          <div className="muted-block">
            Total: <strong>{totals.total}</strong> · Open: <strong>{totals.open}</strong> · Paid: <strong>{totals.paid}</strong>
          </div>

          <div className="co-admin-actions">
            <button className="btn-outline" type="button" onClick={load} disabled={loading}>
              Refresh
            </button>
            <div className="co-date-filter">
              <label>
                From
                <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
              </label>
              <label>
                To
                <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
              </label>
              <button
                className="btn-outline"
                type="button"
                onClick={() => {
                  setDateFrom('');
                  setDateTo('');
                }}
              >
                Clear
              </button>
            </div>
          </div>

          {status ? <div className="form-error">{status}</div> : null}
          {loading ? <div className="muted-block">Loading…</div> : null}

          <div className="admin-list">
            {filtered.map((o) => {
              const orderedAt = new Date(o.createdAt);
              return (
                <div key={o.id} className="co-admin-item">
                  <div className="co-admin-main">
                    <div className="admin-title">
                      {(o.customerName || 'Customer') + ' · '}
                      <span style={{ color: 'var(--gold)' }}>{formatPrice(o.total)}</span>
                    </div>
                    <div className="admin-meta">
                      <div className="admin-meta-item">
                        Ordered: {isNaN(orderedAt.getTime()) ? '—' : orderedAt.toLocaleString()}
                      </div>
                      <div className="admin-meta-item">Order: {o.id}</div>
                      <div className="admin-meta-item">
                        Pay: {o.paymentStatus}
                        {o.paymentMethod ? ` (${o.paymentMethod})` : ''}
                      </div>
                      {o.email ? <div className="admin-meta-item">Email: {o.email}</div> : null}
                      {o.phone ? <div className="admin-meta-item">Phone: {o.phone}</div> : null}
                    </div>

                    <div className="co-admin-split">
                      <div className="co-admin-address">
                        {o.address ? (
                          <div className="muted-block" style={{ whiteSpace: 'pre-wrap' }}>
                            {o.address}
                          </div>
                        ) : (
                          <div className="muted-block">No address</div>
                        )}
                      </div>
                      <div className="co-admin-uploads">
                        <div className="muted-block">
                          {o.items.map((it) => (
                            <div key={it.id} style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8 }}>
                              <div style={{ width: 42, height: 42, borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border)' }}>
                                {it.product.imageUrl ? (
                                  <img src={it.product.imageUrl} alt={it.product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    {it.product.name.slice(0, 1).toUpperCase()}
                                  </div>
                                )}
                              </div>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 700, color: 'var(--text)' }}>{it.product.name}</div>
                                <div style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>
                                  Qty: {it.quantity} · {formatPrice(it.priceAtPurchase)}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="co-admin-actions-col">
                    <label style={{ margin: 0 }}>
                      Status
                      <select
                        value={o.status}
                        onChange={(e) => {
                          const next = e.target.value;
                          setOrders((prev) => prev.map((x) => (x.id === o.id ? { ...x, status: next } : x)));
                        }}
                        style={{ marginTop: 6 }}
                      >
                        {statusOptions.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </label>
                    <button
                      className="btn-primary"
                      type="button"
                      onClick={async () => {
                        setStatus('');
                        try {
                          const res = await fetch(`/api/admin/orders/${o.id}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ status: o.status })
                          });
                          const data = await res.json().catch(() => ({}));
                          if (!res.ok) throw new Error(data?.error || 'Failed to update.');
                        } catch (err) {
                          setStatus(err instanceof Error ? err.message : 'Failed to update.');
                        }
                      }}
                    >
                      Update
                    </button>
                    <button
                      className="btn-danger"
                      type="button"
                      onClick={async () => {
                        if (!confirm('Delete this order permanently?')) return;
                        setStatus('');
                        try {
                          const res = await fetch(`/api/admin/orders/${o.id}`, { method: 'DELETE' });
                          const data = await res.json().catch(() => ({}));
                          if (!res.ok) throw new Error(data?.error || 'Failed to delete.');
                          setOrders((prev) => prev.filter((x) => x.id !== o.id));
                        } catch (err) {
                          setStatus(err instanceof Error ? err.message : 'Failed to delete.');
                        }
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {filtered.length === 0 && !loading ? <div className="muted-block">No shop orders in this range.</div> : null}
        </div>
      </div>
    </div>
  );
}
