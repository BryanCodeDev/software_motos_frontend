import { Helmet } from 'react-helmet-async';
import PropTypes from 'prop-types';

const SITE_NAME = 'Tu QR te Cuida';
const SITE_URL = 'https://tuqrcuida.com';
const DEFAULT_IMAGE = `${SITE_URL}/og-image.png`;
const DEFAULT_DESCRIPTION =
  'Tu QR te Cuida: tu perfil digital de emergencia con código QR. Comparte tu información médica, contactos de emergencia y datos vitales de forma segura. Ideal para motos, ciclistas y deportistas.';

const Seo = ({ title, description, url, keywords, noindex = false, image }) => {
  const fullTitle = title
    ? `${title} — ${SITE_NAME}`
    : `${SITE_NAME} — Perfil digital de emergencia con QR`;
  const fullDescription = description || DEFAULT_DESCRIPTION;
  const canonical = url ? `${SITE_URL}${url}` : SITE_URL;
  const ogImage = image || DEFAULT_IMAGE;

  return (
    <Helmet>
      <html lang="es" />
      <title>{fullTitle}</title>
      <meta name="description" content={fullDescription} />
      {keywords && <meta name="keywords" content={keywords} />}
      <meta name="language" content="es" />
      <meta name="author" content="MasterCode Company" />
      <meta
        name="robots"
        content={noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large'}
      />
      <meta name="theme-color" content="#FAF5F6" />

      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={fullDescription} />
      <meta property="og:type" content="website" />
      <meta property="og:locale" content="es_CO" />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:alt" content={`${SITE_NAME}: perfil digital de emergencia con QR`} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={fullDescription} />
      <meta name="twitter:image" content={ogImage} />

      {!noindex && <link rel="canonical" href={canonical} />}
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
