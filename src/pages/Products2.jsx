// pages/Products2.jsx - Simple version using only final-product-list.js
import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Alert, Button } from 'react-bootstrap';
import { ProductCard2 } from '../components/product/ProductCard2';
import { PageLayout2 } from '../components/layout/PageLayout2';
import { PRODUCT_CATEGORIES, PRODUCT_TYPES, isLightbaseProduct } from '../utils/categoriesConfig';
import { Lightbulb, Gem } from 'lucide-react';

export function Products2() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Category filtering state
  const [selectedCategories, setSelectedCategories] = useState(['all']);
  
  // Product type filtering state
  const [selectedProductType, setSelectedProductType] = useState(PRODUCT_TYPES.ALL);

  // Read categories and product type from URL on mount
  useEffect(() => {
    const url = window.location.search;
    const params = new URLSearchParams(url);
    const mainCategory = params.get('category');
    const productType = params.get('type');
    
    // Set product type from URL
    if (productType && Object.values(PRODUCT_TYPES).includes(productType)) {
      setSelectedProductType(productType);
    }
    
    // Set categories from URL
    if (!mainCategory) {
      setSelectedCategories(['all']);
      return;
    }

    // Get all parameters as array
    const allParams = Array.from(new URL(window.location).searchParams.keys());
    const categories = [mainCategory, ...allParams.filter(p => p !== 'category' && p !== 'type')];
    
    setSelectedCategories(categories);
  }, []);

  // Handle product type selection
  const handleProductTypeChange = (newType) => {
    setSelectedProductType(newType);
    updateURL(selectedCategories, newType);
  };

  // Handle category selection
  const handleCategoryToggle = (categoryValue) => {
    let newCategories;
    if (categoryValue === 'all') {
      newCategories = ['all'];
    } else {
      newCategories = selectedCategories.includes(categoryValue)
        ? selectedCategories.filter(c => c !== categoryValue)
        : [...selectedCategories.filter(c => c !== 'all'), categoryValue];
      if (newCategories.length === 0) {
        newCategories = ['all'];
      }
    }
    
    setSelectedCategories(newCategories);
    updateURL(newCategories, selectedProductType);
  };

  // Update URL with current filters
  const updateURL = (categories, productType) => {
    const params = new URLSearchParams();
    
    // Add product type if not 'all'
    if (productType !== PRODUCT_TYPES.ALL) {
      params.set('type', productType);
    }
    
    // Add categories
    if (categories.includes('all')) {
      params.set('category', 'all');
    } else if (categories.length > 0) {
      params.set('category', categories[0]);
      categories.slice(1).forEach(cat => params.set(cat, ''));
    }
    
    const url = `/products2${params.toString() ? '?' + params.toString() : ''}`;
    window.history.replaceState(null, '', url);
  };

  // Filter products based on selected categories and product type
  const filteredProducts = products.filter(product => {
    // First filter by product type
    let typeMatch = true;
    if (selectedProductType === PRODUCT_TYPES.CRYSTAL) {
      typeMatch = !isLightbaseProduct(product);
    } else if (selectedProductType === PRODUCT_TYPES.LIGHTBASE) {
      typeMatch = isLightbaseProduct(product);
    }
    
    if (!typeMatch) return false;
    
    // Then filter by categories
    if (selectedCategories.includes('all')) {
      return true;
    }
    
    return product.categories?.some(cat => selectedCategories.includes(cat));
  });

  // Get count of products per category (considering product type filter)
  const getCategoryCount = (categoryValue) => {
    const typeFilteredProducts = products.filter(product => {
      if (selectedProductType === PRODUCT_TYPES.CRYSTAL) {
        return !isLightbaseProduct(product);
      } else if (selectedProductType === PRODUCT_TYPES.LIGHTBASE) {
        return isLightbaseProduct(product);
      }
      return true;
    });
    
    if (categoryValue === 'all') return typeFilteredProducts.length;
    return typeFilteredProducts.filter(product => 
      product.categories?.includes(categoryValue)
    ).length;
  };

  // Get count of products per product type
  const getProductTypeCount = (type) => {
    if (type === PRODUCT_TYPES.ALL) return products.length;
    if (type === PRODUCT_TYPES.CRYSTAL) {
      return products.filter(product => !isLightbaseProduct(product)).length;
    }
    if (type === PRODUCT_TYPES.LIGHTBASE) {
      return products.filter(product => isLightbaseProduct(product)).length;
    }
    return 0;
  };

  // Load products from final-product-list.js ONLY
  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Import the final product list
      const { finalProductList } = await import('../data/final-product-list.js');
      
      if (finalProductList && Array.isArray(finalProductList)) {
        setProducts(finalProductList);
        console.log('✅ PRODUCTS2: Products loaded successfully:', finalProductList.length);
        
        if (process.env.NODE_ENV === 'development') {
          // Debug lightbase detection
          const lightbases = finalProductList.filter(isLightbaseProduct);
          const crystals = finalProductList.filter(p => !isLightbaseProduct(p));
          console.log('🔍 PRODUCTS2: Product breakdown:', {
            total: finalProductList.length,
            lightbases: lightbases.length,
            crystals: crystals.length,
            lightbaseNames: lightbases.map(p => p.name)
          });
        }
      } else {
        throw new Error('finalProductList is not available or not an array');
      }
      
    } catch (importError) {
      console.error('❌ PRODUCTS2: Import error:', importError);
      setError('Failed to load products from final-product-list.js. Make sure the file exists and contains valid product data.');
    } finally {
      setLoading(false);
    }
  };

  // Load products on component mount
  useEffect(() => {
    loadProducts();
  }, []);

  return (
    <PageLayout2
      pageTitle="Shop 3D Crystals - CrystalKeepsakes"
      pageDescription="Transform your precious moments into stunning 3D crystal art."
      className="products"
    >  
      <section className="hero py-4"> 
        <div className="hero-content">
          <h1 className="primary-header">Our Crystal Creations</h1>
          <p>Transform memories into timeless, 3D-engraved crystal keepsakes – perfect for every occasion.</p>
        </div>
      </section>

      <section className="py-5">
        <Container className="container-fluid">
          {/*<Row>
            <Col xs={12} sm={12} md={8} lg={9} className="order-2 order-md-1">  
              
              <div className="mb-3 p-3 bg-dark rounded">
                <span className="text-light mb-2">Current Filters: </span>
                
                {selectedProductType !== PRODUCT_TYPES.ALL && (           
                  <span className="badge bg-success me-2">
                    {selectedProductType === PRODUCT_TYPES.CRYSTAL ? 'Crystals Only' : 'Light Bases Only'}
                  </span>            
                )}
                
                {!selectedCategories.includes('all') && selectedCategories.length > 0 && (
                  <div className="mb-2">
                    {selectedCategories.map(catValue => {
                      const category = PRODUCT_CATEGORIES.find(c => c.value === catValue);
                      return category ? (
                        <span key={catValue} className="badge bg-primary me-1 mb-1">{category.label}</span>
                      ) : null;
                    })}
                  </div>
                )}
                
                <small className="text-muted">
                  Showing {filteredProducts.length} of {products.length} products
                </small>
              </div>
            </Col>
          </Row>*/}
          <Row>
            <Col xs={12} sm={12} md={8} lg={9} className="order-2 order-md-1">  
              {/* Loading state */}
              {loading && (
                <Row>
                  <Col className="text-center py-5">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading products...</span>
                    </div>
                    <p className="mt-3">Loading products...</p>
                  </Col>
                </Row>
              )}

              {/* Error state */}
              {error && (
                <Row>
                  <Col>
                    <Alert variant="danger">
                      <h5>Error Loading Products</h5>
                      <p>{error}</p>
                      <p className="small mb-0">
                        Make sure you have generated final-product-list.js using the ProductAdmin panel.
                      </p>
                    </Alert>
                  </Col>
                </Row>
              )}

              {/* Products grid */}
              {!loading && !error && (
                <Row>
                  {filteredProducts.length > 0 ? (
                    filteredProducts.map((product, index) => (
                      <Col key={product.id} xs={12} sm={6} md={6} lg={4} className="mb-4">
                        <div 
                          className="scale-95 animate-fadeIn"
                          style={{
                            animationDelay: `${(index * 100)}ms`,
                            animationFillMode: 'forwards'
                          }}
                        >
                          <ProductCard2 product={product} />
                        </div>
                      </Col>
                    ))
                  ) : (
                    <Col xs={12}>
                      <Alert variant="warning" className="text-center">
                        <h5>No products found</h5>
                        <p>
                          {selectedCategories.includes('all') 
                            ? `No ${selectedProductType === PRODUCT_TYPES.ALL ? '' : selectedProductType + ' '}products found.`
                            : `No ${selectedProductType === PRODUCT_TYPES.ALL ? '' : selectedProductType + ' '}products found in the selected categories: ${selectedCategories.join(', ')}.`
                          }
                        </p>
                        <Button variant="outline-primary" onClick={() => {
                          setSelectedCategories(['all']);
                          setSelectedProductType(PRODUCT_TYPES.ALL);
                          updateURL(['all'], PRODUCT_TYPES.ALL);
                        }}>
                          Show All Products
                        </Button>
                      </Alert>
                    </Col>
                  )}
                </Row>
              )}
            </Col>

            {/* Filter Sidebar */}
            <Col xs={12} sm={12} md={4} lg={3} className="order-1 order-md-2 mb-4">
              {/* Product Type Filter */}
              <div className="category-filter mb-4">
                <h6 className="h5 mb-2 text-light">Product Type</h6>
                
                <div 
                  className={`category-filter__item ${
                    selectedProductType === PRODUCT_TYPES.ALL ? 'category-filter__item--active' : ''
                  }`}
                  onClick={() => handleProductTypeChange(PRODUCT_TYPES.ALL)}
                  style={{cursor: 'pointer'}}
                >
                  <input 
                    type="radio"
                    checked={selectedProductType === PRODUCT_TYPES.ALL}
                    onChange={() => handleProductTypeChange(PRODUCT_TYPES.ALL)}
                    style={{display: 'none'}}
                  />
                  All Products ({getProductTypeCount(PRODUCT_TYPES.ALL)})
                </div>

                <div 
                  className={`category-filter__item ${
                    selectedProductType === PRODUCT_TYPES.CRYSTAL ? 'category-filter__item--active' : ''
                  }`}
                  onClick={() => handleProductTypeChange(PRODUCT_TYPES.CRYSTAL)}
                  style={{cursor: 'pointer'}}
                >
                  <input 
                    type="radio"
                    checked={selectedProductType === PRODUCT_TYPES.CRYSTAL}
                    onChange={() => handleProductTypeChange(PRODUCT_TYPES.CRYSTAL)}
                    style={{display: 'none'}}
                  />
                  <Gem size={16} className="me-2" />
                  Crystals ({getProductTypeCount(PRODUCT_TYPES.CRYSTAL)})
                </div>

                <div 
                  className={`category-filter__item ${
                    selectedProductType === PRODUCT_TYPES.LIGHTBASE ? 'category-filter__item--active' : ''
                  }`}
                  onClick={() => handleProductTypeChange(PRODUCT_TYPES.LIGHTBASE)}
                  style={{cursor: 'pointer'}}
                >
                  <input 
                    type="radio"
                    checked={selectedProductType === PRODUCT_TYPES.LIGHTBASE}
                    onChange={() => handleProductTypeChange(PRODUCT_TYPES.LIGHTBASE)}
                    style={{display: 'none'}}
                  />
                  <Lightbulb size={16} className="me-2" />
                  Light Bases ({getProductTypeCount(PRODUCT_TYPES.LIGHTBASE)})
                </div>
              

              {/* Category Filter - Only show if not filtering by lightbases only */}
              {selectedProductType !== PRODUCT_TYPES.LIGHTBASE && (
                <div className="mt-3">
                  <h6 className="h5 mb-3 text-light">Filter by Category</h6>
                  
                  {[
                    PRODUCT_CATEGORIES.find(cat => cat.value === 'all'),
                    ...PRODUCT_CATEGORIES
                      .filter(cat => cat.value !== 'all' && cat.value !== 'lightbases')
                      .sort((a, b) => a.label.localeCompare(b.label))
                  ].map(category => {
                    const categoryCount = getCategoryCount(category.value);
                    
                    return (
                      <div 
                        key={category.value}
                        className={`mb-2 category-filter__item ${
                          selectedCategories.includes(category.value) ?
                          'category-filter__item--active' : ''
                        }`}
                        onClick={() => handleCategoryToggle(category.value)}
                        style={{cursor: 'pointer'}}
                      >
                        <input 
                          type="checkbox"
                          checked={selectedCategories.includes(category.value)}
                          onChange={() => handleCategoryToggle(category.value)}
                          style={{display: 'none'}}
                        />
                        {category.label} ({categoryCount})
                      </div>
                    );
                  })}
                </div>
              )}
                
              </div>              
            </Col>
          </Row>
        </Container>
      </section>
    </PageLayout2>
  );
}