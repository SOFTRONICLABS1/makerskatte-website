export type FavoritesState = {
  productIds: string[];
};

const storageKey = 'makerskatte_favorites_v1';

export function readFavoritesFromStorage(): FavoritesState {
  if (typeof window === 'undefined') return { productIds: [] };
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return { productIds: [] };
    const parsed = JSON.parse(raw) as FavoritesState;
    if (!parsed || !Array.isArray(parsed.productIds)) return { productIds: [] };
    return { productIds: parsed.productIds.filter((id) => typeof id === 'string') };
  } catch {
    return { productIds: [] };
  }
}

export function writeFavoritesToStorage(state: FavoritesState) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(storageKey, JSON.stringify(state));
}

export function isFavorite(state: FavoritesState, productId: string) {
  return state.productIds.includes(productId);
}

export function toggleFavorite(state: FavoritesState, productId: string): FavoritesState {
  if (state.productIds.includes(productId)) {
    return { productIds: state.productIds.filter((id) => id !== productId) };
  }
  return { productIds: [productId, ...state.productIds] };
}

export function clearFavorites(): FavoritesState {
  return { productIds: [] };
}
