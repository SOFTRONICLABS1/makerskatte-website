'use client';

export type CheckoutItem = { productId: string; quantity: number };

export type CheckoutDraft = {
  items: CheckoutItem[];
  fullName: string;
  email: string;
  mobile: string;
  country: string;
  pincode: string;
  flat: string;
  area: string;
  landmark: string;
  city: string;
  state: string;
  deliveryInstructions: string;
};

const storageKey = 'makerskatte_checkout_v1';

export function getDefaultCheckoutDraft(): CheckoutDraft {
  return {
    items: [],
    fullName: '',
    email: '',
    mobile: '',
    country: 'India',
    pincode: '',
    flat: '',
    area: '',
    landmark: '',
    city: '',
    state: '',
    deliveryInstructions: ''
  };
}

export function readCheckoutDraft(): CheckoutDraft {
  if (typeof window === 'undefined') return getDefaultCheckoutDraft();
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return getDefaultCheckoutDraft();
    const parsed = JSON.parse(raw) as Partial<CheckoutDraft>;
    const base = getDefaultCheckoutDraft();
    const items = Array.isArray(parsed.items)
      ? parsed.items
          .filter((it: any) => it && typeof it.productId === 'string')
          .map((it: any) => ({ productId: it.productId, quantity: Math.max(1, Math.floor(Number(it.quantity) || 1)) }))
      : base.items;
    return { ...base, ...parsed, items };
  } catch {
    return getDefaultCheckoutDraft();
  }
}

export function writeCheckoutDraft(next: CheckoutDraft) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(storageKey, JSON.stringify(next));
}

export function clearCheckoutDraft() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(storageKey);
}
