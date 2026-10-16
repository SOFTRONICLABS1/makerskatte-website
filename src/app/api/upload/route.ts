import { NextResponse } from 'next/server';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { randomBytes } from 'node:crypto';
import { getAdminSession } from '@/lib/auth';
import sharp from 'sharp';

export const runtime = 'nodejs';

function getMaxUploadBytes() {
  const env = process.env.MAX_UPLOAD_BYTES ? Number(process.env.MAX_UPLOAD_BYTES) : NaN;
  if (Number.isFinite(env) && env > 0) return env;
  return 15 * 1024 * 1024; // 15MB default for local dev
}

function sanitizeFilename(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_');
}

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const form = await request.formData();
  const file = form.get('file') as unknown;
  // In Node.js runtimes the global `File` class may not exist, so avoid `instanceof File`.
  if (!file || typeof file !== 'object' || typeof (file as any).arrayBuffer !== 'function') {
    return NextResponse.json({ error: 'Missing file' }, { status: 400 });
  }

  const maxBytes = getMaxUploadBytes();

  const size = Number((file as any).size ?? 0);
  if (!Number.isFinite(size) || size <= 0) {
    return NextResponse.json({ error: 'Invalid file' }, { status: 400 });
  }
  if (size > maxBytes) {
    const maxMb = Math.floor(maxBytes / (1024 * 1024));
    return NextResponse.json({ error: `File too large (max ${maxMb}MB)` }, { status: 413 });
  }

  const originalName = String((file as any).name ?? 'upload');
  const fileType = String((file as any).type ?? '');
  const allowedTypes = new Set(['image/png', 'image/jpeg', 'image/webp']);
  if (!allowedTypes.has(fileType)) {
    return NextResponse.json({ error: 'Only PNG/JPG/WEBP images are allowed' }, { status: 415 });
  }

  const uploadDir = path.join(process.cwd(), 'public', 'uploads');
  await mkdir(uploadDir, { recursive: true });

  const token = randomBytes(6).toString('hex');
  const safeName = sanitizeFilename(path.basename(originalName, path.extname(originalName)));
  const filenameBase = `${Date.now()}_${token}_${safeName || 'image'}`;

  const inputBytes = Buffer.from(await (file as any).arrayBuffer());

  // Amazon-style consistency: normalize all uploads to the same square size and format.
  // We save WebP to reduce size while keeping quality.
  const mainFilename = `${filenameBase}.webp`;
  const thumbFilename = `${filenameBase}_thumb.webp`;
  const mainPath = path.join(uploadDir, mainFilename);
  const thumbPath = path.join(uploadDir, thumbFilename);

  const pipeline = sharp(inputBytes).rotate();

  const mainBuffer = await pipeline
    .clone()
    .resize(1200, 1200, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .webp({ quality: 82 })
    .toBuffer();

  const thumbBuffer = await pipeline
    .clone()
    .resize(360, 360, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .webp({ quality: 75 })
    .toBuffer();

  await Promise.all([writeFile(mainPath, mainBuffer), writeFile(thumbPath, thumbBuffer)]);

  return NextResponse.json({
    ok: true,
    url: `/uploads/${mainFilename}`,
    thumbUrl: `/uploads/${thumbFilename}`
  });
}
