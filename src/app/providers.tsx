'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  addToCart,
  addToCartWithLimit,
  clearCart,
  getCartCount,
  readCartFromStorage,
  removeFromCart,
  setCartQuantity,
  setCartQuantityWithLimit,
  type CartState
} from '@/lib/cart';
import {
  clearFavorites,
  readFavoritesFromStorage,
  toggleFavorite,
  type FavoritesState
} from '@/lib/favorites';

type CartContextValue = {
  state: CartState;
  count: number;
  add: (productId: string, quantity?: number, maxStock?: number) => void;
  setQuantity: (productId: string, quantity: number, maxStock?: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
  hydrated: boolean;
};

const CartContext = createContext<CartContextValue | null>(null);

type FavoritesContextValue = {
  state: FavoritesState;
  count: number;
  toggle: (productId: string) => void;
  clear: () => void;
  hydrated: boolean;
};

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<CartState>({ items: [] });
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setState(readCartFromStorage());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    // Lazy import to avoid bundling in SSR paths.
    import('@/lib/cart').then(({ writeCartToStorage }) => writeCartToStorage(state));
  }, [state, hydrated]);

  const value = useMemo<CartContextValue>(() => {
    return {
      state,
      count: getCartCount(state),
      add: (productId, quantity, maxStock) =>
        setState((prev) =>
          typeof maxStock === 'number' ? addToCartWithLimit(prev, productId, quantity ?? 1, maxStock) : addToCart(prev, productId, quantity)
        ),
      setQuantity: (productId, quantity, maxStock) =>
        setState((prev) =>
          typeof maxStock === 'number' ? setCartQuantityWithLimit(prev, productId, quantity, maxStock) : setCartQuantity(prev, productId, quantity)
        ),
      remove: (productId) => setState((prev) => removeFromCart(prev, productId)),
      clear: () => setState(clearCart()),
      hydrated
    };
  }, [state, hydrated]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error('useCart must be used inside <CartProvider>');
  }
  return ctx;
}

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<FavoritesState>({ productIds: [] });
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setState(readFavoritesFromStorage());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    import('@/lib/favorites').then(({ writeFavoritesToStorage }) => writeFavoritesToStorage(state));
  }, [state, hydrated]);

  const value = useMemo<FavoritesContextValue>(() => {
    return {
      state,
      count: state.productIds.length,
      toggle: (productId) => setState((prev) => toggleFavorite(prev, productId)),
      clear: () => setState(clearFavorites()),
      hydrated
    };
  }, [state, hydrated]);

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) {
    throw new Error('useFavorites must be used inside <FavoritesProvider>');
  }
  return ctx;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <FavoritesProvider>{children}</FavoritesProvider>
    </CartProvider>
  );
}
