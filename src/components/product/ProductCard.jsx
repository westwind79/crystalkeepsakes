// components/product/ProductCard.jsx
import { useState } from 'react'
import { Link } from 'react-router-dom'
import ProductGallery from './ProductGallery';
 

export function ProductCard({ product }) {
  const mainImage = product.images.find(img => img.isMain) || product.images[0];
  // Instead of traditional Bootstrap card, let's create something unique

    
  const getImagePath = (imageName) => {
    // Remove any leading slash from imageName
    const cleanImageName = imageName.replace(/^\//, '');
    return `${import.meta.env.BASE_URL}${cleanImageName}`;
  };

  return (
    <div className="crystal-product">

      <div className="crystal-product-image">
 
          <Link 
            to={`/product/${product.slug}`} 
            className=""
          >
            <img src={mainImage.src} alt={product.name} />
          </Link>   

      </div>

      <div className="crystal-product-info">

        <h3>
          <Link 
            to={`/product/${product.slug}`} 
            className=""
          >{product.name}</Link>
        </h3>
        <p>{product.description}</p>

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