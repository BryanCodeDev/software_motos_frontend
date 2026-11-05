import { Helmet } from 'react-helmet-async';
import PropTypes from 'prop-types';

const SITE_NAME = 'Tu QR te Cuida';
const SITE_URL = 'https://tuqrcuida.com';
const DEFAULT_IMAGE = `${SITE_URL}/og-image.png`;
const DEFAULT_DESCRIPTION =
  'Tu QR te Cuida: tu perfil digital de emergencia con código QR. Comparte tu información médica, contactos de emergencia y datos vitales de forma segura. Ideal para motos, ciclistas y deportistas.';

const clamp = (text, max) => (text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text);

const normalizePath = (url) => {
  if (!url) return '';
  const path = `/${url.replace(/^\/+/, '')}`.split(/[?#]/)[0];
  return path === '/' ? '' : path.replace(/\/+$/, '');
};

const imageType = (src) => {
  if (/\.png$/i.test(src)) return 'image/png';
  if (/\.jpe?g$/i.test(src)) return 'image/jpeg';
  if (/\.webp$/i.test(src)) return 'image/webp';
  return undefined;
};

const siteGraph = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${SITE_URL}/#organization`,
      name: SITE_NAME,
      url: SITE_URL,
      logo: `${SITE_URL}/favicon.svg`,
      founder: { '@type': 'Organization', name: 'MasterCode Company', url: 'https://mastercodecompany.com/' },
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      url: SITE_URL,
      name: SITE_NAME,
      inLanguage: 'es-CO',
      publisher: { '@id': `${SITE_URL}/#organization` },
    },
  ],
};

/**
 * Metadatos de cada página. `jsonLd` agrega datos estructurados propios;
 * en el inicio se incluye además el grafo de la organización y del sitio.
 * Usa `noindex` en páginas privadas (panel, administración, perfiles de emergencia).
 */
const Seo = ({ title, description, url, keywords, noindex = false, image, imageAlt, type = 'website', jsonLd }) => {
  const path = normalizePath(url);
  const fullTitle = title ? `${title} — ${SITE_NAME}` : `${SITE_NAME} — Perfil digital de emergencia con QR`;
  const fullDescription = clamp(description || DEFAULT_DESCRIPTION, 160);
  const canonical = `${SITE_URL}${path}`;
  const ogImage = image || DEFAULT_IMAGE;
  const ogAlt = imageAlt || `${SITE_NAME}: perfil digital de emergencia con QR`;
  const ogType = imageType(ogImage);
  const isHome = path === '';

  const graphs = [];
  if (!noindex && isHome) graphs.push(siteGraph);
  if (jsonLd) graphs.push(...(Array.isArray(jsonLd) ? jsonLd : [jsonLd]));

  return (
    <Helmet>
      <html lang="es" />
      <title>{fullTitle}</title>
      <meta name="description" content={fullDescription} />
      {keywords && <meta name="keywords" content={keywords} />}
      <meta name="author" content="MasterCode Company" />
      <meta
        name="robots"
        content={noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large'}
      />
      <meta name="theme-color" content="#fdf4f6" />
      <meta name="format-detection" content="telephone=no" />
      <meta name="apple-mobile-web-app-title" content={SITE_NAME} />

      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={fullDescription} />
      <meta property="og:type" content={type} />
      <meta property="og:locale" content="es_CO" />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:alt" content={ogAlt} />
      {ogType && <meta property="og:image:type" content={ogType} />}
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={fullDescription} />
      <meta name="twitter:image" content={ogImage} />
      <meta name="twitter:image:alt" content={ogAlt} />

      {!noindex && <link rel="canonical" href={canonical} />}
      {!noindex && <link rel="alternate" hrefLang="es-CO" href={canonical} />}
      {!noindex && <link rel="alternate" hrefLang="x-default" href={canonical} />}
      <link rel="icon" type="image/svg+xml" href="/favicon.svg" />

      {graphs.map((graph, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(graph)}
        </script>
      ))}
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
  imageAlt: PropTypes.string,
  type: PropTypes.oneOf(['website', 'article']),
  jsonLd: PropTypes.oneOfType([PropTypes.object, PropTypes.arrayOf(PropTypes.object)]),
};

export default Seo;