import { productCategoryName } from '@/lib/category';

export const PRODUCT_CATEGORIES = ['Acrylic', 'Wood', 'Glass', 'Metal', 'Leather'] as const;

export type AdminProduct = {
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
};

export type ProductFormState = {
  id: string;
  name: string;
  slug: string;
  description: string;
  material: string;
  category: string;
  subcategory: string;
  price: number;
  originalPrice: string;
  stock: number;
  badge: string;
  rating: string;
  reviews: string;
  imageUrls: string[];
  isFeatured: boolean;
  isComingSoon: boolean;
  isActive: boolean;
};

export const emptyProductForm: ProductFormState = {
  id: '',
  name: '',
  slug: '',
  description: '',
  material: '',
  category: '',
  subcategory: '',
  price: 0,
  originalPrice: '',
  stock: 0,
  badge: '',
  rating: '',
  reviews: '',
  imageUrls: [],
  isFeatured: false,
  isComingSoon: false,
  isActive: true
};

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

export function parseImageUrls(product: Pick<AdminProduct, 'imageUrls' | 'imageUrl'>): string[] {
  const urls: string[] = [];
  if (typeof product.imageUrls === 'string' && product.imageUrls.trim()) {
    try {
      const parsed = JSON.parse(product.imageUrls);
      if (Array.isArray(parsed)) {
        parsed.forEach((item) => {
          if (typeof item === 'string' && item.trim()) urls.push(item);
        });
      }
    } catch {
      // ignore
    }
  }
  if (typeof product.imageUrl === 'string' && product.imageUrl.trim() && !urls.includes(product.imageUrl)) {
    urls.unshift(product.imageUrl);
  }
  return urls;
}

export function formFromProduct(product: AdminProduct): ProductFormState {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description ?? '',
    material: product.material ?? '',
    category: PRODUCT_CATEGORIES.find((category) => category.toLowerCase() === productCategoryName(product.category, product.material).toLowerCase()) ?? '',
    subcategory: product.subcategory ?? '',
    price: product.price,
    originalPrice: product.originalPrice === null ? '' : String(product.originalPrice),
    stock: typeof product.stock === 'number' ? product.stock : 0,
    badge: product.badge ?? '',
    rating: product.rating === null ? '' : String(product.rating),
    reviews: product.reviews === null ? '' : String(product.reviews),
    imageUrls: parseImageUrls(product),
    isFeatured: product.isFeatured,
    isComingSoon: product.isComingSoon ?? false,
    isActive: product.isActive
  };
}
