import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/firebaseAdmin';
import { getAdminSession } from '@/lib/auth';
import { randomUUID } from 'node:crypto';

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

async function getBySlug(slug: string) {
  const snap = await db.collection('products').where('slug', '==', slug).limit(1).get();
  return snap.empty ? null : snap.docs[0];
}

async function ensureUniqueSlug(base: string, opts?: { excludeId?: string }) {
  const safeBase = slugify(base) || 'product';
  let candidate = safeBase;
  for (let i = 0; i < 50; i++) {
    const existing = await getBySlug(candidate);
    if (!existing || (opts?.excludeId && existing.id === opts.excludeId)) {
      return candidate;
    }
    candidate = `${safeBase}-${i + 2}`;
  }
  return `${safeBase}-${Date.now()}`;
}

function mapProduct(doc: FirebaseFirestore.QueryDocumentSnapshot | FirebaseFirestore.DocumentSnapshot) {
  const raw = (doc.data() ?? {}) as Record<string, unknown>;
  const now = new Date().toISOString();
  return {
    id: doc.id,
    name: typeof raw.name === 'string' ? raw.name : '',
    slug: typeof raw.slug === 'string' ? raw.slug : '',
    description: typeof raw.description === 'string' ? raw.description : null,
    material: typeof raw.material === 'string' ? raw.material : null,
    category: typeof raw.category === 'string' ? raw.category : null,
    subcategory: typeof raw.subcategory === 'string' ? raw.subcategory : null,
    price: Number(raw.price) || 0,
    originalPrice: raw.originalPrice === null || raw.originalPrice === undefined || raw.originalPrice === '' ? null : Number(raw.originalPrice),
    stock: Math.max(0, Math.floor(Number(raw.stock) || 0)),
    badge: typeof raw.badge === 'string' ? raw.badge : null,
    rating: raw.rating === null || raw.rating === undefined || raw.rating === '' ? null : Number(raw.rating),
    reviews: raw.reviews === null || raw.reviews === undefined || raw.reviews === '' ? null : Number(raw.reviews),
    imageUrl: typeof raw.imageUrl === 'string' ? raw.imageUrl : null,
    imageUrls: typeof raw.imageUrls === 'string' ? raw.imageUrls : null,
    isFeatured: typeof raw.isFeatured === 'boolean' ? raw.isFeatured : false,
    isComingSoon: typeof raw.isComingSoon === 'boolean' ? raw.isComingSoon : false,
    isActive: typeof raw.isActive === 'boolean' ? raw.isActive : true,
    createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : now,
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : now
  };
}

export async function GET() {
  const snap = await db.collection('products').where('isActive', '==', true).get();
  const products = snap.docs.map((doc) => mapProduct(doc));
  products.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  return NextResponse.json(products);
}

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const name = typeof body?.name === 'string' ? body.name.trim() : '';
  if (!name) {
    return NextResponse.json({ error: 'Name is required.' }, { status: 400 });
  }

  const imageUrls =
    Array.isArray(body.imageUrls) ? body.imageUrls.filter((u: unknown) => typeof u === 'string') : body.imageUrls;
  const imageUrlsJson = imageUrls ? (typeof imageUrls === 'string' ? imageUrls : JSON.stringify(imageUrls)) : null;

  const desiredSlug = typeof body?.slug === 'string' && body.slug.trim() ? body.slug : name;
  const slug = await ensureUniqueSlug(desiredSlug);
  const now = new Date().toISOString();
  const id = randomUUID();

  const product = {
    id,
    name,
    slug,
    description: body.description ?? null,
    material: body.material ?? null,
    category: body.category ?? null,
    subcategory: body.subcategory ?? null,
    price: Number(body.price),
    originalPrice: body.originalPrice ? Number(body.originalPrice) : null,
    stock: body.stock === undefined || body.stock === null ? 0 : Number(body.stock),
    badge: body.badge ?? null,
    rating: body.rating ? Number(body.rating) : null,
    reviews: body.reviews ? Number(body.reviews) : null,
    imageUrl: body.imageUrl ?? null,
    imageUrls: imageUrlsJson,
    isFeatured: Boolean(body.isFeatured),
    isComingSoon: body.isComingSoon === true,
    isActive: body.isActive !== false,
    createdAt: now,
    updatedAt: now
  };

  await db.collection('products').doc(id).set(product);
  revalidatePath('/');
  revalidatePath('/shop');
  return NextResponse.json(product);
}
