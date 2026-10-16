'use client';

import React, { useEffect, useMemo, useState } from 'react';
import AdminHeader from '@/app/admin/products/AdminHeader';

type CustomOrderRow = {
  id: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string | null;
  name: string;
  email: string;
  phone: string | null;
  material: string | null;
  size: string | null;
  quantity: number | null;
  address: string | null;
  message: string | null;
  fileName: string | null;
  estimatedTotal: number | null;
  createdAt: string;
};

const statusOptions = ['created', 'paid', 'processing', 'design_sent', 'approved', 'dispatched', 'delivered', 'cancelled'] as const;

function parseUploads(fileName: string | null): string[] {
  if (!fileName) return [];
  const raw = fileName.trim();
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.filter((u) => typeof u === 'string');
  } catch {
    // ignore
  }
  return [];
}

export default function AdminCustomOrdersPage() {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<CustomOrderRow[]>([]);
  const [status, setStatus] = useState('');
  const [enabled, setEnabled] = useState(true);
  const [disabledMessage, setDisabledMessage] = useState(
    'We are currently not accepting custom orders. You can contact us on +91 8095047273.'
  );
  const [instagramUsername, setInstagramUsername] = useState('');
  const [savingSettings, setSavingSettings] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  async function load() {
    setLoading(true);
    setStatus('');
    try {
      const res = await fetch('/api/admin/custom-orders', { cache: 'no-store' });
      const data = (await res.json()) as CustomOrderRow[];
      if (!res.ok) throw new Error((data as any)?.error || 'Failed to load.');
      setOrders(data);

      const settingsRes = await fetch('/api/admin/custom-order-settings', { cache: 'no-store' });
      const settingsData = await settingsRes.json().catch(() => ({}));
      if (settingsRes.ok) {
        setEnabled(Boolean(settingsData?.enabled));
        if (typeof settingsData?.message === 'string' && settingsData.message.trim()) {
          setDisabledMessage(settingsData.message);
        }
        if (typeof settingsData?.instagramUsername === 'string') {
          setInstagramUsername(settingsData.instagramUsername);
        }
      }
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
      <AdminHeader subtitle="Track custom orders and update dispatch status." />

      <div className="custom-orders-admin">
        <section className="admin-form custom-orders-settings">
          <div className="custom-orders-settings-head">
            <h2>Custom Order Intake</h2>
            <span className={`custom-orders-pill ${enabled ? 'on' : 'off'}`}>{enabled ? 'ON' : 'OFF'}</span>
          </div>
          <p className="custom-orders-settings-sub">Control whether customers can place new custom orders.</p>
          <div className="custom-orders-toggle-row">
            <span className="custom-orders-toggle-label">Accept New Custom Orders</span>
            <label className="custom-orders-switch" aria-label="Accept custom orders toggle">
              <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
              <span className="custom-orders-slider" />
            </label>
          </div>
          <label>Message shown when OFF</label>
          <textarea
            value={disabledMessage}
            onChange={(e) => setDisabledMessage(e.target.value)}
            rows={3}
            placeholder="Currently not accepting custom orders. Contact us on ..."
          />
          <label htmlFor="instagram-username">Instagram username for custom-order messages</label>
          <input
            id="instagram-username"
            type="text"
            value={instagramUsername}
            onChange={(e) => setInstagramUsername(e.target.value)}
            placeholder="@yourbusiness"
            autoComplete="off"
          />
          <p className="custom-orders-settings-sub">Enter your Instagram username or profile URL. Leave blank to hide the message button.</p>
          <div className="custom-orders-settings-actions">
            <button
              className="btn-primary"
              type="button"
              disabled={savingSettings}
              onClick={async () => {
                setSavingSettings(true);
                setStatus('');
                try {
                  const res = await fetch('/api/admin/custom-order-settings', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ enabled, message: disabledMessage, instagramUsername })
                  });
                  const data = await res.json().catch(() => ({}));
                  if (!res.ok) throw new Error(data?.error || 'Failed to save settings.');
                  setInstagramUsername(data.instagramUsername ?? '');
                  setStatus(`Settings updated: custom orders ${enabled ? 'ON' : 'OFF'}.`);
                } catch (err) {
                  setStatus(err instanceof Error ? err.message : 'Failed to save settings.');
                } finally {
                  setSavingSettings(false);
                }
              }}
            >
              {savingSettings ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </section>

        <section className="admin-form custom-orders-list-wrap">
          <div className="custom-orders-list-head">
            <h2>Custom Orders</h2>
            <div className="muted-block">
              Total: <strong>{totals.total}</strong> · Open: <strong>{totals.open}</strong> · Paid: <strong>{totals.paid}</strong>
            </div>
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
              const uploads = parseUploads(o.fileName);
              const orderedAt = new Date(o.createdAt);
              return (
                <div key={o.id} className="co-admin-item">
                  <div className="co-admin-main">
                    <div className="admin-title">
                      {o.name} · <span style={{ color: 'var(--gold)' }}>₹{o.estimatedTotal ?? 0}</span>
                    </div>
                    <div className="admin-meta">
                      <div className="admin-meta-item">
                        Ordered: {isNaN(orderedAt.getTime()) ? '—' : orderedAt.toLocaleString()}
                      </div>
                      <div className="admin-meta-item">Order: {o.id}</div>
                      <div className="admin-meta-item">Material: {o.material ?? '—'}</div>
                      <div className="admin-meta-item">Size: {o.size ?? '—'}</div>
                      <div className="admin-meta-item">Qty: {o.quantity ?? 1}</div>
                      <div className="admin-meta-item">
                        Pay: {o.paymentStatus}
                        {o.paymentMethod ? ` (${o.paymentMethod})` : ''}
                      </div>
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
                        {uploads.length > 0 ? (
                          <div className="co-mini-previews">
                            {uploads.slice(0, 4).map((u) => (
                              <img key={u} src={u} alt="Upload" />
                            ))}
                          </div>
                        ) : (
                          <div className="muted-block">No uploads</div>
                        )}
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
                          const res = await fetch(`/api/admin/custom-orders/${o.id}`, {
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
                          const res = await fetch(`/api/admin/custom-orders/${o.id}`, { method: 'DELETE' });
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

          {filtered.length === 0 && !loading ? <div className="muted-block">No custom orders in this range.</div> : null}
        </section>
      </div>
    </div>
  );
}
