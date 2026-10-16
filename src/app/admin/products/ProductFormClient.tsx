'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminHeader from './AdminHeader';
import type { AdminProduct, ProductFormState } from './adminUtils';
import { emptyProductForm, formFromProduct, slugify, PRODUCT_CATEGORIES } from './adminUtils';

export default function ProductFormClient({
  mode,
  initialProduct
}: {
  mode: 'create' | 'edit';
  initialProduct?: AdminProduct;
}) {
  const router = useRouter();
  const [form, setForm] = useState<ProductFormState>(initialProduct ? formFromProduct(initialProduct) : { ...emptyProductForm });
  const [status, setStatus] = useState('');
  const [saving, setSaving] = useState(false);

  const isEditing = mode === 'edit';

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setStatus('Saving...');

    const payload = {
      name: form.name,
      slug: form.slug || slugify(form.name),
      description: form.description || null,
      material: form.material || null,
      category: form.category || null,
      subcategory: form.subcategory || null,
      price: Number(form.price),
      originalPrice: form.originalPrice ? Number(form.originalPrice) : null,
      stock: Number(form.stock) || 0,
      badge: form.badge || null,
      rating: form.rating ? Number(form.rating) : null,
      reviews: form.reviews ? Number(form.reviews) : null,
      imageUrl: form.imageUrls[0] ? form.imageUrls[0] : null,
      imageUrls: form.imageUrls.length > 0 ? form.imageUrls : null,
      isFeatured: form.isFeatured,
      isComingSoon: form.isComingSoon,
      isActive: form.isActive
    };

    try {
      const url = isEditing ? `/api/products/${form.id}` : '/api/products';
      const response = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data?.error || 'Failed to save.');
      }

      setStatus('Saved!');
      router.refresh();
      if (!isEditing) {
        router.push('/admin/products');
      }
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  const uploadFiles = async (files: File[]) => {
    setStatus(`Uploading ${files.length} image(s)...`);
    try {
      const urls: string[] = [];
      for (const file of files) {
        const fd = new FormData();
        fd.append('file', file);
        const res = await fetch('/api/upload', { method: 'POST', body: fd });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || 'Upload failed');
        urls.push(data.url);
      }
      setForm((prev) => ({ ...prev, imageUrls: [...prev.imageUrls, ...urls] }));
      setStatus('Image(s) uploaded.');
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Upload failed');
    }
  };

  return (
    <div className="admin-shell">
      <AdminHeader subtitle={isEditing ? 'Edit product' : 'Create a new product'} />

      <div className="admin-grid">
        <form className="admin-form" onSubmit={save}>
          <h2>{isEditing ? 'Edit Product' : 'Create Product'}</h2>

          <label>Name</label>
          <input
            type="text"
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value, slug: slugify(event.target.value) })}
            required
          />

          <label>Slug</label>
          <input type="text" value={form.slug} onChange={(event) => setForm({ ...form, slug: event.target.value })} required />

          <label>Description</label>
          <textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />

          <label>Material</label>
          <input type="text" value={form.material} onChange={(event) => setForm({ ...form, material: event.target.value })} />

          <label htmlFor="product-category">Category</label>
          <select
            id="product-category"
            name="category"
            value={form.category}
            onChange={(event) => setForm({ ...form, category: event.target.value })}
            required
          >
            <option value="" disabled>Select a category</option>
            {PRODUCT_CATEGORIES.map((category) => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>

          <div className="form-grid-2">
            <div>
              <label>Price (₹)</label>
              <input type="number" value={form.price} onChange={(event) => setForm({ ...form, price: Number(event.target.value) })} />
            </div>
            <div>
              <label>Original Price (₹)</label>
              <input type="number" value={form.originalPrice} onChange={(event) => setForm({ ...form, originalPrice: event.target.value })} />
            </div>
          </div>

          <label>Stock (Available Quantity)</label>
          <input
            type="number"
            min={0}
            value={form.stock}
            onChange={(event) => setForm({ ...form, stock: Math.max(0, Math.floor(Number(event.target.value) || 0)) })}
          />

          <label>Product Images</label>
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            multiple
            onChange={async (event) => {
              const input = event.currentTarget;
              const files = Array.from(input.files ?? []);
              if (files.length === 0) return;
              await uploadFiles(files);
              input.value = '';
            }}
          />

          {form.imageUrls.length > 0 ? (
            <div className="admin-img-grid">
              {form.imageUrls.map((url, idx) => (
                <div key={`${url}-${idx}`} className="admin-img-item">
                  <img src={url} alt={`Product image ${idx + 1}`} />
                  <div className="admin-img-actions">
                    <button
                      type="button"
                      className="btn-outline"
                      onClick={() => {
                        setForm((prev) => {
                          const next = prev.imageUrls.slice();
                          const [picked] = next.splice(idx, 1);
                          next.unshift(picked);
                          return { ...prev, imageUrls: next };
                        });
                      }}
                    >
                      {idx === 0 ? 'Primary' : 'Make Primary'}
                    </button>
                    <button
                      type="button"
                      className="btn-danger"
                      onClick={() => setForm((prev) => ({ ...prev, imageUrls: prev.imageUrls.filter((_, i) => i !== idx) }))}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="muted-block">Upload one or more images. The first image is used as the primary image.</div>
          )}

          <div className="form-grid-2">
            <div>
              <label>Rating</label>
              <input type="number" step="0.1" value={form.rating} onChange={(event) => setForm({ ...form, rating: event.target.value })} />
            </div>
            <div>
              <label>Reviews</label>
              <input type="number" value={form.reviews} onChange={(event) => setForm({ ...form, reviews: event.target.value })} />
            </div>
          </div>

          <fieldset className="product-visibility">
            <legend>Product visibility</legend>
            <label className="checkbox">
              <input type="checkbox" name="isFeatured" checked={form.isFeatured} onChange={(event) => setForm({ ...form, isFeatured: event.target.checked })} aria-describedby="featured-help" />
              Featured product
            </label>
            <p id="featured-help">Show this product in Featured Products on the homepage after saving.</p>
            <label className="checkbox">
              <input type="checkbox" name="isComingSoon" checked={form.isComingSoon} onChange={(event) => setForm({ ...form, isComingSoon: event.target.checked })} aria-describedby="coming-soon-help" />
              Coming soon
            </label>
            <p id="coming-soon-help">Customers can view this product, but cannot add it to the cart or place an order.</p>
            <label className="checkbox">
              <input type="checkbox" name="isActive" checked={form.isActive} onChange={(event) => setForm({ ...form, isActive: event.target.checked })} />
              Active
            </label>
            <p>Only active products are visible to customers.</p>
          </fieldset>

          <button className="btn-primary" type="submit" disabled={saving}>
            {saving ? 'Saving...' : isEditing ? 'Update Product' : 'Create Product'}
          </button>
          {status ? <div className="form-success">{status}</div> : null}
        </form>

        <div className="admin-list">
          <h2>Quick Links</h2>
          <div className="muted-block">
            <a href="/admin/products">Back to products</a>
          </div>
        </div>
      </div>
    </div>
  );
}
