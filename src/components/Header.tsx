'use client';

import React, { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Logo from './Logo';
import { useCart, useFavorites } from '@/app/providers';

type SearchProduct = {
  id: string;
  name: string;
  slug: string;
  material: string | null;
  category: string | null;
};

type Suggestion =
  | { kind: 'product'; key: string; label: string; slug: string }
  | { kind: 'category'; key: string; label: string }
  | { kind: 'material'; key: string; label: string };

function normalize(text: string) {
  return text.toLowerCase().trim();
}

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement | null>(null);
  const cart = useCart();
  const favorites = useFavorites();
  const [searchValue, setSearchValue] = useState('');
  const deferredSearchValue = useDeferredValue(searchValue);
  const [searchProducts, setSearchProducts] = useState<SearchProduct[]>([]);
  const [searchLoaded, setSearchLoaded] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);

  const openSearch = () => {
    setIsSearchOpen(true);
    requestAnimationFrame(() => {
      searchRef.current?.focus();
    });
  };

  const closeSearch = () => {
    setIsSearchOpen(false);
    setActiveSuggestionIndex(-1);
  };

  useEffect(() => {
    if (!isSearchOpen) return;
    if (searchLoaded) return;
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch('/api/products', { cache: 'no-store' });
        const data = (await res.json()) as SearchProduct[];
        if (!cancelled) setSearchProducts(Array.isArray(data) ? data : []);
      } catch {
        if (!cancelled) setSearchProducts([]);
      } finally {
        if (!cancelled) setSearchLoaded(true);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [isSearchOpen, searchLoaded]);

  const suggestions = useMemo<Suggestion[]>(() => {
    const q = normalize(deferredSearchValue);
    if (!q) return [];

    const productMatches = searchProducts
      .filter((p) => normalize(`${p.name} ${p.slug}`).includes(q))
      .slice(0, 6)
      .map((p) => ({ kind: 'product', key: `p:${p.id}`, label: p.name, slug: p.slug } as const));

    const categories = Array.from(
      new Set(
        searchProducts
          .map((p) => p.category)
          .filter((c): c is string => Boolean(c))
          .filter((c) => normalize(c).includes(q))
      )
    )
      .slice(0, 3)
      .map((c) => ({ kind: 'category', key: `c:${c}`, label: c } as const));

    const materials = Array.from(
      new Set(
        searchProducts
          .map((p) => p.material)
          .filter((m): m is string => Boolean(m))
          .filter((m) => normalize(m).includes(q))
      )
    )
      .slice(0, 3)
      .map((m) => ({ kind: 'material', key: `m:${m}`, label: m } as const));

    return [...productMatches, ...categories, ...materials];
  }, [deferredSearchValue, searchProducts]);

  const selectSuggestion = (s: Suggestion) => {
    if (s.kind === 'product') {
      router.push(`/product/${s.slug}`);
      closeSearch();
      return;
    }
    const q = s.label.trim();
    if (q) {
      router.push(`/search?q=${encodeURIComponent(q)}`);
      closeSearch();
    }
  };

  return (
    <header>
      <Logo />
      <nav>
        <Link className={pathname === '/' ? 'active' : ''} href="/">
          Home
        </Link>
        <Link className={pathname.startsWith('/shop') ? 'active' : ''} href="/shop">
          Shop
        </Link>
        <Link className={pathname.startsWith('/custom-order') ? 'active' : ''} href="/custom-order">
          Custom Order
        </Link>
        <Link className={pathname.startsWith('/about') ? 'active' : ''} href="/about">
          About
        </Link>
      </nav>
      <div className="nav-icons">
        <div className={`search-wrap ${isSearchOpen ? 'open' : ''}`}>
          <button className="nav-icon" aria-label="Search" onClick={openSearch} type="button">
          <svg className="icon-svg" viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
            <path d="M16.5 16.5L21 21" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          </button>
          <input
            ref={searchRef}
            className="search-input"
            type="search"
            placeholder="Search products..."
            value={searchValue}
            onChange={(e) => {
              setSearchValue(e.currentTarget.value);
              setActiveSuggestionIndex(-1);
            }}
            onBlur={(e) => {
              if (e.currentTarget.value.trim() === '') {
                closeSearch();
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                if (suggestions.length === 0) return;
                setActiveSuggestionIndex((prev) => Math.min(suggestions.length - 1, prev + 1));
                return;
              }
              if (e.key === 'ArrowUp') {
                e.preventDefault();
                if (suggestions.length === 0) return;
                setActiveSuggestionIndex((prev) => Math.max(0, prev - 1));
                return;
              }
              if (e.key === 'Enter') {
                const picked = activeSuggestionIndex >= 0 ? suggestions[activeSuggestionIndex] : null;
                if (picked) {
                  e.preventDefault();
                  selectSuggestion(picked);
                  return;
                }
                const q = searchValue.trim();
                if (q.length > 0) {
                  router.push(`/search?q=${encodeURIComponent(q)}`);
                  closeSearch();
                }
              }
              if (e.key === 'Escape') {
                closeSearch();
              }
            }}
          />
          {isSearchOpen && suggestions.length > 0 ? (
            <div className="search-suggest" role="listbox" aria-label="Search suggestions">
              {suggestions.map((s, idx) => (
                <button
                  key={s.key}
                  type="button"
                  className={`search-suggest-item${idx === activeSuggestionIndex ? ' active' : ''}`}
                  role="option"
                  aria-selected={idx === activeSuggestionIndex}
                  onMouseDown={(ev) => {
                    // Prevent input blur before click.
                    ev.preventDefault();
                  }}
                  onMouseEnter={() => setActiveSuggestionIndex(idx)}
                  onClick={() => selectSuggestion(s)}
                >
                  <span className="search-suggest-kind">
                    {s.kind === 'product' ? 'Product' : s.kind === 'category' ? 'Category' : 'Material'}
                  </span>
                  <span className="search-suggest-label">{s.label}</span>
                </button>
              ))}
            </div>
          ) : null}
        </div>
        <Link className="nav-icon" style={{ position: 'relative' }} aria-label="Wishlist" href="/wishlist">
          <svg className="icon-svg" viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M12 20.5s-7.5-4.7-9.6-8.8C1 9.1 2.4 6.2 5.3 5.4c2.1-.6 4.2.2 5.4 1.9 1.2-1.7 3.3-2.5 5.4-1.9 2.9.8 4.3 3.7 2.9 6.3-2.1 4.1-9.6 8.8-9.6 8.8Z"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {favorites.hydrated && favorites.count > 0 ? <span className="nbadge">{favorites.count}</span> : null}
        </Link>
        <Link className="nav-icon" style={{ position: 'relative' }} aria-label="Cart" href="/cart">
          <svg className="icon-svg" viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M3 4h2l2.2 10.2a2 2 0 0 0 2 1.6h7.6a2 2 0 0 0 2-1.6L21 7H7"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="10" cy="19" r="1.6" fill="none" stroke="currentColor" strokeWidth="1.6" />
            <circle cx="17" cy="19" r="1.6" fill="none" stroke="currentColor" strokeWidth="1.6" />
          </svg>
          {cart.hydrated && cart.count > 0 ? <span className="nbadge">{cart.count}</span> : null}
        </Link>
      </div>
    </header>
  );
}
