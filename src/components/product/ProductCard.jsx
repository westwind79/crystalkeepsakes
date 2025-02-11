// components/product/ProductCard.jsx
import { useState } from 'react'
import { Link } from 'react-router-dom'
import ProductGallery from './ProductGallery';
 import { getImagePath } from '../../utils/imageUtils';

import { PRODUCT_CATEGORIES } from '../../utils/categoriesConfig';

export function ProductCard({ product }) {
  const mainImage = product.images.find(img => img.isMain) || product.images[0];
  // Instead of traditional Bootstrap card, let's create something unique


  return (
    <div className="crystal-product">

      <Link to={`/product/${product.slug}`}
        className="crystal-product-image" 
        style={{ 
          backgroundImage: `url(${mainImage.src})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        {/*<img src={mainImage.src} alt={product.name} />*/}
      </Link>
      
      <div className="crystal-product-info">
        <h3>
          <Link 
            to={`/product/${product.slug}`} 
            className=""
          >{product.name}</Link>
        </h3>
        <p>{product.shortDescription}</p>

        <div className="crystal-product-price">
          From ${product.basePrice.toFixed(2)}
        </div>

        <Link 
          to={`/product/${product.slug}`} 
          className="btn btn-primary"
        >
          <span>Customize Crystal</span>
        </Link>

      </div>
    </div>
  )
}