import { readImage } from '@/lib/firestoreImages';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  if (!/^[0-9a-f-]{36}$/i.test(params.id)) {
    return new Response('Not found', { status: 404 });
  }
  const image = await readImage(params.id);
  if (!image) return new Response('Not found', { status: 404 });
  return new Response(new Uint8Array(image.bytes), {
    headers: {
      'Content-Type': 'image/webp',
      'Content-Length': String(image.bytes.length),
      'Cache-Control': image.kind === 'product'
        ? 'public, max-age=31536000, s-maxage=31536000, immutable'
        : 'private, no-store',
      'X-Content-Type-Options': 'nosniff'
    }
  });
}
