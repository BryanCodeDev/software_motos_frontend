import { Link } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { routes } from '../utils/routes';

const columns = [
  {
    title: 'Producto',
    links: [
      { label: 'QR digital de emergencia', to: routes.products },
      { label: 'Sticker QR personalizado', to: routes.products },
    ],
  },
  {
    title: 'Plataforma',
    links: [
      { label: 'Cómo funciona', to: routes.howItWorks },
      { label: 'Privacidad y seguridad', to: routes.privacy },
      { label: 'Preguntas frecuentes', to: routes.faq },
      { label: 'Contacto', to: routes.contact },
    ],
  },
  {
    title: 'Cuenta',
    links: [
      { label: 'Iniciar sesión', to: routes.login },
      { label: 'Crear cuenta', to: routes.register },
    ],
  },
];

export const Footer = () => (
  <footer className="relative border-t border-brand-border bg-brand-navy/60 pt-14 pb-8">
    <div
      className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-accent/50 to-transparent"
      aria-hidden="true"
    />
    <div className="container-page">
      <div className="grid gap-10 lg:grid-cols-12 mb-12">
        <div className="lg:col-span-5">
          <Link to={routes.home} className="inline-flex items-center gap-2.5 font-bold text-brand-text mb-4 tracking-tight">
            <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-accent to-brand-deep flex items-center justify-center text-brand-dark">
              <ShieldCheck size={18} strokeWidth={2.4} />
            </span>
            Tu QR te Cuida
          </Link>
          <p className="text-sm text-brand-textMuted leading-relaxed max-w-sm">
            Perfil digital de emergencia con código QR. Si tú no puedes hablar, tu información importante
            puede hacerlo por ti.
          </p>
        </div>

        <nav className="lg:col-span-7 grid grid-cols-2 md:grid-cols-3 gap-8 text-sm" aria-label="Pie de página">
          {columns.map((col) => (
            <div key={col.title}>
              <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-text mb-4">{col.title}</h3>
              <ul className="space-y-2.5 text-brand-textMuted">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link to={l.to} className="hover:text-brand-accent transition-colors">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>

      <div className="border-t border-brand-border pt-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-xs text-brand-textMuted">
        <p>© {new Date().getFullYear()} <a href="https://mastercodecompany.com/" target="_blank" rel="noopener noreferrer" className="hover:text-brand-accent transition-colors">MasterCode Company</a>. Todos los derechos reservados.</p>
        <p className="md:max-w-md md:text-right leading-relaxed">
          Versión preliminar. Esta plataforma es una herramienta de apoyo y no sustituye a los servicios
          oficiales de emergencia.
        </p>
      </div>
    </div>
  </footer>
);

export default Footer;
