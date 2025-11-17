'use client';

/**
 * Enhanced Product Admin Panel
 * Version: 2.0.0
 * Features:
 * - Complete price control (base + all options)
 * - Option configuration (enable/disable per product)
 * - Size, lightbase, background, text option management
 * - Generates final-product-list.js with all customizations
 */

import React, { useState, useEffect } from 'react';
import { cockpit3dProducts } from '@/data/cockpit3d-products';
import ProductGallery2 from '@/components/ProductGallery2';
import ImageUpload from '@/components/admin/ImageUpload';
import { getProductCategories, getCategoryLabel, isOnSale, OCCASION_CATEGORIES } from '@/utils/categoriesConfig';

// Types
interface ProductImage {
  src: string;
  isMain: boolean;
}

interface Size {
  id: string;
  name: string;
  price: number;
  cockpit3d_id?: string;
  enabled?: boolean;
}

interface LightBase {
  id: string;
  name: string;
  price: number | null;
  cockpit3d_id?: string;
  enabled?: boolean;
}

interface BackgroundOption {
  id: string;
  name: string;
  price: number;
  cockpit3d_option_id?: string;
  enabled?: boolean;
}

interface TextOption {
  id: string;
  name: string;
  price: number;
  cockpit3d_option_id?: string;
  enabled?: boolean;
}

interface Product {
  id: string;
  cockpit3d_id?: string;
  name: string;
  slug: string;
  sku: string;
  cost?: number;  // What you pay to fulfill
  basePrice: number;  // What customer pays (after markup)
  description: string;
  longDescription?: string;
  images?: ProductImage[];
  sizes?: Size[];
  lightBases?: LightBase[];
  backgroundOptions?: BackgroundOption[];
  textOptions?: TextOption[];
  requiresImage?: boolean;
  featured?: boolean;
  sale?: boolean;
  salePrice?: number;  // LEGACY: Fixed sale price
  salePercent?: number;  // Percentage discount
  maskImageUrl?: string | null;
  occasions?: string[];
  fulfillment?: 'cockpit3d' | 'custom';  // NEW: Who fulfills this product
}

interface ProductCustomizations {
  [productId: string]: Partial<Product>;
}

export default function EnhancedProductAdminPage() {
  const [sourceProducts] = useState<Product[]>(cockpit3dProducts as Product[]);
  const [editedProducts, setEditedProducts] = useState<ProductCustomizations>({});
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [activeTab, setActiveTab] = useState<'basic' | 'pricing' | 'options' | 'images'>('basic');

  // Load existing customizations from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('productCustomizations');
      if (saved) {
        setEditedProducts(JSON.parse(saved));
      }
    } catch (e) {
      console.warn('No existing customizations found');
    }
  }, []);

  // Get merged product data (source + customizations)
  const getProductData = (productId: string): Product => {
    const sourceProduct = sourceProducts.find((p) => p.id === productId);
    const customizations = editedProducts[productId] || {};
    return { ...sourceProduct, ...customizations } as Product;
  };

  // Update product customization
  const updateProduct = (productId: string, updates: Partial<Product>) => {
    setEditedProducts((prev) => ({
      ...prev,
      [productId]: { ...prev[productId], ...updates },
    }));
  };

  // Handle size updates
  const updateSize = (productId: string, sizeIndex: number, updates: Partial<Size>) => {
    const product = getProductData(productId);
    const sizes = [...(product.sizes || [])];
    sizes[sizeIndex] = { ...sizes[sizeIndex], ...updates };
    
    // Auto-update basePrice to smallest enabled size price
    const enabledSizes = sizes.filter(s => s.enabled !== false);
    if (enabledSizes.length > 0) {
      const minPrice = Math.min(...enabledSizes.map(s => s.price || 0));
      updateProduct(productId, { sizes, basePrice: minPrice });
    } else {
      updateProduct(productId, { sizes });
    }
  };

  // Handle lightbase updates
  const updateLightBase = (productId: string, lbIndex: number, updates: Partial<LightBase>) => {
    const product = getProductData(productId);
    const lightBases = [...(product.lightBases || [])];
    lightBases[lbIndex] = { ...lightBases[lbIndex], ...updates };
    updateProduct(productId, { lightBases });
  };

  // Handle background updates
  const updateBackground = (productId: string, bgIndex: number, updates: Partial<BackgroundOption>) => {
    const product = getProductData(productId);
    const backgroundOptions = [...(product.backgroundOptions || [])];
    backgroundOptions[bgIndex] = { ...backgroundOptions[bgIndex], ...updates };
    updateProduct(productId, { backgroundOptions });
  };

  // Handle text option updates
  const updateTextOption = (productId: string, textIndex: number, updates: Partial<TextOption>) => {
    const product = getProductData(productId);
    const textOptions = [...(product.textOptions || [])];
    textOptions[textIndex] = { ...textOptions[textIndex], ...updates };
    updateProduct(productId, { textOptions });
  };

  // Handle images update
  const handleImagesUpdated = (productId: string, updatedImages: ProductImage[]) => {
    updateProduct(productId, { images: updatedImages });
  };

  // Generate final product list
  const generateFinalProducts = () => {
    const finalProducts = sourceProducts.map((product) => {
      const customizations = editedProducts[product.id] || {};
      const merged = { ...product, ...customizations };
      
      // Filter out disabled options
      if (merged.sizes) {
        merged.sizes = merged.sizes.filter(s => s.enabled !== false);
      }
      if (merged.lightBases) {
        merged.lightBases = merged.lightBases.filter(lb => lb.enabled !== false);
      }
      if (merged.backgroundOptions) {
        merged.backgroundOptions = merged.backgroundOptions.filter(bg => bg.enabled !== false);
      }
      if (merged.textOptions) {
        merged.textOptions = merged.textOptions.filter(t => t.enabled !== false);
      }
      
      return merged;
    });

    const content = `// final-product-list.js - Generated by Enhanced Admin Panel
// DO NOT EDIT MANUALLY - Generated from cockpit3d-products.js + customizations
// Generated: ${new Date().toISOString()}
// 
// This file is the SOURCE OF TRUTH for product display and pricing
// All frontend pages, cart, checkout, and orders use this file

export const finalProductList = ${JSON.stringify(finalProducts, null, 2)};

export const customizationInfo = {
  generated_at: "${new Date().toISOString()}",
  source_products: ${sourceProducts.length},
  customized_products: ${Object.keys(editedProducts).length},
  total_products: ${finalProducts.length},
  has_custom_images: ${finalProducts.some((p) => p.images?.length > 1)},
  has_price_overrides: ${finalProducts.some((p) => editedProducts[p.id]?.basePrice !== undefined)},
  admin_customized: true
};

export default finalProductList;
`;

    return content;
  };

  // Save and download final product list
  const saveFinalProducts = async () => {
    // Validate: Check if any product has sale=true but no salePrice
    const invalidProducts = Object.entries(editedProducts)
      .filter(([id, data]) => data.sale === true && (!data.salePrice || data.salePrice <= 0))
      .map(([id]) => {
        const product = sourceProducts.find(p => p.id === id);
        return product?.name || id;
      });

    if (invalidProducts.length > 0) {
      alert(`❌ Cannot Save: Missing Sale Prices\n\nThe following products are marked "On Sale" but have no sale price set:\n\n${invalidProducts.join('\n')}\n\nPlease set a sale price for each product marked as "On Sale".`);
      return;
    }

    // Validate: Check if sale price is less than base price
    const invalidPriceProducts = Object.entries(editedProducts)
      .filter(([id, data]) => {
        if (!data.sale || !data.salePrice) return false;
        const product = sourceProducts.find(p => p.id === id);
        const basePrice = data.basePrice ?? product?.basePrice ?? 0;
        return data.salePrice >= basePrice;
      })
      .map(([id]) => {
        const product = sourceProducts.find(p => p.id === id);
        return product?.name || id;
      });

    if (invalidPriceProducts.length > 0) {
      alert(`❌ Cannot Save: Invalid Sale Prices\n\nThe following products have a sale price that is NOT less than the original price:\n\n${invalidPriceProducts.join('\n')}\n\nSale price must be lower than the original price.`);
      return;
    }

    const jsContent = generateFinalProducts();
    
    // Save to localStorage
    localStorage.setItem('productCustomizations', JSON.stringify(editedProducts));

    // Generate the products array for JSON
    const finalProducts = sourceProducts.map((product) => {
      const customizations = editedProducts[product.id] || {};
      const merged = { ...product, ...customizations };
      
      // Filter out disabled options
      if (merged.sizes) {
        merged.sizes = merged.sizes.filter(s => s.enabled !== false);
      }
      if (merged.lightBases) {
        merged.lightBases = merged.lightBases.filter(lb => lb.enabled !== false);
      }
      if (merged.backgroundOptions) {
        merged.backgroundOptions = merged.backgroundOptions.filter(bg => bg.enabled !== false);
      }
      if (merged.textOptions) {
        merged.textOptions = merged.textOptions.filter(t => t.enabled !== false);
      }
      
      return merged;
    });
    
    // Download products.json (for FTP upload to /public/data/)
    const jsonContent = JSON.stringify(finalProducts, null, 2);
    const jsonBlob = new Blob([jsonContent], { type: 'application/json' });
    const jsonUrl = URL.createObjectURL(jsonBlob);
    const jsonLink = document.createElement('a');
    jsonLink.href = jsonUrl;
    jsonLink.download = 'products.json';
    document.body.appendChild(jsonLink);
    jsonLink.click();
    document.body.removeChild(jsonLink);
    URL.revokeObjectURL(jsonUrl);
    
    // Also download the JS file (for development/backup)
    const jsBlob = new Blob([jsContent], { type: 'application/javascript' });
    const jsUrl = URL.createObjectURL(jsBlob);
    const jsLink = document.createElement('a');
    jsLink.href = jsUrl;
    jsLink.download = 'final-product-list.js';
    document.body.appendChild(jsLink);
    jsLink.click();
    document.body.removeChild(jsLink);
    URL.revokeObjectURL(jsUrl);
    
    alert(`✅ Products saved successfully!\n\n${Object.keys(editedProducts).length} products customized\n\n📥 Downloaded 2 files:\n\n1. products.json - Upload this to /public/data/ via FTP\n2. final-product-list.js - Backup for development\n\nAfter uploading products.json, refresh your site to see changes!`);
  };

  const hasCustomizations = (productId: string) => {
    return editedProducts[productId] && Object.keys(editedProducts[productId]).length > 0;
  };

  const selectedProductData = selectedProduct ? getProductData(selectedProduct.id) : null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-[var(--header-height)] z-10">
        <div className="max-w-full mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-3xl font-bold text-gray-900">Enhanced Product Admin</p>
              <p className="text-sm text-gray-600 mt-1">
                Complete control over products, prices, and options
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowPreview(!showPreview)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  showPreview
                    ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {showPreview ? '👁️ Hide Preview' : '👁️ Show Preview'}
              </button>
              <button
                onClick={saveFinalProducts}
                className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <span>💾</span>
                <span>Save Products</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-full mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {/* Stats */}
        <div className="my-6 grid grid-cols-5 lg:grid-cols-5 gap-2">
          <div className="bg-blue-100 rounded-lg p-4 text-center">
            <div className="text-sm font-medium text-blue-600">Source</div>
            <div className="text-2xl font-bold text-blue-900">{sourceProducts.length}</div>
          </div>
          <div className="bg-green-100 rounded-lg p-4 text-center">
            <div className="text-sm font-medium text-green-600">On Sale</div>
            <div className="text-2xl font-bold text-green-900">
              {sourceProducts.filter(p => {
                const productData = editedProducts[p.id] || p;
                return productData.sale === true;
              }).length}
            </div>
          </div>
          <div className="bg-blue-100 rounded-lg p-4 text-center">
            <div className="text-sm font-medium text-green-600">Featured</div>
            <div className="text-2xl font-bold text-green-900">
              {sourceProducts.filter(p => {
                const productData = editedProducts[p.id] || p;
                return productData.featured === true;
              }).length}
            </div>
          </div>
          <div className="bg-yellow-200 rounded-lg p-4 text-center">
            <div className="text-sm font-medium text-green-600">Customized</div>
            <div className="text-2xl font-bold text-green-900">
              {Object.keys(editedProducts).length}
            </div>
          </div>
          <div className="bg-purple-100 rounded-lg p-4 text-center">
            <div className="text-sm font-medium text-purple-600">Total</div>
            <div className="text-2xl font-bold text-purple-900">{sourceProducts.length}</div>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* Product List - Left Column */}
          <div className="col-span-12 lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-4 border-b bg-gray-50">
                <p className="text-lg font-semibold text-gray-900">
                  Products ({sourceProducts.length})
                </p>
              </div>
              <div className="overflow-y-auto" style={{ maxHeight: '75vh' }}>
                {sourceProducts.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => setSelectedProduct(product)}
                    className={`w-full text-left p-3 border-b hover:bg-gray-50 transition-colors ${
                      selectedProduct?.id === product.id ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {/* Product Thumbnail */}
                      <div className="w-32 h-32 flex-shrink-0 bg-gray-100 rounded overflow-hidden">
                        {product.images && product.images.length > 0 ? (
                          <img
                            src={product.images[0].src}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                            No img
                          </div>
                        )}
                      </div>

                      {/* Product Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm text-gray-900 truncate">{product.name}</h3>
                        <p className="text-xs text-gray-600">SKU: {product.sku}</p>
                        <p className="text-sm text-green-600 font-bold">${product.basePrice}</p>
                        {hasCustomizations(product.id) && (
                          <span className="inline-block mt-1 px-2 py-0.5 bg-green-100 text-green-800 text-xs font-medium rounded">
                            Edited
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Edit Panel - Middle Column */}
          <div className="col-span-12 lg:col-span-5">
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-4 border-b bg-gray-50">
                <p className="text-lg font-semibold text-gray-900">
                  {selectedProduct ? `Edit: ${selectedProduct.name}` : 'Select a Product'}
                </p>
              </div>

              {selectedProduct && selectedProductData ? (
                <>
                  {/* Tabs */}
                  <div className="flex border-b">
                    {[
                      { id: 'basic', label: '📝 Basic', icon: '' },
                      { id: 'pricing', label: '💰 Pricing', icon: '' },
                      { id: 'options', label: '⚙️ Options', icon: '' },
                      { id: 'images', label: '📸 Images', icon: '' },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                          activeTab === tab.id
                            ? 'border-b-2 border-blue-600 text-blue-600 bg-blue-50'
                            : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* Tab Content */}
                  <div className="p-6 overflow-y-auto" style={{ maxHeight: '65vh' }}>
                    {/* Basic Info Tab */}
                    {activeTab === 'basic' && (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Display Name
                          </label>
                          <input
                            type="text"
                            value={selectedProductData.name}
                            onChange={(e) => updateProduct(selectedProduct.id, { name: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Short Description
                          </label>
                          <input
                            type="text"
                            value={selectedProductData.description || ''}
                            onChange={(e) => updateProduct(selectedProduct.id, { description: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Long Description
                          </label>
                          <textarea
                            rows={4}
                            value={selectedProductData.longDescription || ''}
                            onChange={(e) =>
                              updateProduct(selectedProduct.id, { longDescription: e.target.value })
                            }
                            placeholder="Detailed product description..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div>
                          <label className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={selectedProductData.featured || false}
                              onChange={(e) => updateProduct(selectedProduct.id, { featured: e.target.checked })}
                              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <span className="text-sm font-medium text-gray-700">Featured product</span>
                          </label>
                        </div>

                        {/* Fulfillment Method */}
                        <div className="p-4 bg-purple-50 border-2 border-purple-200 rounded-lg">
                          <label className="block text-sm font-bold text-gray-800 mb-3">\ud83d\ude9a Fulfillment</label>
                          <div className="space-y-2">
                            <label className="flex items-center space-x-3 cursor-pointer">
                              <input
                                type="radio"
                                checked={selectedProductData.fulfillment !== 'custom'}
                                onChange={() => updateProduct(selectedProduct.id, { fulfillment: 'cockpit3d' })}
                                className="w-4 h-4 text-purple-600 border-gray-300 focus:ring-purple-500"
                              />
                              <div className="flex-1">
                                <span className="text-sm font-semibold text-gray-900">Cockpit3D</span>
                                <p className="text-xs text-gray-600">Sent to Cockpit3D for fulfillment</p>
                              </div>
                            </label>
                            <label className="flex items-center space-x-3 cursor-pointer">
                              <input
                                type="radio"
                                checked={selectedProductData.fulfillment === 'custom'}
                                onChange={() => updateProduct(selectedProduct.id, { fulfillment: 'custom' })}
                                className="w-4 h-4 text-purple-600 border-gray-300 focus:ring-purple-500"
                              />
                              <div className="flex-1">
                                <span className="text-sm font-semibold text-gray-900">Custom (You fulfill)</span>
                                <p className="text-xs text-gray-600">Wood coasters, custom items, etc.</p>
                              </div>
                            </label>
                          </div>
                        </div>

                        <div>
                          <label className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={selectedProductData.requiresImage !== false}
                              onChange={(e) => updateProduct(selectedProduct.id, { requiresImage: e.target.checked })}
                              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <span className="text-sm font-medium text-gray-700">Requires custom image</span>
                          </label>
                        </div>

                        {/* Categories Section */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-3">
                            🏷️ Product Categories (Auto-detected)
                          </label>
                          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="text-xs text-blue-600 mb-3">
                              Categories are automatically detected based on product name and type. The system will categorize this product as:
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {(() => {
                                const categories = getProductCategories(selectedProductData);
                                
                                if (categories.length === 0) {
                                  return <span className="text-xs text-gray-500">No categories detected</span>;
                                }
                                
                                return categories.map((cat: string) => (
                                  <span 
                                    key={cat}
                                    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                                  >
                                    {getCategoryLabel(cat)}
                                  </span>
                                ));
                              })()}
                            </div>
                            <div className="mt-3 text-xs text-gray-600">
                              <strong>Detection Rules:</strong>
                              <ul className="list-disc list-inside mt-1 space-y-1">
                                <li>Sale: ✓ if "On Sale" is checked above</li>
                                <li>Featured: ✓ if "Featured product" is checked above</li>
                                <li>Light Bases: Product IDs 105-108, 119, 160, 252, 276 (excludes ID 279)</li>
                                <li>3D Crystals: Name contains "3D", "ball", "dome", "monument"</li>
                                <li>2D Crystals: Name contains "2D" or "plaque"</li>
                                <li>Keychains & Necklaces: Name contains "keychain" or "necklace"</li>
                                <li>Ornaments: Name contains "ornament" or ID is 279</li>
                                <li>Heart Shapes: Name contains "heart"</li>
                              </ul>
                            </div>
                          </div>
                        </div>

                        {/* Occasions Section - Manual Assignment */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-3">
                            🎉 Occasions & Themes (Manual Selection)
                          </label>
                          <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg space-y-3">
                            <p className="text-xs text-purple-600 mb-3">
                              Select one or more occasions that this product is suitable for. These will be used for filtering on the products page.
                            </p>
                            <div className="grid grid-cols-2 gap-2">
                              {OCCASION_CATEGORIES.map((occasion) => {
                                const isSelected = selectedProductData.occasions?.includes(occasion.value) || false;
                                
                                return (
                                  <label 
                                    key={occasion.value}
                                    className={`flex items-center space-x-2 p-2 rounded-lg border-2 cursor-pointer transition-all ${
                                      isSelected 
                                        ? 'bg-purple-100 border-purple-500' 
                                        : 'bg-white border-gray-200 hover:border-purple-300'
                                    }`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={(e) => {
                                        const currentOccasions = selectedProductData.occasions || [];
                                        let updatedOccasions;
                                        
                                        if (e.target.checked) {
                                          // Add occasion
                                          updatedOccasions = [...currentOccasions, occasion.value];
                                        } else {
                                          // Remove occasion
                                          updatedOccasions = currentOccasions.filter((o: string) => o !== occasion.value);
                                        }
                                        
                                        updateProduct(selectedProduct.id, { occasions: updatedOccasions });
                                      }}
                                      className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                                    />
                                    <span className="text-sm font-medium text-gray-700">{occasion.label}</span>
                                  </label>
                                );
                              })}
                            </div>
                            
                            {selectedProductData.occasions && selectedProductData.occasions.length > 0 && (
                              <div className="mt-3 pt-3 border-t border-purple-200">
                                <p className="text-xs font-semibold text-purple-700 mb-2">
                                  Selected Occasions ({selectedProductData.occasions.length}):
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {selectedProductData.occasions.map((occ: string) => {
                                    const occasionData = OCCASION_CATEGORIES.find(o => o.value === occ);
                                    return (
                                      <span 
                                        key={occ}
                                        className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800"
                                      >
                                        {occasionData?.label || occ}
                                      </span>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Mask Image Selector */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            🎭 Mask Image (for image editor overlay)
                          </label>
                          <select
                            value={selectedProductData.maskImageUrl || ''}
                            onChange={(e) => updateProduct(selectedProduct.id, { maskImageUrl: e.target.value || null })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">No mask (free crop)</option>
                            <option value="/img/masks/2d-ornament-mask.png">2D Ornament</option>
                            <option value="/img/masks/3CRS-portrait-mask.png">3D Crystal Portrait</option>
                            <option value="/img/masks/3D-crystal-prestige-iceberg-mask.png">3D Crystal Prestige Iceberg</option>
                            <option value="/img/masks/3d-crystal-block-wide.png">3D Crystal Block Wide</option>
                            <option value="/img/masks/3d-crystal-cut-corner-diamond_o.png">3D Crystal Cut Corner Diamond</option>
                            <option value="/img/masks/3d-crystal-diamond-cut-corner-2.png">3D Crystal Diamond Cut Corner 2</option>
                            <option value="/img/masks/3d-crystal-monument_o.png">3D Crystal Monument</option>
                            <option value="/img/masks/3d-crystal-oval_mask.png">3D Crystal Oval</option>
                            <option value="/img/masks/3d-crystal-rectangle-wide-mask.png">3D Crystal Rectangle Wide</option>
                            <option value="/img/masks/3d-crystal-urn-small-mask.png">3D Crystal Urn Small</option>
                            <option value="/img/masks/3d-rectangle-tall-mask.png">3D Rectangle Tall</option>
                            <option value="/img/masks/cat-shape-large-mask.png">Cat Shape Large</option>
                            <option value="/img/masks/crystal-heart-mask.png">Crystal Heart</option>
                            <option value="/img/masks/crystal-urn-large-mask.png">Crystal Urn Large</option>
                            <option value="/img/masks/desk-lamp-mask.png">Desk Lamp</option>
                            <option value="/img/masks/diamond-mask.png">Diamond</option>
                            <option value="/img/masks/dogbone-horizontal-mask.png">Dogbone Horizontal</option>
                            <option value="/img/masks/dogbone-vertical-mask.png">Dogbone Vertical</option>
                            <option value="/img/masks/globe-mask.png">Globe</option>
                            <option value="/img/masks/heart-keychain-mask.png">Heart Keychain</option>
                            <option value="/img/masks/heart-mask.png">Heart</option>
                            <option value="/img/masks/heart-necklace-mask.png">Heart Necklace</option>
                            <option value="/img/masks/notched-horizontal-mask.png">Notched Horizontal</option>
                            <option value="/img/masks/notched-vertical-mask.png">Notched Vertical</option>
                            <option value="/img/masks/ornament-mask.png">Ornament</option>
                            <option value="/img/masks/photo-crystal-ornament-with-a-hole.png">Photo Crystal Ornament with Hole</option>
                            <option value="/img/masks/prestige-mask.png">Prestige</option>
                            <option value="/img/masks/rectangle-horizontal-mask.png">Rectangle Horizontal</option>
                            <option value="/img/masks/rectangle-keychain-horizontal-mask.png">Rectangle Keychain Horizontal</option>
                            <option value="/img/masks/rectangle-keychain-vertical-mask.png">Rectangle Keychain Vertical</option>
                            <option value="/img/masks/rectangle-necklace-mask.png">Rectangle Necklace</option>
                            <option value="/img/masks/rectangle-vertical-mask.png">Rectangle Vertical</option>
                          </select>
                          {selectedProductData.maskImageUrl && (
                            <div className="mt-2 p-2 bg-gray-100 rounded">
                              <img 
                                src={selectedProductData.maskImageUrl} 
                                alt="Mask preview" 
                                className="max-h-40 mx-auto"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Pricing Tab */}
                    {activeTab === 'pricing' && (
                      <div className="space-y-6">
                        {/* Cost & Base Price */}
                        <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-lg space-y-4">
                          <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                            <span>💰</span> Cost & Pricing
                          </h4>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Cost (What you pay to fulfill)
                              </label>
                              <div className="relative">
                                <span className="absolute left-3 top-2 text-gray-500">$</span>
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={selectedProductData.cost || ''}
                                  onChange={(e) => updateProduct(selectedProduct.id, { cost: parseFloat(e.target.value) || undefined })}
                                  placeholder="0.00"
                                  className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                                />
                              </div>
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Base Price {selectedProductData.sizes && selectedProductData.sizes.length > 0 && (
                                  <span className="text-xs text-blue-600">(= smallest size)</span>
                                )}
                              </label>
                              <div className="relative">
                                <span className="absolute left-3 top-2 text-gray-500">$</span>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={selectedProductData.basePrice}
                                  onChange={(e) =>
                                    updateProduct(selectedProduct.id, { basePrice: parseFloat(e.target.value) || 0 })
                                  }
                                  disabled={selectedProductData.sizes && selectedProductData.sizes.length > 0}
                                  className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                                />
                              </div>
                              {selectedProductData.sizes && selectedProductData.sizes.length > 0 && (
                                <p className="text-xs text-gray-600 mt-1">
                                  Auto-set from size prices
                                </p>
                              )}
                            </div>
                          </div>
                          
                          {/* Profit Display */}
                          {selectedProductData.cost && selectedProductData.basePrice && (
                            <div className="pt-3 border-t border-blue-300">
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-700">Profit Margin (on base):</span>
                                <span className="text-lg font-bold text-green-600">
                                  ${(selectedProductData.basePrice - selectedProductData.cost).toFixed(2)}
                                  <span className="text-sm ml-2">
                                    ({Math.round(((selectedProductData.basePrice - selectedProductData.cost) / selectedProductData.cost) * 100)}%)
                                  </span>
                                </span>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Sale Section */}
                        <div className="p-4 bg-red-50 border-2 border-red-200 rounded-lg space-y-4">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                              <span>🔥</span> Sale Discount
                            </h4>
                            <label className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={selectedProductData.sale || false}
                                onChange={(e) => {
                                  updateProduct(selectedProduct.id, { sale: e.target.checked });
                                  if (!e.target.checked) {
                                    updateProduct(selectedProduct.id, { salePrice: undefined, salePercent: undefined });
                                  }
                                }}
                                className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                              />
                              <span className="text-sm font-medium text-gray-700">On Sale</span>
                            </label>
                          </div>

                          {selectedProductData.sale && (
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                {/* Percentage Discount */}
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Discount % <span className="text-xs text-gray-500">(Recommended)</span>
                                  </label>
                                  <div className="relative">
                                    <input
                                      type="number"
                                      step="1"
                                      min="0"
                                      max="100"
                                      value={selectedProductData.salePercent || ''}
                                      onChange={(e) => {
                                        const percent = parseFloat(e.target.value) || undefined
                                        updateProduct(selectedProduct.id, { salePercent: percent })
                                        if (percent) {
                                          updateProduct(selectedProduct.id, { salePrice: undefined })
                                        }
                                      }}
                                      placeholder="e.g., 15"
                                      className="w-full pr-8 pl-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 bg-white"
                                    />
                                    <span className="absolute right-3 top-2 text-gray-500">%</span>
                                  </div>
                                </div>

                                {/* OR Divider */}
                                <div className="flex items-center justify-center text-gray-500 text-sm font-medium">
                                  OR
                                </div>
                              </div>

                              {/* Fixed Sale Price */}
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Fixed Sale Price <span className="text-xs text-gray-500">(Alternative)</span>
                                </label>
                                <div className="relative">
                                  <span className="absolute left-3 top-2 text-gray-500">$</span>
                                  <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={selectedProductData.salePrice || ''}
                                    onChange={(e) => {
                                      const price = parseFloat(e.target.value) || undefined
                                      updateProduct(selectedProduct.id, { salePrice: price })
                                      if (price) {
                                        updateProduct(selectedProduct.id, { salePercent: undefined })
                                      }
                                    }}
                                    placeholder="e.g., 39.99"
                                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 bg-white"
                                  />
                                </div>
                              </div>

                              {/* Preview */}
                              <div className="pt-3 border-t border-red-300 bg-white p-3 rounded">
                                <p className="text-xs font-semibold text-gray-700 mb-2">Preview:</p>
                                <div className="space-y-1 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Original:</span>
                                    <span className="line-through">${selectedProductData.basePrice?.toFixed(2)}</span>
                                  </div>
                                  {selectedProductData.salePercent && (
                                    <>
                                      <div className="flex justify-between text-green-700 font-bold">
                                        <span>Sale ({selectedProductData.salePercent}% off):</span>
                                        <span>${(selectedProductData.basePrice * (1 - selectedProductData.salePercent / 100)).toFixed(2)}</span>
                                      </div>
                                      <div className="flex justify-between text-gray-600 text-xs">
                                        <span>Savings:</span>
                                        <span>${(selectedProductData.basePrice * (selectedProductData.salePercent / 100)).toFixed(2)}</span>
                                      </div>
                                    </>
                                  )}
                                  {selectedProductData.salePrice && !selectedProductData.salePercent && (
                                    <>
                                      <div className="flex justify-between text-green-700 font-bold">
                                        <span>Sale Price:</span>
                                        <span>${selectedProductData.salePrice.toFixed(2)}</span>
                                      </div>
                                      {selectedProductData.salePrice < selectedProductData.basePrice && (
                                        <div className="flex justify-between text-gray-600 text-xs">
                                          <span>Savings ({Math.round(((selectedProductData.basePrice - selectedProductData.salePrice) / selectedProductData.basePrice) * 100)}%):</span>
                                          <span>${(selectedProductData.basePrice - selectedProductData.salePrice).toFixed(2)}</span>
                                        </div>
                                      )}
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Size Prices */}
                        {selectedProductData.sizes && selectedProductData.sizes.length > 0 && (
                          <div>
                            <h3 className="text-sm font-semibold text-gray-900 mb-3">Size Prices</h3>
                            <p className="text-xs text-blue-600 mb-2">
                              💡 Base Price will auto-update to the smallest enabled size price
                            </p>
                            <div className="space-y-2">
                              {selectedProductData.sizes.map((size, index) => (
                                <div key={size.id} className="flex items-center gap-3">
                                  <input
                                    type="checkbox"
                                    checked={size.enabled !== false}
                                    onChange={(e) =>
                                      updateSize(selectedProduct.id, index, { enabled: e.target.checked })
                                    }
                                    className="w-4 h-4"
                                  />
                                  <div className="flex-1 text-sm text-gray-700">{size.name}</div>
                                  <div className="relative w-24">
                                    <span className="absolute left-2 top-1.5 text-gray-500 text-sm">$</span>
                                    <input
                                      type="number"
                                      step="0.01"
                                      value={size.price}
                                      onChange={(e) =>
                                        updateSize(selectedProduct.id, index, { price: parseFloat(e.target.value) || 0 })
                                      }
                                      className="w-full pl-6 pr-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                            
                            {/* Show calculated base price */}
                            {(() => {
                              const enabledSizes = selectedProductData.sizes.filter((s: any) => s.enabled !== false);
                              if (enabledSizes.length > 0) {
                                const minPrice = Math.min(...enabledSizes.map((s: any) => s.price || 0));
                                return (
                                  <div className="mt-3 p-2 bg-blue-50 rounded text-xs">
                                    <span className="text-gray-700">Auto-calculated Base Price: </span>
                                    <span className="font-bold text-blue-700">${minPrice.toFixed(2)}</span>
                                  </div>
                                );
                              }
                              return null;
                            })()}
                          </div>
                        )}

                        {/* Lightbase Prices */}
                        {selectedProductData.lightBases && selectedProductData.lightBases.length > 0 && (
                          <div>
                            <h3 className="text-sm font-semibold text-gray-900 mb-3">Lightbase Prices</h3>
                            <div className="space-y-2">
                              {selectedProductData.lightBases.map((lb, index) => (
                                <div key={lb.id} className="flex items-center gap-3">
                                  <input
                                    type="checkbox"
                                    checked={lb.enabled !== false}
                                    onChange={(e) =>
                                      updateLightBase(selectedProduct.id, index, { enabled: e.target.checked })
                                    }
                                    className="w-4 h-4"
                                  />
                                  <div className="flex-1 text-sm text-gray-700">{lb.name}</div>
                                  <div className="relative w-24">
                                    <span className="absolute left-2 top-1.5 text-gray-500 text-sm">$</span>
                                    <input
                                      type="number"
                                      step="0.01"
                                      value={lb.price || 0}
                                      onChange={(e) =>
                                        updateLightBase(selectedProduct.id, index, { price: parseFloat(e.target.value) || null })
                                      }
                                      className="w-full pl-6 pr-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Background Prices */}
                        {selectedProductData.backgroundOptions && selectedProductData.backgroundOptions.length > 0 && (
                          <div>
                            <h3 className="text-sm font-semibold text-gray-900 mb-3">Background Prices</h3>
                            <div className="space-y-2">
                              {selectedProductData.backgroundOptions.map((bg, index) => (
                                <div key={bg.id} className="flex items-center gap-3">
                                  <input
                                    type="checkbox"
                                    checked={bg.enabled !== false}
                                    onChange={(e) =>
                                      updateBackground(selectedProduct.id, index, { enabled: e.target.checked })
                                    }
                                    className="w-4 h-4"
                                  />
                                  <div className="flex-1 text-sm text-gray-700">{bg.name}</div>
                                  <div className="relative w-24">
                                    <span className="absolute left-2 top-1.5 text-gray-500 text-sm">$</span>
                                    <input
                                      type="number"
                                      step="0.01"
                                      value={bg.price}
                                      onChange={(e) =>
                                        updateBackground(selectedProduct.id, index, { price: parseFloat(e.target.value) || 0 })
                                      }
                                      className="w-full pl-6 pr-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Text Option Prices */}
                        {selectedProductData.textOptions && selectedProductData.textOptions.length > 0 && (
                          <div>
                            <h3 className="text-sm font-semibold text-gray-900 mb-3">Text Option Prices</h3>
                            <div className="space-y-2">
                              {selectedProductData.textOptions.map((text, index) => (
                                <div key={text.id} className="flex items-center gap-3">
                                  <input
                                    type="checkbox"
                                    checked={text.enabled !== false}
                                    onChange={(e) =>
                                      updateTextOption(selectedProduct.id, index, { enabled: e.target.checked })
                                    }
                                    className="w-4 h-4"
                                  />
                                  <div className="flex-1 text-sm text-gray-700">{text.name}</div>
                                  <div className="relative w-24">
                                    <span className="absolute left-2 top-1.5 text-gray-500 text-sm">$</span>
                                    <input
                                      type="number"
                                      step="0.01"
                                      value={text.price}
                                      onChange={(e) =>
                                        updateTextOption(selectedProduct.id, index, { price: parseFloat(e.target.value) || 0 })
                                      }
                                      className="w-full pl-6 pr-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Options Tab */}
                    {activeTab === 'options' && (
                      <div className="space-y-4">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <h4 className="font-semibold text-blue-900 mb-2">Product Options Configuration</h4>
                          <p className="text-sm text-blue-700">
                            Enable/disable options to control what customers can select.
                            Unchecked options will be hidden on the product page.
                          </p>
                        </div>

                        {/* Sizes */}
                        {selectedProductData.sizes && selectedProductData.sizes.length > 0 && (
                          <div>
                            <h3 className="font-semibold text-gray-900 mb-2">Sizes Available</h3>
                            <div className="space-y-2">
                              {selectedProductData.sizes.map((size, index) => (
                                <label key={size.id} className="flex items-center space-x-2">
                                  <input
                                    type="checkbox"
                                    checked={size.enabled !== false}
                                    onChange={(e) =>
                                      updateSize(selectedProduct.id, index, { enabled: e.target.checked })
                                    }
                                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                  />
                                  <span className="text-sm text-gray-700">{size.name} (${size.price})</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Lightbases */}
                        {selectedProductData.lightBases && selectedProductData.lightBases.length > 0 && (
                          <div>
                            <h3 className="font-semibold text-gray-900 mb-2">Lightbases Available</h3>
                            <div className="space-y-2">
                              {selectedProductData.lightBases.map((lb, index) => (
                                <label key={lb.id} className="flex items-center space-x-2">
                                  <input
                                    type="checkbox"
                                    checked={lb.enabled !== false}
                                    onChange={(e) =>
                                      updateLightBase(selectedProduct.id, index, { enabled: e.target.checked })
                                    }
                                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                  />
                                  <span className="text-sm text-gray-700">
                                    {lb.name} {lb.price ? `($${lb.price})` : '(No charge)'}
                                  </span>
                                </label>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Backgrounds */}
                        {selectedProductData.backgroundOptions && selectedProductData.backgroundOptions.length > 0 && (
                          <div>
                            <h3 className="font-semibold text-gray-900 mb-2">Background Options Available</h3>
                            <div className="space-y-2">
                              {selectedProductData.backgroundOptions.map((bg, index) => (
                                <label key={bg.id} className="flex items-center space-x-2">
                                  <input
                                    type="checkbox"
                                    checked={bg.enabled !== false}
                                    onChange={(e) =>
                                      updateBackground(selectedProduct.id, index, { enabled: e.target.checked })
                                    }
                                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                  />
                                  <span className="text-sm text-gray-700">{bg.name} (${bg.price})</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Text Options */}
                        {selectedProductData.textOptions && selectedProductData.textOptions.length > 0 && (
                          <div>
                            <h3 className="font-semibold text-gray-900 mb-2">Text Options Available</h3>
                            <div className="space-y-2">
                              {selectedProductData.textOptions.map((text, index) => (
                                <label key={text.id} className="flex items-center space-x-2">
                                  <input
                                    type="checkbox"
                                    checked={text.enabled !== false}
                                    onChange={(e) =>
                                      updateTextOption(selectedProduct.id, index, { enabled: e.target.checked })
                                    }
                                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                  />
                                  <span className="text-sm text-gray-700">{text.name} (${text.price})</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Images Tab */}
                    {activeTab === 'images' && (
                      <div>
                        <ImageUpload
                          productId={selectedProduct.id}
                          images={selectedProductData.images || []}
                          onImagesUpdated={(images) => handleImagesUpdated(selectedProduct.id, images)}
                        />
                      </div>
                    )}

                    {/* Reset Button */}
                    <div className="border-t pt-4 mt-6">
                      <button
                        onClick={() => {
                          const newEditedProducts = { ...editedProducts };
                          delete newEditedProducts[selectedProduct.id];
                          setEditedProducts(newEditedProducts);
                        }}
                        className="w-full px-4 py-2 bg-red-50 text-red-600 rounded-lg font-medium hover:bg-red-100 transition-colors"
                      >
                        🔄 Reset to Original
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="p-6 text-center py-12">
                  <p className="text-gray-500">Select a product from the list to edit</p>
                </div>
              )}
            </div>
          </div>

          {/* Preview Panel - Right Column */}
          {showPreview && (
            <div className="col-span-12 lg:col-span-4">
              <div className="bg-white rounded-lg shadow-sm border">
                <div className="p-4 border-b bg-gray-50">
                  <p className="text-lg font-semibold text-gray-900">Preview</p>
                </div>
                <div className="p-6 overflow-y-auto" style={{ maxHeight: '75vh' }}>
                  {selectedProduct && selectedProductData ? (
                    <div className="space-y-4">
                      {/* Gallery Preview */}
                      <div>
                        <h3 className="text-sm font-semibold text-gray-700 mb-2">Image Gallery</h3>
                        <ProductGallery2
                          images={selectedProductData.images || []}
                          productName={selectedProductData.name}
                        />
                      </div>

                      {/* Product Details Preview */}
                      <div className="border-t pt-4">
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">
                          {selectedProductData.name}
                        </h3>
                        <p className="text-3xl font-bold text-green-600 mb-4">
                          ${selectedProductData.basePrice}
                        </p>
                        <p className="text-gray-700 mb-4">
                          {selectedProductData.description}
                        </p>
                        {selectedProductData.longDescription && (
                          <div className="text-sm text-gray-600 bg-gray-50 p-4 rounded-lg">
                            <p className="font-semibold mb-2">Detailed Description:</p>
                            <p>{selectedProductData.longDescription}</p>
                          </div>
                        )}
                      </div>

                      {/* Options Summary */}
                      <div className="border-t pt-4">
                        <h3 className="text-sm font-semibold text-gray-900 mb-2">Available Options</h3>
                        <div className="space-y-2 text-sm text-gray-600">
                          {selectedProductData.sizes && selectedProductData.sizes.filter(s => s.enabled !== false).length > 0 && (
                            <div>✓ {selectedProductData.sizes.filter(s => s.enabled !== false).length} size options</div>
                          )}
                          {selectedProductData.lightBases && selectedProductData.lightBases.filter(lb => lb.enabled !== false).length > 0 && (
                            <div>✓ {selectedProductData.lightBases.filter(lb => lb.enabled !== false).length} lightbase options</div>
                          )}
                          {selectedProductData.backgroundOptions && selectedProductData.backgroundOptions.filter(bg => bg.enabled !== false).length > 0 && (
                            <div>✓ {selectedProductData.backgroundOptions.filter(bg => bg.enabled !== false).length} background options</div>
                          )}
                          {selectedProductData.textOptions && selectedProductData.textOptions.filter(t => t.enabled !== false).length > 0 && (
                            <div>✓ {selectedProductData.textOptions.filter(t => t.enabled !== false).length} text options</div>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-gray-500">Select a product to see preview</p>
                    </div>
                  )}
                </div>
              </div>             
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
