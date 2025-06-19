import { useEffect } from 'react';
import { Container } from 'react-bootstrap';
import { Helmet } from 'react-helmet-async';
import { SEOHead } from '../common/SEOHead';

export function PageLayout({ 
  children, 
  pageTitle, 
  pageDescription,
  pagePath,
  pageImage,
  pageType = "website", 
  schema = null,
  className = '' 
}) {
    // Trigger prerender event when component mounts
  useEffect(() => {
    // This event is what vite-plugin-prerender listens for
    document.dispatchEvent(new Event('render-event'));
  }, []);
  
  return (
    <div className={`page ${className}`}>
      <SEOHead 
        title={pageTitle}
        description={pageDescription}
        path={pagePath}
        image={pageImage}
        type={pageType}
        schema={schema}
      />
      {children} 
    </div>
  );
}