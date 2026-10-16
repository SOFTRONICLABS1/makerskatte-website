export function slugifyCategory(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}


/** Resolve legacy labels while treating an explicitly saved category as authoritative. */
export function productCategoryName(category: string | null | undefined, material?: string | null): string {
  const value = category?.trim() || material?.trim() || '';
  const aliases: Record<string, string> = {
    acrylic: 'Acrylic', acrlyic: 'Acrylic', wood: 'Wood', wooden: 'Wood',
    glass: 'Glass', metal: 'Metal', leather: 'Leather'
  };
  return aliases[value.toLowerCase()] ?? value;
}
