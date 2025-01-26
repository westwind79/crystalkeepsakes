import { Helmet } from 'react-helmet-async';

export function SEOHead({ title, description, image }) {
  return (
    <Helmet>
      <title>{title} | CrystalKeepsakes</title>
      <meta name="description" content={description} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      {image && <meta property="og:image" content={image} />}
      <meta property="og:type" content="product" />
      <meta property="og:site_name" content="CrystalKeepsakes" />
      {/*<link rel="canonical" href={`https://crystalkeepsakes.com${slug}`} />*/}
    </Helmet>
  );
}