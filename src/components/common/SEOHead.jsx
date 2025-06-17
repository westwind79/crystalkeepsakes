import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';

export function SEOHead({ 
  title, 
  description,
  keywords = "",
  image = '/img/crystalkeepsakes-social.jpg',
  type = 'website',
  schema = null,
  path = null,
  noIndex = false
}) {
  const location = useLocation();
  const baseUrl = import.meta.env.VITE_SITE_URL || 'https://crystalkeepsakes.com';
  const currentPath = path || location.pathname;
  
  // Ensure paths start with / and URLs don't end with /
  const cleanBaseUrl = baseUrl.replace(/\/$/, '');
  const cleanPath = currentPath.startsWith('/') ? currentPath : `/${currentPath}`;
  
  const fullUrl = `${cleanBaseUrl}${cleanPath}`;
  const imageUrl = image.startsWith('http') 
    ? image 
    : `${cleanBaseUrl}${image.startsWith('/') ? image : `/${image}`}`;
  
  // Format title properly - don't duplicate CrystalKeepsakes
  const formattedTitle = title.includes('CrystalKeepsakes') 
    ? title 
    : `${title} | CrystalKeepsakes`;

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{formattedTitle}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      <link rel="canonical" href={fullUrl} />
      
      {/* Control indexing if needed */}
      {noIndex && <meta name="robots" content="noindex, nofollow" />}
      
      {/* Open Graph Tags */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />      
      <meta property="og:image" content={imageUrl} />
      <meta property="og:url" content={fullUrl} /> 
      <meta property="og:site_name" content="CrystalKeepsakes" />
      
      {/* Twitter Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={imageUrl} />
      
      {/* Structured Data */}
      {schema && (
        <script type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      )}
      
      {/* Default Website Schema if no custom schema provided */}
      {!schema && (
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": "CrystalKeepsakes",
            "url": cleanBaseUrl,
            "description": description || "Custom 3D crystal laser engraving and keepsakes",
            "potentialAction": {
              "@type": "SearchAction",
              "target": `${cleanBaseUrl}/products?search={search_term_string}`,
              "query-input": "required name=search_term_string"
            }
          })}
        </script>
      )}
    </Helmet>
  );
}