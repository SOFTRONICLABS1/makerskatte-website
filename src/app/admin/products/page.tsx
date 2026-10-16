import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/firebaseAdmin';
import ProductsListClient from './ProductsListClient';

export default async function AdminProductsPage() {
  await requireAdmin();
  const snap = await db.collection('products').get();
  const products = snap.docs
    .map((doc) => ({ id: doc.id, ...(doc.data() as Record<string, unknown>) }))
    .sort((a: any, b: any) => {
      const aTime = new Date(typeof a.updatedAt === 'string' ? a.updatedAt : 0).getTime();
      const bTime = new Date(typeof b.updatedAt === 'string' ? b.updatedAt : 0).getTime();
      return bTime - aTime;
    });

  return <ProductsListClient initialProducts={products as any} />;
}
