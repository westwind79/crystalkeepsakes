// components/product/ProductCard2.jsx
import { useState } from 'react'
import { Link } from 'react-router-dom'

export function ProductCard2({ product }) {
  const [imageSrc, setImageSrc] = useState(
    product.images && product.images[0] ? product.images[0].src : 'https:\/\/placehold.co\/600x400'
  );
  const [hasTriedFallback, setHasTriedFallback] = useState(false);

  const tryNextExtension = async () => {
    if (hasTriedFallback) return;

    const extensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    const baseInfo = product.images[0];
    
    // FIXED: Extract path WITHOUT assuming extension
    const matches = baseInfo.src.match(/\/cockpit3d\/(\d+)\/cockpit3d_(\d+)_(.+)\.([^.]+)$/);
    if (!matches) return;
    
    const [, productId, , baseName] = matches;
    const basePath = `/img/products/cockpit3d/${productId}/cockpit3d_${productId}_${baseName}`;
    
    // Try ALL extensions (including current one again)
    for (const ext of extensions) {
      const testPath = `${basePath}.${ext}`;
      try {
        await new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = () => {
            setImageSrc(testPath);
            setHasTriedFallback(true);
            resolve();
          };
          img.onerror = reject;
          img.src = testPath;
        });
        return; // Found working image
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.log(`❌ PRODUCTCARD2: Failed to load ${testPath}`);
        }
      }
    }
  };

  const handleImageError = () => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`❌ PRODUCTCARD2: Image failed to load: ${imageSrc}`);
    }
    tryNextExtension();
  };

  if (process.env.NODE_ENV === 'development') {
    console.log('✅ PRODUCTCARD2: Rendering product:', product.name);
  }

  return (
    <div className="crystal-product">
      <Link 
        to={`/product2/${product.slug}`}
        className="crystal-product-image" 
        style={{ 
          backgroundImage: `url(${imageSrc})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        {/* Hidden img for error handling */}
        <img 
          src={imageSrc} 
          alt={product.name}
          onError={handleImageError}
          style={{ display: 'none' }}
        />
      </Link>
      
      <div className="crystal-product-info">
        <h3>
          <Link 
            to={`/product2/${product.slug}`} 
            className=""
          >
            {product.name}
          </Link>
        </h3>
        <p>{product.shortDescription || product.description}</p>

        <div className="crystal-product-price">
          From ${product.basePrice.toFixed(2)}
        </div>

        <Link 
          to={`/product2/${product.slug}`} 
          className="btn btn-primary"
        >
          <span>Customize Crystal</span>
        </Link>
      </div>
    </div>
  )
}