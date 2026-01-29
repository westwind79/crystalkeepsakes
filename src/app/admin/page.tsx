'use client';

/**
 * Enhanced Product Admin Panel

 * Version: 3.1.0 - Persistent Edited Stats
 * Date: 2025-12-14

 * Features:
 * - Complete price control (base + all options)
 * - Option configuration (enable/disable per product)
 * - Size, lightbase, background, text option management
 * - Saves directly to final-products.json (single source of truth)
 * - Persistent edited count (tracks editedAt timestamps)
 * - Display editedAt in product list
 * 
 * NOTE: This page is for DEVELOPMENT ONLY
 * Do NOT upload the /admin directory to production server
 */

import React, { useState, useEffect } from 'react';
import ProductGallery from '@/components/ProductGallery';
import ImageUpload from '@/components/admin/ImageUpload';
import { getProductCategories, getCategoryLabel, isOnSale, OCCASION_CATEGORIES } from '@/utils/categoriesConfig';
import { getProducts } from '@/lib/products';

// Production safeguard
if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && !window.location.hostname.includes('127.0.0.1')) {
  window.location.href = '/';
}

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
  edited?: boolean;  // Flag indicating product has been edited
  editedAt?: string;  // ISO timestamp of last edit
}

interface ProductCustomizations {
  [productId: string]: Partial<Product>;
}

// Master list of all available light bases - these should ALWAYS be visible
const MASTER_LIGHTBASES: LightBase[] = [
  { id: 'none', name: 'No Base', price: null, enabled: true },
  { id: 'lightbase-rectangle', name: 'Lightbase Rectangle', price: 25, enabled: true },
  { id: 'lightbase-square', name: 'Lightbase Square', price: 25, enabled: true },
  { id: 'lightbase-wood-small', name: 'Lightbase Wood Small', price: 35, enabled: true },
  { id: 'lightbase-wood-medium', name: 'Lightbase Wood Medium', price: 45, enabled: true },
  { id: 'lightbase-wood-long', name: 'Lightbase Wood Long', price: 35, enabled: true },
  { id: 'rotating-led-lightbase', name: 'Rotating LED Lightbase', price: 19.99, enabled: true },
  { id: 'wooden-premium-base-mini', name: 'Wooden Premium Base Mini', price: 45, enabled: true },
  { id: 'concave-lightbase', name: 'Concave Lightbase', price: 39, enabled: true },
  { id: 'ornament-stand', name: 'Ornament Stand', price: 25, enabled: true },
];

// Mapping from lightbase option ID to standalone product ID
const LIGHTBASE_PRODUCT_MAP: { [key: string]: string } = {
  'lightbase-rectangle': '105',
  'lightbase-square': '106',
  'lightbase-wood-small': '107',
  'lightbase-wood-medium': '108',
  'lightbase-wood-long': '119',
  'rotating-led-lightbase': '160',
  'concave-lightbase': '276',
};

export default function EnhancedProductAdminPage() {
  const [sourceProducts, setSourceProducts] = useState<Product[]>([]);
  const [editedProducts, setEditedProducts] = useState<ProductCustomizations>({});
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [activeTab, setActiveTab] = useState<'basic' | 'pricing' | 'options' | 'images'>('basic');
  const [availableMasks, setAvailableMasks] = useState<Array<{filename: string, path: string, displayName: string}>>([]);
  const [loading, setLoading] = useState(true);

  // Load products from JSON on mount
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const products = await getProducts();
        setSourceProducts(products as Product[]);
      } catch (error) {
        console.error('Failed to load products:', error);
        alert('Failed to load products from JSON file');
      } finally {
        setLoading(false);
      }
    };
    loadProducts();
  }, []);

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

  // Load available masks from static JSON file
  useEffect(() => {
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
    fetch(`${basePath}/data/available-masks.json`)
      .then(res => res.json())
      .then(masks => {
        setAvailableMasks(masks);
        console.log(`✅ Loaded ${masks.length} masks from ${basePath}/data/available-masks.json`);
      })
      .catch(err => {
        console.error('Failed to load masks:', err);
        setAvailableMasks([]);
      });
  }, []);

  // Keyboard shortcut: Ctrl+S / Cmd+S to save
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveFinalProducts();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [editedProducts]); // Include editedProducts so it has latest state

  // Get merged product data (source + customizations)
  // Ensures all light bases from MASTER_LIGHTBASES are present (with proper enabled state)
  const getProductData = (productId: string): Product => {
    const sourceProduct = sourceProducts.find((p) => p.id === productId);
    const customizations = editedProducts[productId] || {};
    const merged = { ...sourceProduct, ...customizations } as Product;
    
    // Ensure all master light bases are present if product has ANY lightBases
    // This prevents options from disappearing when unchecked
    if (sourceProduct?.lightBases && sourceProduct.lightBases.length > 0) {
      const existingLBs = merged.lightBases || [];
      const existingIds = new Set(existingLBs.map(lb => lb.id));
      
      // Get prices from standalone lightbase products for syncing
      const lightbasePrices: { [key: string]: number | null } = {};
      Object.entries(LIGHTBASE_PRODUCT_MAP).forEach(([lbId, productId]) => {
        const lbProduct = sourceProducts.find(p => p.id === productId);
        const customPrice = editedProducts[productId]?.basePrice;
        if (customPrice !== undefined) {
          lightbasePrices[lbId] = customPrice;
        } else if (lbProduct) {
          lightbasePrices[lbId] = lbProduct.basePrice;
        }
      });
      
      // Merge existing LBs with master list
      const fullLightBases = MASTER_LIGHTBASES.map(masterLB => {
        const existing = existingLBs.find(lb => lb.id === masterLB.id);
        if (existing) {
          // Use synced price from standalone product if available
          const syncedPrice = lightbasePrices[masterLB.id];
          return {
            ...existing,
            price: syncedPrice !== undefined ? syncedPrice : existing.price
          };
        }
        // Not in product's list - add as disabled
        const syncedPrice = lightbasePrices[masterLB.id];
        return { 
          ...masterLB, 
          price: syncedPrice !== undefined ? syncedPrice : masterLB.price,
          enabled: false 
        };
      });
      
      merged.lightBases = fullLightBases;
    }
    
    return merged;
  };

  // Update product customization
  const updateProduct = (productId: string, updates: Partial<Product>) => {
    setEditedProducts((prev) => ({
      ...prev,
      [productId]: { 
        ...prev[productId], 
        ...updates,
        edited: true,
        editedAt: new Date().toISOString()
      },
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

  // Handle lightbase updates - GLOBAL sync across all products AND standalone lightbase products
  const updateLightBase = (productId: string, lbIndex: number, updates: Partial<LightBase>) => {
    const product = getProductData(productId);
    const lightBases = [...(product.lightBases || [])];
    const updatedLB = { ...lightBases[lbIndex], ...updates };
    lightBases[lbIndex] = updatedLB;
    
    // If price changed, sync to ALL products with this lightbase AND to standalone product
    if (updates.price !== undefined) {
      const lbId = updatedLB.id;
      
      // Sync to all products that have this lightbase as an option
      sourceProducts.forEach((p) => {
        if (p.id !== productId && p.lightBases) {
          const matchIdx = p.lightBases.findIndex((lb: LightBase) => lb.id === lbId);
          if (matchIdx >= 0) {
            const pLightBases = [...(getProductData(p.id).lightBases || [])];
            pLightBases[matchIdx] = { ...pLightBases[matchIdx], price: updates.price };
            updateProduct(p.id, { lightBases: pLightBases });
          }
        }
      });
      
      // Sync to standalone lightbase product if exists
      const standaloneProductId = LIGHTBASE_PRODUCT_MAP[lbId];
      if (standaloneProductId && updates.price !== null) {
        updateProduct(standaloneProductId, { basePrice: updates.price });
      }
    }
    
    updateProduct(productId, { lightBases });
  };

  // Handle background updates - GLOBAL sync
  const updateBackground = (productId: string, bgIndex: number, updates: Partial<BackgroundOption>) => {
    const product = getProductData(productId);
    const backgroundOptions = [...(product.backgroundOptions || [])];
    const updatedBG = { ...backgroundOptions[bgIndex], ...updates };
    backgroundOptions[bgIndex] = updatedBG;
    
    // If price changed, sync to ALL products
    if (updates.price !== undefined) {
      const bgId = updatedBG.id;
      sourceProducts.forEach((p) => {
        if (p.id !== productId && p.backgroundOptions) {
          const matchIdx = p.backgroundOptions.findIndex((bg: BackgroundOption) => bg.id === bgId);
          if (matchIdx >= 0) {
            const pBgOptions = [...(getProductData(p.id).backgroundOptions || [])];
            pBgOptions[matchIdx] = { ...pBgOptions[matchIdx], price: updates.price };
            updateProduct(p.id, { backgroundOptions: pBgOptions });
          }
        }
      });
    }
    
    updateProduct(productId, { backgroundOptions });
  };

  // Handle text option updates - GLOBAL sync
  const updateTextOption = (productId: string, textIndex: number, updates: Partial<TextOption>) => {
    const product = getProductData(productId);
    const textOptions = [...(product.textOptions || [])];
    const updatedText = { ...textOptions[textIndex], ...updates };
    textOptions[textIndex] = updatedText;
    
    // If price changed, sync to ALL products
    if (updates.price !== undefined) {
      const textId = updatedText.id;
      sourceProducts.forEach((p) => {
        if (p.id !== productId && p.textOptions) {
          const matchIdx = p.textOptions.findIndex((t: TextOption) => t.id === textId);
          if (matchIdx >= 0) {
            const pTextOptions = [...(getProductData(p.id).textOptions || [])];
            pTextOptions[matchIdx] = { ...pTextOptions[matchIdx], price: updates.price };
            updateProduct(p.id, { textOptions: pTextOptions });
          }
        }
      });
    }
    
    updateProduct(productId, { textOptions });
  };

  // Handle images update
  const handleImagesUpdated = (productId: string, updatedImages: ProductImage[]) => {
    updateProduct(productId, { images: updatedImages });
  };

  // Calculate stats
  const getStats = () => {
    const finalProducts = sourceProducts.map((product) => {
      const customizations = editedProducts[product.id] || {};
      return { ...product, ...customizations };
    });
    
    const editedCount = sourceProducts.filter(p => p.editedAt).length;
    console.log('📊 Stats - Total Edited Products:', editedCount, 'products with editedAt timestamp');
    
    return {
      total: finalProducts.length,
      visible: finalProducts.filter(p => p.visible !== false).length,
      hidden: finalProducts.filter(p => p.visible === false).length,
      featured: finalProducts.filter(p => p.featured === true).length,
      onSale: finalProducts.filter(p => p.sale === true || p.salePrice || p.salePercent).length,
      requiresImage: finalProducts.filter(p => p.requiresImage === true).length,
      edited: editedCount, // Count products with editedAt timestamp
    };
  };

  // Generate final product list
  // Helper: Validate products before save
  const validateProducts = () => {
    // Check if products marked as "On Sale" have either salePrice OR salePercent
    const invalidProducts = Object.entries(editedProducts)
      .filter(([id, data]) => {
        if (data.sale !== true) return false;
        const product = sourceProducts.find(p => p.id === id);
        const hasSalePrice = (data.salePrice ?? product?.salePrice) > 0;
        const hasSalePercent = (data.salePercent ?? product?.salePercent) > 0;
        return !hasSalePrice && !hasSalePercent;
      })
      .map(([id]) => {
        const product = sourceProducts.find(p => p.id === id);
        return product?.name || id;
      });

    if (invalidProducts.length > 0) {
      alert(`❌ Cannot Save: Missing Sale Information\n\n${invalidProducts.join('\n')}\n\nPlease set EITHER a sale price OR a sale percentage for each product marked as "On Sale".`);
      return false;
    }

    // Check if fixed sale price is less than base price
    const invalidPriceProducts = Object.entries(editedProducts)
      .filter(([id, data]) => {
        if (!data.sale) return false;
        const product = sourceProducts.find(p => p.id === id);
        const salePrice = data.salePrice ?? product?.salePrice;
        if (!salePrice || salePrice <= 0) return false; // Skip if using percentage
        const basePrice = data.basePrice ?? product?.basePrice ?? 0;
        return salePrice >= basePrice;
      })
      .map(([id]) => {
        const product = sourceProducts.find(p => p.id === id);
        return product?.name || id;
      });

    if (invalidPriceProducts.length > 0) {
      alert(`❌ Cannot Save: Invalid Sale Prices\n\n${invalidPriceProducts.join('\n')}\n\nFixed sale price must be lower than the base price.`);
      return false;
    }

    return true;
  };

  // Helper: Generate final products array
  const getFinalProductsArray = () => {
    return sourceProducts.map((product) => {
      const customizations = editedProducts[product.id] || {};
      const hasEdits = Object.keys(customizations).length > 0;
      const merged = { ...product, ...customizations };
      
      // Preserve existing edited flag OR set new one if edited now
      if (hasEdits || product.edited) {
        merged.edited = true;
        merged.editedAt = hasEdits ? new Date().toISOString() : (product.editedAt || new Date().toISOString());
      }
      
      // if (merged.sizes) merged.sizes = merged.sizes.filter(s => s.enabled !== false);
      // if (merged.lightBases) merged.lightBases = merged.lightBases.filter(lb => lb.enabled !== false);
      // if (merged.backgroundOptions) merged.backgroundOptions = merged.backgroundOptions.filter(bg => bg.enabled !== false);
      // if (merged.textOptions) merged.textOptions = merged.textOptions.filter(t => t.enabled !== false);

      
      return merged;
    });
  };

  // Save Products (no timestamp) - ONE FILE ONLY
  const saveFinalProducts = async () => {
    if (!validateProducts()) return;
    
    localStorage.setItem('productCustomizations', JSON.stringify(editedProducts));
    const finalProducts = getFinalProductsArray();
    
    // Try to save to server (works in dev mode with Node.js)
    const isDev = process.env.NODE_ENV === 'development';
    
    if (isDev) {
      try {
        const response = await fetch('/api/admin/save-products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            products: finalProducts,
            isBackup: false 
          })
        });

        const result = await response.json();

        if (result.success) {
          alert(`✅ Products saved!\n\n📁 File updated:\n• /public/data/final-products.json\n\n🔄 Reloading products...`);
          
          // Clear localStorage since changes are now saved
          localStorage.removeItem('productCustomizations');
          setEditedProducts({});
          
          // Reload products from JSON to sync with saved data
          try {
            const products = await getProducts();
            setSourceProducts(products as Product[]);
            console.log('✅ Products reloaded from JSON');
          } catch (error) {
            console.error('Failed to reload products:', error);
            alert('⚠️ Products saved but failed to reload. Please refresh the page manually.');
          }
          
          return;
        }
      } catch (error) {
        console.log('Server save failed, downloading file instead:', error);
      }
    }
    
    // Fallback: Download file (for production/static export or if server save fails)
    const jsonBlob = new Blob([JSON.stringify(finalProducts, null, 2)], { type: 'application/json' });
    const jsonUrl = URL.createObjectURL(jsonBlob);
    const jsonLink = document.createElement('a');
    jsonLink.href = jsonUrl;
    jsonLink.download = 'final-products.json';
    document.body.appendChild(jsonLink);
    jsonLink.click();
    document.body.removeChild(jsonLink);
    URL.revokeObjectURL(jsonUrl);
    
    alert(`✅ Products saved!\n\n📥 Downloaded: final-products.json\n\n📤 FTP to your server:\n/public/data/final-products.json\n\n✨ Upload via FTP and refresh site!`);
  };

  // Backup Products (with timestamp) - ONE FILE ONLY
  const backupProducts = async () => {
    if (!validateProducts()) return;
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const finalProducts = getFinalProductsArray();
    
    // Try to save to server (works in dev mode)
    const isDev = process.env.NODE_ENV === 'development';
    
    if (isDev) {
      try {
        const response = await fetch('/api/admin/save-products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            products: finalProducts,
            isBackup: true,
            timestamp
          })
        });

        const result = await response.json();

        if (result.success) {
          alert(`✅ Backup created!\n\n📁 File: ${result.jsonPath}\n\nKeep this as a restore point.`);
          return;
        }
      } catch (error) {
        console.log('Server backup failed, downloading file instead:', error);
      }
    }
    
    // Fallback: Download backup file
    const jsonBlob = new Blob([JSON.stringify(finalProducts, null, 2)], { type: 'application/json' });
    const jsonUrl = URL.createObjectURL(jsonBlob);
    const jsonLink = document.createElement('a');
    jsonLink.href = jsonUrl;
    jsonLink.download = `final-products-${timestamp}.json`;
    document.body.appendChild(jsonLink);
    jsonLink.click();
    document.body.removeChild(jsonLink);
    URL.revokeObjectURL(jsonUrl);
    
    alert(`✅ Backup created!\n\n📥 Downloaded: final-products-${timestamp}.json\n\nKeep this as a restore point.`);
  };

  // Upload JSON to production
  const uploadToProduction = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (!file) return;
      
      try {
        const text = await file.text();
        const products = JSON.parse(text);
        
        // Write to /public/data/final-products.json
        const blob = new Blob([JSON.stringify(products, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'final-products.json';
        a.click();
        URL.revokeObjectURL(url);
        
        alert('✅ File ready! Upload final-products.json to /public/data/ on your server via FTP.');
      } catch (err) {
        alert('❌ Invalid JSON file');
      }
    };
    input.click();
  };

  const hasCustomizations = (productId: string) => {
    return editedProducts[productId] && Object.keys(editedProducts[productId]).length > 0;
  };

  // Check if there are ANY unsaved changes
  const hasUnsavedChanges = Object.keys(editedProducts).length > 0;

  // Reset to saved data (clear localStorage)
  const resetToSaved = async () => {
    if (!confirm('⚠️ DISCARD ALL UNSAVED CHANGES?\n\nThis will:\n• Clear all your edits from memory\n• Reload products from the saved JSON file\n• Cannot be undone\n\nContinue?')) {
      return;
    }
    
    try {
      // Clear localStorage
      localStorage.removeItem('productCustomizations');
      setEditedProducts({});
      
      // Reload products from JSON file
      const products = await getProducts();
      setSourceProducts(products as Product[]);
      
      // Clear selection
      setSelectedProduct(null);
      
      alert('✅ Reset complete!\n\nAll unsaved changes discarded.\nNow showing saved data from JSON file.');
    } catch (error) {
      console.error('Reset failed:', error);
      alert('❌ Reset failed. Check console for details.');
    }
  };

  const selectedProductData = selectedProduct ? getProductData(selectedProduct.id) : null;

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-[#72B01D] border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600">Loading products from JSON...</p>
        </div>
      </div>
    );
  }

  return (
    <>
    <style>
      {`
        footer,
        header {display:none !important;}
      `}
    </style>
    <div className="min-h-screen bg-gray-50">
      {/* Development-Only Warning Banner */}
      <div className="bg-red-500 text-xs text-white px-4 py-2 text-center font-semibold">
        🚨 DEVELOPMENT ONLY - This admin panel must NEVER be deployed to production 🚨
      </div>
      
      {/* Unsaved Changes Warning */}
      {hasUnsavedChanges && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="text-2xl mr-3">⚠️</span>
              <div>
                <p className="text-sm font-medium text-yellow-800">
                  You have unsaved changes in browser memory
                </p>
                <p className="text-xs text-yellow-700 mt-1">
                  Data shown = Saved JSON file + Your edits (not yet saved)
                </p>
              </div>
            </div>
            <button
              onClick={resetToSaved}
              className="px-3 py-1.5 bg-yellow-600 text-white text-sm rounded-lg font-medium hover:bg-yellow-700 transition-colors"
            >
              🔄 Discard Changes
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white shadow-sm border-b z-10">
        <div className="max-w-full mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div>
               
              <p className="text-sm text-gray-600 mt-1">              
                {hasUnsavedChanges && (
                  <span className="ml-2 text-yellow-600 font-semibold">• Unsaved Edits Active</span>
                )}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={resetToSaved}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg font-medium hover:bg-gray-600 transition-colors flex items-center gap-2"
                title="Discard all unsaved changes and reload from JSON file"
              >
                <span>🔄</span>
                <span>Reset</span>
              </button>
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
              <button
                onClick={backupProducts}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <span>📦</span>
                <span>Backup</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-full mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {/* Stats - Clean & Compact */}
        <div className="my-6 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          
          <div className="bg-purple-50 rounded-lg p-4 text-center border border-purple-200">
            <div className="text-xs font-medium text-purple-600 uppercase">Total</div>
            <div className="text-3xl font-bold text-purple-900 mt-1">{sourceProducts.length}</div>
          </div>

          <div className="bg-green-50 rounded-lg p-4 text-center border border-green-200">
            <div className="text-xs font-medium text-green-600 uppercase">👁️ Visible</div>
            <div className="text-3xl font-bold text-green-900 mt-1">{getStats().visible}</div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 text-center border border-gray-200">
            <div className="text-xs font-medium text-gray-600 uppercase">🚫 Hidden</div>
            <div className="text-3xl font-bold text-gray-900 mt-1">{getStats().hidden}</div>
          </div>

          <div className="bg-yellow-50 rounded-lg p-4 text-center border border-yellow-200">
            <div className="text-xs font-medium text-yellow-600 uppercase">⭐ Featured</div>
            <div className="text-3xl font-bold text-yellow-900 mt-1">{getStats().featured}</div>
          </div>

          <div className="bg-red-50 rounded-lg p-4 text-center border border-red-200">
            <div className="text-xs font-medium text-red-600 uppercase">💰 On Sale</div>
            <div className="text-3xl font-bold text-red-900 mt-1">{getStats().onSale}</div>
          </div>

          <div className="bg-blue-50 rounded-lg p-4 text-center border border-blue-200">
            <div className="text-xs font-medium text-blue-600 uppercase">✏️ Edited</div>
            <div className="text-3xl font-bold text-blue-900 mt-1">{getStats().edited}</div>
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
                {[...sourceProducts]
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((product) => {
                  const productData = { ...product, ...(editedProducts[product.id] || {}) };
                  const isVisible = productData.visible !== false;
                  const isFeatured = productData.featured === true;
                  const isOnSale = productData.sale === true || productData.salePrice || productData.salePercent;
                  
                  return (
                  <button
                    key={product.id}
                    onClick={() => setSelectedProduct(product)}
                    className={`w-full text-left p-3 border-b hover:bg-gray-50 transition-colors ${
                      selectedProduct?.id === product.id ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''
                    } ${!isVisible ? 'opacity-50 bg-gray-50' : ''}`}
                  >
                    <div className="flex items-start gap-2">
                      {/* Product Thumbnail */}
                      <div className="w-32 h-32 flex-shrink-0 bg-gray-100 rounded overflow-hidden relative">
                        {product.images && product.images.length > 0 ? (
                          <img
                            src={product.images[0].src}
                            alt={product.name}
                            className={`w-full h-full object-cover ${!isVisible ? 'grayscale' : ''}`}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                            No img
                          </div>
                        )}
                        
                        {/* Status Icons - Top Right Corner */}
                        <div className="absolute top-1 right-1 flex flex-col gap-1">
                          {!isVisible && (
                            <span className="bg-gray-800 text-white px-1.5 py-0.5 rounded text-xs font-bold" title="Hidden">
                              🚫
                            </span>
                          )}
                          {isFeatured && (
                            <span className="bg-yellow-500 text-white px-1.5 py-0.5 rounded text-xs font-bold" title="Featured">
                              ⭐
                            </span>
                          )}
                          {isOnSale && (
                            <span className="bg-red-500 text-white px-1.5 py-0.5 rounded text-xs font-bold" title="On Sale">
                              💰
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Product Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className={`font-semibold text-sm truncate ${!isVisible ? 'text-gray-500' : 'text-gray-900'}`}>
                          {product.name}
                        </h3>
                        <p className="text-xs text-gray-600">SKU: {product.sku}</p>
                        <p className="text-sm text-green-600 font-bold">${product.basePrice}</p>
                        {(hasCustomizations(product.id) || product.edited) && (
                          <span className="inline-block mt-1 px-2 py-0.5 bg-green-100 text-green-800 text-xs font-medium rounded">
                            Edited
                          </span>
                        )}

                        {product.editedAt && (
                          <p className="text-xs text-blue-600 mt-1" title={`Last edited: ${new Date(product.editedAt).toLocaleString()}`}>
                            ✏️ {new Date(product.editedAt).toLocaleDateString()}
                          </p>
                        )}

                      </div>
                    </div>
                  </button>
                  );
                })}
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
                          <textarea
                            rows={2}
                            value={selectedProductData.description || ''}
                            onChange={(e) => updateProduct(selectedProduct.id, { description: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-y"
                            style={{ minHeight: '60px' }}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Long Description (HTML allowed)
                          </label>
                          <textarea
                            rows={6}
                            value={selectedProductData.longDescription || ''}
                            onChange={(e) =>
                              updateProduct(selectedProduct.id, { longDescription: e.target.value })
                            }
                            placeholder="Detailed product description... You can use HTML tags like <p>, <br>, <strong>, <ul>, <li>, etc."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-y"
                            style={{ minHeight: '120px' }}
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            💡 Tip: Use HTML tags for formatting (e.g., &lt;p&gt;, &lt;br&gt;, &lt;strong&gt;, &lt;ul&gt;, &lt;li&gt;)
                          </p>
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

                        {/* Product Visibility */}
                        <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
                          <label className="flex items-center space-x-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedProductData.visible !== false}
                              onChange={(e) => updateProduct(selectedProduct.id, { visible: e.target.checked })}
                              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <span className="text-sm font-medium text-gray-700">👁️ Product Visible</span>
                          </label>
                          <p className="text-xs text-gray-600 mt-2 ml-7">Uncheck to hide this product from customers</p>
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

                        {/* Mask Image Selector - SIMPLE DROPDOWN */}
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
                            {availableMasks.map((mask) => (
                              <option key={mask.filename} value={mask.path}>
                                {mask.displayName}
                              </option>
                            ))}
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
                          <p className="text-xs text-gray-500 mt-2">
                            💡 Add masks: Drop PNG in <code className="bg-gray-200 px-1 rounded">/public/img/masks/</code> then run <code className="bg-gray-200 px-1 rounded">./scripts/generate-masks-json.sh</code>
                          </p>
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
                                  {selectedProductData.sizes && selectedProductData.sizes.length > 0 
                                    ? 'Dollar Discount (per item)'
                                    : 'Fixed Sale Price'
                                  }
                                  <span className="text-xs text-gray-500 ml-1">(Alternative)</span>
                                </label>
                                <p className="text-xs text-blue-600 mb-2">
                                  {selectedProductData.sizes && selectedProductData.sizes.length > 0 
                                    ? '💡 This amount will be subtracted from each size price'
                                    : '💡 This is the final sale price (not a discount)'
                                  }
                                </p>
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
                                    placeholder={selectedProductData.sizes && selectedProductData.sizes.length > 0 ? "e.g., 10 ($10 off each)" : "e.g., 39.99"}
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
                                      {selectedProductData.sizes && selectedProductData.sizes.length > 0 ? (
                                        <>
                                          <div className="flex justify-between text-green-700 font-bold">
                                            <span>Discount Amount:</span>
                                            <span>-${selectedProductData.salePrice.toFixed(2)}</span>
                                          </div>
                                          <div className="flex justify-between text-gray-600 text-xs">
                                            <span>Applied to each size</span>
                                            <span>${Math.max(0, selectedProductData.basePrice - selectedProductData.salePrice).toFixed(2)}</span>
                                          </div>
                                        </>
                                      ) : (
                                        <>
                                          <div className="flex justify-between text-green-700 font-bold">
                                            <span>Sale Price:</span>
                                            <span>${selectedProductData.salePrice.toFixed(2)}</span>
                                          </div>
                                          {selectedProductData.salePrice < selectedProductData.basePrice && (
                                            <div className="flex justify-between text-gray-600 text-xs">
                                              <span>Savings:</span>
                                              <span>${(selectedProductData.basePrice - selectedProductData.salePrice).toFixed(2)}</span>
                                            </div>
                                          )}
                                        </>
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
                        {/* Debug Info */}
                        {editedProducts[selectedProduct.id]?.images && (
                          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-xs">
                            <p className="font-semibold text-yellow-800 mb-1">⚠️ Unsaved Changes</p>
                            <p className="text-yellow-700">You have modified this product's images. Click "Save Products" to persist changes.</p>
                            <p className="text-yellow-600 mt-1">
                              Changed images: {editedProducts[selectedProduct.id].images.length} 
                              {' vs Original: '}{sourceProducts.find(p => p.id === selectedProduct.id)?.images?.length || 0}
                            </p>
                          </div>
                        )}
                        
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
                        <ProductGallery
                          images={selectedProductData.images || []}
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
    </>
  );
}

