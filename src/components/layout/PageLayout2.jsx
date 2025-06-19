// components/layout/PageLayout2.jsx
import { useEffect } from 'react';

import { Helmet } from 'react-helmet-async';
import { SEOHead } from '../common/SEOHead';

export function PageLayout2({ 
  children, 
  pageTitle = "CrystalKeepsakes - Custom Crystal Engravings",
  pageDescription = "Create beautiful custom crystal engravings with our CockPit3D technology.",
  className = "",
  ...props 
}) {
  
  if (process.env.NODE_ENV === 'development') {
    console.log('📄 PAGELAYOUT2: Rendering page with title:', pageTitle);
  }

  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
      </Helmet>
      
      <main className={`page page-layout2 ${className}`} {...props}>
        {children}
      </main>
    </>
  );
}