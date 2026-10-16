'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getDefaultDraft, readDraft, writeDraft, type CustomOrderDraft } from '@/lib/customOrderDraft';

type UploadResult = { ok: boolean; url?: string; thumbUrl?: string; error?: string };

export default function CustomOrderUploadClient() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Avoid hydration mismatch: server render can't read localStorage.
  const [draft, setDraft] = useState<CustomOrderDraft>(() => getDefaultDraft());
  const [hydrated, setHydrated] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    setDraft(readDraft());
    setHydrated(true);
    // Must have Step 1 values (material/size). If draft is missing, send back.
    const d = readDraft();
    if (!d.material || !d.size) router.replace('/custom-order');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    writeDraft(draft);
  }, [draft, hydrated]);

  const canProceed = draft.fileUrls.length > 0 || draft.instructions.trim().length > 0;

  const guidelines = useMemo(
    () => [
      'Upload clear, high-resolution images for best engraving output.',
      'Avoid blurry/pixelated images.',
      'If you need text, write it in the instructions box.',
      'Max file size: 4MB per image.'
    ],
    []
  );

  const uploadFiles = async (files: File[]) => {
    const picked = files.filter(Boolean).slice(0, 5);
    if (picked.length === 0) return;
    setBusy(true);
    setStatus(`Uploading ${picked.length} file(s)...`);
    try {
      const urls: string[] = [];
      for (const file of picked) {
        const fd = new FormData();
        fd.append('file', file);
        const res = await fetch('/api/custom-order-upload', { method: 'POST', body: fd });
        const data = (await res.json().catch(() => ({}))) as UploadResult;
        if (!res.ok || !data.ok || !data.url) {
          throw new Error(data?.error || 'Upload failed');
        }
        urls.push(data.url);
      }
      setDraft((prev) => ({ ...prev, fileUrls: [...prev.fileUrls, ...urls].slice(0, 10) }));
      setStatus('Uploaded.');
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="co-upload-shell">
      <div className="co-upload-top">
        <div>
          <div className="eyebrow">Step 2</div>
          <h1 className="co-title">Upload Your Photo / Design</h1>
          <div className="co-sub">
            Material: <strong>{draft.material}</strong> · Size: <strong>{draft.size}</strong>
          </div>
        </div>
        <div className="co-top-actions">
          <button className="btn-outline" type="button" onClick={() => router.push('/custom-order')}>
            ← Back
          </button>
          <button
            className="btn-primary"
            type="button"
            disabled={busy || !canProceed}
            onClick={() => {
              writeDraft(draft);
              router.push('/custom-order/review');
            }}
          >
            Save and Proceed
          </button>
        </div>
      </div>

      <div className="co-upload-grid">
        <div>
          <div
            className={`co-drop${dragOver ? ' over' : ''}`}
            role="button"
            tabIndex={0}
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click();
            }}
            onDragEnter={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setDragOver(true);
            }}
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setDragOver(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setDragOver(false);
            }}
            onDrop={async (e) => {
              e.preventDefault();
              e.stopPropagation();
              setDragOver(false);
              const files = Array.from(e.dataTransfer.files ?? []);
              await uploadFiles(files);
            }}
            aria-label="Upload files"
          >
            <div className="co-drop-icon">⬆</div>
            <div className="co-drop-title">Click or Drag & Drop to Upload</div>
            <div className="co-drop-sub">Supported formats: PNG, JPG, WEBP</div>
            <div className="co-drop-sub">Max 4MB per image</div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              multiple
              style={{ display: 'none' }}
              onChange={async (event) => {
                const input = event.currentTarget;
                const files = Array.from(input.files ?? []);
                await uploadFiles(files);
                input.value = '';
              }}
            />
          </div>

          {draft.fileUrls.length > 0 ? (
            <div className="co-upload-previews">
              {draft.fileUrls.map((url, idx) => (
                <div key={`${url}-${idx}`} className="co-preview">
                  <img src={url} alt={`Upload ${idx + 1}`} />
                  <button
                    type="button"
                    className="co-remove"
                    onClick={() => setDraft((prev) => ({ ...prev, fileUrls: prev.fileUrls.filter((_, i) => i !== idx) }))}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          ) : null}

          <div className="co-instructions">
            <div className="co-instructions-title">Share design instruction here</div>
            <textarea
              placeholder="Additional information"
              value={draft.instructions}
              onChange={(e) => setDraft((prev) => ({ ...prev, instructions: e.target.value }))}
            />
          </div>

          {status ? <div className="muted-block">{status}</div> : null}
        </div>

        <div className="co-guidelines">
          <div className="co-guidelines-title">Guidelines</div>
          <ul className="co-guidelines-list">
            {guidelines.map((g) => (
              <li key={g}>
                <span className="co-check">✔</span>
                <span>{g}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
