import 'server-only';
import { randomUUID } from 'node:crypto';
import { db } from './firebaseAdmin';

const CHUNK_BYTES = 512 * 1024;
const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

export type ImageKind = 'product' | 'custom-order';

/** Store a processed WebP in Firestore without exceeding its 1 MiB document limit. */
export async function saveImage(buffer: Buffer, kind: ImageKind): Promise<string> {
  if (buffer.length === 0 || buffer.length > MAX_IMAGE_BYTES) {
    throw new Error('Processed image is too large. Please choose a smaller image.');
  }

  const id = randomUUID();
  const ref = db.collection('imageAssets').doc(id);
  const chunks = Math.ceil(buffer.length / CHUNK_BYTES);
  const batch = db.batch();
  batch.set(ref, {
    kind,
    contentType: 'image/webp',
    byteLength: buffer.length,
    chunkCount: chunks,
    createdAt: new Date().toISOString()
  });
  for (let index = 0; index < chunks; index++) {
    batch.set(ref.collection('chunks').doc(String(index)), {
      bytes: buffer.subarray(index * CHUNK_BYTES, (index + 1) * CHUNK_BYTES)
    });
  }
  await batch.commit();
  return `/api/images/${id}`;
}

export async function readImage(id: string) {
  const ref = db.collection('imageAssets').doc(id);
  const meta = await ref.get();
  if (!meta.exists) return null;
  const data = meta.data() as Record<string, unknown>;
  const count = Number(data.chunkCount);
  const expectedLength = Number(data.byteLength);
  if (!Number.isInteger(count) || count < 1 || count > 4 || !Number.isInteger(expectedLength) || expectedLength < 1 || expectedLength > MAX_IMAGE_BYTES) {
    throw new Error('Invalid image metadata.');
  }
  const refs = Array.from({ length: count }, (_, index) => ref.collection('chunks').doc(String(index)));
  const snaps = await db.getAll(...refs);
  if (snaps.some((snap) => !snap.exists)) throw new Error('Image is incomplete.');
  const bytes = Buffer.concat(snaps.map((snap) => {
    const chunk = snap.get('bytes');
    if (!Buffer.isBuffer(chunk)) throw new Error('Invalid image chunk.');
    return chunk;
  }));
  if (bytes.length !== expectedLength) throw new Error('Image size mismatch.');
  return { bytes, kind: data.kind === 'product' ? 'product' : 'custom-order' } as const;
}
