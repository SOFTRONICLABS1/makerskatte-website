import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/firebaseAdmin';
import { notFound } from 'next/navigation';
import ProductFormClient from '../../ProductFormClient';

export default async function EditProductPage({ params }: { params: { id: string } }) {
  await requireAdmin();
  const ref = db.collection('products').doc(params.id);
  const snap = await ref.get();
  if (!snap.exists) {
    notFound();
  }
  const product = { id: snap.id, ...(snap.data() as Record<string, unknown>) };
  return <ProductFormClient mode="edit" initialProduct={product as any} />;
}
