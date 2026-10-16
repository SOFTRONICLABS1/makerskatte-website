import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

function isValidIndiaPin(pin: string) {
  return /^[1-9][0-9]{5}$/.test(pin);
}

type PostalApiEntry = {
  Status?: string;
  Message?: string;
  PostOffice?: Array<{
    District?: string;
    Division?: string;
    Block?: string;
    Name?: string;
    State?: string;
    Country?: string;
  }> | null;
};

type ZippopotamResponse = {
  places?: Array<{
    state?: string;
    'place name'?: string;
  }>;
};

type LookupResult = { city: string; state: string };
type LookupOutcome = { ok: true; result: LookupResult } | { ok: false; reason: 'not_found' | 'unavailable' };

function pickCityState(entries: PostalApiEntry[] | unknown): LookupResult | null {
  if (!Array.isArray(entries) || entries.length === 0) return null;
  const first = entries[0] as PostalApiEntry;
  if (typeof first?.Status === 'string' && first.Status.toLowerCase() === 'error') return null;
  const offices = Array.isArray(first?.PostOffice) ? first.PostOffice : [];
  for (const office of offices) {
    const city = (office?.District ?? office?.Division ?? office?.Block ?? office?.Name ?? '').trim();
    const state = (office?.State ?? '').trim();
    if (city && state) return { city, state };
  }
  return null;
}

function pickFromZippopotam(data: ZippopotamResponse | unknown): LookupResult | null {
  if (!data || typeof data !== 'object') return null;
  const rawPlaces = (data as ZippopotamResponse).places;
  const places = Array.isArray(rawPlaces) ? rawPlaces : [];
  for (const place of places) {
    const city = (place?.['place name'] ?? '').trim();
    const state = (place?.state ?? '').trim();
    if (city && state) return { city, state };
  }
  return null;
}

async function fetchWithTimeout(url: string, ms = 5000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, {
      cache: 'no-store',
      signal: controller.signal,
      headers: { 'User-Agent': 'makerskatte-custom-order/1.0' }
    });
  } finally {
    clearTimeout(timer);
  }
}

function isExplicitNotFound(entries: PostalApiEntry[] | unknown): boolean {
  if (!Array.isArray(entries) || entries.length === 0) return false;
  const first = entries[0] as PostalApiEntry;
  const status = (first?.Status ?? '').toString().toLowerCase();
  const message = (first?.Message ?? '').toString().toLowerCase();
  return status === 'error' && (message.includes('no records') || message.includes('not found'));
}

async function lookupPincode(pincode: string): Promise<LookupOutcome> {
  const urls = [
    { url: `https://api.zippopotam.us/IN/${pincode}`, kind: 'zippopotam' as const },
    { url: `https://api.postalpincode.in/pincode/${pincode}`, kind: 'postal' as const },
    { url: `https://www.postalpincode.in/api/pincode/${pincode}`, kind: 'postal' as const }
  ];
  let sawExplicitNotFound = false;
  let sawAnySuccessfulHttp = false;

  for (const source of urls) {
    try {
      const res = await fetchWithTimeout(source.url, 5000);
      if (!res.ok) continue;
      sawAnySuccessfulHttp = true;
      const data = (await res.json()) as unknown;
      const picked = source.kind === 'zippopotam' ? pickFromZippopotam(data) : pickCityState(data);
      if (picked) return { ok: true, result: picked };
      if (source.kind === 'postal' && isExplicitNotFound(data)) sawExplicitNotFound = true;
    } catch {
      // try next provider
    }
  }

  if (sawExplicitNotFound) return { ok: false, reason: 'not_found' };
  if (sawAnySuccessfulHttp) return { ok: false, reason: 'not_found' };
  return { ok: false, reason: 'unavailable' };
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const pincode = (url.searchParams.get('pincode') ?? '').replace(/[^0-9]/g, '').slice(0, 6);
  if (!isValidIndiaPin(pincode)) {
    return NextResponse.json({ ok: false, error: 'Invalid pincode' }, { status: 400 });
  }

  try {
    const outcome = await lookupPincode(pincode);
    if (!outcome.ok) {
      if (outcome.reason === 'unavailable') {
        return NextResponse.json({ ok: false, error: 'Lookup failed' }, { status: 502 });
      }
      return NextResponse.json({ ok: false, error: 'Pincode not found' }, { status: 404 });
    }
    return NextResponse.json({ ok: true, pincode, city: outcome.result.city, state: outcome.result.state });
  } catch {
    return NextResponse.json({ ok: false, error: 'Lookup failed' }, { status: 502 });
  }
}
