'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { clearDraft, getDefaultDraft, readDraft, writeDraft, type CustomOrderDraft } from '@/lib/customOrderDraft';

type PricingRow = { id?: string; name: string; price: number };
type PricingResponse = { materials: PricingRow[]; sizes: PricingRow[] };
type PinLookupResponse = { ok: boolean; city?: string; state?: string; error?: string };

export default function CustomOrderReviewClient() {
  const router = useRouter();
  // Avoid hydration mismatch: server render can't read localStorage.
  const [draft, setDraft] = useState<CustomOrderDraft>(() => getDefaultDraft());
  const [hydrated, setHydrated] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState('');
  const [pricing, setPricing] = useState<PricingResponse | null>(null);
  const [pinStatus, setPinStatus] = useState<string>('');
  const [pinBusy, setPinBusy] = useState(false);
  const [lastPinLookup, setLastPinLookup] = useState<string>('');

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

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      normalized: {
        email,
        country,
        mobileDigits,
        pincode: pin
      }
    };
  }, [draft]);

  const canSubmit = validation.isValid;

  const estimatedTotal = useMemo(() => {
    const materialBase = pricing?.materials?.find((m) => m.name === draft.material)?.price ?? 0;
    const sizePrice = pricing?.sizes?.find((s) => s.name === draft.size)?.price ?? 0;
    const qty = Math.max(1, Math.floor(Number(draft.quantity) || 1));
    return materialBase + sizePrice * qty;
  }, [draft.material, draft.quantity, draft.size, pricing]);

  const formattedAddress = useMemo(() => {
    const parts = [
      draft.flat.trim(),
      draft.area.trim(),
      draft.landmark.trim() ? `Landmark: ${draft.landmark.trim()}` : '',
      `${draft.city.trim()}${draft.state.trim() ? `, ${draft.state.trim()}` : ''}`.trim(),
      draft.pincode.trim(),
      draft.country.trim()
    ].filter(Boolean);
    return parts.join('\n');
  }, [draft]);

  return (
    <div className="custom-layout">
      <div>
        <div className="form-card">
          <div className="co-review-top">
            <div>
              <div className="eyebrow">Step 3</div>
              <h2 style={{ marginTop: 6 }}>Review & Submit</h2>
            </div>
            <div className="co-review-actions">
              <button className="btn-outline" type="button" onClick={() => router.push('/custom-order/upload')}>
                ← Back
              </button>
            </div>
          </div>
        </div>

        <div className="form-card">
          <h3>🧾 Your Details</h3>

          <div className="form-grid-2">
            <div>
              <label>Quantity</label>
              <input
                type="number"
                min={1}
                value={draft.quantity}
                onChange={(e) => setDraft((prev) => ({ ...prev, quantity: Math.max(1, Math.floor(Number(e.target.value) || 1)) }))}
              />
            </div>
            <div>
              <label>Country/Region</label>
              <select value={draft.country} onChange={(e) => setDraft((prev) => ({ ...prev, country: e.target.value }))}>
                <option>India</option>
              </select>
            </div>
          </div>

          <label>Full name (First and Last name)</label>
          <input
            type="text"
            placeholder="Full name"
            value={draft.fullName}
            onChange={(e) => setDraft((prev) => ({ ...prev, fullName: e.target.value }))}
            required
          />
          {validation.errors.fullName ? <div className="field-err">{validation.errors.fullName}</div> : null}

          <label>Email</label>
          <input
            type="email"
            placeholder="Email Address"
            value={draft.email}
            onChange={(e) => setDraft((prev) => ({ ...prev, email: e.target.value }))}
            required
          />
          {validation.errors.email ? <div className="field-err">{validation.errors.email}</div> : null}

          <label>Mobile number</label>
          <input
            type="tel"
            inputMode="numeric"
            placeholder="Mobile number"
            value={draft.mobile}
            onChange={(e) =>
              setDraft((prev) => {
                const digits = e.target.value.replace(/[^0-9]/g, '');
                const limited = prev.country.toLowerCase() === 'india' ? digits.slice(0, 10) : digits.slice(0, 15);
                return { ...prev, mobile: limited };
              })
            }
            required
          />
          {validation.errors.mobile ? <div className="field-err">{validation.errors.mobile}</div> : null}

          <label>Pincode</label>
          <input
            type="text"
            inputMode="numeric"
            placeholder="6 digits PIN code"
            value={draft.pincode}
            onChange={(e) => setDraft((prev) => ({ ...prev, pincode: e.target.value.replace(/[^0-9]/g, '').slice(0, 6) }))}
            required
          />
          {validation.errors.pincode ? <div className="field-err">{validation.errors.pincode}</div> : null}
          {pinStatus ? <div className={pinBusy ? 'muted-block' : 'muted-block'}>{pinStatus}</div> : null}

          <label>Flat, House no., Building, Company, Apartment</label>
          <input
            type="text"
            placeholder="Flat / house / building"
            value={draft.flat}
            onChange={(e) => setDraft((prev) => ({ ...prev, flat: e.target.value }))}
            required
          />
          {validation.errors.flat ? <div className="field-err">{validation.errors.flat}</div> : null}

          <label>Area, Street, Sector, Village</label>
          <input
            type="text"
            placeholder="Area / street"
            value={draft.area}
            onChange={(e) => setDraft((prev) => ({ ...prev, area: e.target.value }))}
            required
          />
          {validation.errors.area ? <div className="field-err">{validation.errors.area}</div> : null}

          <label>Landmark (optional)</label>
          <input
            type="text"
            placeholder="E.g. near apollo hospital"
            value={draft.landmark}
            onChange={(e) => setDraft((prev) => ({ ...prev, landmark: e.target.value }))}
          />

          <div className="form-grid-2">
            <div>
              <label>Town/City</label>
              <input
                type="text"
                placeholder="City"
                value={draft.city}
                onChange={(e) => setDraft((prev) => ({ ...prev, city: e.target.value }))}
                required
              />
              {validation.errors.city ? <div className="field-err">{validation.errors.city}</div> : null}
            </div>
            <div>
              <label>State</label>
              <input
                type="text"
                placeholder="State"
                value={draft.state}
                onChange={(e) => setDraft((prev) => ({ ...prev, state: e.target.value }))}
                required
              />
              {validation.errors.state ? <div className="field-err">{validation.errors.state}</div> : null}
            </div>
          </div>

          <div className="muted-block" style={{ whiteSpace: 'pre-wrap' }}>
            <strong>Delivery address preview</strong>
            {'\n'}
            {formattedAddress || '—'}
          </div>

          <label style={{ marginTop: '0.9rem' }}>Delivery instructions (optional)</label>
          <textarea
            placeholder="Add preferences, access code, notes..."
            value={draft.deliveryInstructions}
            onChange={(e) => setDraft((prev) => ({ ...prev, deliveryInstructions: e.target.value }))}
          />
        </div>

        <div className="co-step-actions">
          <button
            className="btn-primary"
            type="button"
            disabled={submitting || !canSubmit}
            onClick={async () => {
              if (!validation.isValid) {
                setStatus('Please fix the highlighted fields and try again.');
                return;
              }
              setSubmitting(true);
              setStatus('');
              // Persist latest draft (address formatting + normalized fields happen later at payment step too).
              writeDraft(draft);
              router.push('/custom-order/payment');
            }}
          >
            {submitting ? 'Please wait…' : 'Next'}
          </button>
          {status ? <div className="muted-block">{status}</div> : null}
        </div>
      </div>

      <div className="side-summary">
        <div className="ss-card">
          <div className="ss-title">Summary</div>
          <div className="ss-row">
            <div className="lbl">Material</div>
            <div className="val">
              {draft.material}{' '}
              <button className="co-edit-link" type="button" onClick={() => router.push('/custom-order')}>
                Edit
              </button>
            </div>
          </div>
          <div className="ss-row">
            <div className="lbl">Size</div>
            <div className="val">
              {draft.size}{' '}
              <button className="co-edit-link" type="button" onClick={() => router.push('/custom-order')}>
                Edit
              </button>
            </div>
          </div>
          <div className="ss-row">
            <div className="lbl">Quantity</div>
            <div className="val">{draft.quantity}</div>
          </div>
          <div className="ss-row">
            <div className="lbl">Uploads</div>
            <div className="val">
              {draft.fileUrls.length}{' '}
              <button className="co-edit-link" type="button" onClick={() => router.push('/custom-order/upload')}>
                Edit
              </button>
            </div>
          </div>
          {draft.fileUrls.length > 0 ? (
            <div className="co-mini-previews">
              {draft.fileUrls.slice(0, 4).map((url, idx) => (
                <img key={`${url}-${idx}`} src={url} alt={`Uploaded ${idx + 1}`} />
              ))}
            </div>
          ) : null}

          <div className="ss-price">
            <div className="lbl">Estimated Total</div>
            <div className="val">₹{estimatedTotal}</div>
          </div>

          <button
            type="button"
            className="btn-outline"
            onClick={() => {
              clearDraft();
              setDraft(readDraft());
              setStatus('Draft cleared.');
            }}
          >
            Clear Draft
          </button>
        </div>
      </div>
    </div>
  );
}
