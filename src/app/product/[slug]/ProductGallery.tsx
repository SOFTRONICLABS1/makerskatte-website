'use client';

import React, { useMemo, useState } from 'react';

export default function ProductGallery({
  name,
  badge,
  imageUrls
}: {
  name: string;
  badge?: string | null;
  imageUrls: string[];
}) {
  const urls = useMemo(() => imageUrls.filter((u) => typeof u === 'string' && u.trim().length > 0), [imageUrls]);
  const [active, setActive] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const [origin, setOrigin] = useState({ x: 50, y: 50 });
  const activeUrl = urls[active] ?? '';
  const fallback = name?.trim()?.slice(0, 1).toUpperCase() || '•';

  return (
    <div className="pgallery">
      <div className="pgallery-thumbs" aria-label="Product images">
        {urls.length > 0 ? (
          urls.map((url, idx) => (
            <button
              key={`${url}-${idx}`}
              type="button"
              className={`pgallery-thumb${idx === active ? ' active' : ''}`}
              onClick={() => setActive(idx)}
              aria-label={`View image ${idx + 1}`}
            >
              <img src={url} alt={`${name} ${idx + 1}`} />
            </button>
          ))
        ) : (
          <div className="pgallery-thumb active">{fallback}</div>
        )}
      </div>

      <div
        className="pgallery-main"
        onMouseEnter={() => setZoomed(true)}
        onMouseLeave={() => setZoomed(false)}
        onMouseMove={(e) => {
          const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
          const x = ((e.clientX - rect.left) / rect.width) * 100;
          const y = ((e.clientY - rect.top) / rect.height) * 100;
          setOrigin({ x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) });
        }}
      >
        {activeUrl ? (
          <img
            className={zoomed ? 'zoomed' : ''}
            src={activeUrl}
            alt={name}
            style={{ transformOrigin: `${origin.x}% ${origin.y}%` }}
          />
        ) : (
          <span className="product-fallback" aria-hidden="true">
            {fallback}
          </span>
        )}
        {badge ? <span className="img-badge">{badge}</span> : null}
        <span className="zoom-hint">Hover to zoom</span>
      </div>
    </div>
  );
}
