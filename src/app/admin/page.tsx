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
  cost?: number;
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
  const [activeTab, setActiveTab] = useState<'basic' | 'pricing' | 'images'>('basic');
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
  // Also syncs lightbase prices when standalone lightbase product price changes
  const updateProduct = (productId: string, updates: Partial<Product>) => {
    setEditedProducts((prev) => {
      const newState = {
        ...prev,
        [productId]: { 
          ...prev[productId], 
          ...updates,
          edited: true,
          editedAt: new Date().toISOString()
        },
      };
      
      // Check if this is a standalone lightbase product and basePrice changed
      if (updates.basePrice !== undefined) {
        const lbOptionId = Object.entries(LIGHTBASE_PRODUCT_MAP).find(
          ([optionId, prodId]) => prodId === productId
        )?.[0];
        
        if (lbOptionId) {
          // Sync to all products that have this lightbase as an option
          sourceProducts.forEach((p) => {
            if (p.lightBases && p.lightBases.length > 0) {
              const existingLBs = [...(newState[p.id]?.lightBases || p.lightBases)];
              const matchIdx = existingLBs.findIndex((lb: LightBase) => lb.id === lbOptionId);
              if (matchIdx >= 0) {
                existingLBs[matchIdx] = { ...existingLBs[matchIdx], price: updates.basePrice };
                newState[p.id] = {
                  ...newState[p.id],
                  lightBases: existingLBs,
                  edited: true,
                  editedAt: new Date().toISOString()
                };
              }
            }
          });
        }
      }
      
      return newState;
    });
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
        
        /* Admin Panel Clean UI Reset */
        .admin-panel * {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important;
        }
        
        .admin-panel h1, .admin-panel h2, .admin-panel h3, .admin-panel h4, .admin-panel h5, .admin-panel h6 {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important;
          text-transform: none !important;
          letter-spacing: normal !important;
          font-variant: normal !important;
        }
        
        .admin-panel .product-name {
          font-weight: 600 !important;
          text-transform: none !important;
          font-variant: normal !important;
        }
        
        .admin-panel .section-title {
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #6b7280;
          margin-bottom: 0.75rem;
        }
        
        .admin-panel input[type="number"],
        .admin-panel input[type="text"],
        .admin-panel textarea,
        .admin-panel select {
          font-size: 14px !important;
        }
      `}
    </style>
    <div className="min-h-screen bg-slate-100 admin-panel">
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
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-full mx-auto px-6 py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <h1 className="text-lg font-semibold text-slate-800">Product Manager</h1>
              {hasUnsavedChanges && (
                <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded">
                  Unsaved Changes
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={resetToSaved}
                className="px-3 py-1.5 text-slate-600 text-sm font-medium hover:bg-slate-100 rounded transition-colors"
                title="Discard all unsaved changes"
              >
                Reset
              </button>
              <button
                onClick={() => setShowPreview(!showPreview)}
                className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${
                  showPreview
                    ? 'bg-slate-200 text-slate-700'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {showPreview ? 'Hide Preview' : 'Preview'}
              </button>
              <button
                onClick={backupProducts}
                className="px-3 py-1.5 text-slate-600 text-sm font-medium hover:bg-slate-100 rounded transition-colors"
              >
                Backup
              </button>
              <button
                onClick={saveFinalProducts}
                className="px-4 py-1.5 bg-emerald-600 text-white text-sm font-medium rounded hover:bg-emerald-700 transition-colors"
              >
                Save Products
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-full mx-auto px-6 py-4">
        {/* Stats Row - Minimal */}
        <div className="mb-4 flex gap-6 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-slate-500">Products:</span>
            <span className="font-semibold text-slate-800">{sourceProducts.length}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
            <span className="text-slate-500">Visible:</span>
            <span className="font-semibold text-slate-800">{getStats().visible}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-slate-400 rounded-full"></span>
            <span className="text-slate-500">Hidden:</span>
            <span className="font-semibold text-slate-800">{getStats().hidden}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
            <span className="text-slate-500">Featured:</span>
            <span className="font-semibold text-slate-800">{getStats().featured}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-rose-500 rounded-full"></span>
            <span className="text-slate-500">On Sale:</span>
            <span className="font-semibold text-slate-800">{getStats().onSale}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
            <span className="text-slate-500">Edited:</span>
            <span className="font-semibold text-slate-800">{getStats().edited}</span>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-4">
          {/* Product List - Left Column */}
          <div className="col-span-12 lg:col-span-3">
            <div className="bg-white rounded-lg border border-slate-200">
              <div className="px-4 py-3 border-b border-slate-200">
                <span className="text-sm font-medium text-slate-700">Products</span>
              </div>
              <div className="overflow-y-auto" style={{ maxHeight: '75vh' }}>
                {[...sourceProducts]
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((product) => {
                  const productData = getProductData(product.id);
                  const isVisible = productData.visible !== false;
                  const isFeatured = productData.featured === true;
                  const isOnSale = productData.sale === true || productData.salePrice || productData.salePercent;
                  
                  return (
                  <button
                    key={product.id}
                    onClick={() => setSelectedProduct(product)}
                    className={`w-full text-left p-3 border-b border-slate-100 hover:bg-slate-50 transition-colors ${
                      selectedProduct?.id === product.id ? 'bg-blue-50 border-l-2 border-l-blue-600' : ''
                    } ${!isVisible ? 'opacity-40' : ''}`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Product Thumbnail */}
                      <div className="w-12 h-12 flex-shrink-0 bg-slate-100 rounded overflow-hidden">
                        {product.images && product.images.length > 0 ? (
                          <img
                            src={product.images[0].src}
                            alt={product.name}
                            className={`w-full h-full object-cover ${!isVisible ? 'grayscale' : ''}`}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
                            —
                          </div>
                        )}
                      </div>

                      {/* Product Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="product-name text-sm text-slate-800 truncate">
                            {product.name}
                          </h3>
                          {isFeatured && <span className="w-1.5 h-1.5 bg-amber-500 rounded-full" title="Featured"></span>}
                          {isOnSale && <span className="w-1.5 h-1.5 bg-rose-500 rounded-full" title="On Sale"></span>}
                          {(hasCustomizations(product.id) || product.edited) && (
                            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" title="Edited"></span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-slate-400">{product.sku}</span>
                          <span className="text-xs font-medium text-emerald-600">
                            {productData.sizes && productData.sizes.length > 0 ? (
                              (() => {
                                const enabledSizes = productData.sizes.filter((s: Size) => s.enabled !== false);
                                if (enabledSizes.length === 0) return `$${productData.basePrice}`;
                                const prices = enabledSizes.map((s: Size) => s.price);
                                const minPrice = Math.min(...prices);
                                const maxPrice = Math.max(...prices);
                                return minPrice === maxPrice ? `$${minPrice}` : `$${minPrice}–$${maxPrice}`;
                              })()
                            ) : (
                              `$${productData.basePrice}`
                            )}
                          </span>
                        </div>
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
            <div className="bg-white rounded-lg border border-slate-200">
              <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                <span className="text-sm font-medium text-slate-700">
                  {selectedProduct ? selectedProduct.name : 'Select a Product'}
                </span>
                {selectedProduct && (
                  <span className="text-xs text-slate-400">ID: {selectedProduct.id}</span>
                )}
              </div>

              {selectedProduct && selectedProductData ? (
                <>
                  {/* Tabs */}
                  <div className="flex border-b border-slate-200">
                    {[
                      { id: 'basic', label: 'Basic' },
                      { id: 'pricing', label: 'Pricing' },
                      { id: 'images', label: 'Images' },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`px-4 py-2 text-sm font-medium transition-colors ${
                          activeTab === tab.id
                            ? 'border-b-2 border-slate-800 text-slate-800'
                            : 'text-slate-500 hover:text-slate-700'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* Tab Content */}
                  <div className="p-5 overflow-y-auto" style={{ maxHeight: '70vh' }}>
                    {/* Basic Info Tab */}
                    {activeTab === 'basic' && (
                      <div className="space-y-5">
                        <div>
                          <label className="section-title">Display Name</label>
                          <input
                            type="text"
                            value={selectedProductData.name}
                            onChange={(e) => updateProduct(selectedProduct.id, { name: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-slate-400 focus:border-slate-400"
                          />
                        </div>

                        <div>
                          <label className="section-title">Short Description</label>
                          <textarea
                            rows={2}
                            value={selectedProductData.description || ''}
                            onChange={(e) => updateProduct(selectedProduct.id, { description: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-slate-400 resize-y"
                            style={{ minHeight: '60px' }}
                          />
                        </div>

                        <div>
                          <label className="section-title">
                            Long Description (HTML allowed)
                          </label>
                          <textarea
                            rows={6}
                            value={selectedProductData.longDescription || ''}
                            onChange={(e) =>
                              updateProduct(selectedProduct.id, { longDescription: e.target.value })
                            }
                            placeholder="Detailed product description... You can use HTML tags like <p>, <br>, <strong>, <ul>, <li>, etc."
                            className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-slate-400 resize-y"
                            style={{ minHeight: '120px' }}
                          />
                          <p className="text-xs text-slate-400 mt-1">
                            Tip: Use HTML tags for formatting (e.g., &lt;p&gt;, &lt;br&gt;, &lt;strong&gt;, &lt;ul&gt;, &lt;li&gt;)
                          </p>
                        </div>

                        <div>
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={selectedProductData.featured || false}
                              onChange={(e) => updateProduct(selectedProduct.id, { featured: e.target.checked })}
                              className="w-4 h-4 text-slate-600 border-slate-300 rounded focus:ring-slate-500"
                            />
                            <span className="text-sm text-slate-700">Featured product</span>
                          </label>
                        </div>

                        {/* Product Visibility */}
                        <div className="p-3 bg-slate-50 border border-slate-200 rounded">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedProductData.visible !== false}
                              onChange={(e) => updateProduct(selectedProduct.id, { visible: e.target.checked })}
                              className="w-4 h-4 text-slate-600 border-slate-300 rounded focus:ring-slate-500"
                            />
                            <span className="text-sm text-slate-700">Product Visible</span>
                          </label>
                          <p className="text-xs text-slate-400 mt-1 ml-6">Uncheck to hide this product from customers</p>
                        </div>

                        {/* Fulfillment Method */}
                        <div className="p-3 bg-slate-50 border border-slate-200 rounded">
                          <label className="section-title">Fulfillment</label>
                          <div className="space-y-2 mt-2">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="radio"
                                checked={selectedProductData.fulfillment !== 'custom'}
                                onChange={() => updateProduct(selectedProduct.id, { fulfillment: 'cockpit3d' })}
                                className="w-4 h-4 text-slate-600 border-slate-300 focus:ring-slate-500"
                              />
                              <div className="flex-1">
                                <span className="text-sm text-slate-700">Cockpit3D</span>
                                <p className="text-xs text-slate-400">Sent to Cockpit3D for fulfillment</p>
                              </div>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="radio"
                                checked={selectedProductData.fulfillment === 'custom'}
                                onChange={() => updateProduct(selectedProduct.id, { fulfillment: 'custom' })}
                                className="w-4 h-4 text-slate-600 border-slate-300 focus:ring-slate-500"
                              />
                              <div className="flex-1">
                                <span className="text-sm text-slate-700">Custom (You fulfill)</span>
                                <p className="text-xs text-slate-400">Wood coasters, custom items, etc.</p>
                              </div>
                            </label>
                          </div>
                        </div>

                        <div>
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={selectedProductData.requiresImage !== false}
                              onChange={(e) => updateProduct(selectedProduct.id, { requiresImage: e.target.checked })}
                              className="w-4 h-4 text-slate-600 border-slate-300 rounded focus:ring-slate-500"
                            />
                            <span className="text-sm text-slate-700">Requires custom image</span>
                          </label>
                        </div>

                        {/* Categories Section */}
                        <div className="pt-4 border-t border-slate-200">
                          <label className="section-title">Categories (Auto-detected)</label>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {(() => {
                              const categories = getProductCategories(selectedProductData);
                              
                              if (categories.length === 0) {
                                return <span className="text-xs text-slate-400">No categories detected</span>;
                              }
                              
                              return categories.map((cat: string) => (
                                <span 
                                  key={cat}
                                  className="inline-flex items-center px-2 py-1 rounded text-xs bg-slate-100 text-slate-600"
                                >
                                  {getCategoryLabel(cat)}
                                </span>
                              ));
                            })()}
                          </div>
                        </div>

                        {/* Occasions Section - Manual Assignment */}
                        <div className="pt-4 border-t border-slate-200">
                          <label className="section-title">Occasions & Themes</label>
                          <div className="grid grid-cols-2 gap-2 mt-2">
                            {OCCASION_CATEGORIES.map((occasion) => {
                              const isSelected = selectedProductData.occasions?.includes(occasion.value) || false;
                              
                              return (
                                <label 
                                  key={occasion.value}
                                  className={`flex items-center gap-2 p-2 rounded border cursor-pointer transition-all ${
                                    isSelected 
                                      ? 'bg-slate-100 border-slate-400' 
                                      : 'bg-white border-slate-200 hover:border-slate-300'
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
                                    className="w-4 h-4 text-slate-600 border-slate-300 rounded focus:ring-slate-500"
                                  />
                                  <span className="text-sm text-slate-700">{occasion.label}</span>
                                </label>
                              );
                            })}
                          </div>
                        </div>

                        {/* Mask Image Selector */}
                        <div className="pt-4 border-t border-slate-200">
                          <label className="section-title">Mask Image</label>
                          <select
                            value={selectedProductData.maskImageUrl || ''}
                            onChange={(e) => updateProduct(selectedProduct.id, { maskImageUrl: e.target.value || null })}
                            className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-slate-400 mt-2"
                          >
                            <option value="">No mask (free crop)</option>
                            {availableMasks.map((mask) => (
                              <option key={mask.filename} value={mask.path}>
                                {mask.displayName}
                              </option>
                            ))}
                          </select>
                          {selectedProductData.maskImageUrl && (
                            <div className="mt-2 p-2 bg-slate-50 rounded">
                              <img 
                                src={selectedProductData.maskImageUrl} 
                                alt="Mask preview" 
                                className="max-h-32 mx-auto"
                              />
                            </div>
                          )}
                          <p className="text-xs text-slate-400 mt-2">
                            Add masks: Drop PNG in <code className="bg-slate-100 px-1 rounded">/public/img/masks/</code>
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Pricing Tab */}
                    {activeTab === 'pricing' && (
                      <div className="space-y-6">
                        {/* Cost & Base Price */}
                        <div className="space-y-4">
                          <h4 className="section-title">Base Pricing</h4>
                          
                          <div className="grid grid-cols-2 gap-4">
                            {/* Only show single cost field for products WITHOUT sizes */}
                            {!(selectedProductData.sizes && selectedProductData.sizes.length > 0) && (
                              <div>
                                <label className="block text-xs text-slate-500 mb-1">Cost</label>
                                <div className="relative">
                                  <span className="absolute left-3 top-2 text-slate-400 text-sm">$</span>
                                  <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={selectedProductData.cost || ''}
                                    onChange={(e) => updateProduct(selectedProduct.id, { cost: parseFloat(e.target.value) || undefined })}
                                    placeholder="0.00"
                                    className="w-full pl-7 pr-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-slate-400 bg-white"
                                  />
                                </div>
                              </div>
                            )}
                            
                            <div className={selectedProductData.sizes && selectedProductData.sizes.length > 0 ? 'col-span-2' : ''}>
                              <label className="block text-xs text-slate-500 mb-1">
                                Base Price {selectedProductData.sizes && selectedProductData.sizes.length > 0 && (
                                  <span className="text-slate-400">(auto from sizes)</span>
                                )}
                              </label>
                              <div className="relative">
                                <span className="absolute left-3 top-2 text-slate-400 text-sm">$</span>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={selectedProductData.basePrice}
                                  onChange={(e) =>
                                    updateProduct(selectedProduct.id, { basePrice: parseFloat(e.target.value) || 0 })
                                  }
                                  disabled={selectedProductData.sizes && selectedProductData.sizes.length > 0}
                                  className="w-full pl-7 pr-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-slate-400 bg-white disabled:bg-slate-100 disabled:cursor-not-allowed"
                                />
                              </div>
                            </div>
                          </div>
                          
                          {/* Profit Display - only for products WITHOUT sizes */}
                          {!(selectedProductData.sizes && selectedProductData.sizes.length > 0) && 
                           selectedProductData.cost && selectedProductData.basePrice && (
                            <div className="flex items-center gap-2 mt-2 text-sm">
                              <span className="text-slate-500">Margin:</span>
                              <span className="font-medium text-emerald-600">
                                ${(selectedProductData.basePrice - selectedProductData.cost).toFixed(2)}
                                ({Math.round(((selectedProductData.basePrice - selectedProductData.cost) / selectedProductData.cost) * 100)}%)
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Sale Section */}
                        <div className="space-y-3 pt-4 border-t border-slate-200">
                          <div className="flex items-center justify-between">
                            <h4 className="section-title">Sale Discount</h4>
                            <label className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={selectedProductData.sale || false}
                                onChange={(e) => {
                                  updateProduct(selectedProduct.id, { sale: e.target.checked });
                                  if (!e.target.checked) {
                                    updateProduct(selectedProduct.id, { salePrice: undefined, salePercent: undefined });
                                  }
                                }}
                                className="w-4 h-4 text-slate-600 border-slate-300 rounded focus:ring-slate-500"
                              />
                              <span className="text-sm text-slate-600">On Sale</span>
                            </label>
                          </div>

                          {selectedProductData.sale && (
                            <div className="space-y-3">
                              <div className="grid grid-cols-2 gap-4">
                                {/* Percentage Discount */}
                                <div>
                                  <label className="block text-xs text-slate-500 mb-1">
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

                        {/* Size Prices with Cost per Size */}
                        {selectedProductData.sizes && selectedProductData.sizes.length > 0 && (
                          <div className="pt-4 border-t border-slate-200">
                            <h4 className="section-title">Size Pricing</h4>
                            
                            {/* Header row */}
                            <div className="flex items-center gap-3 mb-2 text-xs text-slate-400">
                              <div className="w-5"></div>
                              <div className="flex-1">Size</div>
                              <div className="w-20 text-center">Cost</div>
                              <div className="w-20 text-center">Price</div>
                              <div className="w-16 text-center">Margin</div>
                            </div>
                            
                            <div className="space-y-1.5">
                              {selectedProductData.sizes.map((size, index) => {
                                const margin = size.price && size.cost ? size.price - size.cost : null;
                                const marginPct = size.price && size.cost && size.cost > 0 
                                  ? Math.round((margin! / size.cost) * 100) 
                                  : null;
                                
                                return (
                                  <div key={size.id} className="flex items-center gap-3">
                                    <input
                                      type="checkbox"
                                      checked={size.enabled !== false}
                                      onChange={(e) =>
                                        updateSize(selectedProduct.id, index, { enabled: e.target.checked })
                                      }
                                      className="w-4 h-4 text-slate-600 border-slate-300 rounded"
                                    />
                                    <div className="flex-1 text-sm text-slate-700">{size.name}</div>
                                    
                                    {/* Cost input */}
                                    <div className="relative w-20">
                                      <span className="absolute left-2 top-1.5 text-slate-400 text-xs">$</span>
                                      <input
                                        type="number"
                                        step="0.01"
                                        value={size.cost || ''}
                                        placeholder="—"
                                        onChange={(e) =>
                                          updateSize(selectedProduct.id, index, { cost: parseFloat(e.target.value) || undefined })
                                        }
                                        className="w-full pl-5 pr-1 py-1.5 text-sm border border-slate-300 rounded focus:ring-1 focus:ring-slate-400"
                                      />
                                    </div>
                                    
                                    {/* Price input */}
                                    <div className="relative w-20">
                                      <span className="absolute left-2 top-1.5 text-slate-400 text-xs">$</span>
                                      <input
                                        type="number"
                                        step="0.01"
                                        value={size.price}
                                        onChange={(e) =>
                                          updateSize(selectedProduct.id, index, { price: parseFloat(e.target.value) || 0 })
                                        }
                                        className="w-full pl-5 pr-1 py-1.5 text-sm border border-slate-300 rounded focus:ring-1 focus:ring-slate-400"
                                      />
                                    </div>
                                    
                                    {/* Margin display */}
                                    <div className="w-16 text-center text-xs">
                                      {margin !== null ? (
                                        <span className={margin >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                                          {marginPct}%
                                        </span>
                                      ) : (
                                        <span className="text-slate-300">—</span>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Lightbase Prices */}
                        {selectedProductData.lightBases && selectedProductData.lightBases.length > 0 && (
                          <div className="pt-4 border-t border-slate-200">
                            <h4 className="section-title">Light Bases</h4>
                            <div className="space-y-1.5">
                              {selectedProductData.lightBases.map((lb, index) => (
                                <div key={lb.id} className="flex items-center gap-3">
                                  <input
                                    type="checkbox"
                                    checked={lb.enabled !== false}
                                    onChange={(e) =>
                                      updateLightBase(selectedProduct.id, index, { enabled: e.target.checked })
                                    }
                                    className="w-4 h-4 text-slate-600 border-slate-300 rounded"
                                  />
                                  <div className="flex-1 text-sm text-slate-700">{lb.name}</div>
                                  <div className="relative w-20">
                                    <span className="absolute left-2 top-1.5 text-slate-400 text-xs">$</span>
                                    <input
                                      type="number"
                                      step="0.01"
                                      value={lb.price || 0}
                                      onChange={(e) =>
                                        updateLightBase(selectedProduct.id, index, { price: parseFloat(e.target.value) || null })
                                      }
                                      className="w-full pl-5 pr-1 py-1.5 text-sm border border-slate-300 rounded focus:ring-1 focus:ring-slate-400"
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

