import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import sharp from 'sharp';
import { cert, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const CHUNK_BYTES = 512 * 1024;
const MAX_BYTES = 2 * 1024 * 1024;

async function loadEnv() {
  const raw = await readFile('.env', 'utf8');
  for (const line of raw.split(/\r?\n/)) {
    const match = line.match(/^([A-Z_]+)=(.*)$/);
    if (match && !(match[1] in process.env)) {
      process.env[match[1]] = match[2].trim().replace(/^"(.*)"$/, '$1');
    }
  }
}

function required(name) {
  if (!process.env[name]?.trim()) throw new Error('Missing ' + name);
  return process.env[name].trim();
}

function localName(value, folder) {
  if (typeof value !== 'string') return null;
  let pathname = value;
  if (/^https?:\/\//i.test(value)) {
    try { pathname = new URL(value).pathname; } catch { return null; }
  }
  const prefix = '/' + folder + '/';
  if (!pathname.startsWith(prefix)) return null;
  let name;
  try { name = decodeURIComponent(pathname.slice(prefix.length)); } catch { return null; }
  return name && name === path.basename(name) ? name : null;
}

function urlList(value) {
  if (Array.isArray(value)) return value;
  if (typeof value !== 'string' || !value.trim()) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [value];
  } catch {
    return [value];
  }
}

async function compressedImage(filePath) {
  const input = await readFile(filePath);
  for (const width of [1600, 1200, 800]) {
    const bytes = await sharp(input).rotate()
      .resize(width, width, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 78 }).toBuffer();
    if (bytes.length <= MAX_BYTES) return bytes;
  }
  throw new Error('Image remains too large after compression: ' + filePath);
}

function deterministicId(bytes, kind) {
  const hash = createHash('sha256').update(kind).update(bytes).digest('hex').slice(0, 32);
  return [hash.slice(0, 8), hash.slice(8, 12), hash.slice(12, 16), hash.slice(16, 20), hash.slice(20)].join('-');
}

async function main() {
  await loadEnv();
  const apply = process.argv.includes('--apply');
  const app = initializeApp({
    credential: cert({
      projectId: required('FIREBASE_PROJECT_ID'),
      clientEmail: required('FIREBASE_CLIENT_EMAIL'),
      privateKey: required('FIREBASE_PRIVATE_KEY').replace(/\\n/g, '\n')
    })
  });
  const db = getFirestore(app);
  const files = new Map();
  for (const folder of ['uploads', 'custom-order-uploads']) {
    const directory = path.join('public', folder);
    let names = [];
    try { names = await readdir(directory); } catch { /* no local files */ }
    for (const name of names) {
      if (/\.(png|jpe?g|webp)$/i.test(name)) {
        files.set(folder + '/' + name, {
          localPath: path.join(directory, name),
          kind: folder === 'uploads' ? 'product' : 'custom-order'
        });
      }
    }
  }

  const [products, orders, customOrders] = await Promise.all([
    db.collection('products').get(),
    db.collection('orders').get(),
    db.collection('customOrders').get()
  ]);
  const refs = new Set();
  const collect = (value, folder) => {
    const name = localName(value, folder);
    if (name) refs.add(folder + '/' + name);
  };
  for (const doc of products.docs) {
    const data = doc.data();
    collect(data.imageUrl, 'uploads');
    for (const url of urlList(data.imageUrls)) collect(url, 'uploads');
  }
  for (const doc of orders.docs) {
    for (const item of doc.data().items ?? []) collect(item?.product?.imageUrl, 'uploads');
  }
  for (const doc of customOrders.docs) {
    for (const url of urlList(doc.data().fileName)) collect(url, 'custom-order-uploads');
  }
  const missing = [...refs].filter((key) => !files.has(key));
  if (missing.length) throw new Error('Referenced local images are missing: ' + missing.join(', '));

  const prepared = new Map();
  let totalBytes = 0;
  for (const [key, file] of files) {
    const bytes = await compressedImage(file.localPath);
    const id = deterministicId(bytes, file.kind);
    prepared.set(key, { id, bytes, kind: file.kind, url: '/api/images/' + id });
    totalBytes += bytes.length;
  }
  console.log((apply ? 'Migrating ' : 'Dry run: ') + prepared.size + ' images (' + (totalBytes / 1048576).toFixed(1) + ' MiB compressed), ' + products.size + ' products, ' + orders.size + ' orders, ' + customOrders.size + ' custom orders.');
  if (!apply) {
    console.log('Run again with --apply to save images in Firestore and update URLs. Source files will be retained.');
    return;
  }

  for (const image of prepared.values()) {
    const ref = db.collection('imageAssets').doc(image.id);
    if ((await ref.get()).exists) continue;
    const count = Math.ceil(image.bytes.length / CHUNK_BYTES);
    const batch = db.batch();
    batch.set(ref, { kind: image.kind, contentType: 'image/webp', byteLength: image.bytes.length, chunkCount: count, createdAt: new Date().toISOString() });
    for (let i = 0; i < count; i++) {
      batch.set(ref.collection('chunks').doc(String(i)), { bytes: image.bytes.subarray(i * CHUNK_BYTES, (i + 1) * CHUNK_BYTES) });
    }
    await batch.commit();
  }

  const replace = (value, folder) => {
    const name = localName(value, folder);
    return name ? prepared.get(folder + '/' + name).url : value;
  };
  let updated = 0;
  for (const doc of products.docs) {
    const data = doc.data();
    const imageUrl = replace(data.imageUrl, 'uploads');
    const before = urlList(data.imageUrls);
    const after = before.map((url) => replace(url, 'uploads'));
    if (imageUrl !== data.imageUrl || JSON.stringify(after) !== JSON.stringify(before)) {
      await doc.ref.update({ imageUrl, imageUrls: JSON.stringify(after) });
      updated++;
    }
  }
  for (const doc of orders.docs) {
    const data = doc.data();
    const items = Array.isArray(data.items) ? data.items.map((item) => ({
      ...item,
      product: item?.product ? { ...item.product, imageUrl: replace(item.product.imageUrl, 'uploads') } : item?.product
    })) : [];
    if (JSON.stringify(items) !== JSON.stringify(data.items)) {
      await doc.ref.update({ items });
      updated++;
    }
  }
  for (const doc of customOrders.docs) {
    const data = doc.data();
    const before = urlList(data.fileName);
    const after = before.map((url) => replace(url, 'custom-order-uploads'));
    if (JSON.stringify(after) !== JSON.stringify(before)) {
      await doc.ref.update({ fileName: JSON.stringify(after) });
      updated++;
    }
  }
  console.log('Saved/verified ' + prepared.size + ' images and updated ' + updated + ' Firestore documents. Source files were retained.');
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
