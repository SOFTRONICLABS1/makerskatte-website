'use client';

export type CustomOrderDraft = {
  material: string;
  size: string;
  fileUrls: string[];
  instructions: string;
  // Step 3 fields
  quantity: number;
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

const storageKey = 'makerskatte_custom_order_v1';

export function getDefaultDraft(): CustomOrderDraft {
  return {
    material: 'Wood',
    size: 'A4',
    fileUrls: [],
    instructions: '',
    quantity: 1,
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

export function readDraft(): CustomOrderDraft {
  if (typeof window === 'undefined') return getDefaultDraft();
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return getDefaultDraft();
    const parsed = JSON.parse(raw) as Partial<CustomOrderDraft>;
    const base = getDefaultDraft();
    return {
      ...base,
      ...parsed,
      fileUrls: Array.isArray(parsed.fileUrls) ? parsed.fileUrls.filter((u) => typeof u === 'string') : base.fileUrls,
      quantity: Number.isFinite(Number(parsed.quantity)) ? Math.max(1, Math.floor(Number(parsed.quantity))) : base.quantity,
      // Keep legacy fields from older drafts from breaking the new flow.
      fullName: typeof (parsed as any).fullName === 'string' ? (parsed as any).fullName : typeof (parsed as any).name === 'string' ? (parsed as any).name : base.fullName,
      mobile: typeof (parsed as any).mobile === 'string' ? (parsed as any).mobile : typeof (parsed as any).phone === 'string' ? (parsed as any).phone : base.mobile
    };
  } catch {
    return getDefaultDraft();
  }
}

export function writeDraft(next: CustomOrderDraft) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(storageKey, JSON.stringify(next));
}

export function clearDraft() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(storageKey);
}
