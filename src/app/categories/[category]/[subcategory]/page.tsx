import { redirect } from 'next/navigation';

export default function CategoryPage({ params }: { params: { category: string } }) {
  redirect(`/shop?category=${encodeURIComponent(params.category)}`);
}
