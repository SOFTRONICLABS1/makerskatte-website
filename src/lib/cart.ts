export type CartItem = {
  productId: string;
  quantity: number;
};

export type CartState = {
  items: CartItem[];
};

export type CartProduct = {
  id: string;
  name: string;
  slug: string;
  price: number;
  originalPrice: number | null;
  imageUrl?: string | null;
  material: string | null;
  stock?: number | null;
  isComingSoon?: boolean;
};

const storageKey = 'makerskatte_cart_v1';

export function readCartFromStorage(): CartState {
  if (typeof window === 'undefined') return { items: [] };
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return { items: [] };
    const parsed = JSON.parse(raw) as CartState;
    if (!parsed || !Array.isArray(parsed.items)) return { items: [] };
    return {
      items: parsed.items
        .filter((item) => item && typeof item.productId === 'string' && typeof item.quantity === 'number')
        .map((item) => ({ productId: item.productId, quantity: Math.max(1, Math.floor(item.quantity)) }))
    };
  } catch {
    return { items: [] };
  }
}

export function writeCartToStorage(state: CartState) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(storageKey, JSON.stringify(state));
}

export function getCartCount(state: CartState) {
  return state.items.reduce((sum, item) => sum + item.quantity, 0);
}

export function addToCart(state: CartState, productId: string, quantity = 1): CartState {
  const qty = Math.max(1, Math.floor(quantity));
  const existing = state.items.find((item) => item.productId === productId);
  if (!existing) {
    return { items: [{ productId, quantity: qty }, ...state.items] };
  }
  return {
    items: state.items.map((item) =>
      item.productId === productId ? { ...item, quantity: item.quantity + qty } : item
    )
  };
}

export function addToCartWithLimit(state: CartState, productId: string, quantity: number, maxStock: number) {
  const max = Math.max(0, Math.floor(maxStock));
  if (max === 0) return state;
  const qty = Math.max(1, Math.floor(quantity));
  const existing = state.items.find((item) => item.productId === productId);
  if (!existing) {
    return { items: [{ productId, quantity: Math.min(qty, max) }, ...state.items] };
  }
  const nextQty = Math.min(existing.quantity + qty, max);
  return {
    items: state.items.map((item) => (item.productId === productId ? { ...item, quantity: nextQty } : item))
  };
}

export function setCartQuantity(state: CartState, productId: string, quantity: number): CartState {
  const qty = Math.max(1, Math.floor(quantity));
  return {
    items: state.items.map((item) => (item.productId === productId ? { ...item, quantity: qty } : item))
  };
}

export function setCartQuantityWithLimit(state: CartState, productId: string, quantity: number, maxStock: number) {
  const max = Math.max(0, Math.floor(maxStock));
  if (max === 0) {
    return removeFromCart(state, productId);
  }
  const qty = Math.max(1, Math.floor(quantity));
  return {
    items: state.items.map((item) => (item.productId === productId ? { ...item, quantity: Math.min(qty, max) } : item))
  };
}

export function removeFromCart(state: CartState, productId: string): CartState {
  return { items: state.items.filter((item) => item.productId !== productId) };
}

export function clearCart(): CartState {
  return { items: [] };
}
