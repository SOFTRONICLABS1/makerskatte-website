import { productCategoryName } from './category';

/** Match the homepage material families as well as exact catalog material labels. */
export function matchesMaterial(material: string | null, selected: string): boolean {
  const value = productCategoryName(null, material).toLowerCase() || 'other';
  const filter = productCategoryName(null, selected).toLowerCase();
  if (value === filter) return true;
  const families: Record<string, RegExp> = {
    wood: /\b(wood|wooden|plywood|mdf)\b/,
    acrylic: /\bacrylic\b/,
    glass: /\bglass\b/,
    metal: /\b(metal|steel|aluminium|aluminum|brass|copper)\b/,
    leather: /\bleather\b/
  };
  return families[filter]?.test(value) ?? false;
}

export function matchesProductMaterial(product: { category: string | null; material: string | null }, selected: string): boolean {
  return matchesMaterial(productCategoryName(product.category, product.material), selected);
}
