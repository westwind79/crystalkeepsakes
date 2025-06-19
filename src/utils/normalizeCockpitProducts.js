// utils/normalizeCockpitProducts.js
export function normalizeCockpitProduct(product) {
  return {
    id: String(product.id),
    name: product.name.trim(),
    slug: product.slug,
    basePrice: parseFloat(product.basePrice || 0),
    sizes: (product.sizes || []).map(s => ({
      ...s,
      price: parseFloat(s.price || 0),
    })),
    lightBases: (product.lightBases || []).map(b => ({
      ...b,
      price: parseFloat(b.price || 0),
    })),
    backgroundOptions: (product.backgroundOptions || []).map(o => ({
      ...o,
      price: parseFloat(o.price || 0),
    })),
    textOptions: (product.textOptions || []).map(o => ({
      ...o,
      price: parseFloat(o.price || 0),
    })),
    requiresImage: !!product.requiresImage,
    images: product.images || [],
    description: product.description || '',
    options: product.options || [],
  };
}
