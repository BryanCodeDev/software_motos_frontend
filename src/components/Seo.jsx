import { Helmet } from 'react-helmet-async';
import PropTypes from 'prop-types';

const Seo = ({ title, description, url, noindex = false }) => {
  const fullTitle = title
    ? `${title} — Identificación de Emergencia`
    : 'Identificación de Emergencia — MasterCode Company';
  const fullDescription =
    description ||
    'Perfil digital de emergencia con código QR. Si tú no puedes hablar, tu información importante puede hacerlo por ti.';
  const canonical = url ? `https://mastercodecompany.com${url}` : undefined;

  return (
    <Helmet>
      <html lang="es" />
      <title>{fullTitle}</title>
      <meta name="description" content={fullDescription} />
      <meta name="language" content="es" />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={fullDescription} />
      <meta property="og:type" content="website" />
      {canonical && <meta property="og:url" content={canonical} />}
      {noindex && (
        <>
          <meta name="robots" content="noindex, nofollow" />
          <meta property="og:url" content={canonical || ''} />
        </>
      )}
      {canonical && <link rel="canonical" href={canonical} />}
    </Helmet>
  );
};

Seo.propTypes = {
  title: PropTypes.string,
  description: PropTypes.string,
  url: PropTypes.string,
  noindex: PropTypes.bool,
};

export default Seo;
