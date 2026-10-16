'use client';

import MaterialIcon from '@/components/MaterialIcon';

import React, { useState } from 'react';

const initialState = {
  name: '',
  email: '',
  phone: '',
  material: 'Wood',
  size: 'A4',
  quantity: 1,
  urgency: 'Standard (48-72 hrs)',
  address: '',
  message: ''
};

export default function CustomOrderForm() {
  const [form, setForm] = useState(initialState);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const updateField = (field: keyof typeof initialState, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setStatus('loading');
    setErrorMessage('');

    try {
      const response = await fetch('/api/custom-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to submit.');
      }

      setStatus('success');
      setForm(initialState);
    } catch (error) {
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Something went wrong.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="custom-layout">
      <div>
        <div className="form-card">
        <h3>Choose Material</h3>
        <div className="material-grid">
          {['Wood', 'Acrylic', 'Leather'].map((item) => (
            <button
              key={item}
              type="button"
              className={`mat-option${form.material === item ? ' selected' : ''}`}
              onClick={() => updateField('material', item)}
            >
              <span className="mat-icon">
                <MaterialIcon name={item} />
              </span>
              <div className="mat-name">{item}</div>
              <div className="mat-price">From ₹499</div>
            </button>
          ))}
        </div>
        <label style={{ marginTop: '0.5rem' }}>Preferred Material Notes</label>
        <input
          type="text"
          placeholder="Example: Teak (Premium), Matte Acrylic"
          value={form.message}
          onChange={(event) => updateField('message', event.target.value)}
        />
        </div>

        <div className="form-card">
        <h3>📐 Select Size</h3>
        <div className="size-grid">
          {['A5', 'A4', 'A3', 'A2', 'Custom'].map((item) => (
            <button
              key={item}
              type="button"
              className={`size-option${form.size === item ? ' selected' : ''}`}
              onClick={() => updateField('size', item)}
            >
              <div className="size-dim">{item}</div>
              <div className="size-cm">{item === 'Custom' ? 'Your dimensions' : 'Standard size'}</div>
              <div className="size-add">{item === 'Custom' ? 'Quote on request' : '+ ₹0'}</div>
            </button>
          ))}
        </div>
        </div>

        <div className="form-card">
        <h3>📦 Quantity & Delivery</h3>
        <div className="qty-urgency">
          <div>
            <label>Quantity</label>
            <input
              type="number"
              min={1}
              value={form.quantity}
              onChange={(event) => updateField('quantity', Number(event.target.value))}
            />
          </div>
          <div>
            <label>Urgency</label>
            <select value={form.urgency} onChange={(event) => updateField('urgency', event.target.value)}>
              <option>Standard (48-72 hrs)</option>
              <option>Express (24-48 hrs)</option>
              <option>Urgent (Same Day)</option>
            </select>
          </div>
        </div>
        <label>Delivery Address</label>
        <textarea
          placeholder="Full address with pincode"
          value={form.address}
          onChange={(event) => updateField('address', event.target.value)}
        ></textarea>
        </div>

        <div className="form-card">
        <h3>✉️ Contact Details</h3>
        <div className="form-grid-2">
          <input
            type="text"
            placeholder="Your Name"
            value={form.name}
            onChange={(event) => updateField('name', event.target.value)}
            required
          />
          <input
            type="email"
            placeholder="Email Address"
            value={form.email}
            onChange={(event) => updateField('email', event.target.value)}
            required
          />
        </div>
        <input
          type="tel"
          placeholder="Phone (optional)"
          value={form.phone}
          onChange={(event) => updateField('phone', event.target.value)}
        />
        </div>
      </div>

      <div className="side-summary">
        <div className="ss-card">
          <div className="ss-title">Order Summary</div>
          <div className="ss-row">
            <div className="lbl">Material</div>
            <div className="val">{form.material}</div>
          </div>
          <div className="ss-row">
            <div className="lbl">Size</div>
            <div className="val">{form.size}</div>
          </div>
          <div className="ss-row">
            <div className="lbl">Quantity</div>
            <div className="val">{form.quantity}</div>
          </div>
          <div className="ss-price">
            <div className="lbl">Estimated Total</div>
            <div className="val">₹1,299</div>
          </div>
          <button className="btn-submit" type="submit" disabled={status === 'loading'}>
            {status === 'loading' ? 'Submitting...' : 'Submit Request'}
          </button>
          {status === 'success' ? <div className="form-success">Request submitted! We’ll reach out soon.</div> : null}
          {status === 'error' ? <div className="form-error">{errorMessage}</div> : null}
        </div>

        <div className="ss-card">
          <div className="ss-title">Why Order with Us</div>
          <div className="ss-row">
            <div className="lbl">✔ Free Design Preview</div>
          </div>
          <div className="ss-row">
            <div className="lbl">✔ Quality Guarantee</div>
          </div>
          <div className="ss-row">
            <div className="lbl">✔ Pan-India Delivery</div>
          </div>
          <div className="ss-row">
            <div className="lbl">✔ Support via WhatsApp</div>
          </div>
        </div>
      </div>
    </form>
  );
}
