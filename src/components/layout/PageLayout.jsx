import { Container } from 'react-bootstrap';
import { Helmet } from 'react-helmet-async';

export function PageLayout({ 
  children, 
  pageTitle, 
  pageDescription,
  className = '' 
}) {
  return (
    <div className={`page ${className}`}>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
      </Helmet>  
        {children} 
    </div>
  );
}