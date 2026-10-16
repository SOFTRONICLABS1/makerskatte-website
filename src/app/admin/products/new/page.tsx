import { requireAdmin } from '@/lib/auth';
import ProductFormClient from '../ProductFormClient';

export default async function NewProductPage() {
  await requireAdmin();
  return <ProductFormClient mode="create" />;
}
