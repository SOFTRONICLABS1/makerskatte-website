import Breadcrumb from '@/components/Breadcrumb';
import Layout from '@/components/Layout';
import { getActiveProducts, getCategoryCounts } from '@/lib/products';
import ShopClient from './ShopClient';
import { slugifyCategory } from '@/lib/category';

export const dynamic = 'force-dynamic';

export default async function ShopPage({ searchParams }: { searchParams: { category?: string | string[] } }) {
  const [products, categories] = await Promise.all([getActiveProducts(), getCategoryCounts()]);
  const requested = typeof searchParams.category === 'string' ? searchParams.category : '';
  const initialCategory = categories.find((category) => slugifyCategory(category.name) === slugifyCategory(requested))?.name || requested || null;
  const clientProducts = products.map((product) => ({
    id: product.id,
    name: product.name,
    slug: product.slug,
    badge: product.badge,
    material: product.material,
    category: product.category,
    price: product.price,
    originalPrice: product.originalPrice,
    rating: product.rating,
    reviews: product.reviews,
    imageUrl: product.imageUrl,
    stock: product.stock,
    isComingSoon: product.isComingSoon
  }));

  return (
    <Layout announcement="🔥 Free shipping above ₹999 | Use code DIWALI20 for 20% off | COD Available">
      <Breadcrumb items={[{ label: 'Home', to: '/' }, { label: 'Shop' }]} />

      <ShopClient key={initialCategory ?? "all"} products={clientProducts} categories={categories} initialCategory={initialCategory} />
    </Layout>
  );
}
