import { NextResponse } from 'next/server';
import sharp from 'sharp';
import { saveImage } from '@/lib/firestoreImages';
import { getCustomOrderSettings } from '@/lib/customOrderSettings';

export const runtime = 'nodejs';

function getMaxUploadBytes() {
  const env = process.env.MAX_CUSTOM_ORDER_UPLOAD_BYTES ? Number(process.env.MAX_CUSTOM_ORDER_UPLOAD_BYTES) : NaN;
  if (Number.isFinite(env) && env > 0) return Math.min(env, 4 * 1024 * 1024);
  return 4 * 1024 * 1024; // Stay below Vercel's 4.5MB request limit.
}

export async function POST(request: Request) {
  const settings = await getCustomOrderSettings();
  if (!settings.enabled) {
    return NextResponse.json({ ok: false, error: settings.message }, { status: 403 });
  }

  const form = await request.formData();
  const file = form.get('file') as unknown;
  if (!file || typeof file !== 'object' || typeof (file as any).arrayBuffer !== 'function') {
    return NextResponse.json({ ok: false, error: 'Missing file' }, { status: 400 });
  }

  const maxBytes = getMaxUploadBytes();
  const size = Number((file as any).size ?? 0);
  if (!Number.isFinite(size) || size <= 0) {
    return NextResponse.json({ ok: false, error: 'Invalid file' }, { status: 400 });
  }
  if (size > maxBytes) {
    const maxMb = Math.floor(maxBytes / (1024 * 1024));
    return NextResponse.json({ ok: false, error: `File too large (max ${maxMb}MB)` }, { status: 413 });
  }

  const fileType = String((file as any).type ?? '');
  const allowedTypes = new Set(['image/png', 'image/jpeg', 'image/webp']);
  if (!allowedTypes.has(fileType)) {
    return NextResponse.json({ ok: false, error: 'Only PNG/JPG/WEBP images are allowed' }, { status: 415 });
  }

  const inputBytes = Buffer.from(await (file as any).arrayBuffer());
  const pipeline = sharp(inputBytes).rotate();

  const mainBuffer = await pipeline
    .clone()
    .resize(1600, 1600, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer();

  const thumbBuffer = await pipeline
    .clone()
    .resize(360, 360, { fit: 'cover' })
    .webp({ quality: 75 })
    .toBuffer();

  if (mainBuffer.length > 2 * 1024 * 1024) {
    return NextResponse.json({ ok: false, error: 'Image is too detailed after compression. Please choose a smaller image.' }, { status: 413 });
  }

  const [url, thumbUrl] = await Promise.all([
    saveImage(mainBuffer, 'custom-order'),
    saveImage(thumbBuffer, 'custom-order')
  ]);

  return NextResponse.json({
    ok: true,
    url,
    thumbUrl
  });
}
