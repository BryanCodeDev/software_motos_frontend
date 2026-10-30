import { Helmet } from 'react-helmet-async';
import PropTypes from 'prop-types';

const Seo = ({ title, description, url, keywords, noindex = false, image }) => {
  const siteName = 'Tu QR te Cuida';
  const fullTitle = title
    ? `${title} — ${siteName}`
    : `${siteName} — Perfil digital de emergencia con QR`;
  const fullDescription =
    description ||
    'Tu QR te Cuida: tu perfil digital de emergencia con código QR. Comparte tu información médica, contactos de emergencia y datos vitales de forma segura. Ideal para motos, ciclistas y deportistas.';
  const defaultImage = 'https://tuqrcuida.com/og-image.png';
  const canonical = url ? `https://tuqrcuida.com${url}` : 'https://tuqrcuida.com';
  const ogImage = image || defaultImage;

  return (
    <Helmet>
      <html lang="es" />
      <title>{fullTitle}</title>
      <meta name="description" content={fullDescription} />
      {keywords && <meta name="keywords" content={keywords} />}
      <meta name="language" content="es" />
      <meta name="author" content="MasterCode Company" />
      <meta name="robots" content={noindex ? 'noindex, nofollow' : 'index, follow'} />
      <meta name="theme-color" content="#0f172a" />

      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={fullDescription} />
      <meta property="og:type" content="website" />
      <meta property="og:locale" content="es" />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={fullDescription} />
      <meta name="twitter:image" content={ogImage} />

      <link rel="canonical" href={canonical} />
      <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    </Helmet>
  );
};

Seo.propTypes = {
  title: PropTypes.string,
  description: PropTypes.string,
  url: PropTypes.string,
  keywords: PropTypes.string,
  noindex: PropTypes.bool,
  image: PropTypes.string,
};

export default Seo;