import { db } from './firebaseAdmin';
import { productCategoryName } from './category';

type ProductRecord = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  material: string | null;
  category: string | null;
  subcategory: string | null;
  price: number;
  originalPrice: number | null;
  stock: number;
  badge: string | null;
  rating: number | null;
  reviews: number | null;
  imageUrl: string | null;
  imageUrls: string | null;
  isFeatured: boolean;
  isComingSoon: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

function asString(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback;
}

function asNullableString(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function asNumber(value: unknown, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function asNullableNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function asBoolean(value: unknown, fallback = false) {
  return typeof value === 'boolean' ? value : fallback;
}

function asIso(value: unknown) {
  if (typeof value === 'string' && value.trim()) return value;
  return new Date().toISOString();
}

function mapProduct(id: string, raw: Record<string, unknown>): ProductRecord {
  return {
    id,
    name: asString(raw.name),
    slug: asString(raw.slug),
    description: asNullableString(raw.description),
    material: asNullableString(raw.material),
    category: productCategoryName(asNullableString(raw.category), asNullableString(raw.material)) || null,
    subcategory: asNullableString(raw.subcategory),
    price: asNumber(raw.price, 0),
    originalPrice: asNullableNumber(raw.originalPrice),
    stock: Math.max(0, Math.floor(asNumber(raw.stock, 0))),
    badge: asNullableString(raw.badge),
    rating: asNullableNumber(raw.rating),
    reviews: asNullableNumber(raw.reviews),
    imageUrl: asNullableString(raw.imageUrl),
    imageUrls: asNullableString(raw.imageUrls),
    isFeatured: asBoolean(raw.isFeatured, false),
    isComingSoon: asBoolean(raw.isComingSoon, false),
    isActive: asBoolean(raw.isActive, true),
    createdAt: asIso(raw.createdAt),
    updatedAt: asIso(raw.updatedAt)
  };
}

async function getAllProducts() {
  const snap = await db.collection('products').get();
  return snap.docs.map((doc) => mapProduct(doc.id, doc.data() as Record<string, unknown>));
}

function sortByUpdatedDesc<T extends { updatedAt: string }>(items: T[]) {
  return [...items].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

export async function getFeaturedProducts(limit?: number) {
  const products = await getAllProducts();
  return sortByUpdatedDesc(products.filter((p) => p.isFeatured && p.isActive)).slice(0, limit);
}

export async function getActiveProducts() {
  const products = await getAllProducts();
  return sortByUpdatedDesc(products.filter((p) => p.isActive));
}

export async function getActiveProductsByCategory(category: string) {
  const products = await getAllProducts();
  return sortByUpdatedDesc(products.filter((p) => p.isActive && p.category === category));
}

export async function getActiveProductsByCategoryAndSubcategory(category: string, subcategory: string) {
  const products = await getAllProducts();
  return sortByUpdatedDesc(products.filter((p) => p.isActive && p.category === category && p.subcategory === subcategory));
}

export async function getProductBySlug(slug: string) {
  const products = await getAllProducts();
  return products.find((p) => p.slug === slug) ?? null;
}

export async function getRelatedProducts(category: string | null | undefined, excludeId: string, take = 4) {
  const products = await getAllProducts();
  const filtered = products.filter((p) => p.isActive && p.id !== excludeId && (!category || p.category === category));
  return sortByUpdatedDesc(filtered).slice(0, take);
}

export async function getCategoryCounts() {
  const products = await getAllProducts();
  const counts = new Map<string, number>();
  products.forEach((product) => {
    if (!product.isActive || !product.category) return;
    counts.set(product.category, (counts.get(product.category) ?? 0) + 1);
  });
  return Array.from(counts.entries()).map(([name, count]) => ({ name, count }));
}

export async function getSubcategoryCountsByCategory(category: string) {
  const products = await getAllProducts();
  const counts = new Map<string, number>();
  products
    .filter((p) => p.isActive && p.category === category)
    .forEach((product) => {
      const key = typeof product.subcategory === 'string' && product.subcategory.trim() ? product.subcategory.trim() : 'General';
      counts.set(key, (counts.get(key) ?? 0) + 1);
    });
  return Array.from(counts.entries()).map(([name, count]) => ({ name, count }));
}
